import { access, mkdir, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { normalizeRepositoryUri } from "../canonical-identity.mjs";
import { runChecked } from "./process-utils.mjs";

function conflict(message, details = {}) {
  const error = new Error(message);
  error.code = "BLOCKED_CONFLICT";
  error.details = details;
  throw error;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function lines(text) {
  return String(text).split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

function isStrictDescendant(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path !== "" && path !== ".." && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    && !isAbsolute(path);
}

async function assertCloneTopology(clonePath) {
  const tempRealPath = await realpath(tmpdir());
  let ancestor = dirname(resolve(clonePath));
  while (!(await exists(ancestor))) {
    const parent = dirname(ancestor);
    if (parent === ancestor) conflict("Disposable clone has no existing OS-temp ancestor", { clonePath });
    ancestor = parent;
  }
  const ancestorRealPath = await realpath(ancestor);
  if (ancestorRealPath !== tempRealPath && !isStrictDescendant(tempRealPath, ancestorRealPath)) {
    conflict("Disposable clone ancestor resolves outside OS temp", {
      clonePath,
      ancestor,
      ancestorRealPath,
      tempRealPath,
    });
  }
}

export function createDisposableCloneManager({
  gitExecutable = "git",
  run = runChecked,
} = {}) {
  let sourceBaseline = null;
  const git = (cwd, args, options = {}) =>
    run(gitExecutable, args, { cwd, timeoutMs: 120_000, ...options });

  const inspectSource = async (repository, remainingBudgetMs) => {
    const options = () => ({ timeoutMs: remainingBudgetMs?.() ?? 30_000 });
    const [branch, status, head, originMaster, originUrl, worktrees, refs] =
      await Promise.all([
        git(repository, ["branch", "--show-current"], options()),
        git(repository, ["status", "--porcelain=v1"], options()),
        git(repository, ["rev-parse", "HEAD"], options()),
        git(repository, ["rev-parse", "origin/master"], options()),
        git(repository, ["remote", "get-url", "origin"], options()),
        git(repository, ["worktree", "list", "--porcelain"], options()),
        git(repository, ["for-each-ref", "--format=%(refname)%09%(objectname)"], options()),
      ]);
    return {
      branch: branch.stdout.trim(),
      clean: status.stdout.trim() === "",
      head: head.stdout.trim(),
      originMaster: originMaster.stdout.trim(),
      originUrl: originUrl.stdout.trim(),
      worktrees: lines(worktrees.stdout),
      refs: lines(refs.stdout).sort(),
    };
  };

  const assertSourceState = (state, sourceSha, repositoryUri) => {
    if (state.branch !== "master" || !state.clean) {
      conflict("Patch-only source repository must be clean on master", state);
    }
    if (state.head !== sourceSha || state.originMaster !== sourceSha) {
      const error = new Error("Patch-only source SHA is stale");
      error.code = "RUNNER_SOURCE_STALE";
      error.details = { sourceSha, head: state.head, originMaster: state.originMaster };
      throw error;
    }
    if (normalizeRepositoryUri(state.originUrl) !== normalizeRepositoryUri(repositoryUri)) {
      const error = new Error("Patch-only source origin differs from the approved repository");
      error.code = "RUNNER_REPOSITORY_MISMATCH";
      throw error;
    }
  };

  return {
    async assertSourceReady(repository, sourceSha, repositoryUri, { remainingBudgetMs } = {}) {
      const state = await inspectSource(repository, remainingBudgetMs);
      assertSourceState(state, sourceSha, repositoryUri);
      sourceBaseline ??= state;
      return state;
    },

    async verifySourceUnchanged(
      repository,
      sourceSha,
      repositoryUri,
      { remainingBudgetMs } = {},
    ) {
      const state = await inspectSource(repository, remainingBudgetMs);
      assertSourceState(state, sourceSha, repositoryUri);
      if (sourceBaseline === null || JSON.stringify(sourceBaseline) !== JSON.stringify(state)) {
        const error = new Error("Patch-only run changed source repository refs or worktrees");
        error.code = "RUNNER_SOURCE_REPOSITORY_MUTATED";
        error.details = { before: sourceBaseline, after: state };
        throw error;
      }
      return state;
    },

    async assertAvailable(_repository, _branch, clonePath) {
      if (await exists(clonePath)) {
        conflict("Disposable clone path already exists", { clonePath });
      }
      await assertCloneTopology(clonePath);
    },

    async prepare({
      repository,
      sourceSha,
      branch,
      worktreePath: clonePath,
      repositoryUri,
      remainingBudgetMs,
    }) {
      const before = await inspectSource(repository, remainingBudgetMs);
      assertSourceState(before, sourceSha, repositoryUri);
      await this.assertAvailable(repository, branch, clonePath);
      await mkdir(dirname(resolve(clonePath)), { recursive: true });
      await git(dirname(resolve(clonePath)), [
        "clone",
        "--no-hardlinks",
        "--no-tags",
        "--single-branch",
        "--branch",
        "master",
        resolve(repository),
        resolve(clonePath),
      ], { timeoutMs: remainingBudgetMs?.() ?? 120_000 });
      await git(clonePath, ["remote", "remove", "origin"], {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      await git(clonePath, ["config", "--local", "--add", "credential.helper", ""], {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      await git(clonePath, ["config", "--local", "core.hooksPath", "NUL"], {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      await git(clonePath, ["switch", "-c", branch, sourceSha], {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      const [head, status, currentBranch, remotes, localHelpers] = await Promise.all([
        git(clonePath, ["rev-parse", "HEAD"]),
        git(clonePath, ["status", "--porcelain=v1"]),
        git(clonePath, ["branch", "--show-current"]),
        git(clonePath, ["remote"]),
        git(clonePath, ["config", "--local", "--get-all", "credential.helper"]),
      ]);
      if (
        head.stdout.trim() !== sourceSha
        || status.stdout.trim() !== ""
        || currentBranch.stdout.trim() !== branch
        || remotes.stdout.trim() !== ""
        || localHelpers.code !== 0
        || localHelpers.stdout !== "\n"
      ) {
        const error = new Error("Disposable clone isolation verification failed");
        error.code = "RUNNER_DISPOSABLE_CLONE_INVALID";
        error.details = {
          head: head.stdout.trim(),
          branch: currentBranch.stdout.trim(),
          clean: status.stdout.trim() === "",
          remotes: lines(remotes.stdout),
          credential_helper_empty_reset: localHelpers.stdout === "\n",
        };
        throw error;
      }
      const after = await inspectSource(repository, remainingBudgetMs);
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        const error = new Error("Disposable clone preparation changed the source repository");
        error.code = "RUNNER_SOURCE_REPOSITORY_MUTATED";
        error.details = { before, after };
        throw error;
      }
      return {
        branch,
        clonePath: resolve(clonePath),
        sourceSha,
        preserved: true,
        remote_removed: true,
        credential_helper_empty_reset: true,
        containment_status: "PARTIALLY_VERIFIED",
      };
    },
  };
}
