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

export function makeDryRun(specs = [{}]) {
  const input = makePlannerInput(specs);
  return compilePlanner(JSON.stringify(input), REPOSITORY_SHA);
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
  const approval = {
    record_kind: "OWNER_RUN_APPROVAL",
    approval_record_id: "OWNER-RUN-APPROVAL-AH-P2-01-0001",
    approved_by: "owner",
    approved_at: APPROVED_AT,
    dry_run_id: dryRun.dry_run_id,
    result_digest: dryRun.result_digest,
    source_repository_sha: dryRun.input_snapshot.repository.repository_sha,
    selected_work_package_ids: [...selected].sort(),
    selected_work_packages: selectedPackages,
    allowed_paths: allowedPaths,
    reviewed_warning_ids: dryRun.warnings.map(({ error_id }) => error_id).sort(),
    max_concurrency: overrides.max_concurrency ?? 2,
    run_id: overrides.run_id ?? RUN_ID,
    execution_budget: {
      wall_clock_seconds: 600,
      worker_timeout_seconds: 120,
      test_timeout_seconds: 120,
      max_tokens: 10_000,
      max_cost: 0,
      currency: "USD",
      max_external_calls: 0,
      max_retries: 0,
      max_concurrent_processes: 3,
    },
    worktree_root: overrides.worktree_root ?? "C:/tmp/propscans-worktrees",
    publication_policy: {
      mode: overrides.publication_mode ?? "PREPARE_ONLY",
      draft_only: true,
      allow_push: overrides.publication_mode === "EXECUTE_AND_DRAFT_PR",
      base_branch: "master",
      issue_number: 56,
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
