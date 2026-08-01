import { sha256Digest } from "../../../canonical-json.mjs";
import { compilePlanner } from "../../../planner/compiler.mjs";
import {
  makePlannerInput,
  REPOSITORY_SHA,
} from "../../planner/valid/fixture-factory.mjs";

export const RUN_ID = "RUN-AH-P2-01-0001";
export const APPROVED_AT = "2026-07-31T01:00:00Z";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeDryRun(specs = [{}], {
  repositorySha = REPOSITORY_SHA,
  sourcePathOperation = null,
} = {}) {
  const input = makePlannerInput(specs, { repositorySha });
  const createTargets = new Set(
    specs.filter(({ targetExistsAtSource }) => targetExistsAtSource === false)
      .map(({ targetPath }, index) => targetPath ?? `docs/test/requirement-${index + 1}.md`),
  );
  return compilePlanner(JSON.stringify(input), repositorySha, {
    sourcePathOperation: sourcePathOperation
      ?? (({ path }) => createTargets.has(path) ? "CREATE" : "MODIFY"),
  });
}

export function makeOwnerApproval(dryRun, overrides = {}) {
  const selected = overrides.selected_work_package_ids
    ?? dryRun.work_packages
      .filter(({ authority_status }) => authority_status.package_status === "READY")
      .map(({ work_package_id }) => work_package_id);
  const selectedPackages = dryRun.work_packages
    .filter(({ work_package_id }) => selected.includes(work_package_id))
    .map((workPackage) => ({
      work_package_id: workPackage.work_package_id,
      work_package_revision: workPackage.work_package_revision,
      work_package_plan_digest: workPackage.work_package_plan_digest,
      proposed_branch: dryRun.issue_drafts
        .find(({ work_package_id }) => work_package_id === workPackage.work_package_id)
        .body.match(/## Proposed branch\r?\n\r?\n([^\r\n]+)/u)[1],
    }))
    .sort((left, right) => left.work_package_id.localeCompare(right.work_package_id));
  const allowedPaths = [...new Set(
    dryRun.work_packages
      .filter(({ work_package_id }) => selected.includes(work_package_id))
      .flatMap(({ path_policy }) => path_policy.allowed_paths.map(({ path }) => path)),
  )].sort();
  const prohibitedPaths = [...new Set(
    dryRun.work_packages
      .filter(({ work_package_id }) => selected.includes(work_package_id))
      .flatMap(({ path_policy }) => path_policy.forbidden_paths.map(({ path }) => path)),
  )].sort();
  const publicationMode = overrides.publication_mode ?? "PREPARE_ONLY";
  const approval = {
    record_kind: "OWNER_RUN_APPROVAL",
    approval_record_id: "OWNER-RUN-APPROVAL-AH-P2-01-0001",
    approved_by: "owner",
    approved_at: APPROVED_AT,
    dry_run_id: dryRun.dry_run_id,
    result_digest: dryRun.result_digest,
    source_repository_sha: dryRun.input_snapshot.repository.repository_sha,
    source_repository_root: publicationMode === "EXECUTE_PATCH_ONLY"
      ? overrides.source_repository_root ?? "C:/tmp/propscans-source"
      : undefined,
    selected_work_package_ids: [...selected].sort(),
    selected_work_packages: selectedPackages,
    allowed_paths: allowedPaths,
    prohibited_paths: publicationMode === "EXECUTE_PATCH_ONLY"
      ? prohibitedPaths
      : overrides.prohibited_paths,
    reviewed_warning_ids: dryRun.warnings.map(({ error_id }) => error_id).sort(),
    max_concurrency: overrides.max_concurrency
      ?? (publicationMode === "EXECUTE_PATCH_ONLY" ? 1 : 2),
    authentication_mode: publicationMode === "EXECUTE_PATCH_ONLY" ? "CHATGPT" : undefined,
    codex_cli_version: publicationMode === "EXECUTE_PATCH_ONLY" ? "0.146.0" : undefined,
    usage_schema_version: publicationMode === "EXECUTE_PATCH_ONLY" ? "1.0.0" : undefined,
    parser_profile: publicationMode === "EXECUTE_PATCH_ONLY"
      ? "codex-jsonl@0.146.0"
      : undefined,
    token_budget_enforcement: publicationMode === "EXECUTE_PATCH_ONLY"
      ? "POST_RUN_HARD_GATE"
      : undefined,
    max_total_tokens: publicationMode === "EXECUTE_PATCH_ONLY"
      ? overrides.max_total_tokens ?? 600_000
      : undefined,
    max_external_calls: publicationMode === "EXECUTE_PATCH_ONLY" ? 0 : undefined,
    max_retries: publicationMode === "EXECUTE_PATCH_ONLY" ? 0 : undefined,
    monetary_cost_policy: publicationMode === "EXECUTE_PATCH_ONLY"
      ? "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT"
      : undefined,
    production: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    residual_risks_accepted: publicationMode === "EXECUTE_PATCH_ONLY" ? true : undefined,
    run_id: overrides.run_id ?? RUN_ID,
    execution_budget: {
      wall_clock_seconds: 600,
      worker_timeout_seconds: 120,
      test_timeout_seconds: 120,
      max_tokens: publicationMode === "EXECUTE_PATCH_ONLY"
        ? overrides.max_total_tokens ?? 600_000
        : 10_000,
      max_cost: 0,
      currency: "USD",
      max_external_calls: 0,
      max_retries: 0,
      max_concurrent_processes: 3,
    },
    worktree_root: overrides.worktree_root ?? "C:/tmp/propscans-worktrees",
    disposable_clone_root: publicationMode === "EXECUTE_PATCH_ONLY"
      ? overrides.disposable_clone_root
      : undefined,
    publication_mode: publicationMode === "EXECUTE_PATCH_ONLY"
      ? publicationMode
      : overrides.publication_mode_pin,
    commit_allowed: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    push_allowed: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    pr_allowed: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    merge_allowed: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    ready_transition_allowed: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    issue_close_allowed: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
    containment_acknowledgement: publicationMode === "EXECUTE_PATCH_ONLY"
      ? {
          status: "PARTIALLY_VERIFIED",
          residual_risk_accepted: true,
          limitations: [
            "HANDLE_PINNED_JOB_OBJECT_UNVERIFIED",
            "OS_NETWORK_DENY_UNVERIFIED",
            "RACE_FREE_FILESYSTEM_SANDBOX_UNVERIFIED",
          ],
        }
      : undefined,
    publication_policy: {
      mode: publicationMode,
      draft_only: publicationMode !== "EXECUTE_PATCH_ONLY",
      allow_commit: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
      allow_push: publicationMode === "EXECUTE_AND_DRAFT_PR",
      allow_pr: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
      allow_github: publicationMode === "EXECUTE_PATCH_ONLY" ? false : undefined,
      base_branch: "master",
      issue_number: publicationMode === "EXECUTE_PATCH_ONLY" ? null : 56,
    },
    record_hash: `sha256:${"0".repeat(64)}`,
    ...overrides,
  };
  const projection = clone(approval);
  delete projection.record_hash;
  approval.record_hash = sha256Digest(projection);
  return approval;
}

export function resealApproval(approval) {
  const projection = clone(approval);
  delete projection.record_hash;
  approval.record_hash = sha256Digest(projection);
  return approval;
}

export { REPOSITORY_SHA };
