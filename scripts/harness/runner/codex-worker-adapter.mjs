import { access, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { buildCodexExecCommand } from "./codex-command-builder.mjs";
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
  allowPartialContainment = false,
  maxLogBytes = 1024 * 1024,
  run = runProcess,
  versionProbe = runProcess,
  costAuthority = null,
  commandBuilder = buildCodexExecCommand,
} = {}) {
  if (typeof executable !== "string" || !isAbsolute(executable)) {
    throw adapterError(
      "RUNNER_CODEX_EXECUTABLE_INVALID",
      "Real Codex Worker requires an explicit absolute executable path",
    );
  }
  validateCodexPolicyValues({ sandbox, approvalMode });
  if (!Number.isInteger(maxLogBytes) || maxLogBytes < 1024 || maxLogBytes > 4 * 1024 * 1024) {
    throw adapterError("RUNNER_WORKER_POLICY_INVALID", "Invalid Worker log byte limit");
  }
  const executablePath = resolve(executable);
  const evidence = {
    network: isolationEvidence.network === true,
    filesystem: isolationEvidence.filesystem === true,
    processTree: isolationEvidence.processTree === true,
  };

  const assertAvailable = async () => {
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
    const versionResult = await versionProbe(executablePath, ["--version"], {
      env: filterWorkerEnvironment(sourceEnvironment).environment,
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
    return {
      executable: executablePath,
      sandbox,
      approval: approvalMode,
      isolation: evidence,
      containment_status: fullyVerified ? "VERIFIED" : "PARTIALLY_VERIFIED",
      parser_profile: "codex-jsonl@0.146.0",
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
      await assertAvailable();
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
      });
      const filtered = filterWorkerEnvironment(sourceEnvironment);
      const valuesToRedact = secretValues(
        sourceEnvironment,
        filtered.removedSecretNames,
      );
      let result;
      try {
        result = await run(command.executable, command.args, {
          cwd: invocation.cwd,
          env: filtered.environment,
          timeoutMs,
          maxOutputBytes: maxLogBytes,
          stdinData: invocation.prompt,
        });
      } catch (cause) {
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
      };
      await writeFile(metadataPath, `${JSON.stringify(metadata)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
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
      };
    },
  };
}
