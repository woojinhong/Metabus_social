import { copyFile, mkdir, mkdtemp, rename, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { serializeJcs, sha256Digest } from "../canonical-json.mjs";
import { runProcess } from "./process-utils.mjs";

function lines(text) {
  return String(text).split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

function artifactError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function patchForUntracked(path, output) {
  return String(output)
    .replace(/^diff --git a\/NUL b\/.+$/mu, () => `diff --git a/${path} b/${path}`)
    .replace(/^--- a\/NUL$/mu, () => "--- /dev/null");
}

export function createPatchArtifactWriter({
  gitExecutable = "git",
  run = runProcess,
} = {}) {
  const git = async (cwd, args, options = {}) => {
    const result = await run(gitExecutable, args, {
      cwd,
      timeoutMs: 30_000,
      ...options,
    });
    if (result.code !== 0) {
      throw artifactError(
        "RUNNER_GIT_INSPECTION_FAILED",
        `git ${args.join(" ")} exited ${result.code}`,
        { stderr: result.stderr },
      );
    }
    return result;
  };

  return {
    async inspect(cwd, sourceSha, { remainingBudgetMs } = {}) {
      const options = () => ({ timeoutMs: remainingBudgetMs?.() ?? 30_000 });
      const [head, staged, remotes, tracked, untracked, ignored, commitCount] =
        await Promise.all([
          git(cwd, ["rev-parse", "HEAD"], options()),
          git(cwd, ["diff", "--cached", "--name-only"], options()),
          git(cwd, ["remote"], options()),
          git(cwd, ["diff", "--name-only", sourceSha], options()),
          git(cwd, ["ls-files", "--others", "--exclude-standard"], options()),
          git(cwd, ["ls-files", "--others", "--ignored", "--exclude-standard"], options()),
          git(cwd, ["rev-list", "--count", `${sourceSha}..HEAD`], options()),
        ]);
      const state = {
        head: head.stdout.trim(),
        staged: lines(staged.stdout).sort(),
        remotes: lines(remotes.stdout).sort(),
        tracked: lines(tracked.stdout).sort(),
        untracked: [...new Set([
          ...lines(untracked.stdout),
          ...lines(ignored.stdout),
        ])].sort(),
        commit_count: Number(commitCount.stdout.trim()),
      };
      state.changed_files = [...new Set([...state.tracked, ...state.untracked])].sort();
      return state;
    },

    assertSafeState(state, sourceSha) {
      if (state.head !== sourceSha || state.commit_count !== 0) {
        throw artifactError(
          "RUNNER_HEAD_CHANGED",
          "Patch-only Worker or required test changed Git HEAD",
          { sourceSha, head: state.head, commit_count: state.commit_count },
        );
      }
      if (state.staged.length > 0) {
        throw artifactError(
          "RUNNER_PRESTAGED_CHANGE",
          "Patch-only Worker or required test staged files",
          { staged: state.staged },
        );
      }
      if (state.remotes.length > 0) {
        throw artifactError(
          "RUNNER_DISPOSABLE_REMOTE_PRESENT",
          "Patch-only disposable clone acquired a Git remote",
          { remotes: state.remotes },
        );
      }
      return state;
    },

    async assertPinnedHead(cwd, sourceSha, options = {}) {
      const state = await this.inspect(cwd, sourceSha, options);
      this.assertSafeState(state, sourceSha);
      return state.head;
    },

    async changedFiles(cwd, sourceSha, options = {}) {
      const state = await this.inspect(cwd, sourceSha, options);
      this.assertSafeState(state, sourceSha);
      return state.changed_files;
    },

    async changeFingerprint(cwd, sourceSha, options = {}) {
      const state = await this.inspect(cwd, sourceSha, options);
      this.assertSafeState(state, sourceSha);
      const patch = await this.createPatch(cwd, sourceSha, state, options);
      return sha256Digest({ patch, changed_files: state.changed_files });
    },

    async createPatch(cwd, sourceSha, state, { remainingBudgetMs } = {}) {
      const tracked = await git(cwd, ["diff", "--binary", sourceSha], {
        timeoutMs: remainingBudgetMs?.() ?? 30_000,
      });
      const sections = [tracked.stdout];
      for (const path of state.untracked) {
        const result = await run(gitExecutable, [
          "diff",
          "--binary",
          "--no-index",
          "--",
          "NUL",
          path,
        ], {
          cwd,
          timeoutMs: remainingBudgetMs?.() ?? 30_000,
        });
        if (![0, 1].includes(result.code)) {
          throw artifactError(
            "RUNNER_PATCH_GENERATION_FAILED",
            `Unable to render untracked patch for ${path}`,
            { stderr: result.stderr },
          );
        }
        sections.push(patchForUntracked(path, result.stdout));
      }
      return sections.filter((section) => section !== "").join("");
    },

    async writeArtifacts({
      outputDirectory,
      runId,
      workPackage,
      sourceSha,
      state,
      tests,
      workerResult,
      patch,
      terminalState,
      error = null,
      containment,
      budgetResult = null,
    }) {
      await mkdir(outputDirectory, { recursive: true });
      const finalDirectory = join(outputDirectory, "patch-only-artifacts");
      const stagingDirectory = await mkdtemp(join(outputDirectory, ".patch-only-staging-"));
      const names = {
        changedFiles: "changed-files.json",
        testResults: "test-results.json",
        runResult: "run-result.json",
        finalSummary: "final-summary.md",
        patch: "output.patch",
        workerStdout: "worker-stdout.log",
        workerStderr: "worker-stderr.log",
      };
      const paths = {
        ...Object.fromEntries(
          Object.entries(names).map(([key, name]) => [key, join(finalDirectory, name)]),
        ),
      };
      const stagingPaths = Object.fromEntries(
        Object.entries(names).map(([key, name]) => [key, join(stagingDirectory, name)]),
      );
      const changedFiles = {
        record_kind: "PATCH_ONLY_CHANGED_FILES",
        source_sha: sourceSha,
        changed_files: state?.changed_files ?? [],
        tracked_files: state?.tracked ?? [],
        untracked_files: state?.untracked ?? [],
        staged_files: state?.staged ?? [],
      };
      const expectedTests = [...new Set([
        ...(workPackage.required_tests ?? []),
        "git diff --check",
      ])];
      const executedTests = (tests ?? []).map(({ command }) => command);
      const testsPassed = (tests ?? []).every(
        ({ exit_code, timed_out }) => exit_code === 0 && timed_out === false,
      );
      const testStatus = executedTests.length === 0
        ? "NOT_RUN"
        : !testsPassed
          ? "FAILED"
          : JSON.stringify(executedTests) === JSON.stringify(expectedTests)
            ? "PASSED"
            : "UNKNOWN";
      const testResults = {
        record_kind: "PATCH_ONLY_TEST_RESULTS",
        expected_tests: expectedTests,
        executed_tests: executedTests,
        status: testStatus,
        results: tests ?? [],
        all_passed: testStatus === "PASSED",
      };
      const runResult = {
        record_kind: "EXECUTE_PATCH_ONLY_RESULT",
        run_id: runId,
        work_package_id: workPackage.work_package_id,
        source_sha: sourceSha,
        state: terminalState,
        terminal_state: terminalState,
        error_code: error?.code ?? null,
        patch_ready: terminalState === "PATCH_READY_FOR_OWNER_REVIEW",
        changed_files: changedFiles.changed_files,
        patch_bytes: Buffer.byteLength(patch ?? ""),
        worker: workerResult === null ? null : {
          exit_code: workerResult.code,
          timed_out: workerResult.timedOut,
          pid: workerResult.pid ?? null,
          process_termination: workerResult.processTermination ?? null,
          usage: workerResult.usage ?? null,
        },
        containment,
        total_tokens: budgetResult?.total_tokens ?? null,
        max_total_tokens: budgetResult?.max_total_tokens ?? null,
        token_budget_verified: budgetResult?.token_budget_verified ?? false,
        token_budget_exceeded: budgetResult?.token_budget_exceeded ?? null,
        cost: budgetResult?.cost ?? null,
        cost_available: budgetResult?.cost_available ?? false,
        cost_verified: budgetResult?.cost_verified ?? false,
        monetary_cost_policy: budgetResult?.monetary_cost_policy ?? null,
        external_calls: budgetResult?.external_calls ?? null,
        max_external_calls: budgetResult?.max_external_calls ?? null,
        external_calls_verified: budgetResult?.external_calls_verified ?? false,
        process_calls: budgetResult?.process_calls ?? null,
        observed_usage: budgetResult?.observed ?? null,
        authoritative_usage: budgetResult?.authoritative ?? null,
        publication: {
          git_add: false,
          commit: false,
          push: false,
          github_adapter: false,
          pull_request: false,
        },
        error: error === null ? null : {
          code: error.code ?? "RUNNER_FAILED",
          message: error.message,
          details: error.details ?? null,
        },
      };
      const summary = [
        "# EXECUTE_PATCH_ONLY Result",
        "",
        `- Run: \`${runId}\``,
        `- Work Package: \`${workPackage.work_package_id}\``,
        `- Source SHA: \`${sourceSha}\``,
        `- State: \`${terminalState}\``,
        `- Patch ready: ${runResult.patch_ready}`,
        `- Total tokens: ${runResult.total_tokens ?? "unverified"} / ${runResult.max_total_tokens ?? "unverified"}`,
        `- Token budget verified/exceeded: ${runResult.token_budget_verified} / ${runResult.token_budget_exceeded ?? "unverified"}`,
        `- Cost: ${runResult.cost_available ? `${runResult.cost} ${workerResult?.usage?.currency}` : "unavailable (null)"}`,
        `- Cost available/verified: ${runResult.cost_available} / ${runResult.cost_verified}`,
        `- Monetary cost policy: \`${runResult.monetary_cost_policy ?? "none"}\``,
        `- External calls: ${runResult.external_calls ?? "unverified"} / ${runResult.max_external_calls ?? "unverified"}`,
        `- External calls verified: ${runResult.external_calls_verified}`,
        `- Process calls: ${runResult.process_calls ?? "unverified"}`,
        `- Changed files: ${changedFiles.changed_files.length}`,
        `- Patch bytes: ${runResult.patch_bytes}`,
        `- Containment: \`${containment.status}\``,
        "- Commit/push/PR/GitHub adapter: disabled",
        "- Disposable clone and diagnostics are preserved for human review.",
        error === null ? "" : `- Error: \`${runResult.error.code}\` ${runResult.error.message}`,
        "",
      ].filter((line, index, values) => line !== "" || values[index - 1] !== "").join("\n");
      await Promise.all([
        writeFile(stagingPaths.changedFiles, `${serializeJcs(changedFiles)}\n`, { flag: "wx" }),
        writeFile(stagingPaths.testResults, `${serializeJcs(testResults)}\n`, { flag: "wx" }),
        writeFile(stagingPaths.runResult, `${serializeJcs(runResult)}\n`, { flag: "wx" }),
        writeFile(stagingPaths.finalSummary, `${summary}\n`, { flag: "wx" }),
        writeFile(stagingPaths.patch, patch ?? "", { flag: "wx" }),
        workerResult?.stdoutPath
          ? copyFile(workerResult.stdoutPath, stagingPaths.workerStdout, constants.COPYFILE_EXCL)
          : writeFile(stagingPaths.workerStdout, "", { flag: "wx" }),
        workerResult?.stderrPath
          ? copyFile(workerResult.stderrPath, stagingPaths.workerStderr, constants.COPYFILE_EXCL)
          : writeFile(stagingPaths.workerStderr, "", { flag: "wx" }),
      ]);
      await rename(stagingDirectory, finalDirectory);
      return paths;
    },
  };
}
