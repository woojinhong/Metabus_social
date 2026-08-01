import { createHash } from "node:crypto";
import { access, mkdir, readFile, realpath } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
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

function fail(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function samePath(left, right) {
  const normalizedLeft = resolve(left);
  const normalizedRight = resolve(right);
  return process.platform === "win32"
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

export function normalizeSafeDirectorySource(repository) {
  if (typeof repository !== "string" || !isAbsolute(repository)) {
    fail("RUNNER_SAFE_DIRECTORY_SCOPE_INVALID", "safe.directory source must be absolute");
  }
  if (/[*\u0000-\u001f\u007f]/u.test(repository)) {
    fail(
      "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
      "safe.directory source contains a wildcard or control character",
    );
  }
  return resolve(repository).replaceAll("\\", "/");
}

async function sha256File(path) {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}

function sanitizeGitStderr(error) {
  const source = String(error?.result?.stderr ?? "").slice(0, 4_096);
  const home = homedir();
  let sanitized = source.replace(/:\/\/[^\s/@]+:[^\s/@]+@/gu, "://[REDACTED_CREDENTIAL]@");
  for (const value of [home, home.replaceAll("\\", "/")]) {
    if (value.length >= 4) sanitized = sanitized.split(value).join("[USER_HOME]");
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (/TOKEN|SECRET|PASSWORD|KEY|CREDENTIAL/u.test(name) && value?.length >= 4) {
      sanitized = sanitized.split(value).join(`[REDACTED_${name}]`);
    }
  }
  return sanitized;
}

function isDubiousOwnership(error) {
  return /detected dubious ownership/iu.test(String(error?.result?.stderr ?? error?.message ?? ""));
}

function isStrictDescendant(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path !== "" && path !== ".." && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    && !isAbsolute(path);
}

async function assertCloneTopology(clonePath, disposableCloneRoot = clonePath) {
  const tempRealPath = await realpath(tmpdir());
  const approvedRoot = resolve(disposableCloneRoot);
  if (!samePath(approvedRoot, clonePath) && !isStrictDescendant(approvedRoot, clonePath)) {
    fail(
      "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
      "Disposable clone is outside the Owner-approved clone root",
      { clonePath, disposableCloneRoot: approvedRoot },
    );
  }
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
  const rootAncestor = await realpath(await existingAncestor(approvedRoot));
  if (rootAncestor !== tempRealPath && !isStrictDescendant(tempRealPath, rootAncestor)) {
    fail(
      "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
      "Owner-approved disposable clone root resolves outside OS temp",
      { disposableCloneRoot: approvedRoot, rootAncestor, tempRealPath },
    );
  }
}

async function existingAncestor(candidate) {
  let ancestor = resolve(candidate);
  while (!(await exists(ancestor))) {
    const parent = dirname(ancestor);
    if (parent === ancestor) conflict("Path has no existing ancestor", { candidate });
    ancestor = parent;
  }
  return ancestor;
}

function assertPatchOnlyCloneScope({
  executionMode,
  publicationPolicy,
  repository,
  sourceSha,
  clonePath,
  disposableCloneRoot,
  ownerApprovedSourceRoot,
  sourceState,
}) {
  const disabled = publicationPolicy
    && publicationPolicy.allow_commit === false
    && publicationPolicy.allow_push === false
    && publicationPolicy.allow_pr === false
    && publicationPolicy.allow_github === false;
  if (
    executionMode !== "EXECUTE_PATCH_ONLY"
    || publicationPolicy?.mode !== "EXECUTE_PATCH_ONLY"
    || !disabled
    || sourceState.head !== sourceSha
    || !samePath(repository, sourceState.topLevel)
    || !samePath(ownerApprovedSourceRoot, sourceState.topLevel)
    || (!samePath(disposableCloneRoot, clonePath)
      && !isStrictDescendant(disposableCloneRoot, clonePath))
  ) {
    fail(
      "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
      "Command-scoped safe.directory is restricted to the approved patch-only local clone",
    );
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
    normalizeSafeDirectorySource(repository);
    const options = () => ({ timeoutMs: remainingBudgetMs?.() ?? 30_000 });
    let inspected;
    try {
      inspected = await Promise.all([
        git(repository, ["branch", "--show-current"], options()),
        git(repository, ["status", "--porcelain=v1"], options()),
        git(repository, ["rev-parse", "HEAD"], options()),
        git(repository, ["rev-parse", "origin/master"], options()),
        git(repository, ["remote", "get-url", "origin"], options()),
        git(repository, ["worktree", "list", "--porcelain"], options()),
        git(repository, ["for-each-ref", "--format=%(refname)%09%(objectname)"], options()),
        git(repository, ["rev-parse", "--show-toplevel"], options()),
        git(repository, ["rev-parse", "--is-inside-work-tree"], options()),
        git(repository, ["rev-parse", "--absolute-git-dir"], options()),
        git(repository, ["rev-parse", "--git-common-dir"], options()),
      ]);
    } catch (cause) {
      if (isDubiousOwnership(cause)) {
        fail("RUNNER_SOURCE_OWNERSHIP_UNTRUSTED", "Git rejected source repository ownership", {
          exit_code: cause?.result?.code ?? null,
          stderr_excerpt: sanitizeGitStderr(cause),
        });
      }
      throw cause;
    }
    const [branch, status, head, originMaster, originUrl, worktrees, refs,
      topLevel, insideWorktree, absoluteGitDir, commonGitDir] = inspected;
    const topLevelPath = await realpath(resolve(topLevel.stdout.trim()));
    const gitDirPath = await realpath(resolve(repository, absoluteGitDir.stdout.trim()));
    const commonGitDirPath = await realpath(resolve(repository, commonGitDir.stdout.trim()));
    if (insideWorktree.stdout.trim() !== "true" || !samePath(repository, topLevelPath)) {
      fail(
        "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
        "Disposable clone source is not the exact Git worktree root",
      );
    }
    return {
      branch: branch.stdout.trim(),
      clean: status.stdout.trim() === "",
      head: head.stdout.trim(),
      originMaster: originMaster.stdout.trim(),
      originUrl: originUrl.stdout.trim(),
      worktrees: lines(worktrees.stdout),
      refs: lines(refs.stdout).sort(),
      topLevel: topLevelPath,
      gitDir: gitDirPath,
      commonGitDir: commonGitDirPath,
      configHash: await sha256File(join(commonGitDirPath, "config")),
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

    async assertAvailable(_repository, _branch, clonePath, { disposableCloneRoot } = {}) {
      if (await exists(clonePath)) {
        conflict("Disposable clone path already exists", { clonePath });
      }
      await assertCloneTopology(clonePath, disposableCloneRoot ?? clonePath);
    },

    async prepare({
      repository,
      sourceSha,
      branch,
      worktreePath: clonePath,
      repositoryUri,
      remainingBudgetMs,
      executionMode,
      publicationPolicy,
      disposableCloneRoot,
      ownerApprovedSourceRoot,
    }) {
      const before = await inspectSource(repository, remainingBudgetMs);
      assertSourceState(before, sourceSha, repositoryUri);
      const safeDirectory = normalizeSafeDirectorySource(before.gitDir);
      assertPatchOnlyCloneScope({
        executionMode,
        publicationPolicy,
        repository,
        sourceSha,
        clonePath,
        disposableCloneRoot,
        ownerApprovedSourceRoot,
        sourceState: before,
      });
      let prepared;
      let operationError = null;
      try {
        await this.assertAvailable(repository, branch, clonePath, { disposableCloneRoot });
        await mkdir(dirname(resolve(clonePath)), { recursive: true });
        try {
          await git(dirname(resolve(clonePath)), [
            "-c", `safe.directory=${safeDirectory}`, "clone", "--no-hardlinks",
            "--no-tags", "--single-branch", "--branch", "master",
            before.gitDir, resolve(clonePath),
          ], { timeoutMs: remainingBudgetMs?.() ?? 120_000, maxOutputBytes: 4_096 });
        } catch (cause) {
          const code = isDubiousOwnership(cause)
            ? "RUNNER_SOURCE_OWNERSHIP_UNTRUSTED"
            : "RUNNER_DISPOSABLE_CLONE_FAILED";
          fail(code, "Disposable local clone failed", {
            exit_code: cause?.result?.code ?? null,
            stderr_excerpt: sanitizeGitStderr(cause),
          });
        }
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
        const [head, status, currentBranch, remotes, localHelpers,
        destinationGitDir, destinationCommonGitDir, destinationTopLevel] = await Promise.all([
          git(clonePath, ["rev-parse", "HEAD"]),
          git(clonePath, ["status", "--porcelain=v1"]),
          git(clonePath, ["branch", "--show-current"]),
          git(clonePath, ["remote"]),
          git(clonePath, ["config", "--local", "--get-all", "credential.helper"]),
          git(clonePath, ["rev-parse", "--absolute-git-dir"]),
          git(clonePath, ["rev-parse", "--git-common-dir"]),
          git(clonePath, ["rev-parse", "--show-toplevel"]),
        ]);
        const destinationGitDirPath = await realpath(
          resolve(clonePath, destinationGitDir.stdout.trim()),
        );
        const destinationCommonGitDirPath = await realpath(
          resolve(clonePath, destinationCommonGitDir.stdout.trim()),
        );
        const destinationTopLevelPath = await realpath(destinationTopLevel.stdout.trim());
        const independent = !samePath(destinationGitDirPath, before.gitDir)
          && !samePath(destinationCommonGitDirPath, before.commonGitDir)
          && samePath(destinationTopLevelPath, clonePath)
          && isStrictDescendant(clonePath, destinationGitDirPath)
          && isStrictDescendant(clonePath, destinationCommonGitDirPath)
          && !isStrictDescendant(before.commonGitDir, destinationGitDirPath)
          && !isStrictDescendant(destinationCommonGitDirPath, before.gitDir)
          && !(await exists(join(destinationCommonGitDirPath, "objects", "info", "alternates")));
        if (!independent) {
          fail(
            "RUNNER_DISPOSABLE_CLONE_NOT_INDEPENDENT",
            "Disposable clone Git metadata is not independent from the source",
          );
        }
        if (
          head.stdout.trim() !== sourceSha || status.stdout.trim() !== ""
          || currentBranch.stdout.trim() !== branch || remotes.stdout.trim() !== ""
          || localHelpers.code !== 0 || localHelpers.stdout !== "\n"
        ) {
          fail("RUNNER_DISPOSABLE_CLONE_INVALID", "Disposable clone isolation verification failed", {
            head: head.stdout.trim(),
            branch: currentBranch.stdout.trim(),
            clean: status.stdout.trim() === "",
            remotes: lines(remotes.stdout),
            credential_helper_empty_reset: localHelpers.stdout === "\n",
          });
        }
        prepared = {
          branch, clonePath: resolve(clonePath), sourceSha, preserved: true,
          remote_removed: true, credential_helper_empty_reset: true,
          safe_directory: safeDirectory, git_directory_independent: true,
          containment_status: "PARTIALLY_VERIFIED",
        };
      } catch (error) {
        operationError = error.code === "PROCESS_FAILED"
          ? Object.assign(new Error("Disposable clone setup failed"), {
              code: "RUNNER_DISPOSABLE_CLONE_FAILED",
              details: {
                exit_code: error?.result?.code ?? null,
                stderr_excerpt: sanitizeGitStderr(error),
              },
            })
          : error;
      }
      let after;
      try {
        after = await inspectSource(repository, remainingBudgetMs);
      } catch (verificationError) {
        fail(
          "RUNNER_SOURCE_REPOSITORY_VERIFICATION_FAILED",
          "Source repository could not be re-verified after clone preparation",
          {
          original_error_code: operationError?.code ?? null,
          source_verification_error_code: verificationError.code ?? verificationError.name,
          },
        );
      }
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        fail("RUNNER_SOURCE_REPOSITORY_MUTATED", "Disposable clone preparation changed the source", {
          before,
          after,
          original_error_code: operationError?.code ?? null,
        });
      }
      if (operationError !== null) throw operationError;
      return prepared;
    },
  };
}
