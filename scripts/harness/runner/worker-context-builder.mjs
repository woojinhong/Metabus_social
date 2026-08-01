import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { serializeJcs } from "../canonical-json.mjs";

export function buildWorkerContext({
  workPackage,
  dryRun,
  approval,
  branch,
  worktreePath,
  expectedChangeState = null,
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
  const expectedChange = expectedChangeState ?? workPackage.expected_changes[0];
  const targetExistsAtSource = expectedChange.target_exists_at_source
    ?? expectedChange.operation === "MODIFY";
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
    expected_operation: expectedChange.operation,
    target_exists_at_source: targetExistsAtSource,
    exact_target_path: expectedChange.path,
    execution_instruction: expectedChange.operation === "CREATE"
      ? `CREATE the exact target file ${expectedChange.path}; write the required content and do not stop after analysis.`
      : `MODIFY the existing target file ${expectedChange.path}; read it first, write the required changes, and do not stop after analysis.`,
    source_mismatch_instruction:
      "If the target existence differs from target_exists_at_source, do not write and report a blocker.",
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
      mode: approval.publication_policy.mode,
      worker_may_commit: false,
      worker_may_push: false,
      worker_may_create_pr: false,
      patch_only: approval.publication_policy.mode === "EXECUTE_PATCH_ONLY",
      draft_pr_only: approval.publication_policy.mode === "EXECUTE_AND_DRAFT_PR",
      auto_merge: false,
      issue_close: false,
    },
  };
}

export function renderWorkerPrompt(contextPath, context) {
  return [
    "Execute only the bounded Work Package in the provided context JSON.",
    `Context: ${contextPath}`,
    `Exact target: ${context.exact_target_path}`,
    `Expected operation: ${context.expected_operation}`,
    context.execution_instruction,
    context.source_mismatch_instruction,
    "Modify exactly the allowed target file and no other file.",
    "Do not run git add, commit, push, or create or update a pull request.",
    "Do not install dependencies,",
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
  expectedChangeState = null,
}) {
  const packageRoot = join(diagnosticsRoot, runId, workPackage.work_package_id);
  await mkdir(packageRoot, { recursive: true });
  const context = buildWorkerContext({
    workPackage,
    dryRun,
    approval,
    branch,
    worktreePath,
    expectedChangeState,
  });
  const contextPath = join(packageRoot, "worker-context.json");
  const promptPath = join(packageRoot, "worker-prompt.txt");
  await writeFile(contextPath, `${serializeJcs(context)}\n`, { flag: "wx" });
  await writeFile(promptPath, `${renderWorkerPrompt(contextPath, context)}\n`, { flag: "wx" });
  return { context, contextPath, promptPath, packageRoot };
}
