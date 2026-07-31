import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { serializeJcs } from "../canonical-json.mjs";

export function buildWorkerContext({
  workPackage,
  dryRun,
  approval,
  branch,
  worktreePath,
}) {
  const sourceRequirementIds = workPackage.source_requirements
    .map(({ requirement_id }) => requirement_id)
    .sort();
  const sourceRequirements = dryRun.requirements
    .filter(({ requirement_id }) => sourceRequirementIds.includes(requirement_id))
    .sort((left, right) => left.requirement_id.localeCompare(right.requirement_id));
  if (sourceRequirements.length !== sourceRequirementIds.length) {
    throw Object.assign(new Error("Canonical source Requirement is missing from the dry-run"), {
      code: "RUNNER_CONTEXT_INVALID",
    });
  }
  return {
    record_kind: "BOUNDED_WORKER_CONTEXT",
    work_package_id: workPackage.work_package_id,
    work_package_revision: workPackage.work_package_revision,
    work_package_plan_digest: workPackage.work_package_plan_digest,
    source_requirement_ids: sourceRequirementIds,
    source_requirements: sourceRequirements,
    objective: workPackage.objective,
    scope: workPackage.scope,
    out_of_scope: workPackage.out_of_scope,
    acceptance_criteria: workPackage.acceptance_criteria,
    expected_changes: workPackage.expected_changes,
    allowed_paths: workPackage.path_policy.allowed_paths,
    prohibited_paths: workPackage.path_policy.forbidden_paths,
    required_tests: workPackage.required_tests,
    required_checks: workPackage.required_checks,
    source_repository_sha: dryRun.input_snapshot.repository.repository_sha,
    authority: {
      approval_record_id: approval.approval_record_id,
      record_hash: approval.record_hash,
      dry_run_id: dryRun.dry_run_id,
      result_digest: dryRun.result_digest,
      selected_work_package_id: workPackage.work_package_id,
    },
    proposed_branch: branch,
    worktree_path: worktreePath,
    publication_limits: {
      worker_may_commit: false,
      worker_may_push: false,
      worker_may_create_pr: false,
      draft_pr_only: true,
      auto_merge: false,
      issue_close: false,
    },
  };
}

export function renderWorkerPrompt(contextPath) {
  return [
    "Execute only the bounded Work Package in the provided context JSON.",
    `Context: ${contextPath}`,
    "Work only inside the assigned worktree and allowed paths.",
    "Do not commit, push, create or update GitHub resources, install dependencies,",
    "use secrets, access the network, expand scope, or change prohibited paths.",
    "Modify files and run local checks only. The Runner control plane independently",
    "validates paths and required tests before any publication.",
  ].join("\n");
}

export async function writeWorkerContext({
  diagnosticsRoot,
  runId,
  workPackage,
  dryRun,
  approval,
  branch,
  worktreePath,
}) {
  const packageRoot = join(diagnosticsRoot, runId, workPackage.work_package_id);
  await mkdir(packageRoot, { recursive: true });
  const context = buildWorkerContext({
    workPackage,
    dryRun,
    approval,
    branch,
    worktreePath,
  });
  const contextPath = join(packageRoot, "worker-context.json");
  const promptPath = join(packageRoot, "worker-prompt.txt");
  await writeFile(contextPath, `${serializeJcs(context)}\n`, { flag: "wx" });
  await writeFile(promptPath, `${renderWorkerPrompt(contextPath)}\n`, { flag: "wx" });
  return { context, contextPath, promptPath, packageRoot };
}
