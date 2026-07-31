import { access } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { runChecked } from "./process-utils.mjs";
import { normalizeRepositoryUri } from "../canonical-identity.mjs";

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

function parseWorktrees(text) {
  const records = [];
  let current = null;
  for (const line of text.split(/\r?\n/u)) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice(9), branch: null, head: null };
      records.push(current);
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice(7).replace(/^refs\/heads\//u, "");
    } else if (current && line.startsWith("HEAD ")) {
      current.head = line.slice(5);
    }
  }
  return records;
}

export function worktreePathFor(worktreeRoot, workPackageId) {
  if (!isAbsolute(worktreeRoot)) {
    throw new TypeError("worktree root must be absolute");
  }
  const safeId = workPackageId.toLowerCase().replace(/[^a-z0-9._-]/gu, "-");
  const candidate = resolve(worktreeRoot, safeId);
  if (!candidate.startsWith(`${resolve(worktreeRoot)}${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new TypeError("worktree path escaped its root");
  }
  return candidate;
}

export function createWorktreeManager({
  gitExecutable = "git",
  run = runChecked,
} = {}) {
  const git = (repository, args, options = {}) =>
    run(gitExecutable, args, { cwd: repository, timeoutMs: 30_000, ...options });

  return {
    async inspectRepository(repository, { remainingBudgetMs } = {}) {
      const commandOptions = () => ({
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      const [branch, status, head, originMaster, worktrees] = await Promise.all([
        git(repository, ["branch", "--show-current"], commandOptions()),
        git(repository, ["status", "--porcelain"], commandOptions()),
        git(repository, ["rev-parse", "HEAD"], commandOptions()),
        git(repository, ["rev-parse", "origin/master"], commandOptions()),
        git(repository, ["worktree", "list", "--porcelain"], commandOptions()),
      ]);
      remainingBudgetMs?.();
      return {
        branch: branch.stdout.trim(),
        clean: status.stdout.trim() === "",
        head: head.stdout.trim(),
        originMaster: originMaster.stdout.trim(),
        worktrees: parseWorktrees(worktrees.stdout),
      };
    },

    async assertSourceReady(repository, sourceSha, repositoryUri, { remainingBudgetMs } = {}) {
      const commandOptions = () => ({
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      const state = await this.inspectRepository(repository, { remainingBudgetMs });
      if (state.branch !== "master" || !state.clean) {
        conflict("Main repository must be clean on master", state);
      }
      if (state.head !== sourceSha || state.originMaster !== sourceSha) {
        const error = new Error("Approved source SHA is stale");
        error.code = "RUNNER_SOURCE_STALE";
        error.details = { sourceSha, head: state.head, originMaster: state.originMaster };
        throw error;
      }
      const remoteUrl = (await git(
        repository,
        ["remote", "get-url", "origin"],
        commandOptions(),
      )).stdout.trim();
      let normalizedRemote;
      try {
        normalizedRemote = normalizeRepositoryUri(remoteUrl);
      } catch (cause) {
        const error = new Error("Origin is not a canonical repository URI");
        error.code = "RUNNER_REPOSITORY_MISMATCH";
        error.details = { remoteUrl, cause: cause.message };
        throw error;
      }
      if (normalizedRemote !== normalizeRepositoryUri(repositoryUri)) {
        const error = new Error("Origin does not match the approved canonical repository");
        error.code = "RUNNER_REPOSITORY_MISMATCH";
        error.details = { normalizedRemote, repositoryUri };
        throw error;
      }
      const remoteMaster = await git(repository, [
        "ls-remote", "--heads", "origin", "refs/heads/master",
      ], commandOptions());
      remainingBudgetMs?.();
      const liveMasterSha = remoteMaster.stdout.trim().split(/\s+/u)[0] ?? "";
      if (liveMasterSha !== sourceSha) {
        const error = new Error("Approved source SHA is not the live remote master");
        error.code = "RUNNER_SOURCE_STALE";
        error.details = { sourceSha, liveMasterSha };
        throw error;
      }
      return { ...state, normalizedRemote, liveMasterSha };
    },

    async assertAvailable(repository, branch, worktreePath, { remainingBudgetMs } = {}) {
      const commandOptions = () => ({
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      if (branch === "master" || branch.startsWith("refs/")) {
        conflict("Proposed branch is unsafe", { branch });
      }
      if (await exists(worktreePath)) {
        conflict("Worktree path already exists", { worktreePath });
      }
      const local = await git(repository, [
        "show-ref", "--verify", "--quiet", `refs/heads/${branch}`,
      ], commandOptions()).catch((error) => error.result ?? { code: 1 });
      if (local.code === 0) conflict("Local branch already exists", { branch });
      const remote = await git(repository, [
        "show-ref", "--verify", "--quiet", `refs/remotes/origin/${branch}`,
      ], commandOptions()).catch((error) => error.result ?? { code: 1 });
      if (remote.code === 0) conflict("Remote branch already exists", { branch });
      const remoteLookup = await git(repository, [
        "ls-remote", "--exit-code", "--heads", "origin", `refs/heads/${branch}`,
      ], commandOptions()).catch((error) => error.result ?? { code: -1, stderr: error.message });
      if (remoteLookup.code === 0) conflict("Remote branch already exists", { branch });
      if (remoteLookup.code !== 2) {
        const error = new Error("Remote branch collision check failed closed");
        error.code = "RUNNER_REMOTE_UNAVAILABLE";
        error.details = { branch, stderr: remoteLookup.stderr ?? "" };
        throw error;
      }
      const listing = await git(
        repository,
        ["worktree", "list", "--porcelain"],
        commandOptions(),
      );
      remainingBudgetMs?.();
      const checkedOut = parseWorktrees(listing.stdout)
        .find((entry) => entry.branch === branch || resolve(entry.path) === resolve(worktreePath));
      if (checkedOut) conflict("Branch or path is already attached to a worktree", checkedOut);
    },

    async prepare({
      repository,
      sourceSha,
      branch,
      worktreePath,
      runId,
      repositoryUri,
      remainingBudgetMs,
    }) {
      await this.assertSourceReady(
        repository,
        sourceSha,
        repositoryUri,
        { remainingBudgetMs },
      );
      await this.assertAvailable(
        repository,
        branch,
        worktreePath,
        { remainingBudgetMs },
      );
      await git(repository, [
        "worktree",
        "add",
        "--lock",
        "--reason",
        runId,
        "-b",
        branch,
        worktreePath,
        sourceSha,
      ], { timeoutMs: remainingBudgetMs?.() ?? 120_000 });
      remainingBudgetMs?.();
      return { branch, worktreePath, sourceSha, preserved: true };
    },
  };
}
