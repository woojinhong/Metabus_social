import { tmpdir } from "node:os";
import { isAbsolute, relative, resolve } from "node:path";
import {
  parseJsonStrict,
  sha256Digest,
} from "../canonical-json.mjs";
import { digestRecord } from "../planner/digest.mjs";
import { schemas } from "../planner/schemas.mjs";
import { failRunner } from "./runner-error.mjs";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sortedUniqueStrings(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item === "")) {
    failRunner("RUNNER_INPUT_INVALID", `${field} must be a non-empty string array`, { field });
  }
  const sorted = [...value].sort();
  if (new Set(sorted).size !== sorted.length) {
    failRunner("RUNNER_INPUT_INVALID", `${field} contains duplicates`, { field });
  }
  return sorted;
}

export function computeApprovalRecordHash(record) {
  const projection = clone(record);
  delete projection.record_hash;
  return sha256Digest(projection);
}

function assertPin(actual, expected, code, field) {
  if (actual !== expected) {
    failRunner(code, `${field} does not match the approved run`, {
      field,
      expected,
      actual,
    });
  }
}

function validateBudget(budget) {
  const integerFields = [
    "wall_clock_seconds",
    "worker_timeout_seconds",
    "test_timeout_seconds",
    "max_tokens",
    "max_external_calls",
    "max_retries",
    "max_concurrent_processes",
  ];
  if (!budget || typeof budget !== "object") {
    failRunner("RUNNER_BUDGET_INVALID", "execution_budget is required");
  }
  for (const field of integerFields) {
    if (!Number.isInteger(budget[field]) || budget[field] < 0) {
      failRunner("RUNNER_BUDGET_INVALID", `Invalid execution budget ${field}`, { field });
    }
  }
  if (budget.wall_clock_seconds === 0 || budget.worker_timeout_seconds === 0) {
    failRunner("RUNNER_BUDGET_INVALID", "Execution timeouts must be positive");
  }
  if (budget.max_retries !== 0) {
    failRunner("RUNNER_BUDGET_INVALID", "The lightweight Pilot does not permit retries");
  }
  if (budget.max_concurrent_processes < 1 || budget.max_concurrent_processes > 3) {
    failRunner("RUNNER_BUDGET_INVALID", "Concurrent process budget must be between 1 and 3");
  }
  if (typeof budget.max_cost !== "number" || budget.max_cost < 0 || budget.currency !== "USD") {
    failRunner("RUNNER_BUDGET_INVALID", "Cost budget must be a non-negative USD amount");
  }
  return clone(budget);
}

function validatePublicationPolicy(policy) {
  if (
    !policy
    || ![
      "PREPARE_ONLY",
      "EXECUTE_PATCH_ONLY",
      "EXECUTE_AND_DRAFT_PR",
    ].includes(policy.mode)
    || policy.base_branch !== "master"
  ) {
    failRunner("RUNNER_PUBLICATION_POLICY_INVALID", "Invalid Runner publication policy");
  }
  if (
    policy.mode === "PREPARE_ONLY"
    && (policy.draft_only !== true || policy.allow_push !== false)
  ) {
    failRunner("RUNNER_PUBLICATION_POLICY_INVALID", "Prepare-only runs cannot allow push");
  }
  if (
    policy.mode === "EXECUTE_PATCH_ONLY"
    && (
      policy.draft_only !== false
      || policy.allow_commit !== false
      || policy.allow_push !== false
      || policy.allow_pr !== false
      || policy.allow_github !== false
      || policy.issue_number !== null
    )
  ) {
    failRunner(
      "RUNNER_PUBLICATION_POLICY_INVALID",
      "Patch-only runs must disable commit, push, PR, and GitHub publication",
    );
  }
  if (
    policy.mode === "EXECUTE_AND_DRAFT_PR"
    && (
      policy.draft_only !== true
      || policy.allow_push !== true
      || !Number.isInteger(policy.issue_number)
      || policy.issue_number < 1
    )
  ) {
    failRunner("RUNNER_PUBLICATION_POLICY_INVALID", "Execution publication must explicitly allow push");
  }
  return clone(policy);
}

function exactWorkPackagePin(value) {
  if (!value || typeof value !== "object") return null;
  const expectedKeys = [
    "proposed_branch",
    "work_package_id",
    "work_package_plan_digest",
    "work_package_revision",
  ];
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(expectedKeys)) return null;
  return {
    work_package_id: value.work_package_id,
    work_package_revision: value.work_package_revision,
    work_package_plan_digest: value.work_package_plan_digest,
    proposed_branch: value.proposed_branch,
  };
}

function sameWorkPackagePins(approved, actual) {
  const normalizedApproved = approved.map(exactWorkPackagePin);
  if (normalizedApproved.some((value) => value === null)) return false;
  return sha256Digest(normalizedApproved) === sha256Digest(actual);
}

function belowOsTemp(candidate) {
  const path = relative(resolve(tmpdir()), resolve(candidate));
  return path !== ""
    && path !== ".."
    && !path.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    && !isAbsolute(path);
}

const PATCH_ONLY_LIMITATIONS = Object.freeze([
  "HANDLE_PINNED_JOB_OBJECT_UNVERIFIED",
  "OS_NETWORK_DENY_UNVERIFIED",
  "RACE_FREE_FILESYSTEM_SANDBOX_UNVERIFIED",
]);

function validatePatchOnlyApproval({
  approval,
  publicationPolicy,
  selectedWorkPackages,
  approvedPaths,
  concurrency,
}) {
  if (publicationPolicy.mode !== "EXECUTE_PATCH_ONLY") return null;
  const prohibitedPaths = sortedUniqueStrings(
    approval.prohibited_paths,
    "approval.prohibited_paths",
  );
  const selectedProhibitedPaths = [...new Set(
    selectedWorkPackages.flatMap(({ path_policy }) =>
      path_policy.forbidden_paths.map(({ path }) => path)),
  )].sort();
  if (sha256Digest(prohibitedPaths) !== sha256Digest(selectedProhibitedPaths)) {
    failRunner(
      "RUNNER_PROHIBITED_SCOPE_MISMATCH",
      "Owner approval must pin the exact selected Work Package prohibited paths",
      { prohibitedPaths, selectedProhibitedPaths },
    );
  }
  if (
    concurrency !== 1
    || selectedWorkPackages.length !== 1
    || approval.execution_budget?.max_external_calls !== 0
    || approval.execution_budget?.max_retries !== 0
  ) {
    failRunner(
      "RUNNER_PATCH_ONLY_LIMIT_INVALID",
      "Patch-only runs require one Package, concurrency one, zero retries, and zero external calls",
    );
  }
  for (const field of [
    "commit_allowed",
    "push_allowed",
    "pr_allowed",
    "merge_allowed",
    "ready_transition_allowed",
    "issue_close_allowed",
  ]) {
    if (approval[field] !== false) {
      failRunner(
        "RUNNER_PATCH_ONLY_PERMISSION_INVALID",
        `Patch-only approval must pin ${field}: false`,
        { field },
      );
    }
  }
  if (
    approval.publication_mode !== "EXECUTE_PATCH_ONLY"
    || typeof approval.disposable_clone_root !== "string"
    || !isAbsolute(approval.disposable_clone_root)
    || !belowOsTemp(approval.disposable_clone_root)
  ) {
    failRunner(
      "RUNNER_DISPOSABLE_CLONE_INVALID",
      "Patch-only approval must pin an absolute disposable clone below OS temp",
    );
  }
  const containment = approval.containment_acknowledgement;
  const limitations = sortedUniqueStrings(
    containment?.limitations,
    "approval.containment_acknowledgement.limitations",
  );
  if (
    containment?.status !== "PARTIALLY_VERIFIED"
    || containment?.residual_risk_accepted !== true
    || sha256Digest(limitations) !== sha256Digest([...PATCH_ONLY_LIMITATIONS])
  ) {
    failRunner(
      "RUNNER_CONTAINMENT_APPROVAL_MISSING",
      "Owner must explicitly accept the exact residual patch-only containment risks",
    );
  }
  if (
    approvedPaths.length !== 1
    || !approvedPaths[0].startsWith("docs/")
    || !/^[A-Za-z0-9._/-]+\.md$/u.test(approvedPaths[0])
  ) {
    failRunner(
      "RUNNER_PATCH_ONLY_SCOPE_INVALID",
      "Patch-only Pilot is limited to one exact docs/** path",
    );
  }
  const exactPath = approvedPaths[0];
  const [workPackage] = selectedWorkPackages;
  const allowedRules = workPackage.path_policy?.allowed_paths ?? [];
  const requiredRules = workPackage.path_policy?.required_paths ?? [];
  const expectedChanges = workPackage.expected_changes ?? [];
  if (
    allowedRules.length !== 1
    || allowedRules[0].match !== "EXACT"
    || allowedRules[0].path !== exactPath
    || requiredRules.length !== 1
    || requiredRules[0].match !== "EXACT"
    || requiredRules[0].path !== exactPath
    || expectedChanges.length !== 1
    || expectedChanges[0].path !== exactPath
    || expectedChanges[0].operation !== "MODIFY"
  ) {
    failRunner(
      "RUNNER_PATCH_ONLY_SCOPE_INVALID",
      "Patch-only requires identical exact allowed, required, and expected-change paths",
    );
  }
  return {
    status: containment.status,
    limitations,
    disposableCloneRoot: resolve(approval.disposable_clone_root),
    exactAllowedPath: exactPath,
  };
}

function proposedBranch(dryRun, workPackage) {
  const draft = dryRun.issue_drafts.find(
    ({ work_package_id }) => work_package_id === workPackage.work_package_id,
  );
  const match = draft?.body?.match(/## Proposed branch\r?\n\r?\n([^\r\n]+)/u);
  const branch = match?.[1] ?? "";
  const segments = branch.split("/");
  if (
    !/^harness\/[a-z0-9._/-]+$/u.test(branch)
    || branch === "harness/master"
    || branch.includes("..")
    || branch.includes("//")
    || branch.endsWith("/")
    || branch.endsWith(".")
    || segments.some((segment) =>
      segment === "" || segment === "." || segment === ".." || segment.endsWith(".lock"))
  ) {
    failRunner("RUNNER_PROPOSED_BRANCH_INVALID", "Planner output has no safe proposed branch", {
      work_package_id: workPackage.work_package_id,
    });
  }
  return branch;
}

export function validateRunInput({
  dryRun,
  approval,
  selectedWorkPackageIds = approval?.selected_work_package_ids,
  approvalRecordHash,
  repositorySha,
  maxConcurrency,
  worktreeRoot,
}) {
  if (!dryRun || dryRun.record_kind !== "READ_ONLY_DRY_RUN") {
    failRunner("RUNNER_DRY_RUN_INVALID", "Only READ_ONLY_DRY_RUN records are accepted");
  }
  let computedDigest;
  try {
    computedDigest = digestRecord(dryRun, schemas["dry-run"]);
  } catch (error) {
    failRunner("RUNNER_DRY_RUN_INVALID", error.message, { cause: error.code ?? error.name });
  }
  assertPin(dryRun.result_digest, computedDigest, "RUNNER_DIGEST_MISMATCH", "result_digest");
  if (!["DRY_RUN_VALID", "DRY_RUN_VALID_WITH_WARNINGS"].includes(dryRun.result)) {
    failRunner("RUNNER_DRY_RUN_NOT_EXECUTABLE", `Dry-run result ${dryRun.result} is not executable`);
  }

  if (
    !approval
    || approval.record_kind !== "OWNER_RUN_APPROVAL"
    || approval.approved_by !== "owner"
    || typeof approval.approved_at !== "string"
    || Number.isNaN(Date.parse(approval.approved_at))
    || typeof approval.approval_record_id !== "string"
  ) {
    failRunner("RUNNER_APPROVAL_MISSING", "A pinned Owner run approval is required");
  }
  assertPin(
    approval.record_hash,
    computeApprovalRecordHash(approval),
    "RUNNER_APPROVAL_HASH_MISMATCH",
    "approval.record_hash",
  );
  if (typeof approvalRecordHash !== "string") {
    failRunner(
      "RUNNER_APPROVAL_HASH_REQUIRED",
      "An out-of-band Owner-pinned approval record hash is required",
    );
  }
  assertPin(
    approvalRecordHash,
    approval.record_hash,
    "RUNNER_APPROVAL_HASH_MISMATCH",
    "approvalRecordHash",
  );
  assertPin(approval.dry_run_id, dryRun.dry_run_id, "RUNNER_APPROVAL_PIN_MISMATCH", "dry_run_id");
  assertPin(
    approval.result_digest,
    dryRun.result_digest,
    "RUNNER_APPROVAL_PIN_MISMATCH",
    "result_digest",
  );
  const sourceSha = dryRun.input_snapshot?.repository?.repository_sha;
  assertPin(
    approval.source_repository_sha,
    sourceSha,
    "RUNNER_APPROVAL_PIN_MISMATCH",
    "source_repository_sha",
  );
  assertPin(repositorySha, sourceSha, "RUNNER_SOURCE_STALE", "repositorySha");

  const requestedIds = sortedUniqueStrings(selectedWorkPackageIds, "selected_work_package_ids");
  const approvedIds = sortedUniqueStrings(
    approval.selected_work_package_ids,
    "approval.selected_work_package_ids",
  );
  if (
    requestedIds.length < 1
    || requestedIds.length > 3
    || JSON.stringify(requestedIds) !== JSON.stringify(approvedIds)
  ) {
    failRunner(
      "RUNNER_SELECTED_IDS_MISMATCH",
      "Requested Work Package IDs must exactly match the 1-3 Owner-approved IDs",
      { requestedIds, approvedIds },
    );
  }
  const byId = new Map(dryRun.work_packages.map((item) => [item.work_package_id, item]));
  const selectedWorkPackages = requestedIds.map((id) => {
    const workPackage = byId.get(id);
    if (!workPackage) {
      failRunner("RUNNER_WORK_PACKAGE_MISSING", `Selected Work Package is not in the dry-run: ${id}`);
    }
    if (workPackage.authority_status.package_status !== "READY") {
      failRunner(
        "RUNNER_WORK_PACKAGE_NOT_READY",
        `Selected Work Package is ${workPackage.authority_status.package_status}: ${id}`,
      );
    }
    if (workPackage.source_snapshot.repository_sha !== sourceSha) {
      failRunner("RUNNER_SOURCE_STALE", `Work Package source SHA is stale: ${id}`);
    }
    return { ...workPackage, proposed_branch: proposedBranch(dryRun, workPackage) };
  });
  if (
    new Set(selectedWorkPackages.map(({ proposed_branch }) => proposed_branch)).size
    !== selectedWorkPackages.length
  ) {
    failRunner(
      "BLOCKED_CONFLICT",
      "Selected Work Packages must have distinct Owner-pinned proposed branches",
    );
  }
  const approvedPackages = [...(approval.selected_work_packages ?? [])]
    .sort((left, right) => left.work_package_id.localeCompare(right.work_package_id));
  const actualPins = selectedWorkPackages.map((item) => ({
    work_package_id: item.work_package_id,
    work_package_revision: item.work_package_revision,
    work_package_plan_digest: item.work_package_plan_digest,
    proposed_branch: item.proposed_branch,
  }));
  if (!sameWorkPackagePins(approvedPackages, actualPins)) {
    failRunner("RUNNER_WORK_PACKAGE_PIN_MISMATCH", "Owner approval does not pin the exact Package revisions/digests");
  }

  if (!Object.hasOwn(approval, "max_concurrency")) {
    failRunner(
      "RUNNER_CONCURRENCY_INVALID",
      "Owner approval must explicitly pin max_concurrency",
    );
  }
  const approvedConcurrency = approval.max_concurrency;
  const concurrency = maxConcurrency ?? approvedConcurrency;
  if (
    !Number.isInteger(concurrency)
    || concurrency < 1
    || concurrency > 3
    || concurrency !== approvedConcurrency
  ) {
    failRunner("RUNNER_CONCURRENCY_INVALID", "Concurrency must equal the Owner approval and be between 1 and 3");
  }
  if (concurrency > approval.execution_budget?.max_concurrent_processes) {
    failRunner(
      "RUNNER_BUDGET_INVALID",
      "Concurrency exceeds the approved concurrent process budget",
    );
  }
  const approvedPaths = sortedUniqueStrings(
    approval.allowed_paths,
    "approval.allowed_paths",
  );
  const selectedPaths = [...new Set(
    selectedWorkPackages.flatMap(({ path_policy }) =>
      path_policy.allowed_paths.map(({ path }) => path)),
  )].sort();
  if (JSON.stringify(approvedPaths) !== JSON.stringify(selectedPaths)) {
    failRunner(
      "RUNNER_ALLOWED_SCOPE_MISMATCH",
      "Owner approval must pin the exact selected Work Package allowed paths",
      { approvedPaths, selectedPaths },
    );
  }
  const warningIds = dryRun.warnings.map(({ error_id }) => error_id).sort();
  const reviewedWarningIds = sortedUniqueStrings(
    approval.reviewed_warning_ids ?? [],
    "approval.reviewed_warning_ids",
  );
  if (JSON.stringify(warningIds) !== JSON.stringify(reviewedWarningIds)) {
    failRunner(
      "RUNNER_WARNING_REVIEW_MISMATCH",
      "Owner approval must pin the exact reviewed Planner warning IDs",
      { warningIds, reviewedWarningIds },
    );
  }
  const approvedRoot = approval.worktree_root;
  const requestedRoot = worktreeRoot ?? approvedRoot;
  if (
    typeof requestedRoot !== "string"
    || !isAbsolute(requestedRoot)
    || resolve(requestedRoot) !== resolve(approvedRoot)
  ) {
    failRunner("RUNNER_WORKTREE_ROOT_INVALID", "Worktree root must be absolute and exactly Owner-approved");
  }
  if (typeof approval.run_id !== "string" || !/^[A-Za-z0-9._-]{4,128}$/u.test(approval.run_id)) {
    failRunner("RUNNER_RUN_ID_INVALID", "run_id must be a stable safe identifier");
  }

  const publicationPolicy = validatePublicationPolicy(approval.publication_policy);
  const patchOnly = validatePatchOnlyApproval({
    approval,
    publicationPolicy,
    selectedWorkPackages,
    approvedPaths,
    concurrency,
  });

  return {
    dryRun,
    approval,
    selectedWorkPackages,
    selectedWorkPackageIds: requestedIds,
    sourceSha,
    maxConcurrency: concurrency,
    runId: approval.run_id,
    executionBudget: validateBudget(approval.execution_budget),
    worktreeRoot: resolve(requestedRoot),
    publicationPolicy,
    patchOnly,
    approvalRecordHash: approval.record_hash,
  };
}

export function loadRunInput({
  dryRunText,
  approvalText,
  ...options
}) {
  let dryRun;
  let approval;
  try {
    dryRun = typeof dryRunText === "string" ? parseJsonStrict(dryRunText) : dryRunText;
    approval = typeof approvalText === "string" ? parseJsonStrict(approvalText) : approvalText;
  } catch (error) {
    failRunner("RUNNER_INPUT_INVALID", error.message, { cause: error.code ?? error.name });
  }
  return validateRunInput({ dryRun, approval, ...options });
}
