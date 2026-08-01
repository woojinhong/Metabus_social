export function validatePatchOnlyLauncherText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    const error = new TypeError("External-host launcher text is required");
    error.code = "RUNNER_EXTERNAL_LAUNCHER_INVALID";
    throw error;
  }
  const workspaceWrite = /['"]--worker-sandbox['"]\s*,\s*['"]workspace-write['"]/u;
  const readOnly = /['"]--worker-sandbox['"]\s*,\s*['"]read-only['"]/u;
  if (readOnly.test(text) || !workspaceWrite.test(text)) {
    const error = new Error(
      "EXECUTE_PATCH_ONLY external-host launchers must pin --worker-sandbox workspace-write",
    );
    error.code = "RUNNER_WORKER_SANDBOX_MODE_INVALID";
    throw error;
  }
  return { sandbox: "workspace-write" };
}
