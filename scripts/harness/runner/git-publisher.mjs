import { runChecked } from "./process-utils.mjs";
import { normalizeRepositoryUri } from "../canonical-identity.mjs";
import { sha256Digest } from "../canonical-json.mjs";

function lines(text) {
  return text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

export function createGitPublisher({
  gitExecutable = "git",
  ghExecutable = "gh",
  run = runChecked,
} = {}) {
  const git = (cwd, args, options = {}) =>
    run(gitExecutable, args, { cwd, timeoutMs: 120_000, ...options });
  const gh = (cwd, args, options = {}) =>
    run(ghExecutable, args, { cwd, timeoutMs: 120_000, ...options });

  return {
    async changedFiles(cwd, sourceSha = "HEAD", { remainingBudgetMs } = {}) {
      const commandOptions = {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      };
      const [tracked, untracked] = await Promise.all([
        git(cwd, ["diff", "--name-only", sourceSha], commandOptions),
        git(cwd, ["ls-files", "--others", "--exclude-standard"], commandOptions),
      ]);
      remainingBudgetMs?.();
      return [...new Set([...lines(tracked.stdout), ...lines(untracked.stdout)])].sort();
    },

    async assertPinnedHead(cwd, sourceSha, { remainingBudgetMs } = {}) {
      const head = (await git(cwd, ["rev-parse", "HEAD"], {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      })).stdout.trim();
      if (head !== sourceSha) {
        throw Object.assign(new Error("Worker or required test changed Git HEAD"), {
          code: "RUNNER_HEAD_CHANGED",
          details: { sourceSha, head },
        });
      }
      return head;
    },

    async changeFingerprint(cwd, sourceSha, { remainingBudgetMs } = {}) {
      const commandOptions = () => ({
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      const [diff, untracked] = await Promise.all([
        git(cwd, ["diff", "--no-ext-diff", "--binary", sourceSha], commandOptions()),
        git(cwd, ["ls-files", "--others", "--exclude-standard"], commandOptions()),
      ]);
      const untrackedHashes = [];
      for (const path of lines(untracked.stdout).sort()) {
        const hash = (await git(
          cwd,
          ["hash-object", "--no-filters", "--", path],
          commandOptions(),
        )).stdout.trim();
        untrackedHashes.push({ path, hash });
      }
      remainingBudgetMs?.();
      return sha256Digest({ diff: diff.stdout, untracked: untrackedHashes });
    },

    async publish({
      cwd,
      branch,
      workPackage,
      changedFiles,
      pr,
      baseBranch = "master",
      repositoryUri,
      sourceSha,
      remainingBudgetMs,
    }) {
      const commandOptions = () => ({
        timeoutMs: remainingBudgetMs?.() ?? 120_000,
      });
      if (branch === "master" || baseBranch !== "master") {
        throw Object.assign(new Error("Runner publication requires a non-master branch"), {
          code: "RUNNER_PUBLICATION_DENIED",
        });
      }
      await this.assertPinnedHead(cwd, sourceSha, { remainingBudgetMs });
      const currentBranch = (await git(
        cwd,
        ["branch", "--show-current"],
        commandOptions(),
      )).stdout.trim();
      if (currentBranch !== branch) {
        throw Object.assign(new Error("Checked-out branch differs from the approved branch"), {
          code: "RUNNER_BRANCH_MISMATCH",
        });
      }
      const remoteUrl = (await git(cwd, ["remote", "get-url", "origin"], commandOptions()))
        .stdout.trim();
      if (normalizeRepositoryUri(remoteUrl) !== normalizeRepositoryUri(repositoryUri)) {
        throw Object.assign(new Error("Origin differs from the approved canonical repository"), {
          code: "RUNNER_REPOSITORY_MISMATCH",
        });
      }
      const liveMaster = (await git(cwd, [
        "ls-remote", "--heads", "origin", "refs/heads/master",
      ], commandOptions())).stdout.trim().split(/\s+/u)[0] ?? "";
      if (liveMaster !== sourceSha) {
        throw Object.assign(new Error("Remote master changed before publication"), {
          code: "RUNNER_SOURCE_STALE",
          details: { sourceSha, liveMaster },
        });
      }
      if (changedFiles.length === 0) {
        throw Object.assign(new Error("Worker produced no publishable change"), {
          code: "RUNNER_NO_CHANGE",
        });
      }
      const status = (await git(cwd, ["status", "--porcelain=v1"], commandOptions()))
        .stdout.trim();
      if (status === "") {
        throw Object.assign(new Error("Git status reports no publishable change"), {
          code: "RUNNER_NO_CHANGE",
        });
      }
      const actualChangedFiles = await this.changedFiles(
        cwd,
        sourceSha,
        { remainingBudgetMs },
      );
      if (
        JSON.stringify(actualChangedFiles)
        !== JSON.stringify([...changedFiles].sort())
      ) {
        throw Object.assign(new Error("Final diff differs from the validated path set"), {
          code: "RUNNER_FINAL_DIFF_MISMATCH",
          details: { actualChangedFiles, changedFiles },
        });
      }
      const preStaged = lines((await git(
        cwd,
        ["diff", "--cached", "--name-only"],
        commandOptions(),
      )).stdout);
      if (preStaged.length > 0) {
        throw Object.assign(new Error("Worker or test left pre-staged changes"), {
          code: "RUNNER_PRESTAGED_CHANGE",
          details: { preStaged },
        });
      }
      const existing = JSON.parse((await gh(cwd, [
        "pr", "list", "--state", "all", "--head", branch,
        "--json", "number,url,isDraft",
      ], commandOptions())).stdout || "[]");
      if (existing.length > 0) {
        throw Object.assign(new Error("A pull request already exists for the branch"), {
          code: "BLOCKED_CONFLICT",
          details: existing,
        });
      }

      await git(cwd, ["add", "--", ...changedFiles], commandOptions());
      const staged = lines((await git(
        cwd,
        ["diff", "--cached", "--name-only"],
        commandOptions(),
      )).stdout).sort();
      if (JSON.stringify(staged) !== JSON.stringify([...changedFiles].sort())) {
        throw Object.assign(new Error("Staged paths differ from the validated final diff"), {
          code: "RUNNER_STAGED_PATH_MISMATCH",
          details: { staged, changedFiles },
        });
      }
      await git(cwd, ["diff", "--cached", "--check"], commandOptions());
      await git(cwd, [
        "commit",
        "-m",
        `[Harness] ${workPackage.work_package_id}: ${workPackage.title}`,
      ], commandOptions());
      const commitSha = (await git(cwd, ["rev-parse", "HEAD"], commandOptions()))
        .stdout.trim();
      const parentSha = (await git(cwd, ["rev-parse", "HEAD^"], commandOptions()))
        .stdout.trim();
      const commitCount = Number((await git(
        cwd,
        ["rev-list", "--count", `${sourceSha}..HEAD`],
        commandOptions(),
      )).stdout.trim());
      if (parentSha !== sourceSha || commitCount !== 1) {
        throw Object.assign(new Error("Publication commit ancestry differs from the approved source"), {
          code: "RUNNER_COMMIT_ANCESTRY_MISMATCH",
          details: { sourceSha, parentSha, commitCount },
        });
      }
      await git(
        cwd,
        ["push", "origin", `HEAD:refs/heads/${branch}`],
        commandOptions(),
      );
      const created = await gh(cwd, [
        "pr", "create", "--draft", "--base", "master", "--head", branch,
        "--title", pr.title, "--body", pr.body,
      ], commandOptions());
      remainingBudgetMs?.();
      return {
        commitSha,
        draftPrUrl: created.stdout.trim(),
        pushedBranch: branch,
      };
    },
  };
}
