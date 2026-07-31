function renderList(values) {
  return values.length > 0
    ? values.map((value) => `- ${value}`).join("\n")
    : "- None";
}

function renderSources(workPackage, repositoryUri) {
  return workPackage.source_documents
    .map((source) => {
      const lineFragment = source.line_start === null
        ? ""
        : `#L${source.line_start}${source.line_end === null ? "" : `-L${source.line_end}`}`;
      return `${repositoryUri}/blob/${source.repository_sha}/${source.path}${lineFragment}`;
    })
    .sort();
}

function duplicateStatus(workPackage) {
  return workPackage.issue_mapping.existing_issue === null
    ? "UNIQUE"
    : "REUSE_CANDIDATE";
}

function proposedBranch(workPackage) {
  return `harness/proposed-${workPackage.work_package_id.toLowerCase()}`;
}

function renderBody(workPackage, gate, sourceLinks) {
  const dependencyText = workPackage.dependencies.length > 0
    ? workPackage.dependencies.join(", ")
    : "None";
  return [
    `Work Package: ${workPackage.work_package_id}`,
    `Plan digest: ${workPackage.work_package_plan_digest}`,
    "",
    "## Purpose",
    "",
    workPackage.objective,
    "",
    "## Source Requirements",
    "",
    renderList(workPackage.source_requirements.map(({ requirement_id }) => requirement_id)),
    "",
    "## Scope",
    "",
    renderList(workPackage.scope),
    "",
    "## Out of scope",
    "",
    renderList(workPackage.out_of_scope),
    "",
    "## Acceptance criteria",
    "",
    renderList(workPackage.acceptance_criteria.map(({ statement }) => statement)),
    "",
    "## Required tests",
    "",
    renderList(workPackage.required_tests),
    "",
    "## Dependencies",
    "",
    dependencyText,
    "",
    "## Authority gate",
    "",
    `${gate.gate}: ${gate.reason ?? "all pinned gates satisfied"}`,
    "",
    "## Proposed branch",
    "",
    proposedBranch(workPackage),
    "",
    "## Source links",
    "",
    renderList(sourceLinks),
    "",
    "Refs: Owner-pinned canonical Requirement records listed above.",
    "",
    "> This is a deterministic proposal for Owner review. It grants no execution,",
    "> GitHub mutation, repository mutation, Worker, merge, or issue-closing authority.",
  ].join("\n");
}

export function renderIssueDrafts(items, repositoryUri) {
  return items
    .map(({ workPackage, gate }) => {
      const sourceLinks = renderSources(workPackage, repositoryUri);
      const draft = {
        work_package_id: workPackage.work_package_id,
        renderer_version: "issue-template@1.0.0",
        canonical_fields: workPackage,
        title: `[Proposal] ${workPackage.title}`,
        body: renderBody(workPackage, gate, sourceLinks),
        labels: ["read-only-planner", "proposal"],
        milestone: workPackage.issue_mapping.milestone,
        parent_issue: workPackage.issue_mapping.parent_issue,
        existing_issue_candidate: workPackage.issue_mapping.existing_issue,
        duplicate_check: {
          key: `${workPackage.work_package_id}@${workPackage.work_package_revision}:${workPackage.work_package_plan_digest}`,
          status: duplicateStatus(workPackage),
        },
        source_links: workPackage.source_documents,
      };
      return draft;
    })
    .sort((left, right) =>
      left.work_package_id.localeCompare(right.work_package_id),
    );
}
