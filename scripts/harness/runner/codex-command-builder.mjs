import { isAbsolute, resolve } from "node:path";
import { validateCodexPolicyValues } from "./worker-policy.mjs";

export function buildCodexExecCommand({
  executable,
  cwd,
  sandbox,
  approvalMode,
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
      "--sandbox",
      sandbox,
      "-c",
      "sandbox_workspace_write.network_access=false",
      "exec",
      "--cd",
      resolve(cwd),
      "--ephemeral",
      "--ignore-user-config",
      "--json",
      "-",
    ],
    promptTransport: "STDIN",
    networkBoundary: "CODEX_CONFIG_RESTRICTED_NOT_OS_VERIFIED",
  };
}
