import fs from "node:fs/promises";
import path from "node:path";

export const ALLOWED_ROOTS = Object.freeze(["docs", "scripts/harness"]);
export const DEFAULT_EXCLUSIVE_PATHS = Object.freeze([
  "AGENTS.md",
  "build.gradle.kts",
  "settings.gradle.kts",
  ".github/workflows",
  "gradle",
  "migration",
  "migrations",
  "docs/INDEX.md",
]);

const MATCH_KINDS = new Set(["EXACT", "SUBTREE", "GLOB"]);
const NEVER_EXCEPTED_CATEGORIES = new Set([
  "DEPENDENCY",
  "MIGRATION",
  "SOURCE",
  "WORKFLOW",
]);

export class PathPolicyError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PathPolicyError";
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new PathPolicyError(code, message, details);
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function normalizePattern(value) {
  if (typeof value !== "string" || value.length === 0) {
    fail("INVALID_PATH", "Repository paths must be non-empty strings.", { path: value });
  }
  if (value.includes("\0")) {
    fail("PATH_NUL", "Repository paths must not contain NUL.", { path: value });
  }

  const normalized = value.normalize("NFC");
  if (
    normalized.startsWith("/")
    || normalized.startsWith("\\")
    || /^[A-Za-z]:/.test(normalized)
    || /^[/\\]{2}/.test(normalized)
    || normalized.includes("\\")
  ) {
    fail("PATH_ABSOLUTE", "Repository paths must be relative POSIX paths.", { path: value });
  }

  const segments = normalized.split("/");
  if (
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
    || normalized.endsWith("/")
  ) {
    fail("PATH_TRAVERSAL", "Repository paths must be canonical and must not traverse directories.", {
      path: value,
    });
  }
  return normalized;
}

export function normalizeRepositoryPath(value) {
  const normalized = normalizePattern(value);
  if (/[*?[\]{}]/u.test(normalized)) {
    fail("PATH_GLOB", "Concrete repository paths must not contain glob metacharacters.", {
      path: value,
    });
  }
  return normalized;
}

function normalizeRule(rule) {
  if (typeof rule === "string") {
    const pathValue = normalizePattern(rule);
    return {
      path: pathValue,
      match: /[*?[\]{}]/u.test(pathValue) ? "GLOB" : "EXACT",
    };
  }
  if (!rule || typeof rule !== "object") {
    fail("INVALID_PATH_RULE", "Path rules must be strings or { path, match } objects.", { rule });
  }
  const match = rule.match ?? "EXACT";
  if (!MATCH_KINDS.has(match)) {
    fail("INVALID_PATH_RULE", `Unsupported path match kind: ${String(match)}.`, { rule });
  }
  if (match === "GLOB") {
    fail(
      "PATH_GLOB_UNSUPPORTED",
      "GLOB path rules are not supported by the lightweight Pilot conflict policy.",
      { rule },
    );
  }
  const pathValue = normalizePattern(rule.path);
  if (match !== "GLOB" && /[*?[\]{}]/u.test(pathValue)) {
    fail("INVALID_PATH_RULE", `${match} path rules must not contain glob metacharacters.`, { rule });
  }
  return { path: pathValue, match };
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/gu, "\\$&");
}

function globRegex(glob) {
  let expression = "^";
  for (let index = 0; index < glob.length;) {
    if (glob[index] === "*" && glob[index + 1] === "*") {
      if (glob[index + 2] === "/") {
        expression += "(?:.*/)?";
        index += 3;
      } else {
        expression += ".*";
        index += 2;
      }
    } else if (glob[index] === "*") {
      expression += "[^/]*";
      index += 1;
    } else if (glob[index] === "?") {
      expression += "[^/]";
      index += 1;
    } else {
      expression += escapeRegex(glob[index]);
      index += 1;
    }
  }
  return new RegExp(`${expression}$`, "u");
}

export function pathMatchesRule(repositoryPath, rule) {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  const normalizedRule = normalizeRule(rule);
  if (normalizedRule.match === "EXACT") return normalizedPath === normalizedRule.path;
  if (normalizedRule.match === "SUBTREE") {
    return normalizedPath === normalizedRule.path || normalizedPath.startsWith(`${normalizedRule.path}/`);
  }
  return globRegex(normalizedRule.path).test(normalizedPath);
}

function firstWildcardIndex(value) {
  const indexes = ["*", "?", "[", "{"]
    .map((character) => value.indexOf(character))
    .filter((index) => index >= 0);
  return indexes.length === 0 ? -1 : Math.min(...indexes);
}

function staticRulePrefix(rule) {
  if (rule.match !== "GLOB") return rule.path;
  const wildcardIndex = firstWildcardIndex(rule.path);
  const prefix = wildcardIndex < 0 ? rule.path : rule.path.slice(0, wildcardIndex);
  return prefix.replace(/\/+$/u, "");
}

function allowedRootForRule(rule) {
  const prefix = staticRulePrefix(rule);
  return ALLOWED_ROOTS.find(
    (root) => (
      (rule.path === root || rule.path.startsWith(`${root}/`))
      && (prefix === root || prefix.startsWith(`${root}/`))
    ),
  );
}

function prohibitedCategory(repositoryPath) {
  const normalized = normalizePattern(repositoryPath);
  const lower = normalized.toLowerCase();
  const segments = lower.split("/");

  if (segments[0] === ".git") return "GIT_INTERNAL";
  if (segments[0] === "src") return "SOURCE";
  if (segments[0] === "schemas") return "SCHEMA";
  if (segments[0] === ".github" && segments[1] === "workflows") return "WORKFLOW";
  if (lower === "build.gradle.kts" || lower === "settings.gradle.kts") return "DEPENDENCY";
  if (segments[0] === "gradle" || segments[0].startsWith("gradlew")) return "DEPENDENCY";
  if (segments.some((segment) => segment === "migration" || segment === "migrations")) {
    return "MIGRATION";
  }
  if (
    lower === "agents.md"
    || segments.some((segment) =>
      /(?:^|[-_.])(secret|secrets|credential|credentials)(?:$|[-_.])/u.test(segment))
    || segments.some((segment) =>
      /^(?:\.env(?:\..+)?|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key|keystore))$/u.test(segment))
  ) {
    return "SENSITIVE";
  }
  return null;
}

export function isHardProhibitedPath(repositoryPath) {
  return prohibitedCategory(normalizeRepositoryPath(repositoryPath)) !== null;
}

function explicitlyTargetsProhibitedPath(rule) {
  const prefix = staticRulePrefix(rule);
  return prefix === "" ? null : prohibitedCategory(prefix);
}

function normalizedRules(rules, field) {
  if (!Array.isArray(rules)) {
    fail("INVALID_PATH_POLICY", `${field} must be an array.`, { field });
  }
  return rules.map(normalizeRule);
}

function policyFrom(value) {
  return value?.path_policy ?? value;
}

function approvalScopes(approval) {
  if (!approval || typeof approval !== "object") return [];
  const values = [
    ...(Array.isArray(approval.scope) ? approval.scope : []),
    ...(Array.isArray(approval.approved_scope) ? approval.approved_scope : []),
    ...(Array.isArray(approval.approved_paths) ? approval.approved_paths : []),
    ...(Array.isArray(approval.allowed_paths) ? approval.allowed_paths : []),
  ];
  return values.flatMap((value) => {
    if (typeof value === "string") return [value.normalize("NFC")];
    if (value && typeof value.path === "string") return [value.path.normalize("NFC")];
    return [];
  });
}

export function ownerApprovalIncludesExactPath(ownerApproval, repositoryPath) {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  return approvalScopes(ownerApproval).some((scope) => {
    try {
      return normalizeRepositoryPath(scope) === normalizedPath;
    } catch {
      return false;
    }
  });
}

function hasExactAllowedRule(policy, repositoryPath) {
  return policy.allowed_paths.some(
    (rule) => rule.match === "EXACT" && rule.path === repositoryPath,
  );
}

function normalizedPathPolicy(value, { ownerApproval = null, approvalScope = null } = {}) {
  ownerApproval ??= approvalScope;
  const input = policyFrom(value);
  if (!input || typeof input !== "object") {
    fail("INVALID_PATH_POLICY", "A Work Package path_policy is required.");
  }

  const policy = {
    allowed_paths: normalizedRules(input.allowed_paths, "allowed_paths"),
    forbidden_paths: normalizedRules(input.forbidden_paths ?? [], "forbidden_paths"),
    shared_paths: normalizedRules(input.shared_paths ?? [], "shared_paths"),
    required_paths: normalizedRules(input.required_paths ?? [], "required_paths"),
    approved_exceptions: Array.isArray(input.approved_exceptions)
      ? [...input.approved_exceptions]
      : [],
  };
  if (policy.allowed_paths.length === 0) {
    fail("EMPTY_ALLOWED_PATHS", "At least one allowed path rule is required.");
  }

  for (const rule of policy.allowed_paths) {
    const category = explicitlyTargetsProhibitedPath(rule);
    if (category) {
      fail("HARD_PROHIBITED_PATH", `Allowed path targets a hard-prohibited ${category} path: ${rule.path}.`, {
        rule,
        category,
      });
    }
    if (!allowedRootForRule(rule)) {
      fail("PATH_OUTSIDE_PILOT_ROOTS", `Allowed path is outside docs/** and scripts/harness/**: ${rule.path}.`, {
        rule,
      });
    }
  }

  for (const exception of policy.approved_exceptions) {
    const exceptionPath = typeof exception === "string" ? exception : exception?.path;
    if (typeof exceptionPath !== "string") continue;
    const category = prohibitedCategory(normalizePattern(exceptionPath));
    if (category && NEVER_EXCEPTED_CATEGORIES.has(category)) {
      fail("NON_EXCEPTABLE_PATH", `${category} paths cannot be excepted.`, {
        path: exceptionPath,
        category,
      });
    }
  }

  if (
    hasExactAllowedRule(policy, "docs/INDEX.md")
    && !ownerApprovalIncludesExactPath(ownerApproval, "docs/INDEX.md")
  ) {
    fail(
      "OWNER_SCOPE_REQUIRED",
      "docs/INDEX.md requires an explicit EXACT Work Package rule and exact Owner approval scope.",
      { path: "docs/INDEX.md" },
    );
  }
  return policy;
}

export function validatePathPolicy(value, options = {}) {
  return normalizedPathPolicy(value, options).allowed_paths;
}

function ensureChangedPathAllowed(repositoryPath, policy, ownerApproval) {
  const category = prohibitedCategory(repositoryPath);
  if (category) {
    fail("HARD_PROHIBITED_PATH", `Changed path is hard-prohibited (${category}): ${repositoryPath}.`, {
      path: repositoryPath,
      category,
    });
  }
  if (repositoryPath === "docs/INDEX.md") {
    if (
      !hasExactAllowedRule(policy, repositoryPath)
      || !ownerApprovalIncludesExactPath(ownerApproval, repositoryPath)
    ) {
      fail(
        "OWNER_SCOPE_REQUIRED",
        "docs/INDEX.md is exclusive and requires an explicit EXACT rule plus exact Owner approval scope.",
        { path: repositoryPath },
      );
    }
  }
  if (policy.forbidden_paths.some((rule) => pathMatchesRule(repositoryPath, rule))) {
    fail("FORBIDDEN_PATH", `Changed path matches a Work Package forbidden path: ${repositoryPath}.`, {
      path: repositoryPath,
    });
  }
  if (!policy.allowed_paths.some((rule) => pathMatchesRule(repositoryPath, rule))) {
    fail("PATH_NOT_ALLOWED", `Changed path is outside the Work Package allowed paths: ${repositoryPath}.`, {
      path: repositoryPath,
    });
  }
}

async function nearestExistingPath(candidate, root) {
  let current = candidate;
  while (isWithin(root, current)) {
    try {
      await fs.lstat(current);
      return current;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (current === root) break;
    current = path.dirname(current);
  }
  return root;
}

export async function resolveRepositoryPath(repositoryRoot, repositoryPath, { mustExist = false } = {}) {
  const normalizedPath = normalizeRepositoryPath(repositoryPath);
  const absoluteRoot = path.resolve(repositoryRoot);
  const absoluteCandidate = path.resolve(absoluteRoot, ...normalizedPath.split("/"));
  if (!isWithin(absoluteRoot, absoluteCandidate)) {
    fail("PATH_ESCAPE", `Path escapes the repository root: ${normalizedPath}.`, {
      path: normalizedPath,
    });
  }

  const realRoot = await fs.realpath(absoluteRoot);
  const existingPath = await nearestExistingPath(absoluteCandidate, absoluteRoot);
  const realExistingPath = await fs.realpath(existingPath);
  if (!isWithin(realRoot, realExistingPath)) {
    fail("SYMLINK_ESCAPE", `Path resolves outside the repository root: ${normalizedPath}.`, {
      path: normalizedPath,
    });
  }
  if (mustExist) {
    let realCandidate;
    try {
      realCandidate = await fs.realpath(absoluteCandidate);
    } catch (error) {
      if (error?.code === "ENOENT") {
        fail("PATH_MISSING", `Required repository path does not exist: ${normalizedPath}.`, {
          path: normalizedPath,
        });
      }
      throw error;
    }
    if (!isWithin(realRoot, realCandidate)) {
      fail("SYMLINK_ESCAPE", `Path resolves outside the repository root: ${normalizedPath}.`, {
        path: normalizedPath,
      });
    }
  }
  return { path: normalizedPath, absolutePath: absoluteCandidate, repositoryRoot: realRoot };
}

function changedPath(entry) {
  if (typeof entry === "string") return entry;
  if (entry && typeof entry.path === "string") return entry.path;
  fail("INVALID_CHANGED_PATH", "Changed-file entries must be paths or objects with a path.", {
    entry,
  });
}

function changedFileArguments(filesOrOptions, workPackageArgument, optionsArgument) {
  if (Array.isArray(filesOrOptions)) {
    return {
      changedFiles: filesOrOptions,
      workPackage: workPackageArgument,
      ...(optionsArgument ?? {}),
      positionalResult: true,
    };
  }
  return { ...filesOrOptions, positionalResult: false };
}

export async function validateChangedFiles(
  filesOrOptions,
  workPackageArgument,
  optionsArgument,
) {
  const {
    changedFiles,
    workPackage,
    pathPolicy,
    ownerApproval: providedOwnerApproval = null,
    approvalScope = null,
    repositoryRoot = process.cwd(),
    mustExist = false,
    phase = "POST",
    positionalResult,
  } = changedFileArguments(filesOrOptions, workPackageArgument, optionsArgument);
  const ownerApproval = providedOwnerApproval ?? approvalScope;
  if (!Array.isArray(changedFiles)) {
    fail("INVALID_CHANGED_PATHS", "changedFiles must be an array.");
  }
  if (typeof repositoryRoot !== "string" || repositoryRoot.length === 0) {
    fail("INVALID_REPOSITORY_ROOT", "repositoryRoot is required for containment validation.");
  }
  const policy = normalizedPathPolicy(pathPolicy ?? workPackage, { ownerApproval });
  const normalized = [];
  for (const entry of changedFiles) {
    const repositoryPath = normalizeRepositoryPath(changedPath(entry));
    ensureChangedPathAllowed(repositoryPath, policy, ownerApproval);
    await resolveRepositoryPath(repositoryRoot, repositoryPath, { mustExist });
    normalized.push(repositoryPath);
  }
  const result = {
    ok: true,
    phase,
    changedFiles: [...new Set(normalized)].sort(),
    pathPolicy: policy,
  };
  return positionalResult ? result.changedFiles : result;
}

export function validatePreChangedFiles(options) {
  return validateChangedFiles({ ...options, phase: "PRE", mustExist: options.mustExist ?? false });
}

export function validatePostChangedFiles(options) {
  return validateChangedFiles({ ...options, phase: "POST", mustExist: options.mustExist ?? false });
}

export const validatePreflightPaths = validatePreChangedFiles;
export const validatePostflightPaths = validatePostChangedFiles;

function ruleOverlap(left, right) {
  if (left.match === "EXACT") return pathMatchesRule(left.path, right);
  if (right.match === "EXACT") return pathMatchesRule(right.path, left);
  if (left.match === "SUBTREE" && right.match === "SUBTREE") {
    return (
      left.path === right.path
      || left.path.startsWith(`${right.path}/`)
      || right.path.startsWith(`${left.path}/`)
    );
  }

  const leftPrefix = staticRulePrefix(left);
  const rightPrefix = staticRulePrefix(right);
  if (leftPrefix === "" || rightPrefix === "") return true;
  return (
    leftPrefix === rightPrefix
    || leftPrefix.startsWith(`${rightPrefix}/`)
    || rightPrefix.startsWith(`${leftPrefix}/`)
    || (left.match === "GLOB" && pathMatchesRule(rightPrefix, left))
    || (right.match === "GLOB" && pathMatchesRule(leftPrefix, right))
  );
}

function packageId(workPackage, index) {
  return workPackage.work_package_id ?? workPackage.id ?? `WP[${index}]`;
}

export function findPathConflicts(
  workPackages,
  { ownerApprovals = {}, approvalScope = null } = {},
) {
  if (!Array.isArray(workPackages)) {
    fail("INVALID_WORK_PACKAGES", "workPackages must be an array.");
  }
  const packages = workPackages.map((workPackage, index) => {
    const id = packageId(workPackage, index);
    const ownerApproval = approvalScope ?? (ownerApprovals instanceof Map
      ? ownerApprovals.get(id)
      : ownerApprovals[id] ?? workPackage.owner_approval ?? null);
    return {
      id,
      policy: normalizedPathPolicy(workPackage, { ownerApproval }),
    };
  });
  const conflicts = [];

  for (let leftIndex = 0; leftIndex < packages.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < packages.length; rightIndex += 1) {
      const left = packages[leftIndex];
      const right = packages[rightIndex];
      for (const leftRule of left.policy.allowed_paths) {
        for (const rightRule of right.policy.allowed_paths) {
          if (!ruleOverlap(leftRule, rightRule)) continue;
          const exclusivePath = DEFAULT_EXCLUSIVE_PATHS
            .filter((candidate) => !/[*?[\]{}]/u.test(candidate))
            .find(
            (candidate) => pathMatchesRule(candidate, leftRule) && pathMatchesRule(candidate, rightRule),
          ) ?? null;
          conflicts.push({
            work_package_ids: [left.id, right.id],
            left_rule: leftRule,
            right_rule: rightRule,
            kind: exclusivePath ? "EXCLUSIVE_PATH" : "ALLOWED_PATH_OVERLAP",
            exclusive_path: exclusivePath,
          });
        }
      }
    }
  }

  return conflicts;
}

export function detectPathConflicts(workPackages, options) {
  const conflicts = findPathConflicts(workPackages, options);
  if (conflicts.length > 0) {
    fail("BLOCKED_CONFLICT", "Selected Work Packages have overlapping or exclusive paths.", {
      conflicts,
    });
  }
  return [];
}

export function assertNoPathConflicts(workPackages, options) {
  detectPathConflicts(workPackages, options);
  return { status: "READY", reason: null, conflicts: [] };
}

export function pathRuleCovers(rule, repositoryPath) {
  return pathMatchesRule(repositoryPath, rule);
}
