import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { createCodexWorkerAdapter } from "./runner/codex-worker-adapter.mjs";
import { buildCodexExecCommand } from "./runner/codex-command-builder.mjs";
import { parseCodexJsonlOutput } from "./runner/codex-output-parser.mjs";
import { parseRunnerArgs, runCli } from "./runner/cli.mjs";
import {
  processContainmentStatus,
  windowsTaskkillArguments,
} from "./runner/process-tree.mjs";
import { runProcess } from "./runner/process-utils.mjs";
import { unavailableCodexAdapter } from "./runner/worker-process.mjs";
import {
  filterWorkerEnvironment,
  validateApprovedWorkerPolicy,
} from "./runner/worker-policy.mjs";

const FIXTURE = new URL("./fixtures/codex-worker/fake-worker.mjs", import.meta.url)
  .pathname.replace(/^\/([A-Za-z]:)/u, "$1");

async function temporaryDirectory(t, prefix) {
  const root = await mkdtemp(join(tmpdir(), prefix));
  t.after(async () => rm(root, { recursive: true, force: true }));
  return root;
}

async function invocationFixture(t, {
  allowedPath = "docs/output.md",
  rootName = "propscans codex 어댑터-",
} = {}) {
  const root = await temporaryDirectory(t, rootName);
  const worktree = join(root, "worktree with spaces");
  const diagnostics = join(root, "diagnostics");
  await mkdir(join(worktree, dirname(allowedPath)), { recursive: true });
  await mkdir(diagnostics, { recursive: true });
  const workPackage = {
    work_package_id: "WP-CODEX-ADAPTER-TEST",
    path_policy: {
      allowed_paths: [{ path: allowedPath, match: "EXACT" }],
    },
  };
  const contextPath = join(diagnostics, "worker-context.json");
  const promptPath = join(diagnostics, "worker-prompt.txt");
  await writeFile(contextPath, `${JSON.stringify({
    record_kind: "BOUNDED_WORKER_CONTEXT",
    work_package_id: workPackage.work_package_id,
    worktree_path: worktree,
  })}\n`, "utf8");
  await writeFile(
    promptPath,
    `Use context ${contextPath}. Do not use the network or commit.\n`,
    "utf8",
  );
  return {
    root,
    worktree,
    diagnostics,
    workPackage,
    contextPath,
    promptPath,
  };
}

function fixtureCommand(mode, detail = "") {
  return ({ executable }) => ({
    executable,
    args: [FIXTURE, mode, detail],
    promptTransport: "STDIN",
  });
}

function adapterFor(mode, {
  detail = "",
  sourceEnvironment = process.env,
  maxLogBytes = 1024 * 1024,
} = {}) {
  return createCodexWorkerAdapter({
    executable: process.execPath,
    sandbox: "workspace-write",
    approvalMode: "never",
    sourceEnvironment,
    maxLogBytes,
    isolationEvidence: {
      network: true,
      filesystem: true,
      processTree: true,
    },
    commandBuilder: fixtureCommand(mode, detail),
  });
}

function budget() {
  return {
    max_external_calls: 0,
    max_cost: 0,
  };
}

test("Codex command uses explicit bounded non-interactive flags and stdin", () => {
  const command = buildCodexExecCommand({
    executable: process.execPath,
    cwd: resolve("."),
    sandbox: "workspace-write",
    approvalMode: "never",
  });
  assert.equal(command.executable, resolve(process.execPath));
  assert.deepEqual(command.args, [
    "--ask-for-approval", "never",
    "--sandbox", "workspace-write",
    "-c", "sandbox_workspace_write.network_access=false",
    "exec",
    "--cd", resolve("."),
    "--ephemeral",
    "--ignore-user-config",
    "--json",
    "-",
  ]);
  assert.equal(command.args.includes("--search"), false);
  assert.equal(command.args.includes("--dangerously-bypass-approvals-and-sandbox"), false);
  assert.equal(command.promptTransport, "STDIN");
});

test("environment filtering is allowlist-only and records secret names without values", () => {
  const filtered = filterWorkerEnvironment({
    PATH: "safe-path",
    SystemRoot: "safe-root",
    TEMP: "safe-temp",
    GH_TOKEN: "github-secret-value",
    GITHUB_TOKEN: "github-secret-value-2",
    OPENAI_API_KEY: "openai-secret-value",
    AWS_SECRET_ACCESS_KEY: "aws-secret-value",
    NCP_ACCESS_KEY: "ncp-secret-value",
    DATABASE_URL: "database-secret-value",
    CODEX_HOME: "dropped-config-root",
    UNRELATED: "dropped",
  });
  assert.deepEqual(filtered.environment, {
    PATH: "safe-path",
    SystemRoot: "safe-root",
    TEMP: "safe-temp",
  });
  assert.deepEqual(filtered.removedSecretNames, [
    "AWS_SECRET_ACCESS_KEY",
    "DATABASE_URL",
    "GH_TOKEN",
    "GITHUB_TOKEN",
    "NCP_ACCESS_KEY",
    "OPENAI_API_KEY",
  ]);
  assert.equal(JSON.stringify(filtered).includes("github-secret-value"), false);
  assert.equal(JSON.stringify(filtered).includes("dropped-config-root"), false);
});

test("normal fake Worker fixes cwd, transports prompt by stdin, and records usage", async (t) => {
  const fixture = await invocationFixture(t);
  const adapter = adapterFor("normal");
  await adapter.assertAvailable();
  const result = await adapter.run({
    cwd: fixture.worktree,
    promptPath: fixture.promptPath,
    contextPath: fixture.contextPath,
    logDirectory: fixture.diagnostics,
    timeoutMs: 5_000,
    budget: budget(),
    workPackage: fixture.workPackage,
  });
  assert.equal(result.code, 0);
  assert.equal(result.timedOut, false);
  assert.ok(Number.isInteger(result.pid));
  assert.ok(result.duration_ms >= 0);
  assert.deepEqual(result.usage, {
    tokens: 12,
    cost: 0,
    external_calls: 0,
    verified: true,
  });
  const stdout = await readFile(result.stdoutPath, "utf8");
  const inspect = JSON.parse(stdout.split(/\r?\n/u)[0]);
  assert.equal(resolve(inspect.cwd), resolve(fixture.worktree));
  assert.match(inspect.prompt, /Do not use the network or commit/u);
  assert.match(await readFile(result.stderrPath, "utf8"), /fixture stderr/u);
});

test("nonzero fake Worker retains exit code and verified usage", async (t) => {
  const fixture = await invocationFixture(t);
  const result = await adapterFor("nonzero").run({
    cwd: fixture.worktree,
    promptPath: fixture.promptPath,
    contextPath: fixture.contextPath,
    logDirectory: fixture.diagnostics,
    timeoutMs: 5_000,
    budget: budget(),
    workPackage: fixture.workPackage,
  });
  assert.equal(result.code, 23);
  assert.equal(result.timedOut, false);
  assert.equal(result.usage.tokens, 5);
  assert.equal(result.usage.external_calls, 0);
});

test("timeout terminates the fake Worker and returns bounded diagnostics", async (t) => {
  const fixture = await invocationFixture(t);
  const result = await adapterFor("hang").run({
    cwd: fixture.worktree,
    promptPath: fixture.promptPath,
    contextPath: fixture.contextPath,
    logDirectory: fixture.diagnostics,
    timeoutMs: 200,
    budget: budget(),
    workPackage: fixture.workPackage,
  });
  assert.equal(result.timedOut, true);
  assert.ok(result.duration_ms < 10_000);
  assert.equal(result.usage.external_calls, 0);
  assert.ok(await readFile(result.metadataPath, "utf8"));
});

test("termination adapter failures propagate without hanging", async (t) => {
  const root = await temporaryDirectory(t, "propscans-process-settlement-");
  const terminationError = new Error("fixture termination failed");
  terminationError.code = "RUNNER_PROCESS_TREE_TERMINATION_FAILED";
  const startedAt = Date.now();
  await assert.rejects(
    runProcess(process.execPath, [FIXTURE, "hang"], {
      cwd: root,
      stdinData: "bounded prompt\n",
      timeoutMs: 100,
      terminate: async (child) => {
        const closed = new Promise((resolvePromise) =>
          child.once("close", resolvePromise));
        child.kill();
        await closed;
        throw terminationError;
      },
    }),
    (error) => error === terminationError,
  );
  assert.ok(Date.now() - startedAt < 2_000);
});

test("a stalled termination adapter is bounded by one hard deadline", async (t) => {
  const root = await temporaryDirectory(t, "propscans-process-deadline-");
  const startedAt = Date.now();
  await assert.rejects(
    runProcess(process.execPath, [FIXTURE, "hang"], {
      cwd: root,
      stdinData: "bounded prompt\n",
      timeoutMs: 100,
      terminationTimeoutMs: 150,
      terminate: async () => new Promise(() => {}),
    }),
    (error) => error.code === "RUNNER_PROCESS_TREE_TERMINATION_FAILED",
  );
  assert.ok(Date.now() - startedAt < 2_000);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
});

test("Windows descendant timeout records whether tree containment was verified", {
  skip: process.platform !== "win32",
}, async (t) => {
  const fixture = await invocationFixture(t);
  const sentinel = join(fixture.root, "orphan-sentinel.txt");
  const result = await adapterFor("child-tree", { detail: sentinel }).run({
    cwd: fixture.worktree,
    promptPath: fixture.promptPath,
    contextPath: fixture.contextPath,
    logDirectory: fixture.diagnostics,
    timeoutMs: 250,
    budget: budget(),
    workPackage: fixture.workPackage,
  });
  assert.equal(result.timedOut, true);
  assert.equal(result.processTermination?.descendants_targeted, true);
  assert.equal(result.processTermination?.verified, false);
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 1_250));
  try {
    assert.match(await readFile(sentinel, "utf8"), /orphan survived/u);
    assert.match(result.processTermination.limitation, /Job Object|direct child/u);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
});

test("large stdout and stderr are capped with explicit truncation metadata", async (t) => {
  const fixture = await invocationFixture(t);
  await assert.rejects(
    adapterFor("large-output", { maxLogBytes: 4096 }).run({
      cwd: fixture.worktree,
      promptPath: fixture.promptPath,
      contextPath: fixture.contextPath,
      logDirectory: fixture.diagnostics,
      timeoutMs: 10_000,
      budget: budget(),
      workPackage: fixture.workPackage,
    }),
    (error) => error.code === "RUNNER_CODEX_USAGE_UNVERIFIED",
  );
  assert.equal(
    (await readFile(join(fixture.diagnostics, "worker.stdout.log"))).length,
    4096,
  );
  assert.equal(
    (await readFile(join(fixture.diagnostics, "worker.stderr.log"))).length,
    4096,
  );
  assert.match(
    await readFile(join(fixture.diagnostics, "worker-log-metadata.json"), "utf8"),
    /"stdout_truncated":true/u,
  );
});

test("secret environment values are neither inherited nor persisted", async (t) => {
  const fixture = await invocationFixture(t);
  const sourceEnvironment = {
    ...process.env,
    GH_TOKEN: "secret-gh-sentinel",
    GITHUB_TOKEN: "secret-github-sentinel",
    OPENAI_API_KEY: "secret-openai-sentinel",
    DATABASE_URL: "secret-database-sentinel",
  };
  const result = await adapterFor("inspect-env", { sourceEnvironment }).run({
    cwd: fixture.worktree,
    promptPath: fixture.promptPath,
    contextPath: fixture.contextPath,
    logDirectory: fixture.diagnostics,
    timeoutMs: 5_000,
    budget: budget(),
    workPackage: fixture.workPackage,
  });
  const stdout = await readFile(result.stdoutPath, "utf8");
  for (const sentinel of [
    "secret-gh-sentinel",
    "secret-github-sentinel",
    "secret-openai-sentinel",
    "secret-database-sentinel",
  ]) {
    assert.equal(stdout.includes(sentinel), false);
  }
  assert.deepEqual(
    result.removedSecretNames.filter((name) => [
      "DATABASE_URL", "GH_TOKEN", "GITHUB_TOKEN", "OPENAI_API_KEY",
    ].includes(name)),
    ["DATABASE_URL", "GH_TOKEN", "GITHUB_TOKEN", "OPENAI_API_KEY"],
  );
});

test("invalid executable and malformed prompt fail before process execution", async (t) => {
  const fixture = await invocationFixture(t);
  const missing = createCodexWorkerAdapter({
    executable: join(fixture.root, "missing-codex.exe"),
    sandbox: "workspace-write",
    approvalMode: "never",
  });
  await assert.rejects(
    missing.assertAvailable(),
    (error) => error.code === "RUNNER_CODEX_UNAVAILABLE",
  );
  await writeFile(fixture.promptPath, Buffer.from([0xc3, 0x28]));
  await assert.rejects(
    adapterFor("normal").run({
      cwd: fixture.worktree,
      promptPath: fixture.promptPath,
      contextPath: fixture.contextPath,
      logDirectory: fixture.diagnostics,
      timeoutMs: 5_000,
      budget: budget(),
      workPackage: fixture.workPackage,
    }),
    (error) => error.code === "RUNNER_WORKER_INPUT_INVALID",
  );
});

test("real adapter cannot run when any isolation evidence is unverified", async (t) => {
  const fixture = await invocationFixture(t);
  const adapter = createCodexWorkerAdapter({
    executable: process.execPath,
    sandbox: "workspace-write",
    approvalMode: "never",
    commandBuilder: fixtureCommand("normal"),
  });
  await assert.rejects(
    adapter.run({
      cwd: fixture.worktree,
      promptPath: fixture.promptPath,
      contextPath: fixture.contextPath,
      logDirectory: fixture.diagnostics,
      timeoutMs: 5_000,
      budget: budget(),
      workPackage: fixture.workPackage,
    }),
    (error) => error.code === "RUNNER_WORKER_SANDBOX_UNVERIFIED",
  );
});

test("external-call events fail closed and non-JSON output is collected safely", async (t) => {
  const fixture = await invocationFixture(t);
  await assert.rejects(
    adapterFor("external").run({
      cwd: fixture.worktree,
      promptPath: fixture.promptPath,
      contextPath: fixture.contextPath,
      logDirectory: fixture.diagnostics,
      timeoutMs: 5_000,
      budget: budget(),
      workPackage: fixture.workPackage,
    }),
    (error) => error.code === "RUNNER_EXTERNAL_CALL_DETECTED",
  );
  assert.match(
    await readFile(join(fixture.diagnostics, "worker.stdout.log"), "utf8"),
    /web_search/u,
  );
  assert.match(
    await readFile(join(fixture.diagnostics, "worker-log-metadata.json"), "utf8"),
    /CODEX_WORKER_LOG_METADATA/u,
  );
  assert.deepEqual(parseCodexJsonlOutput("plain text\nnot json\n").usage, {
    tokens: 0,
    cost: 0,
    external_calls: 0,
    verified: false,
  });
});

test("malformed JSONL and unapproved cost fail closed after preserving logs", async (t) => {
  const malformedFixture = await invocationFixture(t);
  await assert.rejects(
    adapterFor("malformed-after-usage").run({
      cwd: malformedFixture.worktree,
      promptPath: malformedFixture.promptPath,
      contextPath: malformedFixture.contextPath,
      logDirectory: malformedFixture.diagnostics,
      timeoutMs: 5_000,
      budget: budget(),
      workPackage: malformedFixture.workPackage,
    }),
    (error) => error.code === "RUNNER_CODEX_USAGE_UNVERIFIED",
  );
  assert.match(
    await readFile(
      join(malformedFixture.diagnostics, "worker-log-metadata.json"),
      "utf8",
    ),
    /"malformed_jsonl_lines":1/u,
  );

  const costFixture = await invocationFixture(t);
  await assert.rejects(
    adapterFor("positive-cost").run({
      cwd: costFixture.worktree,
      promptPath: costFixture.promptPath,
      contextPath: costFixture.contextPath,
      logDirectory: costFixture.diagnostics,
      timeoutMs: 5_000,
      budget: budget(),
      workPackage: costFixture.workPackage,
    }),
    (error) => error.code === "RUNNER_BUDGET_EXCEEDED",
  );
});

test("junction/reparse escape in an allowed tree fails closed", {
  skip: process.platform !== "win32",
}, async (t) => {
  const fixture = await invocationFixture(t, { allowedPath: "docs" });
  const outside = await temporaryDirectory(t, "propscans-codex-outside-");
  await mkdir(join(fixture.worktree, "docs"), { recursive: true });
  await symlink(outside, join(fixture.worktree, "docs", "escape"), "junction");
  await assert.rejects(
    adapterFor("normal").run({
      cwd: fixture.worktree,
      promptPath: fixture.promptPath,
      contextPath: fixture.contextPath,
      logDirectory: fixture.diagnostics,
      timeoutMs: 5_000,
      budget: budget(),
      workPackage: fixture.workPackage,
    }),
    (error) => error.code === "RUNNER_WORKER_PATH_ESCAPE",
  );
});

test("real CLI flags require execute mode and exact approved worker policy", async (t) => {
  assert.throws(
    () => parseRunnerArgs([
      "--dry-run", "dry.json",
      "--approval", "approval.json",
      "--approval-hash", `sha256:${"a".repeat(64)}`,
      "--work-packages", "WP-1",
      "--repository", resolve("."),
      "--worktree-root", resolve(tmpdir(), "worktrees"),
      "--real-codex-worker",
      "--codex-executable", process.execPath,
      "--worker-sandbox", "workspace-write",
      "--worker-approval", "never",
      "--prepare-only",
    ]),
    /requires --execute-and-publish/u,
  );

  const root = await temporaryDirectory(t, "propscans-codex-cli-");
  execFileSync("git", ["init", "-b", "master"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Codex Adapter Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "codex@example.invalid"], { cwd: root });
  await writeFile(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "README.md"], { cwd: root });
  execFileSync("git", ["commit", "-m", "fixture"], { cwd: root });
  const dryPath = join(root, "dry.json");
  const approvalPath = join(root, "approval.json");
  await writeFile(dryPath, JSON.stringify({ record_kind: "READ_ONLY_DRY_RUN" }));
  const approval = {
    record_kind: "OWNER_RUN_APPROVAL",
    approved_by: "owner",
    approved_at: "2026-07-31T00:00:00Z",
    worker_policy: {
      adapter: "CODEX_CLI_0_146",
      executable: resolve(process.execPath),
      sandbox: "workspace-write",
      approval: "never",
      network_policy: "DENY_REQUIRED",
      external_calls: 0,
      filesystem_policy: "WORKTREE_AND_RUNNER_PATH_VALIDATION",
      process_containment: "WINDOWS_JOB_OBJECT_REQUIRED",
    },
  };
  validateApprovedWorkerPolicy(approval, {
    executable: process.execPath,
    sandbox: "workspace-write",
    approvalMode: "never",
  });
  await writeFile(approvalPath, JSON.stringify(approval));
  let constructed = null;
  const result = await runCli([
    "--dry-run", dryPath,
    "--approval", approvalPath,
    "--approval-hash", `sha256:${"a".repeat(64)}`,
    "--work-packages", "WP-1",
    "--repository", root,
    "--worktree-root", join(root, "worktrees"),
    "--real-codex-worker",
    "--codex-executable", process.execPath,
    "--worker-sandbox", "workspace-write",
    "--worker-approval", "never",
    "--execute-and-publish",
  ], {
    codexAdapterFactory(input) {
      constructed = input;
      return { async assertAvailable() {}, async run() {} };
    },
    async runner(input) {
      assert.equal(input.prepareOnly, false);
      assert.ok(input.adapters.worker);
      return { state: "BLOCKED_TEST" };
    },
  });
  assert.equal(result, 0);
  assert.deepEqual(constructed.isolationEvidence, {
    network: false,
    filesystem: false,
    processTree: false,
  });
});

test("current process containment implementation does not claim strict Pilot authority", () => {
  const status = processContainmentStatus();
  assert.equal(status.independently_verified, false);
  assert.equal(status.strict_boundary, false);
});

test("Windows taskkill arguments accept only a numeric PID and fixed tokens", () => {
  assert.deepEqual(windowsTaskkillArguments(1234), ["/PID", "1234", "/T"]);
  assert.deepEqual(
    windowsTaskkillArguments(1234, { force: true }),
    ["/PID", "1234", "/T", "/F"],
  );
  assert.throws(
    () => windowsTaskkillArguments("1234 & whoami", { force: true }),
    (error) => error.code === "RUNNER_PROCESS_PID_INVALID",
  );
});

test("default Worker adapter remains unavailable", async () => {
  await assert.rejects(
    unavailableCodexAdapter().assertAvailable(),
    (error) => error.code === "RUNNER_CODEX_UNAVAILABLE",
  );
});
