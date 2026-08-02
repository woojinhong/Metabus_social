import { access, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { buildCodexExecCommand } from "./codex-command-builder.mjs";
import {
  assertCodexProbeBinding,
  fingerprintCodexHostConfiguration,
  probeCodexEffectiveSandbox,
} from "./codex-effective-sandbox.mjs";
import {
  assertCodexOutputPolicy,
  parseCodexJsonlOutput,
} from "./codex-output-parser.mjs";
import { runProcess } from "./process-utils.mjs";
import {
  filterWorkerEnvironment,
  validateCodexPolicyValues,
  validateWorkerInvocation,
} from "./worker-policy.mjs";

function adapterError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function secretValues(source, removedNames) {
  return removedNames
    .map((name) => source[name])
    .filter((value) => typeof value === "string" && value.length >= 4)
    .sort((left, right) => right.length - left.length);
}

function redact(text, values) {
  let result = String(text);
  for (const value of values) result = result.split(value).join("[REDACTED_ENV_SECRET]");
  return result;
}

export function createCodexWorkerAdapter({
  executable,
  sandbox,
  approvalMode,
  sourceEnvironment = process.env,
  isolationEvidence = {},
  patchOnly = false,
  allowPartialContainment = false,
  maxLogBytes = 1024 * 1024,
  run = runProcess,
  versionProbe = runProcess,
  costAuthority = null,
  commandBuilder = buildCodexExecCommand,
  effectiveSandboxProbe = probeCodexEffectiveSandbox,
  configurationFingerprint = fingerprintCodexHostConfiguration,
} = {}) {
  if (typeof executable !== "string" || !isAbsolute(executable)) {
    throw adapterError(
      "RUNNER_CODEX_EXECUTABLE_INVALID",
      "Real Codex Worker requires an explicit absolute executable path",
    );
  }
  validateCodexPolicyValues({ sandbox, approvalMode });
  if (
    (patchOnly || costAuthority?.publication_mode === "EXECUTE_PATCH_ONLY")
    && sandbox !== "workspace-write"
  ) {
    throw adapterError(
      "RUNNER_WORKER_SANDBOX_MODE_INVALID",
      "Patch-only Codex Workers require the workspace-write sandbox",
      { sandbox },
    );
  }
  if (!Number.isInteger(maxLogBytes) || maxLogBytes < 1024 || maxLogBytes > 4 * 1024 * 1024) {
    throw adapterError("RUNNER_WORKER_POLICY_INVALID", "Invalid Worker log byte limit");
  }
  const executablePath = resolve(executable);
  const evidence = {
    network: isolationEvidence.network === true,
    filesystem: isolationEvidence.filesystem === true,
    processTree: isolationEvidence.processTree === true,
  };
  const requiresEffectiveSandboxProbe = patchOnly
    || costAuthority?.publication_mode === "EXECUTE_PATCH_ONLY";
  const filteredEnvironment = filterWorkerEnvironment(sourceEnvironment);
  let executionEnvironment = Object.freeze({ ...filteredEnvironment.environment });
  let runtimeEnvironmentInitialized = !requiresEffectiveSandboxProbe;
  let effectiveSandboxEvidence = null;

  const ensureExecutionEnvironment = async () => {
    if (runtimeEnvironmentInitialized) return executionEnvironment;
    const runtimeTemp = await mkdtemp(join(tmpdir(), "propscans-codex-runtime-"));
    const hooksPath = join(runtimeTemp, "empty-hooks");
    const templatePath = join(runtimeTemp, "empty-template");
    await mkdir(hooksPath);
    await mkdir(templatePath);
    const withoutTemp = Object.fromEntries(Object.entries(executionEnvironment)
      .filter(([name]) => !["TEMP", "TMP", "TMPDIR"].includes(name.toUpperCase())));
    executionEnvironment = Object.freeze({
      ...withoutTemp,
      TEMP: runtimeTemp,
      TMP: runtimeTemp,
      TMPDIR: runtimeTemp,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
      GIT_CONFIG_COUNT: "3",
      GIT_CONFIG_KEY_0: "core.hooksPath",
      GIT_CONFIG_VALUE_0: hooksPath,
      GIT_CONFIG_KEY_1: "init.templateDir",
      GIT_CONFIG_VALUE_1: templatePath,
      GIT_CONFIG_KEY_2: "commit.gpgSign",
      GIT_CONFIG_VALUE_2: "false",
    });
    runtimeEnvironmentInitialized = true;
    return executionEnvironment;
  };

  const assertAvailable = async ({
    budget = null,
    timeoutMs = null,
    probeDiagnosticsRoot = null,
    runId = null,
    workPackageId = null,
  } = {}) => {
    await access(executablePath).catch((cause) => {
      throw adapterError(
        "RUNNER_CODEX_UNAVAILABLE",
        "Configured Codex executable is unavailable",
        { cause: cause.code ?? cause.name },
      );
    });
    const fullyVerified = evidence.network && evidence.filesystem && evidence.processTree;
    if (!fullyVerified && !allowPartialContainment) {
      throw adapterError(
        "RUNNER_WORKER_SANDBOX_UNVERIFIED",
        "Real Pilot requires independently verified network, filesystem, and process-tree containment",
        { isolation: evidence },
      );
    }
    const exactAllowedPath = costAuthority?.exact_allowed_path;
    if (
      costAuthority?.authentication_mode !== "CHATGPT"
      || costAuthority.monetary_cost_policy !== "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT"
      || costAuthority.publication_mode !== "EXECUTE_PATCH_ONLY"
      || costAuthority.production !== false
      || costAuthority.commit_allowed !== false
      || costAuthority.push_allowed !== false
      || costAuthority.pr_allowed !== false
      || typeof exactAllowedPath !== "string"
      || !/^docs\/[A-Za-z0-9._/-]+\.md$/u.test(exactAllowedPath)
      || exactAllowedPath.includes("//")
      || exactAllowedPath.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      throw adapterError(
        "RUNNER_CODEX_COST_AUTHORITY_REQUIRED",
        "Owner-pinned Codex authentication and cost authority is required before execution",
      );
    }
    const environment = await ensureExecutionEnvironment();
    const versionResult = await versionProbe(executablePath, ["--version"], {
      env: environment,
      timeoutMs: 5_000,
      maxOutputBytes: 4_096,
    }).catch((cause) => {
      throw adapterError(
        "RUNNER_CODEX_VERSION_MISMATCH",
        "Codex version probe failed for the approved 0.146.0 parser profile",
        { cause: cause?.code ?? cause?.name ?? "UNKNOWN" },
      );
    });
    const versionOutput = String(versionResult?.stdout ?? "").trim();
    if (
      versionResult?.code !== 0
      || versionResult?.timedOut === true
      || versionResult?.stdoutTruncated === true
      || !/^codex(?:-cli)?\s+0\.146\.0$/u.test(versionOutput)
    ) {
      throw adapterError(
        "RUNNER_CODEX_VERSION_MISMATCH",
        "Codex executable does not match the approved 0.146.0 parser profile",
        { observed_version: versionOutput || null },
      );
    }
    if (requiresEffectiveSandboxProbe) {
      const fingerprint = async () => configurationFingerprint({
        executable: executablePath,
        sandbox,
        approvalMode,
        cliVersion: versionOutput,
        environment,
      }).catch((cause) => {
        if (cause.code?.startsWith?.("RUNNER_")) throw cause;
        throw adapterError(
          "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
          "Codex host/configuration fingerprint could not be verified",
          { cause: cause.code ?? cause.name },
        );
      });
      let currentBinding = await fingerprint();
      if (effectiveSandboxEvidence === null) {
        if (budget === null || typeof budget !== "object") {
          throw adapterError(
            "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
            "Effective sandbox probe requires the Owner-approved run budget",
            { environment_state: "BLOCKED_ENVIRONMENT" },
          );
        }
        try {
          effectiveSandboxEvidence = await effectiveSandboxProbe({
            executable: executablePath,
            sandbox,
            approvalMode,
            sourceEnvironment,
            environment,
            binding: currentBinding,
            commandBuilder,
            run,
            budget,
            diagnosticsRoot: probeDiagnosticsRoot,
            runId: runId ?? "UNBOUND-PROBE-RUN",
            workPackageId: workPackageId ?? "UNBOUND-PROBE-WORK-PACKAGE",
            timeoutMs: Number.isFinite(timeoutMs)
              ? Math.max(1, Math.min(timeoutMs, budget.worker_timeout_seconds * 1_000))
              : budget.worker_timeout_seconds * 1_000,
          });
        } catch (cause) {
          if (cause.code?.startsWith?.("RUNNER_")) throw cause;
          throw adapterError(
            "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
            "Codex effective sandbox probe could not be verified",
            { cause: cause.code ?? cause.name },
          );
        }
        currentBinding = await fingerprint();
      }
      assertCodexProbeBinding(effectiveSandboxEvidence, currentBinding);
    }
    return {
      executable: executablePath,
      sandbox,
      approval: approvalMode,
      isolation: evidence,
      containment_status: fullyVerified ? "VERIFIED" : "PARTIALLY_VERIFIED",
      parser_profile: "codex-jsonl@0.146.0",
      effective_sandbox: requiresEffectiveSandboxProbe
        ? effectiveSandboxEvidence.effective_sandbox
        : null,
      effective_sandbox_probe: requiresEffectiveSandboxProbe
        ? {
            binding_sha256: effectiveSandboxEvidence.binding_sha256,
            result_path: effectiveSandboxEvidence.result_path ?? null,
            probe_root: effectiveSandboxEvidence.artifact_path ?? null,
            result_hash: effectiveSandboxEvidence.result_hash ?? null,
            event_inventory_hash:
              effectiveSandboxEvidence.event_inventory_hash ?? null,
            verification_error_code:
              effectiveSandboxEvidence.verification_error_code ?? null,
            usage: effectiveSandboxEvidence.usage ?? null,
          }
        : null,
      cost_authority: {
        authentication_mode: costAuthority.authentication_mode,
        monetary_cost_policy: costAuthority.monetary_cost_policy,
        publication_mode: costAuthority.publication_mode,
        exact_allowed_path: costAuthority.exact_allowed_path,
      },
    };
  };

  return {
    kind: "CODEX_CLI_0_146",

    assertAvailable,

    async run({
      cwd,
      promptPath,
      contextPath,
      logDirectory,
      timeoutMs,
      budget,
      workPackage,
    }) {
      await assertAvailable({ budget, timeoutMs });
      if (budget?.max_external_calls !== 0) {
        throw adapterError(
          "RUNNER_WORKER_BUDGET_INVALID",
          "Real Codex Worker requires max_external_calls: 0",
        );
      }
      const invocation = await validateWorkerInvocation({
        cwd,
        promptPath,
        contextPath,
        workPackage,
      });
      const command = commandBuilder({
        executable: executablePath,
        cwd: invocation.cwd,
        sandbox,
        approvalMode,
        loadUserConfig: requiresEffectiveSandboxProbe,
      });
      const filtered = filteredEnvironment;
      const valuesToRedact = secretValues(
        sourceEnvironment,
        filtered.removedSecretNames,
      );
      await assertAvailable({ budget, timeoutMs });
      let result;
      try {
        result = await run(command.executable, command.args, {
          cwd: invocation.cwd,
          env: executionEnvironment,
          timeoutMs,
          maxOutputBytes: maxLogBytes,
          stdinData: invocation.prompt,
        });
      } catch (cause) {
        if (cause.processResult) {
          const partial = cause.processResult;
          cause.workerResult = {
            code: partial.code ?? -1,
            signal: partial.signal ?? null,
            timedOut: partial.timedOut === true,
            pid: partial.pid ?? null,
            duration_ms: partial.durationMs ?? null,
            stdoutPath: null,
            stderrPath: null,
            metadataPath: null,
            stdoutTruncated: partial.stdoutTruncated === true,
            stderrTruncated: partial.stderrTruncated === true,
            usage: parseCodexJsonlOutput(redact(partial.stdout ?? "", secretValues(
              sourceEnvironment,
              filteredEnvironment.removedSecretNames,
            ))).usage,
            processTermination: partial.termination ?? null,
            partial: true,
          };
        }
        if (cause.code?.startsWith?.("RUNNER_")) throw cause;
        throw adapterError(
          "RUNNER_CODEX_UNAVAILABLE",
          "Codex Worker process could not be started",
          { cause: cause.code ?? cause.name },
        );
      }

      const stdout = redact(result.stdout, valuesToRedact);
      const stderr = redact(result.stderr, valuesToRedact);
      const stdoutPath = join(logDirectory, "worker.stdout.log");
      const stderrPath = join(logDirectory, "worker.stderr.log");
      const metadataPath = join(logDirectory, "worker-log-metadata.json");
      await writeFile(stdoutPath, stdout, { encoding: "utf8", flag: "wx" });
      await writeFile(stderrPath, stderr, { encoding: "utf8", flag: "wx" });
      const parsed = parseCodexJsonlOutput(stdout, {
        maxTotalBytes: maxLogBytes,
        maxLineBytes: Math.min(maxLogBytes, 256 * 1024),
      });
      const runtimeWriteDenialObserved =
        /read-only sandbox|rejected by user approval settings|writing is blocked/iu
          .test(`${stdout}\n${stderr}`);
      const metadata = {
        record_kind: "CODEX_WORKER_LOG_METADATA",
        pid: result.pid,
        exit_code: result.code,
        timed_out: result.timedOut,
        duration_ms: result.durationMs,
        stdout_bytes_seen: result.stdoutBytes,
        stderr_bytes_seen: result.stderrBytes,
        stdout_bytes_persisted: Buffer.byteLength(stdout),
        stderr_bytes_persisted: Buffer.byteLength(stderr),
        stdout_truncated: result.stdoutTruncated,
        stderr_truncated: result.stderrTruncated,
        removed_secret_names: filtered.removedSecretNames,
        parsed_jsonl_records: parsed.parsed_records,
        malformed_jsonl_lines: parsed.malformed_lines,
        diagnostic_preamble_lines: parsed.diagnostic_lines,
        oversized_jsonl_lines: parsed.oversized_lines,
        jsonl_event_type_counts: parsed.event_type_counts,
        unknown_jsonl_event_types: parsed.unknown_event_types,
        unknown_jsonl_item_types: parsed.unknown_item_types,
        usage_verification_reason: parsed.usage.verification_reason,
        cost_available: parsed.usage.cost_available,
        external_calls_verified: parsed.usage.external_calls_verified,
        process_termination: result.termination,
        containment_status: (
          evidence.network && evidence.filesystem && evidence.processTree
        ) ? "VERIFIED" : "PARTIALLY_VERIFIED",
        requested_sandbox: sandbox,
        preflight_effective_sandbox:
          effectiveSandboxEvidence?.effective_sandbox ?? null,
        runtime_effective_sandbox:
          runtimeWriteDenialObserved ? "read-only" : null,
        runtime_write_denial_observed: runtimeWriteDenialObserved,
        effective_sandbox_binding_sha256:
          effectiveSandboxEvidence?.binding_sha256 ?? null,
        effective_sandbox_probe_result_path:
          effectiveSandboxEvidence?.result_path ?? null,
      };
      await writeFile(metadataPath, `${JSON.stringify(metadata)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
      if (runtimeWriteDenialObserved) {
        const error = adapterError(
          "RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH",
          "Codex Worker reported effective write denial after the preflight probe",
          {
            requested_sandbox: sandbox,
            effective_sandbox: "read-only",
            environment_state: "BLOCKED_ENVIRONMENT",
          },
        );
        error.workerResult = {
          code: result.code,
          signal: result.signal,
          timedOut: result.timedOut,
          pid: result.pid,
          duration_ms: result.durationMs,
          stdoutPath,
          stderrPath,
          metadataPath,
          stdoutTruncated: result.stdoutTruncated,
          stderrTruncated: result.stderrTruncated,
          usage: parsed.usage,
          removedSecretNames: filtered.removedSecretNames,
          processTermination: result.termination,
          policyRejected: true,
        };
        throw error;
      }
      let usage;
      try {
        usage = assertCodexOutputPolicy(parsed, budget, {
          stdoutTruncated: result.stdoutTruncated,
          costAuthority,
        });
      } catch (error) {
        error.workerResult = {
          code: result.code,
          signal: result.signal,
          timedOut: result.timedOut,
          pid: result.pid,
          duration_ms: result.durationMs,
          stdoutPath,
          stderrPath,
          metadataPath,
          stdoutTruncated: result.stdoutTruncated,
          stderrTruncated: result.stderrTruncated,
          usage: parsed.usage,
          removedSecretNames: filtered.removedSecretNames,
          processTermination: result.termination,
          policyRejected: true,
        };
        throw error;
      }
      return {
        code: result.code,
        signal: result.signal,
        timedOut: result.timedOut,
        pid: result.pid,
        duration_ms: result.durationMs,
        stdoutPath,
        stderrPath,
        metadataPath,
        stdoutTruncated: result.stdoutTruncated,
        stderrTruncated: result.stderrTruncated,
        usage,
        removedSecretNames: filtered.removedSecretNames,
        processTermination: result.termination,
        effectiveSandboxEvidence,
      };
    },
  };
}
