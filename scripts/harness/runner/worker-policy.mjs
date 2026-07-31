import {
  lstat,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import {
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { parseJsonStrict } from "../canonical-json.mjs";

const ALLOWED_ENVIRONMENT = new Set([
  "PATH",
  "PATHEXT",
  "SYSTEMROOT",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "TERM",
]);

const SECRET_ENVIRONMENT =
  /(?:TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|COOKIE|AUTH|(?:^|_)KEY(?:$|_)|^GH_|^GITHUB_|^AWS_|^NCP_|OPENAI_API_KEY|DATABASE_URL)/iu;

export const CODEX_SANDBOX_VALUES = Object.freeze([
  "read-only",
  "workspace-write",
]);
export const CODEX_APPROVAL_VALUES = Object.freeze(["never"]);

function policyError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function normalizedAbsolute(value, field) {
  if (typeof value !== "string" || !isAbsolute(value)) {
    policyError("RUNNER_WORKER_POLICY_INVALID", `${field} must be an absolute path`, {
      field,
    });
  }
  return resolve(value);
}

function within(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (
    path !== ".."
    && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    && !isAbsolute(path)
  );
}

export function filterWorkerEnvironment(source = process.env) {
  const environment = {};
  const removedSecretNames = [];
  const includedNames = new Set();
  for (const [name, value] of Object.entries(source)) {
    if (typeof value !== "string") continue;
    const canonicalName = name.toUpperCase();
    if (SECRET_ENVIRONMENT.test(canonicalName)) {
      removedSecretNames.push(name);
      continue;
    }
    if (ALLOWED_ENVIRONMENT.has(canonicalName) && !includedNames.has(canonicalName)) {
      environment[name] = value;
      includedNames.add(canonicalName);
    }
  }
  return {
    environment,
    removedSecretNames: [...new Set(removedSecretNames)].sort((left, right) =>
      left.localeCompare(right)),
  };
}

async function readBoundedUtf8(path, {
  field,
  maxBytes,
}) {
  const metadata = await lstat(path).catch((cause) => {
    policyError("RUNNER_WORKER_INPUT_INVALID", `${field} is unavailable`, {
      field,
      cause: cause.code ?? cause.name,
    });
  });
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > maxBytes) {
    policyError("RUNNER_WORKER_INPUT_INVALID", `${field} must be a bounded regular file`, {
      field,
      size: metadata.size,
      max_bytes: maxBytes,
    });
  }
  const bytes = await readFile(path);
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (cause) {
    policyError("RUNNER_WORKER_INPUT_INVALID", `${field} is not valid UTF-8`, {
      field,
      cause: cause.name,
    });
  }
  if (text.includes("\0") || text.trim() === "") {
    policyError("RUNNER_WORKER_INPUT_INVALID", `${field} is empty or contains NUL`, {
      field,
    });
  }
  return text;
}

async function rejectReparseEntries(root, candidate) {
  const rootReal = await realpath(root);
  let current = root;
  const rel = relative(root, candidate);
  for (const segment of rel.split(/[\\/]/u).filter(Boolean)) {
    current = join(current, segment);
    const metadata = await lstat(current).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (metadata === null) break;
    if (metadata.isSymbolicLink()) {
      policyError("RUNNER_WORKER_PATH_ESCAPE", "Allowed path traverses a reparse point", {
        path: current,
      });
    }
    const currentReal = await realpath(current);
    if (!within(rootReal, currentReal)) {
      policyError("RUNNER_WORKER_PATH_ESCAPE", "Allowed path resolves outside the worktree", {
        path: current,
        resolved_path: currentReal,
      });
    }
  }
}

async function scanExistingTree(root, current) {
  const entries = await readdir(current, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return [];
    throw error;
  });
  for (const entry of entries) {
    const candidate = join(current, entry.name);
    const metadata = await lstat(candidate);
    if (metadata.isSymbolicLink()) {
      policyError("RUNNER_WORKER_PATH_ESCAPE", "Allowed tree contains a reparse point", {
        path: candidate,
      });
    }
    if (metadata.isDirectory()) await scanExistingTree(root, candidate);
  }
}

export async function validateWorkerInvocation({
  cwd,
  promptPath,
  contextPath,
  workPackage,
}) {
  const requestedCwd = normalizedAbsolute(cwd, "cwd");
  const cwdMetadata = await lstat(requestedCwd).catch((cause) => {
    policyError("RUNNER_WORKER_PATH_ESCAPE", "Worker cwd is unavailable", {
      cause: cause.code ?? cause.name,
    });
  });
  if (!cwdMetadata.isDirectory() || cwdMetadata.isSymbolicLink()) {
    policyError("RUNNER_WORKER_PATH_ESCAPE", "Worker cwd must be a non-reparse directory");
  }
  const cwdReal = await realpath(requestedCwd);
  const prompt = await readBoundedUtf8(normalizedAbsolute(promptPath, "promptPath"), {
    field: "promptPath",
    maxBytes: 256 * 1024,
  });
  const contextText = await readBoundedUtf8(normalizedAbsolute(contextPath, "contextPath"), {
    field: "contextPath",
    maxBytes: 1024 * 1024,
  });
  let context;
  try {
    context = parseJsonStrict(contextText);
  } catch (cause) {
    policyError("RUNNER_WORKER_CONTEXT_INVALID", "Worker context is not strict JSON", {
      cause: cause.code ?? cause.name,
    });
  }
  if (
    context.record_kind !== "BOUNDED_WORKER_CONTEXT"
    || resolve(context.worktree_path ?? "") !== requestedCwd
    || context.work_package_id !== workPackage?.work_package_id
  ) {
    policyError(
      "RUNNER_WORKER_CONTEXT_INVALID",
      "Worker context does not pin the requested worktree and Work Package",
    );
  }
  if (!prompt.includes(contextPath)) {
    policyError("RUNNER_WORKER_PROMPT_INVALID", "Worker prompt does not reference its context pack");
  }
  for (const rule of workPackage.path_policy?.allowed_paths ?? []) {
    const allowed = resolve(cwdReal, ...String(rule.path).split("/"));
    if (!within(cwdReal, allowed)) {
      policyError("RUNNER_WORKER_PATH_ESCAPE", "Allowed path escaped the worktree", {
        path: rule.path,
      });
    }
    await rejectReparseEntries(cwdReal, allowed);
    await scanExistingTree(cwdReal, allowed);
  }
  return {
    cwd: cwdReal,
    prompt,
    context,
  };
}

export function validateApprovedWorkerPolicy(approval, {
  executable,
  sandbox,
  approvalMode,
}) {
  if (
    approval?.record_kind !== "OWNER_RUN_APPROVAL"
    || approval.approved_by !== "owner"
    || typeof approval.approved_at !== "string"
    || Number.isNaN(Date.parse(approval.approved_at))
  ) {
    policyError("RUNNER_APPROVAL_MISSING", "Approved Owner run record is required");
  }
  const policy = approval?.worker_policy;
  if (!policy || typeof policy !== "object") {
    policyError(
      "RUNNER_WORKER_POLICY_MISSING",
      "Owner approval must pin the real Codex Worker policy",
    );
  }
  const expected = {
    adapter: "CODEX_CLI_0_146",
    executable: normalizedAbsolute(executable, "executable"),
    sandbox,
    approval: approvalMode,
    network_policy: "DENY_REQUIRED",
    external_calls: 0,
    filesystem_policy: "WORKTREE_AND_RUNNER_PATH_VALIDATION",
    process_containment: "WINDOWS_JOB_OBJECT_REQUIRED",
  };
  const actual = {
    adapter: policy.adapter,
    executable: normalizedAbsolute(policy.executable, "worker_policy.executable"),
    sandbox: policy.sandbox,
    approval: policy.approval,
    network_policy: policy.network_policy,
    external_calls: policy.external_calls,
    filesystem_policy: policy.filesystem_policy,
    process_containment: policy.process_containment,
  };
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    policyError(
      "RUNNER_WORKER_POLICY_MISMATCH",
      "CLI Worker configuration does not match the Owner-approved policy",
      { expected, actual },
    );
  }
  return actual;
}

export function validateCodexPolicyValues({ sandbox, approvalMode }) {
  if (!CODEX_SANDBOX_VALUES.includes(sandbox)) {
    policyError("RUNNER_WORKER_POLICY_INVALID", "Unsupported Codex sandbox policy", {
      sandbox,
    });
  }
  if (!CODEX_APPROVAL_VALUES.includes(approvalMode)) {
    policyError("RUNNER_WORKER_POLICY_INVALID", "Unsupported Codex approval policy", {
      approval: approvalMode,
    });
  }
  return { sandbox, approvalMode };
}
