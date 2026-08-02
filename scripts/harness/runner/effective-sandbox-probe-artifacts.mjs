import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  open,
  rename,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { serializeJcs } from "../canonical-json.mjs";

const FILE_NAMES = Object.freeze({
  result: "effective-sandbox-probe.json",
  usage: "probe-usage.json",
  inventory: "event-inventory.json",
  stdout: "probe-stdout.jsonl",
  stderr: "probe-stderr.log",
  invocation: "sanitized-invocation.json",
  binding: "binding.json",
  filesystem: "filesystem-result.json",
  summary: "final-summary.md",
});

function artifactError(message, cause, stagingDirectory = null) {
  const error = new Error(message);
  error.code = "RUNNER_PROBE_ARTIFACT_WRITE_FAILED";
  error.details = {
    cause: cause?.code ?? cause?.name ?? "UNKNOWN",
    staging_directory: stagingDirectory,
  };
  return error;
}

function fileSha256(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

async function durableWrite(path, content, openFile) {
  const handle = await openFile(path, "wx");
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function jsonBytes(value) {
  return `${serializeJcs(value)}\n`;
}

export function createEffectiveSandboxProbeArtifactWriter({
  makeDirectory = mkdir,
  makeTempDirectory = mkdtemp,
  openFile = open,
  renamePath = rename,
} = {}) {
  return {
    async begin({ diagnosticsRoot }) {
      const root = resolve(diagnosticsRoot);
      let stagingDirectory = null;
      try {
        await makeDirectory(root, { recursive: true });
        const finalDirectory = join(root, "effective-sandbox-probe");
        stagingDirectory = await makeTempDirectory(
          join(root, ".effective-sandbox-probe-staging-"),
        );
        const stagingPaths = Object.fromEntries(
          Object.entries(FILE_NAMES).map(([key, name]) => [key, join(stagingDirectory, name)]),
        );
        const finalPaths = Object.fromEntries(
          Object.entries(FILE_NAMES).map(([key, name]) => [key, join(finalDirectory, name)]),
        );
        let rawWritten = false;
        return {
          finalDirectory,
          finalPaths,
          stagingDirectory,
          async writeRaw({ stdout, stderr }) {
            try {
              await durableWrite(stagingPaths.stdout, stdout, openFile);
              await durableWrite(stagingPaths.stderr, stderr, openFile);
              rawWritten = true;
            } catch (cause) {
              throw artifactError(
                "Effective sandbox probe raw evidence could not be persisted",
                cause,
                stagingDirectory,
              );
            }
          },
          async commit({
            result,
            usage,
            eventInventory,
            invocation,
            binding,
            filesystemResult,
          }) {
            if (!rawWritten) {
              throw artifactError(
                "Effective sandbox probe raw evidence must be persisted first",
                new Error("RAW_EVIDENCE_MISSING"),
                stagingDirectory,
              );
            }
            const resultRecord = {
              ...result,
              artifact_paths: { ...finalPaths },
            };
            const summary = [
              "# Effective Sandbox Probe",
              "",
              `- Run: \`${resultRecord.run_id}\``,
              `- Work Package: \`${resultRecord.work_package_id}\``,
              `- Requested/effective sandbox: \`${resultRecord.requested_sandbox}\` / \`${resultRecord.effective_sandbox ?? "unverified"}\``,
              `- Verified: ${resultRecord.verified}`,
              `- Verification error: \`${resultRecord.verification_error_code ?? "none"}\``,
              `- Usage verified: ${resultRecord.usage_verified}`,
              `- Tokens/external/process calls: ${resultRecord.total_tokens ?? "unverified"} / ${resultRecord.external_calls ?? "unverified"} / ${resultRecord.process_calls ?? "unverified"}`,
              "- Captured stdout/stderr were secret-redacted before durable storage.",
              "- Inventory records only event type, item type, ID, status, and counts.",
              "",
            ].join("\n");
            const records = {
              result: jsonBytes(resultRecord),
              usage: jsonBytes(usage),
              inventory: jsonBytes(eventInventory),
              invocation: jsonBytes(invocation),
              binding: jsonBytes(binding),
              filesystem: jsonBytes(filesystemResult),
              summary: `${summary}\n`,
            };
            try {
              for (const [key, content] of Object.entries(records)) {
                await durableWrite(stagingPaths[key], content, openFile);
              }
              await renamePath(stagingDirectory, finalDirectory);
            } catch (cause) {
              if (cause.code === "RUNNER_PROBE_ARTIFACT_WRITE_FAILED") throw cause;
              throw artifactError(
                "Effective sandbox probe evidence could not be atomically finalized",
                cause,
                stagingDirectory,
              );
            }
            return {
              artifact_path: finalDirectory,
              artifact_paths: { ...finalPaths },
              result: resultRecord,
              result_hash: fileSha256(records.result),
              event_inventory_hash: fileSha256(records.inventory),
            };
          },
        };
      } catch (cause) {
        if (cause.code === "RUNNER_PROBE_ARTIFACT_WRITE_FAILED") throw cause;
        throw artifactError(
          "Effective sandbox probe staging directory could not be created",
          cause,
          stagingDirectory,
        );
      }
    },
  };
}
