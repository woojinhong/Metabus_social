import { createHash } from "node:crypto";

function mcpPolicyError(message, details = {}) {
  const error = new Error(message);
  error.code = "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED";
  error.details = details;
  return error;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function parseCodexMcpServerPolicy(stdout) {
  let records;
  try {
    records = JSON.parse(String(stdout));
  } catch {
    throw mcpPolicyError("Codex MCP inventory was not valid JSON");
  }
  if (!Array.isArray(records)) {
    throw mcpPolicyError("Codex MCP inventory must be an array");
  }
  const servers = records.map((record) => {
    const name = record?.name;
    if (
      typeof name !== "string"
      || name.length < 1
      || name.length > 128
      || /[\u0000-\u001f\u007f]/u.test(name)
      || typeof record.enabled !== "boolean"
    ) {
      throw mcpPolicyError("Codex MCP inventory contained an invalid server record");
    }
    return { name, enabled: record.enabled };
  }).sort((left, right) => left.name.localeCompare(right.name));
  if (new Set(servers.map(({ name }) => name)).size !== servers.length) {
    throw mcpPolicyError("Codex MCP inventory contained duplicate server names");
  }
  return Object.freeze({
    serverNames: servers.map(({ name }) => name),
    fingerprint: Object.freeze({
      server_count: servers.length,
      enabled_server_count: servers.filter(({ enabled }) => enabled).length,
      server_identities: servers.map(({ name, enabled }) => ({
        name_sha256: sha256(name),
        enabled,
      })),
      all_forced_disabled_for_probe: true,
      raw_inventory_recorded: false,
    }),
  });
}

export async function discoverCodexMcpServerPolicy({
  executable,
  environment,
  run,
}) {
  const result = await run(executable, ["mcp", "list", "--json"], {
    env: environment,
    timeoutMs: 15_000,
    maxOutputBytes: 1024 * 1024,
  }).catch((cause) => {
    throw mcpPolicyError("Codex MCP inventory process could not start", {
      cause: cause?.code ?? cause?.name ?? "UNKNOWN",
    });
  });
  if (
    result?.code !== 0
    || result?.timedOut === true
    || result?.stdoutTruncated === true
    || result?.stderrTruncated === true
  ) {
    throw mcpPolicyError("Codex MCP inventory could not be verified", {
      exit_code: result?.code ?? null,
      timed_out: result?.timedOut === true,
      stdout_truncated: result?.stdoutTruncated === true,
      stderr_truncated: result?.stderrTruncated === true,
    });
  }
  return parseCodexMcpServerPolicy(result.stdout);
}
