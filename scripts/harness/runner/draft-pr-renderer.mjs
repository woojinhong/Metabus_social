function list(values, render = (value) => value) {
  return values.length === 0
    ? "- None"
    : values.map((value) => `- ${render(value)}`).join("\n");
}

export function renderDraftPr({
  workPackage,
  dryRun,
  approval,
  issueNumber,
  changedFiles,
  testResults,
  workerResult,
  notImplemented = [],
}) {
  const title = `[Harness] ${workPackage.work_package_id}: ${workPackage.title}`;
  const body = [
    "## Work Package",
    "",
    `- ID: \`${workPackage.work_package_id}\``,
    `- Revision: \`${workPackage.work_package_revision}\``,
    `- Plan digest: \`${workPackage.work_package_plan_digest}\``,
    `- Requirements: ${workPackage.source_requirements
      .map(({ requirement_id }) => `\`${requirement_id}\``).join(", ")}`,
    "",
    "## Pinned authority",
    "",
    `- Planner dry run: \`${dryRun.dry_run_id}\``,
    `- Planner result digest: \`${dryRun.result_digest}\``,
    `- Owner run approval: \`${approval.approval_record_id}\``,
    `- Owner approval hash: \`${approval.record_hash}\``,
    `- Source SHA: \`${dryRun.input_snapshot.repository.repository_sha}\``,
    "",
    "## Scope",
    "",
    list(workPackage.scope),
    "",
    "## Out of scope",
    "",
    list(workPackage.out_of_scope),
    "",
    "## Acceptance criteria",
    "",
    list(workPackage.acceptance_criteria, ({ statement }) => statement),
    "",
    "## Changed files",
    "",
    list(changedFiles, (path) => `\`${path}\``),
    "",
    "## Runner-controlled tests",
    "",
    list(testResults, ({ command, exit_code, timed_out }) =>
      `\`${command}\` — exit ${exit_code}${timed_out ? " (timeout)" : ""}`),
    "",
    "## Worker",
    "",
    `- Exit code: ${workerResult.code}`,
    `- Timed out: ${workerResult.timedOut ? "yes" : "no"}`,
    `- Stdout log: \`${workerResult.stdoutPath}\``,
    `- Stderr log: \`${workerResult.stderrPath}\``,
    "",
    "## Blocked / not implemented",
    "",
    list(notImplemented),
    "",
    `Refs #${issueNumber}`,
    "",
    "> Draft publication only. This PR does not authorize merge, Ready transition,",
    "> Issue closure, cleanup, product execution, or any follow-up run.",
  ].join("\n");
  return { title, body };
}
