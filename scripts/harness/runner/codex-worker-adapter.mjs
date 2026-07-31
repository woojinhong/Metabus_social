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
  maxLogBytes = 1024 * 1024,
  run = runProcess,
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
    if (!evidence.network || !evidence.filesystem || !evidence.processTree) {
      throw adapterError(
        "RUNNER_WORKER_SANDBOX_UNVERIFIED",
        "Real Pilot requires independently verified network, filesystem, and process-tree containment",
        { isolation: evidence },
      );
    }
    return {
      executable: executablePath,
      sandbox,
      approval: approvalMode,
      isolation: evidence,
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
      const parsed = parseCodexJsonlOutput(stdout);
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
        process_termination: result.termination,
      };
      await writeFile(metadataPath, `${JSON.stringify(metadata)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
      const usage = assertCodexOutputPolicy(parsed, budget, {
        stdoutTruncated: result.stdoutTruncated,
      });
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
