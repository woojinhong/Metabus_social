import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  makeDryRun,
  makeOwnerApproval,
  REPOSITORY_SHA,
  RUN_ID,
  resealApproval,
} from "./fixtures/runner/valid/fixture-factory.mjs";
import { digestRecord } from "./planner/digest.mjs";
import { schemas } from "./planner/schemas.mjs";
import {
  computeApprovalRecordHash,
  validateRunInput as validateRunInputStrict,
} from "./runner/run-input-loader.mjs";
import {
  createRunManifest,
  readRunManifest,
} from "./runner/run-manifest.mjs";
import {
  createTestRunner,
  parseAllowedTestCommand,
} from "./runner/test-runner.mjs";
import {
  detectPathConflicts,
  validateChangedFiles,
  validatePathPolicy,
} from "./runner/path-policy.mjs";
import { runLightweightRunner } from "./runner/runner.mjs";
import { createWorktreeManager } from "./runner/worktree-manager.mjs";
import {
  buildWorkerContext,
  renderWorkerPrompt,
} from "./runner/worker-context-builder.mjs";
import { runCli } from "./runner/cli.mjs";
import { createGitPublisher } from "./runner/git-publisher.mjs";
import {
  createDisposableCloneManager,
  normalizeSafeDirectorySource,
} from "./runner/disposable-clone-manager.mjs";
import { createPatchArtifactWriter } from "./runner/patch-artifacts.mjs";
import {
  validateExpectedChangeAfterWorker,
  validateExpectedChangeAtSource,
  validatePatchOnlyExpectedChange,
} from "./runner/expected-change-policy.mjs";
import { runChecked } from "./runner/process-utils.mjs";
import {
  assertCodexOutputPolicy,
  parseCodexJsonlOutput,
} from "./runner/codex-output-parser.mjs";

const CODEX_0_146_FIXTURE = new URL(
  "./fixtures/codex-worker/codex-0.146.0-sanitized-success.jsonl",
  import.meta.url,
).pathname.replace(/^\/([A-Za-z]:)/u, "$1");

async function temporaryDirectory(t, prefix) {
  const root = await mkdtemp(join(tmpdir(), prefix));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

function validateRunInput(input) {
  return validateRunInputStrict({
    ...input,
    approvalRecordHash: input.approvalRecordHash ?? input.approval?.record_hash,
  });
}

function resealDryRun(dryRun) {
  dryRun.result_digest = digestRecord(dryRun, schemas["dry-run"]);
  return dryRun;
}

function makeFixture(specs, worktreeRoot, overrides = {}) {
  const dryRun = makeDryRun(specs);
  const approval = makeOwnerApproval(dryRun, {
    worktree_root: worktreeRoot,
    ...overrides,
  });
  return { dryRun, approval };
}

function assertCode(expected, operation) {
  assert.throws(operation, (error) => error.code === expected);
}

function fakeWorktreeManager() {
  const prepared = [];
  return {
    prepared,
    async assertSourceReady(_repository, sourceSha) {
      assert.equal(sourceSha, REPOSITORY_SHA);
      return { branch: "master", clean: true, head: sourceSha, originMaster: sourceSha };
    },
    async prepare(input) {
      prepared.push(input);
      await mkdir(input.worktreePath, { recursive: true });
      return input;
    },
  };
}

function fakeUsage(tokens = 100) {
  return {
    record_kind: "CODEX_WORKER_USAGE",
    usage_model_version: "1.0.0",
    parser_profile: "fixture",
    input_tokens: tokens,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: tokens,
    tokens,
    cost: 0,
    currency: "USD",
    cost_available: true,
    cost_verified: true,
    external_calls: 0,
    external_calls_verified: true,
    source_event_type: "turn.completed",
    source_event_id: "turn:1",
    verified: true,
    verification_reason: "FIXTURE_AUTHORITATIVE_USAGE",
  };
}

function fakeWorker({ onRun = null, exitCode = 0 } = {}) {
  let active = 0;
  let maximumActive = 0;
  const calls = [];
  return {
    calls,
    get maximumActive() {
      return maximumActive;
    },
    async assertAvailable() {
      return true;
    },
    async run(input) {
      calls.push(input);
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      try {
        const path = input.workPackage.path_policy.allowed_paths[0].path;
        const target = join(input.cwd, ...path.split("/"));
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, `changed by ${input.workPackage.work_package_id}\n`, "utf8");
        await writeFile(join(input.logDirectory, "worker.stdout.log"), "fake worker stdout\n");
        await writeFile(join(input.logDirectory, "worker.stderr.log"), "");
        await new Promise((resolve) => setTimeout(resolve, 10));
        const override = await onRun?.(input);
        return {
          code: override?.code ?? exitCode,
          timedOut: override?.timedOut ?? false,
          pid: 4000 + calls.length,
          stdoutPath: join(input.logDirectory, "worker.stdout.log"),
          stderrPath: join(input.logDirectory, "worker.stderr.log"),
          usage: override?.usage ?? fakeUsage(),
        };
      } finally {
        active -= 1;
      }
    },
  };
}

function sha256Record(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

async function preserveFakeProbeEvidence({
  probeDiagnosticsRoot,
  runId,
  workPackageId,
}, usage, {
  verified = true,
  verificationErrorCode = null,
} = {}) {
  const artifactPath = join(probeDiagnosticsRoot, "effective-sandbox-probe");
  await mkdir(artifactPath, { recursive: true });
  const resultBytes = `${JSON.stringify({
    record_kind: "CODEX_EFFECTIVE_SANDBOX_PROBE",
    run_id: runId,
    work_package_id: workPackageId,
    verified,
    verification_error_code: verificationErrorCode,
    usage,
  })}\n`;
  const inventoryBytes = `${JSON.stringify({
    record_kind: "CODEX_SANITIZED_EVENT_INVENTORY",
    external_calls: usage.external_calls,
    source_event_ids: usage.external_calls === 2 ? ["mcp-1", "web-1"] : [],
    content_fields_recorded: false,
  })}\n`;
  const contents = {
    "effective-sandbox-probe.json": resultBytes,
    "probe-usage.json": `${JSON.stringify(usage)}\n`,
    "event-inventory.json": inventoryBytes,
    "probe-stdout.jsonl": "{\"type\":\"fixture\"}\n",
    "probe-stderr.log": "fixture stderr\n",
    "sanitized-invocation.json": "{\"prompt_recorded\":false}\n",
    "binding.json": "{\"binding_sha256\":\"fixture\"}\n",
    "filesystem-result.json": "{\"probe_target_created\":true}\n",
    "final-summary.md": "# Fixture probe evidence\n",
  };
  for (const [name, content] of Object.entries(contents)) {
    await writeFile(join(artifactPath, name), content, "utf8");
  }
  return {
    effective_sandbox_probe: {
      artifact_path: artifactPath,
      probe_root: artifactPath,
      result_hash: sha256Record(resultBytes),
      event_inventory_hash: sha256Record(inventoryBytes),
      verified,
      verification_error_code: verificationErrorCode,
      usage,
    },
  };
}

function fakeTestRunner({ fail = false } = {}) {
  const calls = [];
  return {
    calls,
    async assertAvailable() {
      return true;
    },
    async runRequired({ commands }) {
      calls.push(commands);
      const results = commands.map((command) => ({
        command,
        exit_code: fail ? 1 : 0,
        timed_out: false,
        stdout: "",
        stderr: fail ? "fixture failure" : "",
      }));
      if (fail) {
        const error = Object.assign(new Error("fixture test failed"), {
          code: "RUNNER_REQUIRED_TEST_FAILED",
          results,
        });
        throw error;
      }
      return results;
    },
  };
}

function fakePublisher({ changedFiles = null, fingerprints = ["stable", "stable"] } = {}) {
  const publishCalls = [];
  let changedFileCall = 0;
  let fingerprintCall = 0;
  return {
    publishCalls,
    async assertPinnedHead() {
      return REPOSITORY_SHA;
    },
    async changeFingerprint() {
      const result = fingerprints[Math.min(fingerprintCall, fingerprints.length - 1)];
      fingerprintCall += 1;
      return result;
    },
    async changedFiles(cwd) {
      if (changedFiles !== null) {
        if (Array.isArray(changedFiles[0])) {
          const result = changedFiles[Math.min(changedFileCall, changedFiles.length - 1)];
          changedFileCall += 1;
          return result;
        }
        return changedFiles;
      }
      const relative = cwd.split(/[\\/]/u).at(-1);
      void relative;
      const candidates = [];
      async function walk(root, prefix = "") {
        const { readdir } = await import("node:fs/promises");
        for (const entry of await readdir(root, { withFileTypes: true })) {
          const next = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) await walk(join(root, entry.name), next);
          else candidates.push(next);
        }
      }
      await walk(cwd);
      return candidates.sort();
    },
    async publish(input) {
      publishCalls.push(input);
      return {
        commitSha: "d".repeat(40),
        draftPrUrl: `https://github.com/woojinhong/Metabus_social/pull/${100 + publishCalls.length}`,
      };
    },
  };
}

function fakePatchArtifactWriter({
  changedFiles = null,
  staged = [],
  head = REPOSITORY_SHA,
  patch = "fixture patch\n",
  writeError = null,
} = {}) {
  const writes = [];
  const inspect = async (cwd) => ({
    head,
    staged,
    remotes: [],
    tracked: changedFiles ?? [
      `${cwd.split(/[\\/]/u).at(-1) === "repository" ? "docs/allowed.md" : "docs/allowed.md"}`,
    ],
    untracked: [],
    commit_count: head === REPOSITORY_SHA ? 0 : 1,
    changed_files: changedFiles ?? ["docs/allowed.md"],
  });
  return {
    writes,
    inspect,
    assertSafeState(state, sourceSha) {
      if (state.head !== sourceSha || state.commit_count !== 0) {
        throw Object.assign(new Error("head changed"), { code: "RUNNER_HEAD_CHANGED" });
      }
      if (state.staged.length > 0) {
        throw Object.assign(new Error("staged"), { code: "RUNNER_PRESTAGED_CHANGE" });
      }
      return state;
    },
    async assertPinnedHead(cwd, sourceSha) {
      const state = await inspect(cwd);
      this.assertSafeState(state, sourceSha);
      return sourceSha;
    },
    async changedFiles(cwd, sourceSha) {
      const state = await inspect(cwd);
      this.assertSafeState(state, sourceSha);
      return state.changed_files;
    },
    async changeFingerprint() {
      return "stable";
    },
    async createPatch() {
      return changedFiles?.length === 0 ? "" : patch;
    },
    async writeArtifacts(input) {
      if (writeError) throw writeError;
      writes.push(input);
      return {
        patch: join(input.outputDirectory, "output.patch"),
        runResult: join(input.outputDirectory, "run-result.json"),
      };
    },
  };
}

function fakeDisposableCloneManager() {
  const prepared = [];
  return {
    prepared,
    async assertSourceReady(_repository, sourceSha) {
      assert.equal(sourceSha, REPOSITORY_SHA);
      return { branch: "master", clean: true, head: sourceSha, originMaster: sourceSha };
    },
    async prepare(input) {
      prepared.push(input);
      await mkdir(input.worktreePath, { recursive: true });
      return input;
    },
    async verifySourceUnchanged() {
      return true;
    },
  };
}

async function executeFixture(t, {
  specs = [{}],
  approvalOverrides = {},
  worker = fakeWorker(),
  testRunner = fakeTestRunner(),
  publisher = fakePublisher(),
  worktreeManager = null,
  prepareOnly = false,
  executionMode = null,
  patchArtifactWriter = null,
  disposableCloneManager = null,
  expectedChangeValidator = async ({ workPackage }) => {
    const expected = workPackage.expected_changes[0];
    return {
      ...expected,
      target_exists_at_source: expected.operation === "MODIFY",
    };
  },
  expectedChangeResultValidator = async ({ expectedChangeState }) =>
    expectedChangeState,
  captureRoots = () => {},
} = {}) {
  const root = await temporaryDirectory(t, "propscans-runner-test-");
  const worktreeRoot = join(root, "worktrees");
  const manifestRoot = join(root, "manifests");
  const diagnosticsRoot = join(root, "diagnostics");
  captureRoots({ root, manifestRoot, diagnosticsRoot, worktreeRoot });
  const requestedMode = executionMode
    ?? (prepareOnly ? "PREPARE_ONLY" : "EXECUTE_AND_DRAFT_PR");
  const { dryRun, approval } = makeFixture(specs, worktreeRoot, {
    publication_mode: requestedMode,
    ...(requestedMode === "EXECUTE_PATCH_ONLY"
      ? {
          disposable_clone_root: join(root, "disposable", "repository"),
          source_repository_root: root,
        }
      : {}),
    ...approvalOverrides,
  });
  const manager = worktreeManager ?? fakeWorktreeManager();
  const result = await runLightweightRunner({
    dryRun,
    approval,
    approvalRecordHash: approval.record_hash,
    selectedWorkPackageIds: approval.selected_work_package_ids,
    repositorySha: REPOSITORY_SHA,
    maxConcurrency: approval.max_concurrency,
    worktreeRoot,
    repository: root,
    prepareOnly,
    executionMode: requestedMode,
    manifestRoot,
    diagnosticsRoot,
    adapters: {
      worktreeManager: manager,
      disposableCloneManager:
        disposableCloneManager ?? fakeDisposableCloneManager(),
      worker,
      testRunner,
      publisher,
      patchArtifactWriter:
        patchArtifactWriter ?? fakePatchArtifactWriter(),
      expectedChangeValidator,
      expectedChangeResultValidator,
    },
  });
  return {
    root,
    dryRun,
    approval,
    result,
    manager,
    worker,
    testRunner,
    publisher,
  };
}

test("one READY Work Package produces an approved prepare-only plan", async (t) => {
  const fixture = await executeFixture(t, { prepareOnly: true });
  assert.equal(fixture.result.state, "APPROVED");
  assert.equal(fixture.result.prepare_only, true);
  assert.equal(fixture.manager.prepared.length, 0);
  const manifest = await readRunManifest(fixture.result.manifest_path);
  assert.equal(manifest.current_state, "APPROVED");
});

test("two independent Work Packages run with concurrency two", async (t) => {
  const worker = fakeWorker();
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "AH-RUNNER-A", path: "docs/test/a.md" },
      { alias: "AH-RUNNER-B", path: "docs/test/b.md" },
    ],
    worker,
  });
  assert.equal(fixture.result.state, "COMPLETED");
  assert.equal(worker.maximumActive, 2);
  assert.equal(fixture.publisher.publishCalls.length, 2);
});

test("concurrency four is rejected", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-concurrency-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"), {
    max_concurrency: 4,
  });
  assertCode("RUNNER_CONCURRENCY_INVALID", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("BLOCKED_OWNER and BLOCKED_DEPENDENCY dry-runs are rejected", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-blocked-");
  for (const specs of [
    [{ gate: "NOT_GRANTED" }],
    [
      { alias: "PARENT", path: "docs/test/parent.md" },
      { alias: "CHILD", path: "docs/test/child.md", parentAlias: "PARENT" },
    ],
  ]) {
    const dryRun = makeDryRun(specs);
    const approval = makeOwnerApproval(dryRun, {
      worktree_root: join(root, Math.random().toString(16).slice(2)),
      selected_work_package_ids: [dryRun.work_packages.at(-1).work_package_id],
    });
    assertCode("RUNNER_DRY_RUN_NOT_EXECUTABLE", () => validateRunInput({
      dryRun,
      approval,
      repositorySha: REPOSITORY_SHA,
    }));
  }
});

test("digest, source SHA, and Owner selected-ID tampering fail closed", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-pins-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"));

  const digestMismatch = structuredClone(dryRun);
  digestMismatch.result_digest = `sha256:${"f".repeat(64)}`;
  assertCode("RUNNER_DIGEST_MISMATCH", () => validateRunInput({
    dryRun: digestMismatch,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
  assertCode("RUNNER_SOURCE_STALE", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: "b".repeat(40),
  }));
  assertCode("RUNNER_SELECTED_IDS_MISMATCH", () => validateRunInput({
    dryRun,
    approval,
    selectedWorkPackageIds: [],
    repositorySha: REPOSITORY_SHA,
  }));
});

test("approval hash tampering fails closed", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-approval-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"));
  approval.approved_at = "2026-08-01T00:00:00Z";
  assert.notEqual(approval.record_hash, computeApprovalRecordHash(approval));
  assertCode("RUNNER_APPROVAL_HASH_MISMATCH", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("existing branch and worktree path are BLOCKED_CONFLICT in a temp Git repository", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-git-");
  execFileSync("git", ["init", "-b", "master"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Runner Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "runner@example.invalid"], { cwd: root });
  await writeFile(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: root });
  execFileSync("git", ["commit", "-m", "fixture"], { cwd: root });
  execFileSync("git", ["branch", "harness/existing"], { cwd: root });
  const manager = createWorktreeManager();
  await assert.rejects(
    manager.assertAvailable(root, "harness/existing", join(root, "new-worktree")),
    (error) => error.code === "BLOCKED_CONFLICT",
  );
  const occupied = join(root, "occupied");
  await mkdir(occupied);
  await assert.rejects(
    manager.assertAvailable(root, "harness/new", occupied),
    (error) => error.code === "BLOCKED_CONFLICT",
  );
});

test("overlapping allowed paths are BLOCKED_CONFLICT", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-overlap-");
  const dryRun = makeDryRun([
    { alias: "OVERLAP-A", path: "docs/test/a.md" },
    { alias: "OVERLAP-B", path: "docs/test/b.md" },
  ]);
  dryRun.work_packages[1].path_policy.allowed_paths =
    structuredClone(dryRun.work_packages[0].path_policy.allowed_paths);
  resealDryRun(dryRun);
  const approval = makeOwnerApproval(dryRun, { worktree_root: join(root, "worktrees") });
  const input = validateRunInput({ dryRun, approval, repositorySha: REPOSITORY_SHA });
  assertCode("BLOCKED_CONFLICT", () =>
    detectPathConflicts(input.selectedWorkPackages, { approvalScope: approval }));
});

test("forbidden src paths and traversal are rejected", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-paths-");
  for (const path of ["src/main/example.java", "docs/../src/example.java"]) {
    const dryRun = makeDryRun([{}]);
    dryRun.work_packages[0].path_policy.allowed_paths = [{ path, match: "EXACT" }];
    try {
      resealDryRun(dryRun);
      const approval = makeOwnerApproval(dryRun, { worktree_root: join(root, path.length.toString()) });
      const input = validateRunInput({ dryRun, approval, repositorySha: REPOSITORY_SHA });
      assert.throws(
        () => validatePathPolicy(input.selectedWorkPackages[0], { approvalScope: approval }),
        (error) => ["HARD_PROHIBITED_PATH", "PATH_OUTSIDE_PILOT_ROOTS"].includes(error.code),
      );
    } catch (error) {
      assert.ok([
        "HARD_PROHIBITED_PATH",
        "INVALID_POSIX_PATH",
        "RUNNER_DRY_RUN_INVALID",
      ].includes(error.code));
    }
  }
});

test("symlink escape is rejected", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-symlink-root-");
  const outside = await temporaryDirectory(t, "propscans-runner-symlink-outside-");
  await mkdir(join(root, "docs"), { recursive: true });
  await symlink(outside, join(root, "docs", "escape"), "junction");
  const workPackage = makeDryRun([{}]).work_packages[0];
  workPackage.path_policy.allowed_paths = [{ path: "docs", match: "SUBTREE" }];
  await assert.rejects(
    validateChangedFiles(["docs/escape/file.md"], workPackage, {
      repositoryRoot: root,
      approvalScope: { allowed_paths: [] },
    }),
    (error) => error.code === "SYMLINK_ESCAPE",
  );
});

test("post-Worker path violation blocks publication", async (t) => {
  const publisher = fakePublisher({ changedFiles: ["docs/outside.md"] });
  const fixture = await executeFixture(t, { publisher });
  assert.equal(fixture.result.state, "FAILED_PATH_POLICY");
  assert.equal(fixture.result.packages[0].error_code, "PATH_NOT_ALLOWED");
  assert.equal(publisher.publishCalls.length, 0);
});

test("Worker reparse escape is classified as FAILED_PATH_POLICY", async (t) => {
  const worker = fakeWorker({
    onRun: async () => {
      throw Object.assign(new Error("worker path escaped"), {
        code: "RUNNER_WORKER_PATH_ESCAPE",
      });
    },
  });
  const fixture = await executeFixture(t, { worker });
  assert.equal(fixture.result.state, "FAILED_PATH_POLICY");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_WORKER_PATH_ESCAPE");
  assert.equal(fixture.publisher.publishCalls.length, 0);
});

test("required test failure blocks publication and preserves diagnostics", async (t) => {
  const publisher = fakePublisher();
  const fixture = await executeFixture(t, {
    testRunner: fakeTestRunner({ fail: true }),
    publisher,
  });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_REQUIRED_TEST_FAILED");
  assert.equal(publisher.publishCalls.length, 0);
  const manifest = await readRunManifest(fixture.result.manifest_path);
  assert.equal(manifest.current_state, "FAILED");
  assert.ok(manifest.packages[0].diagnostics_path);
  assert.match(
    await readFile(join(manifest.packages[0].diagnostics_path, "worker-context.json"), "utf8"),
    /BOUNDED_WORKER_CONTEXT/u,
  );
  assert.match(
    await readFile(join(manifest.packages[0].diagnostics_path, "worker.stdout.log"), "utf8"),
    /fake worker stdout/u,
  );
});

test("clean/no-change is explicit and blocks publication", async (t) => {
  const publisher = fakePublisher({ changedFiles: [] });
  const fixture = await executeFixture(t, { publisher });
  assert.equal(fixture.result.state, "BLOCKED");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_NO_CHANGE");
  assert.equal(publisher.publishCalls.length, 0);
});

test("effective sandbox failures block before Worker start and are not NO_CHANGE", async (t) => {
  for (const code of [
    "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
    "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
    "RUNNER_CODEX_PROBE_TOOL_POLICY_VIOLATION",
  ]) {
    await t.test(code, async (subtest) => {
      const worker = fakeWorker();
      worker.assertAvailable = async () => {
        throw Object.assign(new Error("effective sandbox preflight failed"), { code });
      };
      await assert.rejects(
        executeFixture(subtest, {
          worker,
          executionMode: "EXECUTE_PATCH_ONLY",
        }),
        (error) => error.code === code && error.code !== "RUNNER_NO_CHANGE",
      );
      assert.equal(worker.calls.length, 0);
    });
  }
});

test("effective sandbox probe usage is included in the Owner run budget", async (t) => {
  const worker = fakeWorker({ onRun: () => ({ usage: fakeUsage(100) }) });
  worker.assertAvailable = async () => ({
    effective_sandbox_probe: { usage: fakeUsage(50) },
  });
  const patchArtifactWriter = fakePatchArtifactWriter();
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    worker,
    patchArtifactWriter,
    executionMode: "EXECUTE_PATCH_ONLY",
  });
  assert.equal(fixture.result.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(patchArtifactWriter.writes[0].budgetResult.total_tokens, 150);
  assert.equal(worker.calls.length, 1);
});

test("probe token exhaustion blocks before the actual Worker", async (t) => {
  const worker = fakeWorker();
  worker.assertAvailable = async (input) =>
    preserveFakeProbeEvidence(input, fakeUsage(600_001));
  let roots;
  await assert.rejects(
    executeFixture(t, {
      specs: [{ path: "docs/allowed.md" }],
      worker,
      executionMode: "EXECUTE_PATCH_ONLY",
      captureRoots: (value) => { roots = value; },
    }),
    (error) => error.code === "RUNNER_TOKEN_BUDGET_EXCEEDED",
  );
  assert.equal(worker.calls.length, 0);
  const manifest = await readRunManifest(join(
    roots.manifestRoot,
    RUN_ID,
    "manifest.json",
  ));
  assert.equal(manifest.current_state, "FAILED_BUDGET");
  assert.equal(manifest.aggregate_usage.total_tokens, 600_001);
  assert.equal(manifest.probe_budget_result.terminal_state, "FAILED_BUDGET");
  assert.equal(manifest.packages[0].state, "FAILED_BUDGET");
  assert.equal(manifest.packages[0].actual_worker_started, false);
  assert.equal(manifest.packages[0].worker_pid, null);
  assert.equal(manifest.packages[0].worktree_path, null);
  assert.ok(await readFile(join(manifest.probe_artifact_path, "probe-stdout.jsonl"), "utf8"));
});

test("failed sandbox probe usage is charged and budget failure takes precedence", async (t) => {
  for (const spec of [
    { name: "tokens", usage: fakeUsage(600_001), code: "RUNNER_TOKEN_BUDGET_EXCEEDED" },
    {
      name: "external-call",
      usage: { ...fakeUsage(50), external_calls: 2 },
      code: "RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED",
    },
  ]) {
    await t.test(spec.name, async (subtest) => {
      const worker = fakeWorker();
      worker.assertAvailable = async (input) => {
        const evidence = await preserveFakeProbeEvidence(input, spec.usage, {
          verified: false,
          verificationErrorCode: "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
        });
        const error = Object.assign(new Error("sandbox probe failed"), {
          code: "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
          probeResult: evidence.effective_sandbox_probe,
        });
        throw error;
      };
      let roots;
      await assert.rejects(
        executeFixture(subtest, {
          specs: [{ path: "docs/allowed.md" }],
          worker,
          executionMode: "EXECUTE_PATCH_ONLY",
          captureRoots: (value) => { roots = value; },
        }),
        (error) => error.code === spec.code,
      );
      const manifest = await readRunManifest(join(
        roots.manifestRoot,
        RUN_ID,
        "manifest.json",
      ));
      assert.equal(manifest.current_state, "FAILED_BUDGET");
      assert.equal(manifest.error_code, spec.code);
      assert.equal(manifest.aggregate_usage.total_tokens, spec.usage.total_tokens);
      assert.equal(manifest.aggregate_usage.external_calls, spec.usage.external_calls);
      assert.equal(manifest.packages[0].state, "FAILED_BUDGET");
      assert.equal(manifest.packages[0].actual_worker_started, false);
      assert.notEqual(manifest.packages[0].state, "APPROVED");
      assert.equal(manifest.probe_terminal_state, "FAILED_BUDGET");
      assert.equal(manifest.probe_error_code, spec.code);
      for (const name of [
        "effective-sandbox-probe.json",
        "probe-usage.json",
        "event-inventory.json",
        "probe-stdout.jsonl",
        "probe-stderr.log",
      ]) {
        await access(join(manifest.probe_artifact_path, name));
      }
      assert.equal(
        manifest.probe_result_hash,
        sha256Record(await readFile(join(
          manifest.probe_artifact_path,
          "effective-sandbox-probe.json",
        ))),
      );
      assert.equal(
        manifest.probe_event_inventory_hash,
        sha256Record(await readFile(join(
          manifest.probe_artifact_path,
          "event-inventory.json",
        ))),
      );
      assert.equal(worker.calls.length, 0);
    });
  }
});

test("probe tool-policy violation outranks external budget while preserving usage", async (t) => {
  const worker = fakeWorker();
  worker.assertAvailable = async (input) => {
    const evidence = await preserveFakeProbeEvidence(input, {
      ...fakeUsage(50),
      external_calls: 2,
    }, {
      verified: false,
      verificationErrorCode: "RUNNER_CODEX_PROBE_TOOL_POLICY_VIOLATION",
    });
    throw Object.assign(new Error("probe used forbidden MCP tools"), {
      code: "RUNNER_CODEX_PROBE_TOOL_POLICY_VIOLATION",
      probeResult: evidence.effective_sandbox_probe,
    });
  };
  const publisher = fakePublisher();
  let roots;
  await assert.rejects(
    executeFixture(t, {
      specs: [{ path: "docs/allowed.md" }],
      worker,
      publisher,
      executionMode: "EXECUTE_PATCH_ONLY",
      captureRoots: (value) => { roots = value; },
    }),
    (error) => error.code === "RUNNER_CODEX_PROBE_TOOL_POLICY_VIOLATION",
  );
  const manifest = await readRunManifest(join(
    roots.manifestRoot,
    RUN_ID,
    "manifest.json",
  ));
  assert.equal(manifest.current_state, "BLOCKED");
  assert.equal(manifest.error_code, "RUNNER_CODEX_PROBE_TOOL_POLICY_VIOLATION");
  assert.equal(manifest.probe_error_code, "RUNNER_CODEX_PROBE_TOOL_POLICY_VIOLATION");
  assert.equal(manifest.probe_terminal_state, "BLOCKED_ENVIRONMENT");
  assert.equal(manifest.probe_usage.external_calls, 2);
  assert.equal(manifest.probe_budget_result.error_code, "RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED");
  assert.equal(manifest.packages[0].actual_worker_started, false);
  assert.equal(worker.calls.length, 0);
  assert.equal(publisher.publishCalls.length, 0);
  assert.ok(await readFile(join(manifest.probe_artifact_path, "probe-stdout.jsonl"), "utf8"));
});

test("probe artifact write failure is BLOCKED and never leaves package APPROVED", async (t) => {
  const worker = fakeWorker();
  worker.assertAvailable = async () => {
    throw Object.assign(new Error("probe evidence write failed"), {
      code: "RUNNER_PROBE_ARTIFACT_WRITE_FAILED",
    });
  };
  let roots;
  await assert.rejects(
    executeFixture(t, {
      worker,
      executionMode: "EXECUTE_PATCH_ONLY",
      captureRoots: (value) => { roots = value; },
    }),
    (error) => error.code === "RUNNER_PROBE_ARTIFACT_WRITE_FAILED",
  );
  const manifest = await readRunManifest(join(roots.manifestRoot, RUN_ID, "manifest.json"));
  assert.equal(manifest.current_state, "BLOCKED");
  assert.equal(manifest.packages[0].state, "BLOCKED");
  assert.equal(manifest.packages[0].actual_worker_started, false);
  assert.equal(manifest.probe_terminal_state, "FAILED_ARTIFACT_WRITE");
  assert.equal(worker.calls.length, 0);
});

test("post-probe runtime write denial remains BLOCKED instead of NO_CHANGE", async (t) => {
  const worker = fakeWorker({
    onRun: async () => {
      throw Object.assign(new Error("runtime effective sandbox changed"), {
        code: "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
      });
    },
  });
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    worker,
    executionMode: "EXECUTE_PATCH_ONLY",
  });
  assert.equal(fixture.result.state, "BLOCKED");
  assert.equal(
    fixture.result.packages[0].error_code,
    "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
  );
  assert.equal(worker.calls.length, 1);
  assert.equal(fixture.publisher.publishCalls.length, 0);
});

test("sandbox mismatch outranks incomplete usage after runtime denial", async (t) => {
  const worker = fakeWorker();
  let roots;
  worker.run = async (input) => {
    worker.calls.push(input);
    const error = Object.assign(new Error("write denied before valid completion"), {
      code: "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
      workerResult: {
        code: 0,
        timedOut: false,
        pid: 4321,
        usage: { verified: false, external_calls: 0 },
      },
    });
    throw error;
  };
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    worker,
    executionMode: "EXECUTE_PATCH_ONLY",
    captureRoots: (value) => { roots = value; },
  });
  assert.equal(fixture.result.state, "BLOCKED");
  assert.equal(
    fixture.result.packages[0].error_code,
    "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
  );
  assert.equal(worker.calls.length, 1);
  assert.equal(fixture.publisher.publishCalls.length, 0);
  const manifest = await readRunManifest(join(roots.manifestRoot, RUN_ID, "manifest.json"));
  assert.equal(manifest.packages[0].actual_worker_started, true);
  assert.equal(manifest.packages[0].worker_pid, 4321);
});

test("pre-spawn Worker binding failure keeps actual_worker_started false", async (t) => {
  const worker = fakeWorker();
  let preSpawnChecks = 0;
  worker.run = async () => {
    preSpawnChecks += 1;
    throw Object.assign(new Error("binding changed before spawn"), {
      code: "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
    });
  };
  let roots;
  const fixture = await executeFixture(t, {
    worker,
    executionMode: "EXECUTE_PATCH_ONLY",
    captureRoots: (value) => { roots = value; },
  });
  assert.equal(fixture.result.state, "BLOCKED");
  assert.equal(preSpawnChecks, 1);
  assert.equal(worker.calls.length, 0);
  const manifest = await readRunManifest(join(roots.manifestRoot, RUN_ID, "manifest.json"));
  assert.equal(manifest.packages[0].actual_worker_started, false);
  assert.equal(manifest.packages[0].worker_pid, null);
});

test("fake Worker success reaches commit/push/Draft-PR adapter plan only", async (t) => {
  const fixture = await executeFixture(t);
  assert.equal(fixture.result.state, "COMPLETED");
  assert.equal(fixture.worker.calls.length, 1);
  assert.equal(fixture.publisher.publishCalls.length, 1);
  const call = fixture.publisher.publishCalls[0];
  assert.notEqual(call.branch, "master");
  assert.match(call.pr.body, /Refs #56/u);
  assert.doesNotMatch(call.pr.body, /\b(?:Closes|Fixes|Resolves)\b/iu);
  assert.match(call.pr.body, /Draft publication only/u);
});

test("the same run_id cannot overwrite an existing manifest", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-manifest-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"));
  const input = validateRunInput({ dryRun, approval, repositorySha: REPOSITORY_SHA });
  await createRunManifest(input, { root: join(root, "manifests") });
  await assert.rejects(
    createRunManifest(input, { root: join(root, "manifests") }),
    (error) => error.code === "RUNNER_RUN_ID_CONFLICT",
  );
});

test("Owner approval selected package pin deletion is rejected", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-delete-pin-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"));
  approval.selected_work_packages = [];
  resealApproval(approval);
  assertCode("RUNNER_WORK_PACKAGE_PIN_MISMATCH", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("required-test allowlist rejects shell chaining, pipes, redirects, and substitution", () => {
  assert.deepEqual(
    parseAllowedTestCommand("node scripts/harness/runner.test.mjs"),
    ["node", ["scripts/harness/runner.test.mjs"]],
  );
  for (const command of [
    "node scripts/harness/runner.test.mjs && whoami",
    "node scripts/harness/runner.test.mjs | more",
    "node scripts/harness/runner.test.mjs > result.txt",
    "node scripts/harness/$(whoami).test.mjs",
  ]) {
    assertCode("RUNNER_TEST_COMMAND_DENIED", () => parseAllowedTestCommand(command));
  }
});

test("publication adapter contains no merge, close, ready, force, or protected-branch command", async () => {
  const source = await readFile(
    new URL("./runner/git-publisher.mjs", import.meta.url),
    "utf8",
  );
  for (const prohibited of [
    "\"merge\"",
    "\"close\"",
    "ready-for-review",
    "--force",
    "push\", \"origin\", \"master",
  ]) {
    assert.equal(source.includes(prohibited), false, prohibited);
  }
});

test("out-of-band approval hash is mandatory and branch-body tampering is rejected", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-branch-pin-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"));
  assertCode("RUNNER_APPROVAL_HASH_REQUIRED", () => validateRunInputStrict({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
  dryRun.issue_drafts[0].body = dryRun.issue_drafts[0].body.replace(
    /harness\/proposed-[a-z0-9-]+/u,
    "harness/attacker-selected",
  );
  assertCode("RUNNER_WORK_PACKAGE_PIN_MISMATCH", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("GLOB path rules fail closed in the lightweight Pilot", () => {
  const workPackage = makeDryRun([{}]).work_packages[0];
  workPackage.path_policy.allowed_paths = [{ path: "docs/a*/x", match: "GLOB" }];
  assertCode("PATH_GLOB_UNSUPPORTED", () =>
    validatePathPolicy(workPackage, { approvalScope: { allowed_paths: [] } }));
});

test("Owner approval pins the exact reviewed Planner warning IDs", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-warning-pin-");
  const dryRun = makeDryRun([
    { alias: "WARN-A", path: "docs/test/shared.md" },
    { alias: "WARN-B", path: "docs/test/shared.md" },
  ]);
  assert.ok(dryRun.warnings.length > 0);
  const approval = makeOwnerApproval(dryRun, { worktree_root: join(root, "worktrees") });
  approval.reviewed_warning_ids = [];
  resealApproval(approval);
  assertCode("RUNNER_WARNING_REVIEW_MISMATCH", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("post-test path mutation is re-enumerated and blocks publication", async (t) => {
  const dryRun = makeDryRun([{}]);
  const allowed = dryRun.work_packages[0].path_policy.allowed_paths[0].path;
  const publisher = fakePublisher({
    changedFiles: [[allowed], [allowed, "src/after-test.java"]],
  });
  const fixture = await executeFixture(t, { publisher });
  assert.equal(fixture.result.state, "FAILED_PATH_POLICY");
  assert.equal(fixture.result.packages[0].error_code, "HARD_PROHIBITED_PATH");
  assert.equal(publisher.publishCalls.length, 0);
});

test("an independent Worker failure does not cancel a successful Package", async (t) => {
  const worker = fakeWorker({
    onRun: ({ workPackage }) => (
      workPackage.title.includes("1") ? { code: 1 } : { code: 0 }
    ),
  });
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "CONTINUE-A", path: "docs/test/continue-a.md", title: "Package 1" },
      { alias: "CONTINUE-B", path: "docs/test/continue-b.md", title: "Package 2" },
    ],
    worker,
  });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(
    fixture.result.packages.filter(({ state }) => state === "COMPLETED").length,
    1,
  );
  assert.equal(fixture.publisher.publishCalls.length, 1);
});

test("three independent Packages respect the absolute concurrency ceiling", async (t) => {
  const worker = fakeWorker();
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "MAX3-A", path: "docs/test/max3-a.md" },
      { alias: "MAX3-B", path: "docs/test/max3-b.md" },
      { alias: "MAX3-C", path: "docs/test/max3-c.md" },
    ],
    approvalOverrides: { max_concurrency: 3 },
    worker,
  });
  assert.equal(fixture.result.state, "COMPLETED");
  assert.equal(worker.maximumActive, 3);
});

test("real Codex adapter kind is serialized to preserve aggregate run budgets", async (t) => {
  const worker = fakeWorker();
  worker.kind = "CODEX_CLI_0_146";
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "SERIAL-A", path: "docs/test/serial-a.md" },
      { alias: "SERIAL-B", path: "docs/test/serial-b.md" },
    ],
    approvalOverrides: { max_concurrency: 2 },
    worker,
  });
  assert.equal(fixture.result.state, "COMPLETED");
  assert.equal(worker.maximumActive, 1);
});

test("real Codex aggregate budget stops before launching another Package", async (t) => {
  const worker = fakeWorker({ onRun: () => ({ usage: fakeUsage(10_001) }) });
  worker.kind = "CODEX_CLI_0_146";
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "BUDGET-STOP-A", path: "docs/test/budget-stop-a.md" },
      { alias: "BUDGET-STOP-B", path: "docs/test/budget-stop-b.md" },
    ],
    approvalOverrides: { max_concurrency: 2 },
    worker,
  });
  assert.equal(worker.calls.length, 1);
  assert.equal(fixture.result.state, "FAILED_BUDGET");
  assert.equal(
    fixture.result.packages.filter(
      ({ error_code }) => error_code === "RUNNER_TOKEN_BUDGET_EXCEEDED",
    ).length,
    2,
  );
  assert.equal(fixture.publisher.publishCalls.length, 0);
});

test("Worker usage beyond the pinned token budget blocks publication", async (t) => {
  const worker = fakeWorker({
    onRun: () => ({
       usage: fakeUsage(10_001),
    }),
  });
  const fixture = await executeFixture(t, { worker });
  assert.equal(fixture.result.state, "FAILED_BUDGET");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_TOKEN_BUDGET_EXCEEDED");
  assert.equal(fixture.publisher.publishCalls.length, 0);
});

test("unverified Worker usage blocks publication even when numeric fields are present", async (t) => {
  const worker = fakeWorker({
    onRun: () => ({
      usage: {
        tokens: 0,
        cost: 0,
        external_calls: 0,
        verified: false,
      },
    }),
  });
  const fixture = await executeFixture(t, { worker });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(
    fixture.result.packages[0].error_code,
    "RUNNER_CODEX_USAGE_UNVERIFIED",
  );
  assert.equal(fixture.publisher.publishCalls.length, 0);
});

test("default required-test adapter refuses unverified network/process-tree isolation", async () => {
  await assert.rejects(
    createTestRunner().assertAvailable(),
    (error) => error.code === "RUNNER_TEST_SANDBOX_UNVERIFIED",
  );
});

test("Worker context contains canonical Requirements and no other selected Package IDs", () => {
  const dryRun = makeDryRun([
    { alias: "CTX-A", path: "docs/test/context-a.md" },
    { alias: "CTX-B", path: "docs/test/context-b.md" },
  ]);
  const approval = makeOwnerApproval(dryRun);
  const workPackage = dryRun.work_packages[0];
  const context = buildWorkerContext({
    workPackage,
    dryRun,
    approval,
    branch: approval.selected_work_packages
      .find(({ work_package_id }) => work_package_id === workPackage.work_package_id)
      .proposed_branch,
    worktreePath: "C:/tmp/context",
  });
  assert.equal(context.source_requirements.length, 1);
  assert.equal(
    context.source_requirements[0].requirement_id,
    workPackage.source_requirements[0].requirement_id,
  );
  assert.equal(context.authority.selected_work_package_id, workPackage.work_package_id);
  assert.equal(Object.hasOwn(context.authority, "selected_work_package_ids"), false);
  assert.equal(context.expected_operation, "MODIFY");
  assert.equal(context.target_exists_at_source, true);
  assert.equal(context.exact_target_path, workPackage.expected_changes[0].path);
  assert.match(context.execution_instruction, /^MODIFY the existing target file/u);
  assert.match(context.execution_instruction, /do not stop after analysis/u);
  const prompt = renderWorkerPrompt("C:/tmp/context.json", context);
  assert.match(prompt, /Expected operation: MODIFY/u);
  assert.match(prompt, /Do not run git add, commit, push/u);
  assert.match(prompt, /Modify exactly the allowed target file and no other file/u);
});

test("expected change validation distinguishes source CREATE and MODIFY", async (t) => {
  const root = await temporaryDirectory(t, "propscans-expected-change-");
  await mkdir(join(root, "docs"), { recursive: true });
  const createPackage = {
    expected_changes: [{ path: "docs/new.md", operation: "CREATE" }],
  };
  assert.deepEqual(
    await validateExpectedChangeAtSource({
      repositoryRoot: root,
      workPackage: createPackage,
      exactAllowedPath: "docs/new.md",
    }),
    { path: "docs/new.md", operation: "CREATE", target_exists_at_source: false },
  );
  await writeFile(join(root, "docs", "existing.md"), "before\n", "utf8");
  const modifyPackage = {
    expected_changes: [{ path: "docs/existing.md", operation: "MODIFY" }],
  };
  assert.deepEqual(
    await validateExpectedChangeAtSource({
      repositoryRoot: root,
      workPackage: modifyPackage,
      exactAllowedPath: "docs/existing.md",
    }),
    { path: "docs/existing.md", operation: "MODIFY", target_exists_at_source: true },
  );
  await assert.rejects(
    validateExpectedChangeAtSource({
      repositoryRoot: root,
      workPackage: {
        expected_changes: [{ path: "docs/existing.md", operation: "CREATE" }],
      },
      exactAllowedPath: "docs/existing.md",
    }),
    (error) => error.code === "RUNNER_EXPECTED_CHANGE_SOURCE_MISMATCH",
  );
  await assert.rejects(
    validateExpectedChangeAtSource({
      repositoryRoot: root,
      workPackage: {
        expected_changes: [{ path: "docs/missing.md", operation: "MODIFY" }],
      },
      exactAllowedPath: "docs/missing.md",
    }),
    (error) => error.code === "RUNNER_EXPECTED_CHANGE_SOURCE_MISMATCH",
  );
});

test("post-Worker operation validation rejects deletion and accepts a regular target", async (t) => {
  const root = await temporaryDirectory(t, "propscans-operation-result-");
  const target = "docs/target.md";
  await mkdir(join(root, "docs"), { recursive: true });
  await assert.rejects(
    validateExpectedChangeAfterWorker({
      repositoryRoot: root,
      expectedChangeState: {
        path: target,
        operation: "MODIFY",
        target_exists_at_source: true,
      },
    }),
    (error) => error.code === "RUNNER_EXPECTED_CHANGE_RESULT_MISMATCH",
  );
  await writeFile(join(root, target), "created\n", "utf8");
  await assert.doesNotReject(validateExpectedChangeAfterWorker({
    repositoryRoot: root,
    expectedChangeState: {
      path: target,
      operation: "CREATE",
      target_exists_at_source: false,
    },
  }));
});

test("expected change validation rejects delete, rename, directory, and reparse targets", async (t) => {
  for (const operation of ["DELETE", "RENAME"]) {
    assert.throws(
      () => validatePatchOnlyExpectedChange({
        expected_changes: [{ path: "docs/target.md", operation }],
      }, "docs/target.md"),
      (error) => error.code === "RUNNER_EXPECTED_CHANGE_OPERATION_UNSUPPORTED",
    );
  }
  const root = await temporaryDirectory(t, "propscans-expected-unsupported-");
  await mkdir(join(root, "docs", "directory.md"), { recursive: true });
  await assert.rejects(
    validateExpectedChangeAtSource({
      repositoryRoot: root,
      workPackage: {
        expected_changes: [{ path: "docs/directory.md", operation: "MODIFY" }],
      },
      exactAllowedPath: "docs/directory.md",
    }),
    (error) => error.code === "RUNNER_EXPECTED_CHANGE_TARGET_UNSUPPORTED",
  );
  const outside = await temporaryDirectory(t, "propscans-expected-outside-");
  await symlink(outside, join(root, "docs", "linked.md"), "junction");
  await assert.rejects(
    validateExpectedChangeAtSource({
      repositoryRoot: root,
      workPackage: {
        expected_changes: [{ path: "docs/linked.md", operation: "MODIFY" }],
      },
      exactAllowedPath: "docs/linked.md",
    }),
    (error) => ["SYMLINK_ESCAPE", "RUNNER_EXPECTED_CHANGE_TARGET_UNSUPPORTED"]
      .includes(error.code),
  );
});

test("Runner blocks stale CREATE and MODIFY operations before Worker launch", async (t) => {
  const createWorker = fakeWorker();
  const createManager = fakeDisposableCloneManager();
  const originalCreatePrepare = createManager.prepare.bind(createManager);
  createManager.prepare = async (input) => {
    await originalCreatePrepare(input);
    const target = join(input.worktreePath, "docs", "new.md");
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, "unexpected existing target\n", "utf8");
    return input;
  };
  const staleCreate = await executeFixture(t, {
    specs: [{
      path: "docs/source.md",
      targetPath: "docs/new.md",
      targetExistsAtSource: false,
    }],
    executionMode: "EXECUTE_PATCH_ONLY",
    worker: createWorker,
    disposableCloneManager: createManager,
    expectedChangeValidator: validateExpectedChangeAtSource,
  });
  assert.equal(staleCreate.result.state, "BLOCKED");
  assert.equal(
    staleCreate.result.packages[0].error_code,
    "RUNNER_EXPECTED_CHANGE_SOURCE_MISMATCH",
  );
  assert.equal(createWorker.calls.length, 0);

  const modifyWorker = fakeWorker();
  const staleModify = await executeFixture(t, {
    specs: [{ path: "docs/missing.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    worker: modifyWorker,
    expectedChangeValidator: validateExpectedChangeAtSource,
  });
  assert.equal(staleModify.result.state, "BLOCKED");
  assert.equal(
    staleModify.result.packages[0].error_code,
    "RUNNER_EXPECTED_CHANGE_SOURCE_MISMATCH",
  );
  assert.equal(modifyWorker.calls.length, 0);
});

test("repository readiness verifies canonical origin and live remote master", async () => {
  const canonicalUri = "https://github.com/woojinhong/metabus_social";
  const run = async (_executable, args) => {
    const command = args.join(" ");
    if (command === "branch --show-current") return { code: 0, stdout: "master\n", stderr: "" };
    if (command === "status --porcelain") return { code: 0, stdout: "", stderr: "" };
    if (command === "rev-parse HEAD") return { code: 0, stdout: `${REPOSITORY_SHA}\n`, stderr: "" };
    if (command === "rev-parse origin/master") {
      return { code: 0, stdout: `${REPOSITORY_SHA}\n`, stderr: "" };
    }
    if (command === "worktree list --porcelain") {
      return { code: 0, stdout: `worktree C:/repo\nHEAD ${REPOSITORY_SHA}\nbranch refs/heads/master\n`, stderr: "" };
    }
    if (command === "remote get-url origin") {
      return { code: 0, stdout: `${canonicalUri}.git\n`, stderr: "" };
    }
    if (command === "ls-remote --heads origin refs/heads/master") {
      return { code: 0, stdout: `${REPOSITORY_SHA}\trefs/heads/master\n`, stderr: "" };
    }
    throw new Error(command);
  };
  const manager = createWorktreeManager({ run });
  const state = await manager.assertSourceReady("C:/repo", REPOSITORY_SHA, canonicalUri);
  assert.equal(state.liveMasterSha, REPOSITORY_SHA);
  await assert.rejects(
    manager.assertSourceReady(
      "C:/repo",
      REPOSITORY_SHA,
      "https://github.com/example/other",
    ),
    (error) => error.code === "RUNNER_REPOSITORY_MISMATCH",
  );
});

test("remote branch collision fails closed before worktree creation", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-remote-branch-");
  const failure = (code) => {
    const error = new Error(`exit ${code}`);
    error.result = { code, stdout: "", stderr: "" };
    return error;
  };
  const run = async (_executable, args) => {
    if (args[0] === "show-ref") throw failure(1);
    if (args[0] === "ls-remote") {
      return { code: 0, stdout: `${REPOSITORY_SHA}\trefs/heads/harness/remote\n`, stderr: "" };
    }
    throw new Error(args.join(" "));
  };
  await assert.rejects(
    createWorktreeManager({ run }).assertAvailable(
      root,
      "harness/remote",
      join(root, "new-worktree"),
    ),
    (error) => error.code === "BLOCKED_CONFLICT",
  );
});

test("publication refuses any Worker- or test-staged index entry", async () => {
  const canonicalUri = "https://github.com/woojinhong/metabus_social";
  const run = async (executable, args) => {
    const command = `${executable} ${args.join(" ")}`;
    if (command === "git rev-parse HEAD") {
      return { code: 0, stdout: `${REPOSITORY_SHA}\n`, stderr: "" };
    }
    if (command === "git branch --show-current") {
      return { code: 0, stdout: "harness/proposed-fixture\n", stderr: "" };
    }
    if (command === "git remote get-url origin") {
      return { code: 0, stdout: `${canonicalUri}.git\n`, stderr: "" };
    }
    if (command === "git ls-remote --heads origin refs/heads/master") {
      return { code: 0, stdout: `${REPOSITORY_SHA}\trefs/heads/master\n`, stderr: "" };
    }
    if (command === "git status --porcelain=v1") {
      return { code: 0, stdout: " M docs/allowed.md\n", stderr: "" };
    }
    if (command === `git diff --name-only ${REPOSITORY_SHA}`) {
      return { code: 0, stdout: "docs/allowed.md\n", stderr: "" };
    }
    if (command === "git ls-files --others --exclude-standard") {
      return { code: 0, stdout: "", stderr: "" };
    }
    if (command === "git diff --cached --name-only") {
      return { code: 0, stdout: "src/prestaged.java\n", stderr: "" };
    }
    throw new Error(command);
  };
  await assert.rejects(
    createGitPublisher({ run }).publish({
      cwd: "C:/repo",
      branch: "harness/proposed-fixture",
      workPackage: { work_package_id: "WP-fixture", title: "Fixture" },
      changedFiles: ["docs/allowed.md"],
      pr: { title: "Fixture", body: "Refs #56" },
      repositoryUri: canonicalUri,
      sourceSha: REPOSITORY_SHA,
    }),
    (error) => error.code === "RUNNER_PRESTAGED_CHANGE",
  );
});

test("required tests may not change even an allowed publishable file", async (t) => {
  const publisher = fakePublisher({ fingerprints: ["before", "after"] });
  const fixture = await executeFixture(t, { publisher });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(
    fixture.result.packages[0].error_code,
    "RUNNER_TEST_MUTATED_WORKTREE",
  );
  assert.equal(publisher.publishCalls.length, 0);
});

test("Worker-created commits are rejected against the pinned source HEAD", async (t) => {
  const publisher = fakePublisher();
  publisher.assertPinnedHead = async () => {
    const error = new Error("fixture advanced HEAD");
    error.code = "RUNNER_HEAD_CHANGED";
    throw error;
  };
  const fixture = await executeFixture(t, { publisher });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_HEAD_CHANGED");
  assert.equal(publisher.publishCalls.length, 0);
});

test("Worker token usage is aggregated across the whole run", async (t) => {
  const worker = fakeWorker({
    onRun: () => ({
      usage: fakeUsage(6_000),
    }),
  });
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "BUDGET-A", path: "docs/test/budget-a.md" },
      { alias: "BUDGET-B", path: "docs/test/budget-b.md" },
    ],
    worker,
  });
  assert.equal(fixture.result.state, "FAILED_BUDGET");
  assert.equal(
    fixture.result.packages.filter(
      ({ error_code }) => error_code === "RUNNER_TOKEN_BUDGET_EXCEEDED",
    ).length,
    2,
  );
  for (const packageResult of fixture.result.packages) {
    assert.equal(packageResult.usage_budget.total_tokens, 12_000);
    assert.equal(packageResult.usage_budget.worker_total_tokens, 6_000);
    assert.equal(packageResult.usage_budget.token_budget_exceeded, true);
    assert.equal(packageResult.usage_budget.error_code, "RUNNER_TOKEN_BUDGET_EXCEEDED");
    assert.equal(packageResult.usage_budget.terminal_state, "FAILED_BUDGET");
  }
  assert.equal(fixture.publisher.publishCalls.length, 0);
});

test("prepare-only preflight cannot exceed the approved wall-clock budget", async (t) => {
  const slowManager = fakeWorktreeManager();
  slowManager.assertSourceReady = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1_050));
    return {
      branch: "master",
      clean: true,
      head: REPOSITORY_SHA,
      originMaster: REPOSITORY_SHA,
    };
  };
  await assert.rejects(
    executeFixture(t, {
      prepareOnly: true,
      worktreeManager: slowManager,
      approvalOverrides: {
        execution_budget: {
          wall_clock_seconds: 1,
          worker_timeout_seconds: 1,
          test_timeout_seconds: 1,
          max_tokens: 10_000,
          max_cost: 0,
          currency: "USD",
          max_external_calls: 0,
          max_retries: 0,
          max_concurrent_processes: 3,
        },
      },
    }),
    (error) => error.code === "RUNNER_BUDGET_EXCEEDED",
  );
});

test("max concurrency and allowed paths are mandatory exact Owner pins", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-exact-pins-");
  for (const field of ["max_concurrency", "allowed_paths"]) {
    const { dryRun, approval } = makeFixture([{}], join(root, field));
    delete approval[field];
    resealApproval(approval);
    assert.throws(
      () => validateRunInput({
        dryRun,
        approval,
        repositorySha: REPOSITORY_SHA,
      }),
      (error) => [
        "RUNNER_CONCURRENCY_INVALID",
        "RUNNER_INPUT_INVALID",
      ].includes(error.code),
    );
  }
});

test("CLI strict parsing rejects duplicate JSON keys before invoking the Runner", async (t) => {
  const root = await temporaryDirectory(t, "propscans-runner-cli-strict-");
  const dryPath = join(root, "dry-run.json");
  const approvalPath = join(root, "approval.json");
  await writeFile(dryPath, "{\"record_kind\":\"READ_ONLY_DRY_RUN\",\"record_kind\":\"FORGED\"}");
  await writeFile(approvalPath, "{}");
  let invoked = false;
  await assert.rejects(
    runCli([
      "--dry-run", dryPath,
      "--approval", approvalPath,
      "--approval-hash", `sha256:${"0".repeat(64)}`,
      "--work-packages", "WP-fixture",
      "--repository", process.cwd(),
      "--worktree-root", join(root, "worktrees"),
      "--prepare-only",
    ], {
      runner: async () => {
        invoked = true;
      },
    }),
    (error) => error.code === "DUPLICATE_KEY",
  );
  assert.equal(invoked, false);
});

async function temporaryGitSource(t, prefix = "propscans-patch-source-") {
  const root = await temporaryDirectory(t, prefix);
  const source = join(root, "source");
  await mkdir(join(source, "docs"), { recursive: true });
  execFileSync("git", ["init", "-b", "master"], { cwd: source, windowsHide: true });
  execFileSync("git", ["config", "user.name", "Harness Test"], { cwd: source });
  execFileSync("git", ["config", "user.email", "harness@example.invalid"], { cwd: source });
  await writeFile(join(source, "docs", "allowed.md"), "before\n", "utf8");
  execFileSync("git", ["add", "--", "docs/allowed.md"], { cwd: source });
  execFileSync("git", ["commit", "-m", "fixture"], { cwd: source, windowsHide: true });
  execFileSync("git", [
    "remote", "add", "origin", "https://github.com/woojinhong/Metabus_social.git",
  ], { cwd: source });
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: source,
    encoding: "utf8",
  }).trim();
  execFileSync("git", ["update-ref", "refs/remotes/origin/master", sha], { cwd: source });
  return { root, source, sha };
}

function patchOnlyCloneScope(clonePath, sourceRoot) {
  return {
    executionMode: "EXECUTE_PATCH_ONLY",
    publicationPolicy: {
      mode: "EXECUTE_PATCH_ONLY",
      allow_commit: false,
      allow_push: false,
      allow_pr: false,
      allow_github: false,
    },
    disposableCloneRoot: clonePath,
    ownerApprovedSourceRoot: sourceRoot,
  };
}

test("EXECUTE_PATCH_ONLY success writes patch artifacts and never calls publisher", async (t) => {
  const publisher = fakePublisher();
  const patchArtifactWriter = fakePatchArtifactWriter({
    changedFiles: ["docs/allowed.md"],
  });
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    publisher,
    patchArtifactWriter,
  });
  assert.equal(fixture.result.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(fixture.result.packages[0].commit_sha, null);
  assert.equal(fixture.result.packages[0].draft_pr_url, null);
  assert.equal(publisher.publishCalls.length, 0);
  assert.equal(patchArtifactWriter.writes.length, 1);
  assert.equal(
    patchArtifactWriter.writes[0].containment.status,
    "PARTIALLY_VERIFIED",
  );
});

test("workspace-write fake Worker creates exact file through real clone and patch writer", async (t) => {
  const source = await temporaryGitSource(t, "propscans-real-patch-integration-");
  const target = "docs/operations/harness-runner-pilot-runbook.md";
  const disposableRoot = join(source.root, "disposable", "repository");
  const diagnosticsRoot = join(source.root, "diagnostics");
  const manifestRoot = join(source.root, "manifests");
  const dryRun = makeDryRun([{
    path: "docs/allowed.md",
    targetPath: target,
    targetExistsAtSource: false,
  }], {
    repositorySha: source.sha,
    sourcePathOperation: () => "CREATE",
  });
  const approval = makeOwnerApproval(dryRun, {
    publication_mode: "EXECUTE_PATCH_ONLY",
    disposable_clone_root: disposableRoot,
    source_repository_root: source.source,
    run_id: "RUN-WORKSPACE-WRITE-INTEGRATION",
    worktree_root: join(source.root, "unused-worktrees"),
  });
  const worker = fakeWorker({
    onRun: async () => ({
      usage: {
        ...fakeUsage(369_026),
        input_tokens: 360_000,
        output_tokens: 9_026,
        total_tokens: 369_026,
        tokens: 369_026,
        cost: null,
        currency: null,
        cost_available: false,
        cost_verified: false,
        external_calls: 0,
      },
    }),
  });
  const publisher = fakePublisher();
  const result = await runLightweightRunner({
    dryRun,
    approval,
    approvalRecordHash: approval.record_hash,
    selectedWorkPackageIds: approval.selected_work_package_ids,
    repositorySha: source.sha,
    maxConcurrency: 1,
    worktreeRoot: join(source.root, "unused-worktrees"),
    repository: source.source,
    prepareOnly: false,
    executionMode: "EXECUTE_PATCH_ONLY",
    manifestRoot,
    diagnosticsRoot,
    adapters: {
      disposableCloneManager: createDisposableCloneManager(),
      worker,
      testRunner: fakeTestRunner(),
      publisher,
      patchArtifactWriter: createPatchArtifactWriter(),
      expectedChangeValidator: validateExpectedChangeAtSource,
      expectedChangeResultValidator: validateExpectedChangeAfterWorker,
    },
  });
  assert.equal(result.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(result.packages[0].changed_files.length, 1);
  assert.equal(result.packages[0].changed_files[0], target);
  assert.equal(publisher.publishCalls.length, 0);
  const patch = await readFile(result.packages[0].artifact_paths.patch, "utf8");
  assert(Buffer.byteLength(patch) > 0);
  assert.match(patch, /harness-runner-pilot-runbook\.md/u);
  const runResult = JSON.parse(
    await readFile(result.packages[0].artifact_paths.runResult, "utf8"),
  );
  assert.equal(runResult.total_tokens, 369_026);
  assert.equal(runResult.max_total_tokens, 600_000);
  assert.equal(runResult.external_calls, 0);
});

test("workspace-write CREATE integration reaches patch-ready with bounded usage", async (t) => {
  const target = "docs/operations/harness-runner-pilot-runbook.md";
  const publisher = fakePublisher();
  const testRunner = fakeTestRunner();
  const patchArtifactWriter = fakePatchArtifactWriter({
    changedFiles: [target],
    patch: "diff --git a/docs/operations/harness-runner-pilot-runbook.md b/docs/operations/harness-runner-pilot-runbook.md\n",
  });
  const worker = fakeWorker({
    onRun: async () => ({
      usage: {
        ...fakeUsage(369_026),
        parser_profile: "codex-jsonl@0.146.0",
        cost: null,
        currency: null,
        cost_available: false,
        cost_verified: false,
        external_calls: 0,
        external_calls_verified: true,
      },
    }),
  });
  worker.kind = "CODEX_CLI_0_146";
  const fixture = await executeFixture(t, {
    specs: [{
      path: "docs/discovery/source-authority.md",
      targetPath: target,
      targetExistsAtSource: false,
    }],
    executionMode: "EXECUTE_PATCH_ONLY",
    worker,
    testRunner,
    publisher,
    patchArtifactWriter,
  });
  assert.equal(fixture.dryRun.work_packages[0].expected_changes[0].operation, "CREATE");
  assert.equal(fixture.result.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(worker.calls.length, 1);
  assert.equal(testRunner.calls.length, 1);
  assert.equal(publisher.publishCalls.length, 0);
  assert.equal(patchArtifactWriter.writes.length, 1);
  assert.ok(Buffer.byteLength(patchArtifactWriter.writes[0].patch) > 0);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.total_tokens, 369_026);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.max_total_tokens, 600_000);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.external_calls, 0);
  const context = JSON.parse(await readFile(join(
    fixture.root,
    "diagnostics",
    fixture.approval.run_id,
    fixture.dryRun.work_packages[0].work_package_id,
    "worker-context.json",
  ), "utf8"));
  assert.equal(context.expected_operation, "CREATE");
  assert.equal(context.target_exists_at_source, false);
  assert.equal(context.exact_target_path, target);
  assert.match(context.execution_instruction, /^CREATE the exact target file/u);
  assert.match(context.execution_instruction, /write the required content/u);
});

test("actual Codex 0.146 usage reaches patch-ready under the exact unavailable-cost authority", async (t) => {
  const publisher = fakePublisher();
  const testRunner = fakeTestRunner();
  const patchArtifactWriter = fakePatchArtifactWriter({ changedFiles: ["docs/allowed.md"] });
  const worker = {
    async assertAvailable() {
      return true;
    },
    async run(input) {
      const stdout = await readFile(CODEX_0_146_FIXTURE, "utf8");
      const stdoutPath = join(input.logDirectory, "worker.stdout.log");
      const stderrPath = join(input.logDirectory, "worker.stderr.log");
      await writeFile(stdoutPath, stdout, "utf8");
      await writeFile(stderrPath, "", "utf8");
      const parsed = parseCodexJsonlOutput(stdout);
      try {
        const usage = assertCodexOutputPolicy(parsed, input.budget, {
          costAuthority: {
            authentication_mode: "CHATGPT",
            monetary_cost_policy: "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT",
            publication_mode: "EXECUTE_PATCH_ONLY",
            production: false,
            commit_allowed: false,
            push_allowed: false,
            pr_allowed: false,
            exact_allowed_path: "docs/allowed.md",
          },
        });
        return {
          code: 0,
          timedOut: false,
          pid: 6400,
          stdoutPath,
          stderrPath,
          usage,
        };
      } catch (error) {
        error.workerResult = {
          code: 0,
          timedOut: false,
          pid: 6400,
          stdoutPath,
          stderrPath,
          usage: parsed.usage,
          policyRejected: true,
        };
        throw error;
      }
      assert.fail("approved Codex cost authority must pass");
    },
  };
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    worker,
    testRunner,
    publisher,
    patchArtifactWriter,
  });
  assert.equal(fixture.result.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(fixture.result.packages[0].error_code, null);
  assert.equal(testRunner.calls.length, 1);
  assert.equal(publisher.publishCalls.length, 0);
  assert.equal(patchArtifactWriter.writes.length, 1);
  assert.equal(patchArtifactWriter.writes[0].workerResult.usage.tokens, 444_962);
  assert.equal(patchArtifactWriter.writes[0].workerResult.usage.verified, true);
  assert.equal(patchArtifactWriter.writes[0].workerResult.usage.cost, null);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.total_tokens, 444_962);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.max_total_tokens, 600_000);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.cost_available, false);
  assert.equal(patchArtifactWriter.writes[0].budgetResult.patch_ready, true);
});

test("Codex 0.146 token excess preserves artifacts and skips tests and publication", async (t) => {
  const publisher = fakePublisher();
  const testRunner = fakeTestRunner();
  const patchArtifactWriter = fakePatchArtifactWriter({ changedFiles: ["docs/allowed.md"] });
  const worker = fakeWorker({
    onRun: async () => {
      const stdout = await readFile(CODEX_0_146_FIXTURE, "utf8");
      return { usage: parseCodexJsonlOutput(stdout).usage };
    },
  });
  worker.kind = "CODEX_CLI_0_146";
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    approvalOverrides: { max_total_tokens: 400_000 },
    worker,
    testRunner,
    publisher,
    patchArtifactWriter,
  });
  assert.equal(fixture.result.state, "FAILED_BUDGET");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_TOKEN_BUDGET_EXCEEDED");
  assert.equal(fixture.result.packages[0].usage_budget.patch_ready, false);
  assert.equal(testRunner.calls.length, 0);
  assert.equal(publisher.publishCalls.length, 0);
  assert.equal(patchArtifactWriter.writes.length, 1);
  assert.equal(patchArtifactWriter.writes[0].terminalState, "FAILED_BUDGET");
});

test("Codex 0.146 total exactly equal to max_total_tokens remains patch-ready", async (t) => {
  const worker = fakeWorker({
    onRun: async () => ({
      usage: parseCodexJsonlOutput(await readFile(CODEX_0_146_FIXTURE, "utf8")).usage,
    }),
  });
  worker.kind = "CODEX_CLI_0_146";
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    approvalOverrides: { max_total_tokens: 444_962 },
    worker,
    patchArtifactWriter: fakePatchArtifactWriter({ changedFiles: ["docs/allowed.md"] }),
  });
  assert.equal(fixture.result.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(fixture.result.packages[0].usage_budget.token_budget_exceeded, false);
});

test("EXECUTE_PATCH_ONLY fails closed for staged, committed, and forbidden changes", async (t) => {
  const scenarios = [
    {
      writer: fakePatchArtifactWriter({
        changedFiles: ["docs/allowed.md"],
        staged: ["docs/allowed.md"],
      }),
      code: "RUNNER_PRESTAGED_CHANGE",
    },
    {
      writer: fakePatchArtifactWriter({
        changedFiles: ["docs/allowed.md"],
        head: "f".repeat(40),
      }),
      code: "RUNNER_HEAD_CHANGED",
    },
    {
      writer: fakePatchArtifactWriter({ changedFiles: ["src/forbidden.java"] }),
      code: "HARD_PROHIBITED_PATH",
      state: "FAILED_PATH_POLICY",
    },
  ];
  for (const scenario of scenarios) {
    const fixture = await executeFixture(t, {
      specs: [{ path: "docs/allowed.md" }],
      executionMode: "EXECUTE_PATCH_ONLY",
      patchArtifactWriter: scenario.writer,
    });
    assert.equal(fixture.result.state, scenario.state ?? "FAILED");
    assert.equal(fixture.result.packages[0].error_code, scenario.code);
    assert.equal(scenario.writer.writes.length, 1);
  }
});

test("EXECUTE_PATCH_ONLY reports NO_CHANGE and preserves failed test or timeout artifacts", async (t) => {
  const noChangeWriter = fakePatchArtifactWriter({ changedFiles: [], patch: "" });
  const noChange = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    patchArtifactWriter: noChangeWriter,
  });
  assert.equal(noChange.result.state, "NO_CHANGE");
  assert.equal(noChange.result.packages[0].error_code, "RUNNER_NO_CHANGE");
  assert.equal(noChangeWriter.writes.length, 1);

  const failedTestWriter = fakePatchArtifactWriter({
    changedFiles: ["docs/allowed.md"],
  });
  const failedTest = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    testRunner: fakeTestRunner({ fail: true }),
    patchArtifactWriter: failedTestWriter,
  });
  assert.equal(failedTest.result.state, "FAILED");
  assert.equal(failedTest.result.packages[0].error_code, "RUNNER_REQUIRED_TEST_FAILED");
  assert.equal(failedTestWriter.writes.length, 1);

  const timeoutWriter = fakePatchArtifactWriter({
    changedFiles: ["docs/allowed.md"],
  });
  const timeout = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    worker: fakeWorker({ onRun: () => ({ timedOut: true }) }),
    patchArtifactWriter: timeoutWriter,
  });
  assert.equal(timeout.result.state, "FAILED");
  assert.equal(timeout.result.packages[0].error_code, "RUNNER_WORKER_TIMEOUT");
  assert.equal(timeoutWriter.writes.length, 1);
});

test("EXECUTE_PATCH_ONLY rejects malformed and cross-mode approvals", async (t) => {
  const root = await temporaryDirectory(t, "propscans-patch-approval-");
  const { dryRun, approval } = makeFixture(
    [{ path: "docs/allowed.md" }],
    join(root, "worktrees"),
    {
      publication_mode: "EXECUTE_PATCH_ONLY",
      disposable_clone_root: join(root, "repository"),
    },
  );
  delete approval.containment_acknowledgement;
  resealApproval(approval);
  assertCode("RUNNER_INPUT_INVALID", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));

  const patchApproval = makeOwnerApproval(dryRun, {
    publication_mode: "EXECUTE_PATCH_ONLY",
    disposable_clone_root: join(root, "patch-repository"),
    worktree_root: join(root, "worktrees"),
  });
  await assert.rejects(
    runLightweightRunner({
      dryRun,
      approval: patchApproval,
      approvalRecordHash: patchApproval.record_hash,
      repositorySha: REPOSITORY_SHA,
      repository: root,
      worktreeRoot: patchApproval.worktree_root,
      executionMode: "EXECUTE_AND_DRAFT_PR",
    }),
    (error) => error.code === "RUNNER_EXECUTION_MODE_MISMATCH",
  );
  const publishApproval = makeOwnerApproval(dryRun, {
    publication_mode: "EXECUTE_AND_DRAFT_PR",
    worktree_root: join(root, "publish-worktrees"),
  });
  await assert.rejects(
    runLightweightRunner({
      dryRun,
      approval: publishApproval,
      approvalRecordHash: publishApproval.record_hash,
      repositorySha: REPOSITORY_SHA,
      repository: root,
      worktreeRoot: publishApproval.worktree_root,
      executionMode: "EXECUTE_PATCH_ONLY",
    }),
    (error) => error.code === "RUNNER_EXECUTION_MODE_MISMATCH",
  );

  const subtreeDryRun = makeDryRun([{ path: "docs/allowed.md" }]);
  subtreeDryRun.work_packages[0].path_policy.allowed_paths = [{
    path: "docs/allowed.md",
    match: "SUBTREE",
  }];
  resealDryRun(subtreeDryRun);
  const subtreeApproval = makeOwnerApproval(subtreeDryRun, {
    publication_mode: "EXECUTE_PATCH_ONLY",
    disposable_clone_root: join(root, "subtree-repository"),
    worktree_root: join(root, "subtree-worktrees"),
  });
  assertCode("RUNNER_PATCH_ONLY_SCOPE_INVALID", () => validateRunInput({
    dryRun: subtreeDryRun,
    approval: subtreeApproval,
    repositorySha: REPOSITORY_SHA,
  }));

  const unsafeDryRun = makeDryRun([{ path: "docs/unsafe$name.md" }]);
  const unsafeApproval = makeOwnerApproval(unsafeDryRun, {
    publication_mode: "EXECUTE_PATCH_ONLY",
    disposable_clone_root: join(root, "unsafe-repository"),
    worktree_root: join(root, "unsafe-worktrees"),
  });
  assertCode("RUNNER_PATCH_ONLY_SCOPE_INVALID", () => validateRunInput({
    dryRun: unsafeDryRun,
    approval: unsafeApproval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("EXECUTE_PATCH_ONLY approval requires every AH-P2-11 exact pin", async (t) => {
  const root = await temporaryDirectory(t, "propscans-budget-approval-");
  const { dryRun } = makeFixture([{ path: "docs/allowed.md" }], join(root, "worktrees"));
  const valid = () => makeOwnerApproval(dryRun, {
    publication_mode: "EXECUTE_PATCH_ONLY",
    disposable_clone_root: join(root, `repository-${Math.random().toString(16).slice(2)}`),
    source_repository_root: root,
    worktree_root: join(root, "worktrees"),
  });
  assert.doesNotThrow(() => validateRunInput({
    dryRun,
    approval: valid(),
    repositorySha: REPOSITORY_SHA,
  }));
  const scenarios = [
    ["authentication_mode", undefined, "RUNNER_PATCH_ONLY_APPROVAL_INVALID"],
    ["authentication_mode", "API_KEY", "RUNNER_PATCH_ONLY_APPROVAL_INVALID"],
    ["token_budget_enforcement", undefined, "RUNNER_PATCH_ONLY_APPROVAL_INVALID"],
    ["token_budget_enforcement", "PRE_RUN", "RUNNER_PATCH_ONLY_APPROVAL_INVALID"],
    ["monetary_cost_policy", undefined, "RUNNER_CODEX_COST_AUTHORITY_REQUIRED"],
    ["publication_mode", "EXECUTE_AND_DRAFT_PR", "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID"],
    ["commit_allowed", true, "RUNNER_PATCH_ONLY_PERMISSION_INVALID"],
    ["push_allowed", true, "RUNNER_PATCH_ONLY_PERMISSION_INVALID"],
    ["pr_allowed", true, "RUNNER_PATCH_ONLY_PERMISSION_INVALID"],
    ["max_total_tokens", undefined, "RUNNER_BUDGET_INVALID"],
    ["max_total_tokens", 0, "RUNNER_BUDGET_INVALID"],
    ["max_total_tokens", -1, "RUNNER_BUDGET_INVALID"],
    ["max_total_tokens", 1.5, "RUNNER_BUDGET_INVALID"],
    ["max_total_tokens", Number.MAX_SAFE_INTEGER + 1, "RUNNER_BUDGET_INVALID"],
  ];
  for (const [field, value, code] of scenarios) {
    const approval = valid();
    if (value === undefined) delete approval[field];
    else approval[field] = value;
    resealApproval(approval);
    assertCode(code, () => validateRunInput({ dryRun, approval, repositorySha: REPOSITORY_SHA }));
  }
  const spendAuthority = valid();
  spendAuthority.execution_budget.max_cost = 1;
  resealApproval(spendAuthority);
  assertCode("RUNNER_BUDGET_INVALID", () => validateRunInput({
    dryRun,
    approval: spendAuthority,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("Owner selected Work Package pins compare semantically across JSON key order", async (t) => {
  const root = await temporaryDirectory(t, "propscans-pin-order-");
  const { dryRun, approval } = makeFixture([{}], join(root, "worktrees"));
  const pin = approval.selected_work_packages[0];
  approval.selected_work_packages = [{
    proposed_branch: pin.proposed_branch,
    work_package_plan_digest: pin.work_package_plan_digest,
    work_package_revision: pin.work_package_revision,
    work_package_id: pin.work_package_id,
  }];
  resealApproval(approval);
  assert.doesNotThrow(() => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
  approval.selected_work_packages[0].work_package_revision += 1;
  resealApproval(approval);
  assertCode("RUNNER_WORK_PACKAGE_PIN_MISMATCH", () => validateRunInput({
    dryRun,
    approval,
    repositorySha: REPOSITORY_SHA,
  }));
});

test("disposable clone uses command-scoped safe.directory and preserves source state", async (t) => {
  const fixture = await temporaryGitSource(t);
  const clonePath = join(fixture.root, "disposable", "repository");
  const isolatedGlobalConfig = join(fixture.root, "isolated-global.gitconfig");
  const isolatedSystemConfig = join(fixture.root, "isolated-system.gitconfig");
  await writeFile(isolatedGlobalConfig, "[user]\n\tname = Isolated Global\n");
  await writeFile(isolatedSystemConfig, "[core]\n\tautocrlf = false\n");
  const beforeGlobalConfig = await readFile(isolatedGlobalConfig);
  const beforeSystemConfig = await readFile(isolatedSystemConfig);
  const calls = [];
  const manager = createDisposableCloneManager({
    run: async (executable, args, options) => {
      calls.push({ executable, args: [...args], options: { ...options } });
      return runChecked(executable, args, {
        ...options,
        env: {
          ...process.env,
          GIT_CONFIG_GLOBAL: isolatedGlobalConfig,
          GIT_CONFIG_SYSTEM: isolatedSystemConfig,
        },
      });
    },
  });
  await manager.assertSourceReady(
    fixture.source,
    fixture.sha,
    "https://github.com/woojinhong/Metabus_social",
  );
  const beforeRefs = execFileSync("git", ["show-ref"], {
    cwd: fixture.source,
    encoding: "utf8",
  });
  const beforeWorktrees = execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd: fixture.source,
    encoding: "utf8",
  });
  const configPath = join(fixture.source, ".git", "config");
  const beforeConfig = await readFile(configPath);
  await manager.prepare({
    repository: fixture.source,
    sourceSha: fixture.sha,
    branch: "harness/patch-fixture",
    worktreePath: clonePath,
    repositoryUri: "https://github.com/woojinhong/Metabus_social",
    ...patchOnlyCloneScope(clonePath, fixture.source),
  });
  const cloneCall = calls.find(({ args }) => args.includes("clone"));
  assert.deepEqual(cloneCall.args.slice(0, 5), [
    "-c",
    `safe.directory=${normalizeSafeDirectorySource(join(fixture.source, ".git"))}`,
    "clone",
    "--no-hardlinks",
    "--no-tags",
  ]);
  assert.equal(cloneCall.options.shell, undefined);
  assert.equal(calls.some(({ args }) => args.includes("--global") || args.includes("--system")), false);
  assert.equal(execFileSync("git", ["remote"], { cwd: clonePath, encoding: "utf8" }), "");
  assert.equal(
    execFileSync("git", ["config", "--local", "--get-all", "credential.helper"], {
      cwd: clonePath,
      encoding: "utf8",
    }),
    "\n",
  );
  assert.notEqual(spawnSync("git", ["push"], { cwd: clonePath }).status, 0);
  await manager.verifySourceUnchanged(
    fixture.source,
    fixture.sha,
    "https://github.com/woojinhong/Metabus_social",
  );
  assert.equal(execFileSync("git", ["show-ref"], {
    cwd: fixture.source,
    encoding: "utf8",
  }), beforeRefs);
  assert.equal(execFileSync("git", ["worktree", "list", "--porcelain"], {
    cwd: fixture.source,
    encoding: "utf8",
  }), beforeWorktrees);
  assert.deepEqual(await readFile(configPath), beforeConfig);
  assert.deepEqual(await readFile(isolatedGlobalConfig), beforeGlobalConfig);
  assert.deepEqual(await readFile(isolatedSystemConfig), beforeSystemConfig);
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: clonePath,
    encoding: "utf8",
  }).trim(), fixture.sha);
  const sourceGitDir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
    cwd: fixture.source,
    encoding: "utf8",
  }).trim();
  const cloneGitDir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
    cwd: clonePath,
    encoding: "utf8",
  }).trim();
  assert.notEqual(sourceGitDir, cloneGitDir);
  assert.equal(execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: clonePath,
    encoding: "utf8",
  }).trim(), clonePath.replaceAll("\\", "/"));
  await assert.rejects(
    readFile(join(clonePath, ".git", "objects", "info", "alternates")),
    (error) => error.code === "ENOENT",
  );
  await assert.rejects(
    manager.assertAvailable(fixture.source, "harness/collision", clonePath),
    (error) => error.code === "BLOCKED_CONFLICT",
  );
  execFileSync("git", ["tag", "unexpected-source-ref"], { cwd: fixture.source });
  await assert.rejects(
    manager.verifySourceUnchanged(
      fixture.source,
      fixture.sha,
      "https://github.com/woojinhong/Metabus_social",
    ),
    (error) => error.code === "RUNNER_SOURCE_REPOSITORY_MUTATED",
  );
});

test("safe.directory source and patch-only scope fail closed", async (t) => {
  assert.throws(
    () => normalizeSafeDirectorySource("relative/source"),
    (error) => error.code === "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
  );
  for (const source of [`${tmpdir()}${process.platform === "win32" ? "\\" : "/"}*`,
    `${tmpdir()}${process.platform === "win32" ? "\\" : "/"}bad\nsource`,
    `${tmpdir()}${process.platform === "win32" ? "\\" : "/"}bad\u0001source`]) {
    assert.throws(
      () => normalizeSafeDirectorySource(source),
      (error) => error.code === "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
    );
  }
  const fixture = await temporaryGitSource(t, "propscans-safe-scope-");
  const clonePath = join(fixture.root, "disposable", "repository");
  const manager = createDisposableCloneManager();
  await assert.rejects(
    manager.prepare({
      repository: fixture.source,
      sourceSha: fixture.sha,
      branch: "harness/wrong-mode",
      worktreePath: clonePath,
      repositoryUri: "https://github.com/woojinhong/Metabus_social",
      executionMode: "EXECUTE_AND_DRAFT_PR",
      publicationPolicy: patchOnlyCloneScope(clonePath, fixture.source).publicationPolicy,
      disposableCloneRoot: clonePath,
      ownerApprovedSourceRoot: fixture.source,
    }),
    (error) => error.code === "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
  );
  await assert.rejects(
    manager.assertAvailable(fixture.source, "harness/outside-temp", join(process.cwd(), "blocked")),
    (error) => ["BLOCKED_CONFLICT", "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID"].includes(error.code),
  );
});

test("patch-only approval pins the exact local source root before clone preparation", async (t) => {
  await assert.rejects(
    executeFixture(t, {
      specs: [{ path: "docs/allowed.md" }],
      executionMode: "EXECUTE_PATCH_ONLY",
      approvalOverrides: {
        source_repository_root: join(tmpdir(), "different-owner-approved-source"),
      },
    }),
    (error) => error.code === "RUNNER_SAFE_DIRECTORY_SCOPE_INVALID",
  );
});

test("fake dubious-ownership gate accepts only the exact command-scoped clone argv", async (t) => {
  const fixture = await temporaryGitSource(t, "propscans-fake-ownership-");
  const clonePath = join(fixture.root, "disposable", "repository");
  let scopedCloneObserved = false;
  const manager = createDisposableCloneManager({
    run: async (executable, args, options) => {
      if (args.includes("clone")) {
        const expected = `safe.directory=${normalizeSafeDirectorySource(join(fixture.source, ".git"))}`;
        if (args[0] !== "-c" || args[1] !== expected || args[2] !== "clone") {
          const error = new Error("fatal: detected dubious ownership");
          error.code = "PROCESS_FAILED";
          error.result = { code: 128, stderr: "fatal: detected dubious ownership" };
          throw error;
        }
        scopedCloneObserved = true;
      }
      return runChecked(executable, args, options);
    },
  });
  await manager.prepare({
    repository: fixture.source,
    sourceSha: fixture.sha,
    branch: "harness/fake-ownership",
    worktreePath: clonePath,
    repositoryUri: "https://github.com/woojinhong/Metabus_social",
    ...patchOnlyCloneScope(clonePath, fixture.source),
  });
  assert.equal(scopedCloneObserved, true);
});

test("dubious ownership after exact scoped argv has a dedicated redacted error", async (t) => {
  const fixture = await temporaryGitSource(t, "propscans-ownership-taxonomy-");
  const clonePath = join(fixture.root, "disposable", "repository");
  const manager = createDisposableCloneManager({
    run: async (executable, args, options) => {
      if (args.includes("clone")) {
        const error = new Error("fake ownership failure");
        error.code = "PROCESS_FAILED";
        error.result = {
          code: 128,
          stderr: `fatal: detected dubious ownership in repository at '${fixture.source}'`,
        };
        throw error;
      }
      return runChecked(executable, args, options);
    },
  });
  await assert.rejects(
    manager.prepare({
      repository: fixture.source,
      sourceSha: fixture.sha,
      branch: "harness/ownership-taxonomy",
      worktreePath: clonePath,
      repositoryUri: "https://github.com/woojinhong/Metabus_social",
      ...patchOnlyCloneScope(clonePath, fixture.source),
    }),
    (error) => error.code === "RUNNER_SOURCE_OWNERSHIP_UNTRUSTED"
      && error.details.stderr_excerpt.includes("detected dubious ownership"),
  );
});

test("failed disposable clone preserves destination diagnostics", async (t) => {
  const fixture = await temporaryGitSource(t, "propscans-clone-failure-");
  const clonePath = join(fixture.root, "disposable", "repository");
  const manager = createDisposableCloneManager({
    run: async (executable, args, options) => {
      if (args.includes("clone")) {
        await mkdir(clonePath, { recursive: true });
        await writeFile(join(clonePath, "clone-failure.txt"), "preserved\n");
        const error = new Error("fake clone failure");
        error.code = "PROCESS_FAILED";
        error.result = { code: 128, stderr: "credential=https://user:secret@example.invalid" };
        throw error;
      }
      return runChecked(executable, args, options);
    },
  });
  await assert.rejects(
    manager.prepare({
      repository: fixture.source,
      sourceSha: fixture.sha,
      branch: "harness/failure",
      worktreePath: clonePath,
      repositoryUri: "https://github.com/woojinhong/Metabus_social",
      ...patchOnlyCloneScope(clonePath, fixture.source),
    }),
    (error) => error.code === "RUNNER_DISPOSABLE_CLONE_FAILED"
      && !error.details.stderr_excerpt.includes("user:secret"),
  );
  assert.equal(await readFile(join(clonePath, "clone-failure.txt"), "utf8"), "preserved\n");
});

test("source mutation outranks a disposable clone failure", async (t) => {
  const fixture = await temporaryGitSource(t, "propscans-clone-source-mutation-");
  const clonePath = join(fixture.root, "disposable", "repository");
  const manager = createDisposableCloneManager({
    run: async (executable, args, options) => {
      if (args.includes("clone")) {
        execFileSync("git", ["tag", "mutation-during-clone"], { cwd: fixture.source });
        const error = new Error("fake clone failure after source mutation");
        error.code = "PROCESS_FAILED";
        error.result = { code: 128, stderr: "fake clone failure" };
        throw error;
      }
      return runChecked(executable, args, options);
    },
  });
  await assert.rejects(
    manager.prepare({
      repository: fixture.source,
      sourceSha: fixture.sha,
      branch: "harness/source-mutated",
      worktreePath: clonePath,
      repositoryUri: "https://github.com/woojinhong/Metabus_social",
      ...patchOnlyCloneScope(clonePath, fixture.source),
    }),
    (error) => error.code === "RUNNER_SOURCE_REPOSITORY_MUTATED"
      && error.details.original_error_code === "RUNNER_DISPOSABLE_CLONE_FAILED",
  );
});

test("disposable clone rejects source-linked destination Git metadata", async (t) => {
  const fixture = await temporaryGitSource(t, "propscans-clone-linked-metadata-");
  const clonePath = join(fixture.root, "disposable", "repository");
  const sourceGitDir = join(fixture.source, ".git");
  const manager = createDisposableCloneManager({
    run: async (executable, args, options) => {
      if (
        options.cwd === clonePath
        && args.length === 2
        && args[0] === "rev-parse"
        && args[1] === "--absolute-git-dir"
      ) {
        return { code: 0, stdout: `${sourceGitDir}\n`, stderr: "" };
      }
      return runChecked(executable, args, options);
    },
  });
  await assert.rejects(
    manager.prepare({
      repository: fixture.source,
      sourceSha: fixture.sha,
      branch: "harness/linked-metadata",
      worktreePath: clonePath,
      repositoryUri: "https://github.com/woojinhong/Metabus_social",
      ...patchOnlyCloneScope(clonePath, fixture.source),
    }),
    (error) => error.code === "RUNNER_DISPOSABLE_CLONE_NOT_INDEPENDENT",
  );
});

test("disposable clone rejects an OS-temp junction that resolves outside temp", async (t) => {
  const root = await temporaryDirectory(t, "propscans-clone-junction-");
  const junction = join(root, "escape");
  await symlink(process.cwd(), junction, "junction");
  const manager = createDisposableCloneManager();
  await assert.rejects(
    manager.assertAvailable(process.cwd(), "harness/blocked", join(junction, "blocked-clone")),
    (error) => error.code === "BLOCKED_CONFLICT",
  );
});

test("patch artifact writer renders binary diff and rejects staged or committed state", async (t) => {
  const fixture = await temporaryGitSource(t, "propscans-patch-artifacts-");
  execFileSync("git", ["remote", "remove", "origin"], { cwd: fixture.source });
  await writeFile(join(fixture.source, "docs", "allowed.md"), "after\n", "utf8");
  await writeFile(join(fixture.source, "docs", "new-runbook.md"), "new\n", "utf8");
  await writeFile(join(fixture.source, ".git", "info", "exclude"), "build/\n", "utf8");
  await mkdir(join(fixture.source, "build"), { recursive: true });
  await writeFile(join(fixture.source, "build", "escape.txt"), "ignored\n", "utf8");
  const writer = createPatchArtifactWriter();
  const state = await writer.inspect(fixture.source, fixture.sha);
  writer.assertSafeState(state, fixture.sha);
  const patch = await writer.createPatch(fixture.source, fixture.sha, state);
  assert.match(patch, /diff --git a\/docs\/allowed\.md b\/docs\/allowed\.md/u);
  assert.match(patch, /diff --git a\/docs\/new-runbook\.md b\/docs\/new-runbook\.md/u);
  assert.match(patch, /--- \/dev\/null/u);
  assert(state.changed_files.includes("build/escape.txt"));
  assert.match(patch, /diff --git a\/build\/escape\.txt b\/build\/escape\.txt/u);
  const output = join(fixture.root, "artifacts");
  const paths = await writer.writeArtifacts({
    outputDirectory: output,
    runId: "RUN-PATCH-ARTIFACT",
    workPackage: { work_package_id: "WP-PATCH" },
    sourceSha: fixture.sha,
    state,
    tests: [],
    workerResult: null,
    patch,
    terminalState: "PATCH_READY_FOR_OWNER_REVIEW",
    containment: { status: "PARTIALLY_VERIFIED" },
    budgetResult: {
      total_tokens: 444_962,
      max_total_tokens: 600_000,
      token_budget_verified: true,
      token_budget_exceeded: false,
      cost: null,
      cost_available: false,
      cost_verified: false,
      monetary_cost_policy: "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT",
      external_calls: 0,
      max_external_calls: 0,
      external_calls_verified: true,
      process_calls: 23,
      observed: { total_tokens: 444_962, cost: null, external_calls: 0, process_calls: 23 },
      authoritative: { total_tokens: 444_962, cost: null, external_calls: 0 },
    },
  });
  assert.equal(await readFile(paths.patch, "utf8"), patch);
  assert.equal(await readFile(paths.workerStdout, "utf8"), "");
  assert.equal(await readFile(paths.workerStderr, "utf8"), "");
  const testRecord = JSON.parse(await readFile(paths.testResults, "utf8"));
  assert.equal(testRecord.status, "NOT_RUN");
  assert.equal(testRecord.all_passed, false);
  const runResult = JSON.parse(await readFile(paths.runResult, "utf8"));
  assert.equal(runResult.state, "PATCH_READY_FOR_OWNER_REVIEW");
  assert.equal(runResult.patch_ready, true);
  assert.equal(runResult.total_tokens, 444_962);
  assert.equal(runResult.max_total_tokens, 600_000);
  assert.equal(runResult.cost, null);
  assert.equal(runResult.cost_available, false);
  assert.equal(runResult.external_calls, 0);
  assert.equal(runResult.process_calls, 23);
  assert.match(await readFile(paths.finalSummary, "utf8"), /Cost: unavailable \(null\)/u);

  const failedOutput = join(fixture.root, "failed-artifacts");
  await assert.rejects(
    writer.writeArtifacts({
      outputDirectory: failedOutput,
      runId: "RUN-PATCH-ARTIFACT-FAILED",
      workPackage: { work_package_id: "WP-PATCH", required_tests: [] },
      sourceSha: fixture.sha,
      state,
      tests: [],
      workerResult: {
        code: 0,
        timedOut: false,
        stdoutPath: join(fixture.root, "missing-worker-stdout.log"),
        stderrPath: join(fixture.root, "missing-worker-stderr.log"),
        usage: { tokens: 0, cost: 0, external_calls: 0 },
      },
      patch,
      terminalState: "COMPLETED",
      containment: { status: "PARTIALLY_VERIFIED" },
    }),
    (error) => error.code === "ENOENT",
  );
  await assert.rejects(
    readFile(join(failedOutput, "patch-only-artifacts", "run-result.json"), "utf8"),
    (error) => error.code === "ENOENT",
  );

  execFileSync("git", ["add", "--", "docs/allowed.md"], { cwd: fixture.source });
  const staged = await writer.inspect(fixture.source, fixture.sha);
  assert.throws(
    () => writer.assertSafeState(staged, fixture.sha),
    (error) => error.code === "RUNNER_PRESTAGED_CHANGE",
  );

  execFileSync("git", ["commit", "-m", "forbidden worker commit"], {
    cwd: fixture.source,
    windowsHide: true,
  });
  const committed = await writer.inspect(fixture.source, fixture.sha);
  assert.throws(
    () => writer.assertSafeState(committed, fixture.sha),
    (error) => error.code === "RUNNER_HEAD_CHANGED",
  );
});

test("patch artifact write failure cannot leave a completed package", async (t) => {
  const writer = fakePatchArtifactWriter({
    changedFiles: ["docs/allowed.md"],
    writeError: Object.assign(new Error("artifact write failed"), {
      code: "RUNNER_ARTIFACT_WRITE_FAILED",
    }),
  });
  const fixture = await executeFixture(t, {
    specs: [{ path: "docs/allowed.md" }],
    executionMode: "EXECUTE_PATCH_ONLY",
    patchArtifactWriter: writer,
  });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(fixture.result.packages[0].state, "FAILED");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_ARTIFACT_WRITE_FAILED");
});
