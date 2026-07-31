import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
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
import { buildWorkerContext } from "./runner/worker-context-builder.mjs";
import { runCli } from "./runner/cli.mjs";
import { createGitPublisher } from "./runner/git-publisher.mjs";

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
          timedOut: false,
          pid: 4000 + calls.length,
          stdoutPath: join(input.logDirectory, "worker.stdout.log"),
          stderrPath: join(input.logDirectory, "worker.stderr.log"),
          usage: override?.usage ?? {
            tokens: 100,
            cost: 0,
            external_calls: 0,
          },
        };
      } finally {
        active -= 1;
      }
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

async function executeFixture(t, {
  specs = [{}],
  approvalOverrides = {},
  worker = fakeWorker(),
  testRunner = fakeTestRunner(),
  publisher = fakePublisher(),
  worktreeManager = null,
  prepareOnly = false,
} = {}) {
  const root = await temporaryDirectory(t, "propscans-runner-test-");
  const worktreeRoot = join(root, "worktrees");
  const manifestRoot = join(root, "manifests");
  const diagnosticsRoot = join(root, "diagnostics");
  const { dryRun, approval } = makeFixture(specs, worktreeRoot, {
    publication_mode: prepareOnly ? "PREPARE_ONLY" : "EXECUTE_AND_DRAFT_PR",
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
    manifestRoot,
    diagnosticsRoot,
    adapters: {
      worktreeManager: manager,
      worker,
      testRunner,
      publisher,
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
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(fixture.result.packages[0].error_code, "PATH_NOT_ALLOWED");
  assert.equal(publisher.publishCalls.length, 0);
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
  assert.equal(fixture.result.state, "FAILED");
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

test("Worker usage beyond the pinned token budget blocks publication", async (t) => {
  const worker = fakeWorker({
    onRun: () => ({
      usage: { tokens: 10_001, cost: 0, external_calls: 0 },
    }),
  });
  const fixture = await executeFixture(t, { worker });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(fixture.result.packages[0].error_code, "RUNNER_BUDGET_EXCEEDED");
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
      usage: { tokens: 6_000, cost: 0, external_calls: 0 },
    }),
  });
  const fixture = await executeFixture(t, {
    specs: [
      { alias: "BUDGET-A", path: "docs/test/budget-a.md" },
      { alias: "BUDGET-B", path: "docs/test/budget-b.md" },
    ],
    worker,
  });
  assert.equal(fixture.result.state, "FAILED");
  assert.equal(
    fixture.result.packages.filter(
      ({ error_code }) => error_code === "RUNNER_BUDGET_EXCEEDED",
    ).length,
    2,
  );
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
