import { isAbsolute, resolve } from "node:path";
import { validateCodexPolicyValues } from "./worker-policy.mjs";

const PROBE_DISABLED_FEATURES = Object.freeze([
  "apps",
  "browser_use",
  "browser_use_external",
  "in_app_browser",
  "plugins",
  "standalone_web_search",
]);

function tomlQuotedKey(value) {
  return JSON.stringify(value);
}

export function buildCodexProbeToolPolicy(mcpServerNames = []) {
  if (!Array.isArray(mcpServerNames)) {
    const error = new Error("Probe MCP server names must be an array");
    error.code = "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED";
    throw error;
  }
  const names = [...new Set(mcpServerNames)].sort();
  if (names.some((name) => (
    typeof name !== "string"
    || name.length < 1
    || name.length > 128
    || /[\u0000-\u001f\u007f]/u.test(name)
  ))) {
    const error = new Error("Probe MCP server name is not safe for a pinned config override");
    error.code = "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED";
    throw error;
  }
  return Object.freeze({
    web_search: "disabled",
    disabled_features: [...PROBE_DISABLED_FEATURES],
    disabled_mcp_servers: names,
    exact_core_tool_allowlist_supported: false,
  });
}

export function buildCodexExecCommand({
  executable,
  cwd,
  sandbox,
  approvalMode,
  loadUserConfig = false,
}) {
  if (typeof executable !== "string" || !isAbsolute(executable)) {
    const error = new Error("Codex executable must be an explicit absolute path");
    error.code = "RUNNER_CODEX_EXECUTABLE_INVALID";
    throw error;
  }
  if (typeof cwd !== "string" || !isAbsolute(cwd)) {
    const error = new Error("Codex cwd must be an explicit absolute path");
    error.code = "RUNNER_WORKER_PATH_ESCAPE";
    throw error;
  }
  validateCodexPolicyValues({ sandbox, approvalMode });
  return {
    executable: resolve(executable),
    args: [
      "--ask-for-approval",
      approvalMode,
      "exec",
      "--sandbox",
      sandbox,
      "-c",
      "sandbox_workspace_write.network_access=false",
      "--cd",
      resolve(cwd),
      "--ephemeral",
      ...(!loadUserConfig ? ["--ignore-user-config"] : []),
      "--json",
      "-",
    ],
    promptTransport: "STDIN",
    networkBoundary: "CODEX_CONFIG_RESTRICTED_NOT_OS_VERIFIED",
  };
}

export function buildCodexProbeCommand({
  executable,
  cwd,
  sandbox,
  approvalMode,
  mcpServerNames = [],
}) {
  const base = buildCodexExecCommand({
    executable,
    cwd,
    sandbox,
    approvalMode,
    loadUserConfig: true,
  });
  const policy = buildCodexProbeToolPolicy(mcpServerNames);
  const execIndex = base.args.indexOf("exec");
  const policyArgs = [
    "--strict-config",
    "-c", 'web_search="disabled"',
    ...policy.disabled_features.flatMap((feature) => ["--disable", feature]),
    ...policy.disabled_mcp_servers.flatMap((name) => [
      "-c",
      `mcp_servers.${tomlQuotedKey(name)}.enabled=false`,
    ]),
  ];
  return {
    ...base,
    args: [
      ...base.args.slice(0, execIndex + 1),
      ...policyArgs,
      ...base.args.slice(execIndex + 1),
    ],
    probeToolPolicy: policy,
  };
}
