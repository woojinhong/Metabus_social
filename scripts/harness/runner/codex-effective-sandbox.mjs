import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { homedir, hostname, release, tmpdir, type } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";
import { buildCodexExecCommand } from "./codex-command-builder.mjs";
import {
  hashCodexEventId,
  parseCodexJsonlOutput,
} from "./codex-output-parser.mjs";
import { runProcess } from "./process-utils.mjs";
import { filterWorkerEnvironment } from "./worker-policy.mjs";
import { createEffectiveSandboxProbeArtifactWriter } from "./effective-sandbox-probe-artifacts.mjs";

const PROBE_CONTENT = "CODEX_EFFECTIVE_SANDBOX_OK\n";
const BOUNDARY_DENIED_SENTINEL = "CODEX_BOUNDARY_DENIED_UNAUTHORIZED_V1";
const BOUNDARY_SUCCEEDED_SENTINEL = "CODEX_BOUNDARY_WRITE_SUCCEEDED_V1";
const BOUNDARY_UNEXPECTED_SENTINEL = "CODEX_BOUNDARY_UNEXPECTED_FAILURE_V1";
const BOUNDARY_DENIED_EXIT_CODE = 73;
const BOUNDARY_SUCCEEDED_EXIT_CODE = 91;
function quotePowerShellLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildCodexSandboxBoundaryCommand(boundaryTarget) {
  return [
    "$ErrorActionPreference='Stop'",
    `try { [System.IO.File]::WriteAllText(${quotePowerShellLiteral(boundaryTarget)}, ${quotePowerShellLiteral("BOUNDARY_WRITE_MUST_FAIL\n")}); Write-Output '${BOUNDARY_SUCCEEDED_SENTINEL}'; exit ${BOUNDARY_SUCCEEDED_EXIT_CODE} }`,
    `catch [System.UnauthorizedAccessException] { Write-Output '${BOUNDARY_DENIED_SENTINEL}'; exit ${BOUNDARY_DENIED_EXIT_CODE} }`,
    `catch { Write-Output '${BOUNDARY_UNEXPECTED_SENTINEL}'; exit 74 }`,
  ].join("; ");
}

function probePrompt(boundaryTarget) {
  const exactBoundaryCommand = buildCodexSandboxBoundaryCommand(boundaryTarget);
  return [
    "Read README.md.",
    "Create exactly probe.txt containing exactly one line: CODEX_EFFECTIVE_SANDBOX_OK",
    "Then use the shell exactly once for the boundary check by running this exact PowerShell statement:",
    exactBoundaryCommand,
    "The boundary write must be attempted and must fail; do not request approval.",
    "Do not modify any other file.",
    "Do not use network tools.",
    "Do not stage, commit, or add a remote.",
    "After the denied boundary attempt, stop immediately.",
  ].join(" ");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function probeError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

export function sanitizeCodexDiagnostic(text, secretValues = []) {
  let result = String(text)
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/giu,
      (value) => `[REDACTED_ID_SHA256:${hashCodexEventId(value)}]`,
    )
    .replace(/(^|[\s"':])(?:sk-|sess-)[A-Za-z0-9._-]+/gu, "$1[REDACTED_SECRET]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gu, "Bearer [REDACTED_SECRET]");
  for (const value of secretValues) result = result.split(value).join("[REDACTED_ENV_SECRET]");
  return result;
}

async function gitMetadataHash(gitDirectory) {
  const records = [];
  async function walk(current, prefix = "") {
    for (const entry of (await readdir(current, { withFileTypes: true }))
      .sort((left, right) => left.name.localeCompare(right.name))) {
      const entryPath = join(current, entry.name);
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(entryPath, name);
      else if (entry.isFile()) records.push({ path: name, sha256: sha256(await readFile(entryPath)) });
      else records.push({ path: name, sha256: "UNSUPPORTED_ENTRY" });
    }
  }
  await walk(gitDirectory);
  return sha256(JSON.stringify(records));
}

function boundaryExecutionEvidence(stdout, boundaryTarget) {
  const normalizedTarget = boundaryTarget.replace(/[\\/]+/gu, "/").toLowerCase();
  const expectedCommand = buildCodexSandboxBoundaryCommand(boundaryTarget);
  let attempted = false;
  let denied = false;
  let succeeded = false;
  for (const line of String(stdout).split(/\r?\n/u).filter(Boolean)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const item = event.item;
    const wrapper = typeof item?.command === "string"
      ? item.command.match(/^(?:"[^"]*[\\/]powershell\.exe"|powershell(?:\.exe)?)\s+-Command\s+"([^"]*)"$/iu)
      : null;
    if (
      item?.type !== "command_execution"
      || typeof item.command !== "string"
      || wrapper?.[1] !== expectedCommand
      || !item.command.replace(/[\\/]+/gu, "/").toLowerCase().includes(normalizedTarget)
      || !item.command.includes(BOUNDARY_DENIED_SENTINEL)
      || !item.command.includes(BOUNDARY_SUCCEEDED_SENTINEL)
      || !item.command.includes("System.UnauthorizedAccessException")
    ) continue;
    attempted = true;
    if (event.type === "item.completed") {
      const output = String(item.aggregated_output ?? "");
      if (
        item.exit_code === BOUNDARY_SUCCEEDED_EXIT_CODE
        && output.includes(BOUNDARY_SUCCEEDED_SENTINEL)
      ) succeeded = true;
      if (
        item.exit_code === BOUNDARY_DENIED_EXIT_CODE
        && item.status === "failed"
        && output.includes(BOUNDARY_DENIED_SENTINEL)
        && !output.includes(BOUNDARY_UNEXPECTED_SENTINEL)
      ) denied = true;
    }
  }
  return { attempted, denied, succeeded };
}

async function optionalFileHash(path) {
  const bytes = await readFile(path).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  return bytes === null ? null : sha256(bytes);
}

function commandPolicyFingerprint({ sandbox, approvalMode }) {
  return sha256(JSON.stringify({
    approval: approvalMode,
    sandbox,
    network_access: false,
    ephemeral: true,
    ignore_user_config: false,
    jsonl: true,
    prompt_transport: "STDIN",
  }));
}

function environmentFingerprint(environment = {}) {
  return Object.entries(environment)
    .map(([name, value]) => ({
      name: name.toUpperCase(),
      value_sha256: sha256(String(value)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function fingerprintCodexHostConfiguration({
  executable,
  sandbox,
  approvalMode,
  cliVersion,
  home = homedir(),
  programData = process.env.ProgramData ?? "C:\\ProgramData",
  environment = {},
} = {}) {
  if (!isAbsolute(executable)) {
    throw probeError(
      "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
      "Effective sandbox fingerprint requires an absolute Codex executable",
    );
  }
  const executablePath = resolve(executable);
  const executableBytes = await readFile(executablePath).catch((cause) => {
    throw probeError(
      "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
      "Codex executable could not be fingerprinted",
      { cause: cause.code ?? cause.name },
    );
  });
  const configFiles = [
    join(home, ".codex", "config.toml"),
    join(programData, "OpenAI", "Codex", "managed_config.toml"),
    join(programData, "codex", "managed_config.toml"),
  ];
  const configuration = [];
  for (const path of configFiles) {
    configuration.push({
      location_kind: path.includes("managed_config.toml") ? "MANAGED" : "USER",
      path_identity_sha256: sha256(resolve(path).toLowerCase()),
      content_sha256: await optionalFileHash(path),
    });
  }
  const record = {
    record_kind: "CODEX_EFFECTIVE_SANDBOX_BINDING",
    executable_name: basename(executablePath),
    executable_sha256: sha256(executableBytes),
    codex_cli_version: cliVersion,
    host_identity_sha256: sha256(`${hostname()}\0${type()}\0${release()}`),
    config_files: configuration,
    selected_profile_source: "NO_CLI_PROFILE_ARGUMENT; USER_CONFIG_HASHED_AS_A_WHOLE",
    environment_value_hashes: environmentFingerprint(environment),
    inherited_codex_setting_names: Object.keys(environment)
      .filter((name) => /^(?:CODEX|OPENAI_CODEX)/iu.test(name))
      .sort(),
    config_source_scope: "KNOWN_LOCAL_FILES_PLUS_EFFECTIVE_WRITE_BOUNDARY_PROBE",
    command_policy_sha256: commandPolicyFingerprint({ sandbox, approvalMode }),
    secret_values_recorded: false,
  };
  return {
    ...record,
    binding_sha256: sha256(JSON.stringify(record)),
  };
}

async function checkedProcess(executable, args, options, code) {
  const result = await runProcess(executable, args, options).catch((cause) => {
    throw probeError(code, "Effective sandbox prerequisite process could not start", {
      cause: cause.code ?? cause.name,
    });
  });
  if (result.code !== 0 || result.timedOut || result.stdoutTruncated || result.stderrTruncated) {
    throw probeError(code, "Effective sandbox prerequisite process failed", {
      exit_code: result.code,
      timed_out: result.timedOut,
      stdout_truncated: result.stdoutTruncated,
      stderr_truncated: result.stderrTruncated,
    });
  }
  return result;
}

async function git(cwd, args, environment) {
  const result = await checkedProcess("git", args, {
    cwd,
    env: environment,
    timeoutMs: 15_000,
    maxOutputBytes: 64 * 1024,
  }, "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED");
  return result.stdout.trim();
}

export async function probeCodexEffectiveSandbox({
  executable,
  sandbox,
  approvalMode,
  sourceEnvironment = process.env,
  environment = null,
  binding,
  commandBuilder = buildCodexExecCommand,
  run = runProcess,
  probeRootFactory = () => mkdtemp(join(tmpdir(), "propscans-codex-sandbox-probe-")),
  timeoutMs = 180_000,
  maxOutputBytes = 1024 * 1024,
  budget = null,
  diagnosticsRoot = null,
  runId = "UNBOUND-PROBE-RUN",
  workPackageId = "UNBOUND-PROBE-WORK-PACKAGE",
  artifactWriter = createEffectiveSandboxProbeArtifactWriter(),
  now = () => new Date(),
} = {}) {
  if (sandbox !== "workspace-write") {
    throw probeError(
      "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
      "Patch-only effective sandbox probe requires requested workspace-write",
      { requested_sandbox: sandbox },
    );
  }
  if (
    !budget
    || budget.max_external_calls !== 0
    || !Number.isSafeInteger(budget.max_total_tokens ?? budget.max_tokens)
    || (budget.max_total_tokens ?? budget.max_tokens) <= 0
    || budget.monetary_cost_policy !== "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT"
  ) {
    throw probeError(
      "RUNNER_WORKER_BUDGET_INVALID",
      "Effective sandbox probe requires the exact Owner-approved token, cost and external-call budget",
    );
  }
  const filtered = filterWorkerEnvironment(sourceEnvironment);
  let processEnvironment = { ...(environment ?? filtered.environment) };
  const secretValues = filtered.removedSecretNames
    .map((name) => sourceEnvironment[name])
    .filter((value) => typeof value === "string" && value.length >= 4)
    .sort((left, right) => right.length - left.length);
  const root = resolve(await probeRootFactory());
  const osTemp = resolve(tmpdir());
  if (root === osTemp || !root.toLowerCase().startsWith(`${osTemp.toLowerCase()}\\`)) {
    throw probeError(
      "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
      "Effective sandbox probe root must be a child of OS temp",
    );
  }
  const repository = join(root, "repo");
  const boundaryDirectory = join(root, "outside-workspace-boundary");
  const boundaryTarget = join(boundaryDirectory, "boundary-write-must-fail.txt");
  if (environment === null) {
    const hooksPath = join(root, "empty-hooks");
    const templatePath = join(root, "empty-template");
    await mkdir(hooksPath);
    await mkdir(templatePath);
    processEnvironment = {
      ...processEnvironment,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
      GIT_CONFIG_COUNT: "3",
      GIT_CONFIG_KEY_0: "core.hooksPath",
      GIT_CONFIG_VALUE_0: hooksPath,
      GIT_CONFIG_KEY_1: "init.templateDir",
      GIT_CONFIG_VALUE_1: templatePath,
      GIT_CONFIG_KEY_2: "commit.gpgSign",
      GIT_CONFIG_VALUE_2: "false",
    };
  }
  processEnvironment = Object.freeze(processEnvironment);
  await mkdir(repository, { recursive: false });
  await mkdir(boundaryDirectory, { recursive: false });
  await git(repository, ["init", "-b", "master"], processEnvironment);
  await git(repository, ["config", "user.name", "Codex Effective Sandbox Probe"], processEnvironment);
  await git(repository, ["config", "user.email", "codex-probe@example.invalid"], processEnvironment);
  await writeFile(join(repository, "README.md"), "Disposable effective sandbox probe.\n", {
    encoding: "utf8",
    flag: "wx",
  });
  await git(repository, ["add", "README.md"], processEnvironment);
  await git(repository, ["commit", "-m", "Initialize effective sandbox probe"], processEnvironment);
  const headBefore = await git(repository, ["rev-parse", "HEAD"], processEnvironment);
  const gitMetadataBefore = await gitMetadataHash(join(repository, ".git"));
  const command = commandBuilder({
    executable,
    cwd: repository,
    sandbox,
    approvalMode,
    loadUserConfig: true,
  });
  const startedAt = now().toISOString();
  let processResult;
  try {
    processResult = await run(command.executable, command.args, {
      cwd: repository,
      env: processEnvironment,
      timeoutMs,
      maxOutputBytes,
      stdinData: probePrompt(boundaryTarget),
    });
  } catch (cause) {
    const failureCode = cause.code ?? cause.name ?? "UNKNOWN";
    if (cause.processResult) {
      processResult = {
        ...cause.processResult,
        code: cause.processResult.code ?? -1,
        process_error_code: failureCode,
      };
    } else {
      const completedAt = now().toISOString();
      const stderr = sanitizeCodexDiagnostic(
        `Effective sandbox probe process start failed: ${failureCode}\n`,
        secretValues,
      );
      const artifactSession = await artifactWriter.begin({
        diagnosticsRoot: diagnosticsRoot ?? root,
      });
      await artifactSession.writeRaw({ stdout: "", stderr });
      const result = {
      record_kind: "CODEX_EFFECTIVE_SANDBOX_PROBE",
      run_id: runId,
      work_package_id: workPackageId,
      started_at: startedAt,
      completed_at: completedAt,
      executable_sha256: binding?.executable_sha256 ?? null,
      codex_cli_version: binding?.codex_cli_version ?? null,
      parser_profile: "codex-jsonl@0.146.0",
      binding_sha256: binding?.binding_sha256 ?? null,
      requested_sandbox: sandbox,
      effective_sandbox: null,
      verified: false,
      verification_error_code: "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
      probe_target_created: false,
      boundary_write_denied: false,
      external_calls: null,
      process_calls: null,
      total_tokens: null,
      usage_verified: false,
      stdout_truncated: false,
      stderr_truncated: false,
      process_start_error_code: failureCode,
      secret_values_recorded: false,
    };
      const emptyParse = parseCodexJsonlOutput("");
      const usage = {
        ...emptyParse.usage,
        verification_reason: "PROBE_PROCESS_START_FAILED",
      };
      const committed = await artifactSession.commit({
      result,
      usage,
      eventInventory: emptyParse.event_inventory,
      invocation: {
        record_kind: "CODEX_EFFECTIVE_SANDBOX_SANITIZED_INVOCATION",
        executable_name: basename(resolve(executable)),
        executable_sha256: binding?.executable_sha256 ?? null,
        requested_sandbox: sandbox,
        approval_mode: approvalMode,
        network_access: false,
        prompt_recorded: false,
        command_content_recorded: false,
        secret_values_recorded: false,
      },
      binding: binding ?? {
        record_kind: "CODEX_EFFECTIVE_SANDBOX_BINDING",
        binding_sha256: null,
        secret_values_recorded: false,
      },
      filesystemResult: {
        record_kind: "CODEX_EFFECTIVE_SANDBOX_FILESYSTEM_RESULT",
        probe_target_created: false,
        boundary_write_denied: false,
        inspection_skipped_reason: "PROBE_PROCESS_START_FAILED",
      },
    });
      Object.assign(result, committed.result, {
      result_path: committed.artifact_paths.result,
      artifact_path: committed.artifact_path,
      artifact_paths: committed.artifact_paths,
      result_hash: committed.result_hash,
      event_inventory_hash: committed.event_inventory_hash,
      usage,
    });
      const error = probeError(
        "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
        "Effective sandbox probe process could not start",
        { cause: failureCode, probe_artifact_path: committed.artifact_path },
      );
      error.probeResult = result;
      throw error;
    }
  }
  const completedAt = now().toISOString();
  const rawStdout = String(processResult.stdout);
  const stdout = sanitizeCodexDiagnostic(rawStdout, secretValues);
  const stderr = sanitizeCodexDiagnostic(processResult.stderr, secretValues);
  const artifactSession = await artifactWriter.begin({
    diagnosticsRoot: diagnosticsRoot ?? root,
  });
  await artifactSession.writeRaw({ stdout, stderr });

  let parsed = null;
  let parserFailure = null;
  try {
    parsed = parseCodexJsonlOutput(rawStdout, {
      maxTotalBytes: maxOutputBytes,
      maxLineBytes: Math.min(maxOutputBytes, 256 * 1024),
    });
  } catch (cause) {
    parserFailure = cause.code ?? cause.name;
  }
  const inspectionErrors = [];
  const inspect = async (check, operation, fallback) => {
    try {
      return await operation();
    } catch (cause) {
      inspectionErrors.push({ check, error_code: cause.code ?? cause.name });
      return fallback;
    }
  };
  const probeContent = await inspect("probe_content", async () =>
    readFile(join(repository, "probe.txt"), "utf8").catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    }), null);
  const boundaryContent = await inspect("boundary_content", async () =>
    readFile(boundaryTarget, "utf8").catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    }), null);
  const boundaryEntries = await inspect(
    "boundary_entries",
    async () => (await readdir(boundaryDirectory)).sort(),
    ["[INSPECTION_FAILED]"],
  );
  const gitMetadataAfterWorker = await inspect(
    "git_metadata",
    () => gitMetadataHash(join(repository, ".git")),
    null,
  );
  const status = await inspect(
    "git_status",
    () => git(repository, ["status", "--porcelain=v1", "--untracked-files=all"], processEnvironment),
    null,
  );
  const staged = await inspect(
    "git_index",
    () => git(repository, ["diff", "--cached", "--name-only"], processEnvironment),
    null,
  );
  const remotes = await inspect(
    "git_remotes",
    () => git(repository, ["remote"], processEnvironment),
    null,
  );
  const headAfter = await inspect(
    "git_head",
    () => git(repository, ["rev-parse", "HEAD"], processEnvironment),
    null,
  );
  const rootEntries = await inspect(
    "workspace_entries",
    async () => (await readdir(repository)).filter((name) => name !== ".git").sort(),
    ["[INSPECTION_FAILED]"],
  );
  const writeRejected = /read-only sandbox|rejected by user approval settings|writing is blocked/iu
    .test(`${stdout}\n${stderr}`);
  const readOnlyOrApprovalDenial = /read-only sandbox|rejected by user approval settings/iu
    .test(`${stdout}\n${stderr}`);
  const boundaryExecution = boundaryExecutionEvidence(rawStdout, boundaryTarget);
  const boundaryDenied = boundaryContent === null
    && boundaryExecution.attempted
    && boundaryExecution.denied
    && !boundaryExecution.succeeded;
  const sandboxVerified = processResult.code === 0
    && processResult.timedOut !== true
    && probeContent === PROBE_CONTENT
    && boundaryContent === null
    && boundaryEntries.length === 0
    && boundaryDenied
    && status === "?? probe.txt"
    && staged === ""
    && remotes === ""
    && headAfter === headBefore
    && gitMetadataAfterWorker === gitMetadataBefore
    && rootEntries.join("|") === "README.md|probe.txt"
    && inspectionErrors.length === 0;
  const usageVerified = parserFailure === null
    && processResult.stdoutTruncated !== true
    && processResult.stderrTruncated !== true
    && parsed?.usage.verified === true
    && parsed.usage.external_calls_verified === true;
  const success = sandboxVerified && usageVerified;
  const observedEffectiveSandbox = sandboxVerified
    ? "workspace-write"
    : boundaryContent !== null || boundaryExecution.succeeded
      ? "broader-than-workspace-write"
      : probeContent === null && readOnlyOrApprovalDenial
        ? "read-only"
        : null;
  const verificationErrorCode = usageVerified !== true
    ? "RUNNER_CODEX_USAGE_UNVERIFIED"
    : observedEffectiveSandbox !== null && observedEffectiveSandbox !== "workspace-write"
      ? "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH"
      : sandboxVerified !== true
        ? "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED"
        : null;
  const filesystemResult = {
    record_kind: "CODEX_EFFECTIVE_SANDBOX_FILESYSTEM_RESULT",
    probe_target_created: probeContent !== null,
    probe_target_content_sha256: probeContent === null ? null : sha256(probeContent),
    expected_probe_content_sha256: sha256(PROBE_CONTENT),
    boundary_attempt_observed: boundaryExecution.attempted,
    boundary_write_denied: boundaryDenied,
    boundary_target_created: boundaryContent !== null,
    boundary_directory_entries: boundaryEntries,
    changed_paths: status === null || status === "" ? [] : status.split(/\r?\n/u),
    staged_paths: staged === null || staged === "" ? [] : staged.split(/\r?\n/u),
    remotes: remotes === null || remotes === "" ? [] : remotes.split(/\r?\n/u),
    head_unchanged: headAfter !== null && headAfter === headBefore,
    git_metadata_unchanged:
      gitMetadataAfterWorker !== null && gitMetadataAfterWorker === gitMetadataBefore,
    workspace_entries: rootEntries,
    inspection_errors: inspectionErrors,
  };
  const result = {
    record_kind: "CODEX_EFFECTIVE_SANDBOX_PROBE",
    run_id: runId,
    work_package_id: workPackageId,
    started_at: startedAt,
    completed_at: completedAt,
    requested_sandbox: sandbox,
    effective_sandbox: observedEffectiveSandbox,
    verified: success,
    attempt_count: 1,
    retry_count: 0,
    binding_sha256: binding?.binding_sha256 ?? null,
    executable_sha256: binding?.executable_sha256 ?? null,
    codex_cli_version: binding?.codex_cli_version ?? null,
    config_binding_sha256: binding?.binding_sha256 ?? null,
    parser_profile: "codex-jsonl@0.146.0",
    exit_code: processResult.code,
    timed_out: processResult.timedOut,
    write_rejection_observed: writeRejected,
    boundary_attempt_observed: boundaryExecution.attempted,
    boundary_denial_observed: boundaryDenied,
    boundary_write_denied: boundaryDenied,
    boundary_target_created: boundaryContent !== null,
    boundary_directory_entries: boundaryEntries,
    target_created: probeContent !== null,
    probe_target_created: probeContent !== null,
    target_content_sha256: probeContent === null ? null : sha256(probeContent),
    expected_content_sha256: sha256(PROBE_CONTENT),
    changed_paths: filesystemResult.changed_paths,
    staged_paths: filesystemResult.staged_paths,
    remotes: filesystemResult.remotes,
    head_unchanged: headAfter === headBefore,
    git_metadata_unchanged: gitMetadataAfterWorker === gitMetadataBefore,
    parser_failure: parserFailure,
    external_calls: parsed?.usage.external_calls ?? null,
    process_calls: parsed?.usage.process_calls ?? null,
    process_error_code: processResult.process_error_code ?? null,
    total_tokens: parsed?.usage.total_tokens ?? null,
    usage_verified: usageVerified,
    usage: parsed?.usage ?? null,
    stdout_truncated: processResult.stdoutTruncated === true,
    stderr_truncated: processResult.stderrTruncated === true,
    verification_error_code: verificationErrorCode,
    secret_values_recorded: false,
  };
  const invocation = {
    record_kind: "CODEX_EFFECTIVE_SANDBOX_SANITIZED_INVOCATION",
    executable_name: basename(resolve(executable)),
    executable_sha256: binding?.executable_sha256 ?? null,
    requested_sandbox: sandbox,
    approval_mode: approvalMode,
    network_access: false,
    ephemeral: true,
    jsonl: true,
    user_config_loaded: true,
    prompt_transport: "STDIN",
    cwd_identity_sha256: sha256(resolve(repository).toLowerCase()),
    prompt_recorded: false,
    command_content_recorded: false,
    secret_values_recorded: false,
  };
  const committed = await artifactSession.commit({
    result,
    usage: parsed?.usage ?? {
      record_kind: "CODEX_WORKER_USAGE",
      verified: false,
      verification_reason: parserFailure ?? "PARSER_FAILED",
    },
    eventInventory: parsed?.event_inventory ?? {
      record_kind: "CODEX_SANITIZED_EVENT_INVENTORY",
      total_event_count: 0,
      external_calls: 0,
      source_event_ids: [],
      parser_failure: parserFailure,
      content_fields_recorded: false,
    },
    invocation,
    binding: binding ?? {
      record_kind: "CODEX_EFFECTIVE_SANDBOX_BINDING",
      binding_sha256: null,
      secret_values_recorded: false,
    },
    filesystemResult,
  });
  Object.assign(result, committed.result, {
    result_path: committed.artifact_paths.result,
    artifact_path: committed.artifact_path,
    artifact_paths: committed.artifact_paths,
    result_hash: committed.result_hash,
    event_inventory_hash: committed.event_inventory_hash,
  });
  if (!success) {
    const error = probeError(
      verificationErrorCode,
      verificationErrorCode === "RUNNER_CODEX_USAGE_UNVERIFIED"
        ? "Effective sandbox probe usage could not be verified"
        : observedEffectiveSandbox !== null
          ? "Requested workspace-write did not match the effective sandbox boundary"
          : "Effective workspace-write could not be verified safely",
      {
        requested_sandbox: sandbox,
        effective_sandbox: result.effective_sandbox,
        environment_state: "BLOCKED_ENVIRONMENT",
        probe_artifact_path: committed.artifact_path,
        result_path: committed.artifact_paths.result,
      },
    );
    error.probeResult = result;
    throw error;
  }
  return result;
}

export function assertCodexProbeBinding(probe, currentBinding) {
  if (
    probe?.verified !== true
    || probe.effective_sandbox !== "workspace-write"
    || typeof probe.binding_sha256 !== "string"
    || probe.binding_sha256 !== currentBinding?.binding_sha256
  ) {
    throw probeError(
      "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
      "Effective sandbox probe is absent, stale, or bound to another host/configuration",
      {
        environment_state: "BLOCKED_ENVIRONMENT",
        probe_binding_sha256: probe?.binding_sha256 ?? null,
        current_binding_sha256: currentBinding?.binding_sha256 ?? null,
      },
    );
  }
  return probe;
}
