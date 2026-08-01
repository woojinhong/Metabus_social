import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import {
  validateRunInput,
} from "./run-input-loader.mjs";
import {
  createRunManifest,
  updateRunManifest,
} from "./run-manifest.mjs";
import {
  detectPathConflicts,
  validateChangedFiles,
  validatePathPolicy,
} from "./path-policy.mjs";
import {
  createWorktreeManager,
  worktreePathFor,
} from "./worktree-manager.mjs";
import { createDisposableCloneManager } from "./disposable-clone-manager.mjs";
import { createPatchArtifactWriter } from "./patch-artifacts.mjs";
import { writeWorkerContext } from "./worker-context-builder.mjs";
import { unavailableCodexAdapter } from "./worker-process.mjs";
import { createTestRunner } from "./test-runner.mjs";
import { createGitPublisher } from "./git-publisher.mjs";
import { renderDraftPr } from "./draft-pr-renderer.mjs";
import { summarizeRun } from "./result-summary.mjs";

function packageRecord(workPackage, worktreeRoot, workspacePath = null) {
  return {
    workPackage,
    workPackageId: workPackage.work_package_id,
    branch: workPackage.proposed_branch,
    worktreePath: workspacePath
      ?? worktreePathFor(worktreeRoot, workPackage.work_package_id),
    state: "APPROVED",
    workerPid: null,
    changedFiles: [],
    tests: [],
    commitSha: null,
    draftPrUrl: null,
    errorCode: null,
    diagnosticsPath: null,
    workerResult: null,
    artifactPaths: null,
    budgetResult: null,
  };
}

function manifestPackages(packages) {
  return packages.map((entry) => ({
    work_package_id: entry.workPackageId,
    branch: entry.branch,
    worktree_path: entry.worktreePath,
    state: entry.state,
    worker_pid: entry.workerPid,
    test_results: entry.tests,
    commit_sha: entry.commitSha,
    draft_pr_url: entry.draftPrUrl,
    error_code: entry.errorCode,
    diagnostics_path: entry.diagnosticsPath,
    artifact_paths: entry.artifactPaths,
    usage_budget: entry.budgetResult,
  }));
}

function captureFailure(entry, error, fallbackState = "FAILED") {
  if ([
    "RUNNER_TOKEN_BUDGET_EXCEEDED",
    "RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED",
  ].includes(error.code)) {
    entry.state = "FAILED_BUDGET";
  } else {
    entry.state = [
    "BLOCKED_CONFLICT",
    "RUNNER_CODEX_COST_AUTHORITY_REQUIRED",
    "RUNNER_NO_CHANGE",
  ].includes(error.code)
    ? "BLOCKED"
      : fallbackState;
  }
  entry.errorCode = error.code ?? "RUNNER_FAILED";
  entry.error = error;
}

function assertExactPatchOnlyChange(changedFiles, exactAllowedPath) {
  if (changedFiles.length !== 1 || changedFiles[0] !== exactAllowedPath) {
    throw Object.assign(
      new Error("Patch-only changed files differ from the exact approved document"),
      {
        code: "RUNNER_PATCH_ONLY_SCOPE_INVALID",
        details: { changedFiles, exactAllowedPath },
      },
    );
  }
}

async function mapConcurrent(entries, concurrency, operation, shouldContinue = () => true) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, entries.length) },
    async () => {
      while (cursor < entries.length && shouldContinue()) {
        const index = cursor;
        cursor += 1;
        await operation(entries[index]);
      }
    },
  );
  await Promise.all(workers);
}

function terminalState(packages) {
  if (packages.every(({ state }) => state === "PATCH_READY_FOR_OWNER_REVIEW")) {
    return "PATCH_READY_FOR_OWNER_REVIEW";
  }
  if (packages.some(({ state }) => state === "FAILED_BUDGET")) return "FAILED_BUDGET";
  if (packages.every(({ state }) => state === "COMPLETED")) return "COMPLETED";
  if (packages.some(({ state }) => state === "FAILED")) return "FAILED";
  if (packages.every(({ state }) => state === "NO_CHANGE")) return "NO_CHANGE";
  return "BLOCKED";
}

function asRunnerError(error) {
  if (error.code) return error;
  error.code = "RUNNER_FAILED";
  return error;
}

function assertWorkerUsage(result, budget, aggregate) {
  const usage = result.usage;
  const usageVerified = usage?.verified === true
    && Number.isSafeInteger(usage.total_tokens)
    && usage.total_tokens >= 0
    && Number.isSafeInteger(usage.input_tokens)
    && usage.input_tokens >= 0
    && Number.isSafeInteger(usage.output_tokens)
    && usage.output_tokens >= 0
    && usage.input_tokens + usage.output_tokens === usage.total_tokens
    && Number.isSafeInteger(usage.external_calls)
    && usage.external_calls >= 0
    && usage.external_calls_verified === true
    && Number.isSafeInteger(usage.process_calls ?? 0)
    && (usage.process_calls ?? 0) >= 0;
  if (
    !usageVerified
    || (usage.cost_available === true && (
      usage.cost_verified !== true
      || typeof usage.cost !== "number"
      || !Number.isFinite(usage.cost)
      || usage.cost < 0
      || usage.currency !== budget.currency
    ))
    || (usage.cost_available !== true && (
      usage.cost !== null
      || usage.currency !== null
      || usage.cost_verified !== false
    ))
  ) {
    throw Object.assign(new Error("Worker did not return verifiable budget usage"), {
      code: "RUNNER_CODEX_USAGE_UNVERIFIED",
    });
  }
  if (
    usage.cost_available !== true
    && budget.monetary_cost_policy !== "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT"
  ) {
    throw Object.assign(new Error("Unavailable Codex cost lacks Owner authority"), {
      code: "RUNNER_CODEX_COST_AUTHORITY_REQUIRED",
    });
  }
  const next = {
    total_tokens: aggregate.total_tokens + usage.total_tokens,
    cost: usage.cost_available && aggregate.cost_available
      ? aggregate.cost + usage.cost
      : null,
    cost_available: aggregate.cost_available && usage.cost_available,
    cost_verified: aggregate.cost_verified && usage.cost_verified,
    currency: usage.cost_available && aggregate.cost_available ? budget.currency : null,
    external_calls: aggregate.external_calls + usage.external_calls,
    process_calls: aggregate.process_calls + (usage.process_calls ?? 0),
  };
  if (!Number.isSafeInteger(next.total_tokens)
    || !Number.isSafeInteger(next.external_calls)
    || !Number.isSafeInteger(next.process_calls)) {
    throw Object.assign(new Error("Worker aggregate usage overflowed safe budget arithmetic"), {
      code: "RUNNER_CODEX_USAGE_UNVERIFIED",
      details: { aggregate: next, budget },
    });
  }
  Object.assign(aggregate, next);
  const budgetResult = {
    total_tokens: next.total_tokens,
    worker_total_tokens: usage.total_tokens,
    max_total_tokens: budget.max_total_tokens ?? budget.max_tokens,
    token_budget_verified: true,
    token_budget_exceeded: next.total_tokens > (budget.max_total_tokens ?? budget.max_tokens),
    cost: next.cost,
    cost_available: next.cost_available,
    cost_verified: next.cost_verified,
    monetary_cost_policy: budget.monetary_cost_policy ?? null,
    external_calls: next.external_calls,
    max_external_calls: budget.max_external_calls,
    external_calls_verified: usage.external_calls_verified,
    process_calls: next.process_calls,
    observed: {
      total_tokens: usage.total_tokens,
      cost: usage.cost,
      external_calls: usage.external_calls,
      process_calls: usage.process_calls ?? 0,
    },
    authoritative: {
      total_tokens: next.total_tokens,
      worker_total_tokens: usage.total_tokens,
      cost: next.cost_verified ? next.cost : null,
      external_calls: next.external_calls,
    },
    authority_source: "FINAL_SUCCESSFUL_TURN_COMPLETED",
    patch_ready: false,
    error_code: null,
    terminal_state: "RUNNING",
  };
  if (budgetResult.token_budget_exceeded) {
    budgetResult.error_code = "RUNNER_TOKEN_BUDGET_EXCEEDED";
    budgetResult.terminal_state = "FAILED_BUDGET";
    throw Object.assign(new Error("Worker exceeded the Owner-approved total-token budget"), {
      code: budgetResult.error_code,
      details: { aggregate: next, budget_result: budgetResult },
    });
  }
  if (next.external_calls > budget.max_external_calls) {
    budgetResult.error_code = "RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED";
    budgetResult.terminal_state = "FAILED_BUDGET";
    throw Object.assign(new Error("Worker exceeded the Owner-approved external-call budget"), {
      code: budgetResult.error_code,
      details: { aggregate: next, budget_result: budgetResult },
    });
  }
  if (next.cost_available && next.cost > budget.max_cost) {
    throw Object.assign(new Error("Worker exceeded the Owner-approved monetary budget"), {
      code: "RUNNER_BUDGET_EXCEEDED",
      details: { aggregate: next, budget_result: budgetResult },
    });
  }
  return budgetResult;
}

export async function runLightweightRunner({
  dryRun,
  approval,
  approvalRecordHash,
  selectedWorkPackageIds,
  repositorySha,
  maxConcurrency,
  worktreeRoot,
  repository,
  prepareOnly = true,
  executionMode = null,
  manifestRoot = join(tmpdir(), "propscans-lightweight-runner"),
  diagnosticsRoot = manifestRoot,
  now,
  adapters = {},
}) {
  const input = validateRunInput({
    dryRun,
    approval,
    approvalRecordHash,
    selectedWorkPackageIds,
    repositorySha,
    maxConcurrency,
    worktreeRoot,
  });
  const requestedMode = executionMode
    ?? (prepareOnly ? "PREPARE_ONLY" : "EXECUTE_AND_DRAFT_PR");
  if (requestedMode !== input.publicationPolicy.mode) {
    throw Object.assign(
      new Error("Requested Runner mode differs from the Owner-approved mode"),
      {
        code: "RUNNER_EXECUTION_MODE_MISMATCH",
        details: {
          requested_mode: requestedMode,
          approved_mode: input.publicationPolicy.mode,
        },
      },
    );
  }
  const isPrepareOnly = requestedMode === "PREPARE_ONLY";
  const isPatchOnly = requestedMode === "EXECUTE_PATCH_ONLY";
  const requestedSourceRoot = resolve(repository);
  const approvedSourceRoot = input.patchOnly?.sourceRepositoryRoot ?? null;
  const sourceRootMatches = process.platform === "win32"
    ? requestedSourceRoot.toLowerCase() === approvedSourceRoot?.toLowerCase()
    : requestedSourceRoot === approvedSourceRoot;
  if (
    isPatchOnly
    && !sourceRootMatches
  ) {
    throw Object.assign(
      new Error("Patch-only repository differs from the Owner-approved local source root"),
      { code: "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID" },
    );
  }
  const deadline = performance.now() + input.executionBudget.wall_clock_seconds * 1_000;
  const aggregateUsage = {
    total_tokens: 0,
    cost: 0,
    cost_available: true,
    cost_verified: true,
    currency: input.executionBudget.currency,
    external_calls: 0,
    process_calls: 0,
  };
  let runBudgetError = null;
  const remainingBudgetMs = () => {
    const remaining = Math.floor(deadline - performance.now());
    if (remaining <= 0) {
      throw Object.assign(new Error("Run wall-clock budget exhausted"), {
        code: "RUNNER_BUDGET_EXCEEDED",
      });
    }
    return remaining;
  };
  for (const workPackage of input.selectedWorkPackages) {
    validatePathPolicy(workPackage, { approvalScope: input.approval });
  }
  detectPathConflicts(input.selectedWorkPackages, { approvalScope: input.approval });

  const worktreeManager = isPatchOnly
    ? adapters.disposableCloneManager ?? createDisposableCloneManager()
    : adapters.worktreeManager ?? createWorktreeManager();
  const worker = adapters.worker ?? unavailableCodexAdapter();
  const testRunner = adapters.testRunner ?? createTestRunner({
    allowPartialContainment: isPatchOnly,
  });
  const publisher = isPatchOnly
    ? null
    : adapters.publisher ?? createGitPublisher();
  const patchArtifacts = isPatchOnly
    ? adapters.patchArtifactWriter ?? createPatchArtifactWriter()
    : null;
  const verifier = isPatchOnly ? patchArtifacts : publisher;
  const repositoryUri = input.dryRun.input_snapshot.repository.canonical_uri;
  await worktreeManager.assertSourceReady(
    repository,
    input.sourceSha,
    repositoryUri,
    { remainingBudgetMs },
  );
  remainingBudgetMs();
  for (const workPackage of input.selectedWorkPackages) {
    await validateChangedFiles(
      workPackage.expected_changes.map(({ path }) => path),
      workPackage,
      {
        repositoryRoot: repository,
        approvalScope: input.approval,
        mustExist: false,
      },
    );
  }
  remainingBudgetMs();

  const packages = input.selectedWorkPackages.map(
    (workPackage) => packageRecord(
      workPackage,
      input.worktreeRoot,
      isPatchOnly ? input.patchOnly.disposableCloneRoot : null,
    ),
  );
  if (isPrepareOnly && typeof worktreeManager.assertAvailable === "function") {
    for (const entry of packages) {
      await worktreeManager.assertAvailable(
        repository,
        entry.branch,
        entry.worktreePath,
        { remainingBudgetMs },
      );
    }
  }
  remainingBudgetMs();
  const created = await createRunManifest(input, { root: manifestRoot, now });
  remainingBudgetMs();
  const manifestPath = created.manifestPath;

  if (isPrepareOnly) {
    remainingBudgetMs();
    return summarizeRun({
      runId: input.runId,
      dryRunId: input.dryRun.dry_run_id,
      state: "APPROVED",
      prepareOnly: true,
      manifestPath,
      packages,
    });
  }
  if (!["EXECUTE_PATCH_ONLY", "EXECUTE_AND_DRAFT_PR"].includes(requestedMode)) {
    const error = Object.assign(
      new Error("Owner approval does not permit execution"),
      { code: "RUNNER_PUBLICATION_POLICY_INVALID" },
    );
    await updateRunManifest(manifestPath, "BLOCKED", { error_code: error.code }, { now });
    throw error;
  }
  try {
    await Promise.all([
      worker.assertAvailable(),
      testRunner.assertAvailable(),
    ]);
  } catch (error) {
    const runnerError = asRunnerError(error);
    await updateRunManifest(manifestPath, "BLOCKED", {
      error_code: runnerError.code,
    }, { now });
    throw runnerError;
  }

  try {
    await updateRunManifest(manifestPath, "PREPARING", {
      packages: manifestPackages(packages),
    }, { now });
    for (const entry of packages) {
      remainingBudgetMs();
      try {
        await worktreeManager.prepare({
          repository,
          sourceSha: input.sourceSha,
          branch: entry.branch,
          worktreePath: entry.worktreePath,
          runId: input.runId,
          repositoryUri,
          remainingBudgetMs,
          executionMode: requestedMode,
          publicationPolicy: input.publicationPolicy,
          disposableCloneRoot: input.patchOnly?.disposableCloneRoot ?? null,
          ownerApprovedSourceRoot: input.patchOnly?.sourceRepositoryRoot ?? null,
        });
        remainingBudgetMs();
        entry.state = "PREPARING";
      } catch (error) {
        captureFailure(entry, asRunnerError(error), "BLOCKED");
        await updateRunManifest(manifestPath, "BLOCKED", {
          packages: manifestPackages(packages),
          error_code: entry.errorCode,
        }, { now });
        return summarizeRun({
          runId: input.runId,
          dryRunId: input.dryRun.dry_run_id,
          state: "BLOCKED",
          prepareOnly: false,
          manifestPath,
          packages,
          error,
        });
      }
    }

    await updateRunManifest(manifestPath, "RUNNING", {
      packages: manifestPackages(packages),
    }, { now });
    const workerConcurrency = worker.kind === "CODEX_CLI_0_146" ? 1 : input.maxConcurrency;
    await mapConcurrent(packages, workerConcurrency, async (entry) => {
      try {
        const context = await writeWorkerContext({
          diagnosticsRoot,
          runId: input.runId,
          workPackage: entry.workPackage,
          dryRun: input.dryRun,
          approval: input.approval,
          branch: entry.branch,
          worktreePath: entry.worktreePath,
        });
        entry.diagnosticsPath = context.packageRoot;
        entry.state = "RUNNING";
        const result = await worker.run({
          cwd: entry.worktreePath,
          promptPath: context.promptPath,
          contextPath: context.contextPath,
          logDirectory: context.packageRoot,
          timeoutMs: Math.min(
            input.executionBudget.worker_timeout_seconds * 1_000,
            remainingBudgetMs(),
          ),
          budget: input.executionBudget,
          workPackage: entry.workPackage,
        });
        entry.workerResult = result;
        entry.workerPid = result.pid ?? null;
        entry.budgetResult = assertWorkerUsage(result, input.executionBudget, aggregateUsage);
        if (result.code !== 0 || result.timedOut) {
          const error = Object.assign(new Error("Bounded Worker failed"), {
            code: result.timedOut ? "RUNNER_WORKER_TIMEOUT" : "RUNNER_WORKER_FAILED",
          });
          throw error;
        }
      } catch (error) {
        let effectiveError = error;
        if (error.workerResult) {
          entry.workerResult = error.workerResult;
          if (!error.details?.budget_result) {
            try {
              entry.budgetResult = assertWorkerUsage(
                error.workerResult,
                input.executionBudget,
                aggregateUsage,
              );
            } catch (usageError) {
              effectiveError = usageError;
            }
          }
        }
        const runnerError = asRunnerError(effectiveError);
        if ([
          "RUNNER_BUDGET_EXCEEDED",
          "RUNNER_TOKEN_BUDGET_EXCEEDED",
          "RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED",
        ].includes(runnerError.code)) {
          runBudgetError = runnerError;
        }
        if (runnerError.details?.budget_result) {
          entry.budgetResult = runnerError.details.budget_result;
        }
        captureFailure(entry, runnerError);
      }
    }, () => worker.kind !== "CODEX_CLI_0_146" || runBudgetError === null);

    if (runBudgetError !== null) {
      for (const entry of packages.filter(
        ({ state }) => state === "RUNNING" || state === "PREPARING",
      )) {
        const aggregateDecision = runBudgetError.details?.budget_result;
        if (aggregateDecision) {
          const workerObserved = entry.budgetResult?.observed ?? null;
          const workerTotal = entry.budgetResult?.worker_total_tokens ?? null;
          entry.budgetResult = {
            ...entry.budgetResult,
            ...aggregateDecision,
            worker_total_tokens: workerTotal,
            observed: workerObserved,
            authoritative: {
              ...aggregateDecision.authoritative,
              worker_total_tokens: workerTotal,
            },
          };
        }
        captureFailure(entry, runBudgetError);
      }
    }

    if (runBudgetError === null) {
      await updateRunManifest(manifestPath, "TESTING", {
        packages: manifestPackages(packages),
        aggregate_usage: aggregateUsage,
      }, { now });
    }
    await mapConcurrent(
      packages.filter(({ state }) => state === "RUNNING"),
      input.maxConcurrency,
      async (entry) => {
        try {
          await verifier.assertPinnedHead(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          const changedFiles = await verifier.changedFiles(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          if (changedFiles.length === 0) {
            throw Object.assign(new Error("Worker produced no change"), {
              code: "RUNNER_NO_CHANGE",
            });
          }
          entry.changedFiles = await validateChangedFiles(
            changedFiles,
            entry.workPackage,
            {
              repositoryRoot: entry.worktreePath,
              approvalScope: input.approval,
              mustExist: false,
            },
          );
          if (isPatchOnly) {
            assertExactPatchOnlyChange(
              entry.changedFiles,
              input.patchOnly.exactAllowedPath,
            );
          }
          const preTestFingerprint = await verifier.changeFingerprint(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          entry.tests = await testRunner.runRequired({
            cwd: entry.worktreePath,
            commands: [...new Set([
              ...entry.workPackage.required_tests,
              "git diff --check",
            ])],
            timeoutMs: Math.min(
              input.executionBudget.test_timeout_seconds * 1_000,
              remainingBudgetMs(),
            ),
          });
          remainingBudgetMs();
          await verifier.assertPinnedHead(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          const finalChangedFiles = await verifier.changedFiles(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          entry.changedFiles = await validateChangedFiles(
            finalChangedFiles,
            entry.workPackage,
            {
              repositoryRoot: entry.worktreePath,
              approvalScope: input.approval,
              mustExist: false,
            },
          );
          if (isPatchOnly) {
            assertExactPatchOnlyChange(
              entry.changedFiles,
              input.patchOnly.exactAllowedPath,
            );
          }
          const postTestFingerprint = await verifier.changeFingerprint(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          if (preTestFingerprint !== postTestFingerprint) {
            throw Object.assign(
              new Error("Required tests changed the publishable worktree state"),
              { code: "RUNNER_TEST_MUTATED_WORKTREE" },
            );
          }
          entry.state = "TESTING";
        } catch (error) {
          captureFailure(entry, asRunnerError(error));
          if (error.results) entry.tests = error.results;
        }
      },
    );

    if (isPatchOnly) {
      try {
        await worktreeManager.verifySourceUnchanged(
          repository,
          input.sourceSha,
          repositoryUri,
          { remainingBudgetMs },
        );
      } catch (error) {
        for (const entry of packages) captureFailure(entry, asRunnerError(error));
      }
      for (const entry of packages) {
        let workspaceState = null;
        let patch = "";
        let artifactTerminalState = entry.state;
        try {
          workspaceState = await patchArtifacts.inspect(
            entry.worktreePath,
            input.sourceSha,
            { remainingBudgetMs },
          );
          patchArtifacts.assertSafeState(workspaceState, input.sourceSha);
          patch = await patchArtifacts.createPatch(
            entry.worktreePath,
            input.sourceSha,
            workspaceState,
            { remainingBudgetMs },
          );
          if (entry.state === "FAILED_BUDGET") {
            entry.changedFiles = [...workspaceState.changed_files];
          } else {
            entry.changedFiles = await validateChangedFiles(
              workspaceState.changed_files,
              entry.workPackage,
              {
                repositoryRoot: entry.worktreePath,
                approvalScope: input.approval,
                mustExist: false,
              },
            );
            if (entry.changedFiles.length > 0) {
              assertExactPatchOnlyChange(
                entry.changedFiles,
                input.patchOnly.exactAllowedPath,
              );
            }
          }
          if (
            entry.state === "TESTING"
            || entry.errorCode === "RUNNER_NO_CHANGE"
          ) {
            if (Buffer.byteLength(patch) === 0) {
              entry.state = "NO_CHANGE";
              artifactTerminalState = "NO_CHANGE";
              entry.errorCode = "RUNNER_NO_CHANGE";
              entry.error = Object.assign(new Error("Worker produced no change"), {
                code: "RUNNER_NO_CHANGE",
              });
            } else {
              artifactTerminalState = "PATCH_READY_FOR_OWNER_REVIEW";
              if (entry.budgetResult !== null) {
                entry.budgetResult.patch_ready = true;
                entry.budgetResult.terminal_state = artifactTerminalState;
              }
            }
          }
        } catch (error) {
          captureFailure(entry, asRunnerError(error));
          artifactTerminalState = entry.state;
        }
        try {
          await worktreeManager.verifySourceUnchanged(
            repository,
            input.sourceSha,
            repositoryUri,
            { remainingBudgetMs },
          );
        } catch (error) {
          captureFailure(entry, asRunnerError(error));
          artifactTerminalState = entry.state;
        }
        const externalCalls = entry.workerResult?.usage?.external_calls;
        const containment = {
          status: input.patchOnly.status,
          limitations: input.patchOnly.limitations,
          disposable_clone: true,
          remote_present: (workspaceState?.remotes?.length ?? 0) > 0,
          credential_environment: "ALLOWLIST_ONLY",
          external_calls_reported: Number.isInteger(externalCalls) ? externalCalls : null,
          external_tool_event_detected: Number.isInteger(externalCalls)
            ? externalCalls > 0
            : null,
          network_observation: "CODEX_JSONL_EXTERNAL_TOOL_EVENTS_ONLY",
          process_termination: entry.workerResult?.processTermination ?? null,
          clone_preserved: true,
        };
        const outputDirectory = entry.diagnosticsPath
          ?? join(diagnosticsRoot, input.runId, entry.workPackageId);
        try {
          entry.artifactPaths = await patchArtifacts.writeArtifacts({
            outputDirectory,
            runId: input.runId,
            workPackage: entry.workPackage,
            sourceSha: input.sourceSha,
            state: workspaceState,
            tests: entry.tests,
            workerResult: entry.workerResult,
            patch,
            terminalState: artifactTerminalState,
            error: entry.error ?? null,
            containment,
            budgetResult: entry.budgetResult,
          });
          entry.state = artifactTerminalState;
        } catch (error) {
          captureFailure(entry, asRunnerError(error));
        }
      }
      const state = terminalState(packages);
      const firstError = packages.find(({ error }) => error)?.error ?? null;
      await updateRunManifest(manifestPath, state, {
        packages: manifestPackages(packages),
        error_code: firstError?.code ?? null,
        aggregate_usage: aggregateUsage,
      }, { now });
      return summarizeRun({
        runId: input.runId,
        dryRunId: input.dryRun.dry_run_id,
        state,
        prepareOnly: false,
        manifestPath,
        packages,
        error: firstError,
      });
    }

    const publishable = packages.filter(({ state }) => state === "TESTING");
    if (publishable.length > 0) {
      for (const entry of publishable) {
        try {
          remainingBudgetMs();
          const pr = renderDraftPr({
            workPackage: entry.workPackage,
            dryRun: input.dryRun,
            approval: input.approval,
            issueNumber: input.publicationPolicy.issue_number,
            changedFiles: entry.changedFiles,
            testResults: entry.tests,
            workerResult: entry.workerResult,
            notImplemented: [
              "Automatic merge, Ready transition, Issue close, and cleanup",
              "Dispatcher, Runtime Ledger, Critic loop, and Lesson Learned",
            ],
          });
          const result = await publisher.publish({
            cwd: entry.worktreePath,
            branch: entry.branch,
            workPackage: entry.workPackage,
            changedFiles: entry.changedFiles,
            pr,
            baseBranch: "master",
            repositoryUri: input.dryRun.input_snapshot.repository.canonical_uri,
            sourceSha: input.sourceSha,
            remainingBudgetMs,
          });
          entry.commitSha = result.commitSha;
          entry.draftPrUrl = result.draftPrUrl;
          entry.state = "COMPLETED";
          remainingBudgetMs();
        } catch (error) {
          captureFailure(entry, asRunnerError(error));
        }
      }
      if (packages.some(({ state }) => state === "COMPLETED")) {
        await updateRunManifest(manifestPath, "PR_DRAFT", {
          packages: manifestPackages(packages),
        }, { now });
      }
    }

    const state = terminalState(packages);
    remainingBudgetMs();
    const firstError = packages.find(({ error }) => error)?.error ?? null;
    await updateRunManifest(manifestPath, state, {
      packages: manifestPackages(packages),
      error_code: firstError?.code ?? null,
    }, { now });
    return summarizeRun({
      runId: input.runId,
      dryRunId: input.dryRun.dry_run_id,
      state,
      prepareOnly: false,
      manifestPath,
      packages,
      error: firstError,
    });
  } catch (error) {
    const runnerError = asRunnerError(error);
    const currentState = runnerError.code === "BLOCKED_CONFLICT" ? "BLOCKED" : "FAILED";
    try {
      await updateRunManifest(manifestPath, currentState, {
        packages: manifestPackages(packages),
        error_code: runnerError.code,
      }, { now });
    } catch (manifestError) {
      const combined = new AggregateError(
        [runnerError, manifestError],
        "Runner failed and could not persist its terminal manifest",
      );
      combined.code = "RUNNER_MANIFEST_WRITE_FAILED";
      combined.details = {
        primary_code: runnerError.code,
        manifest_error: manifestError.message,
      };
      throw combined;
    }
    throw runnerError;
  }
}
