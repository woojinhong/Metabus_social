import { canonicalRecordBytes } from "../canonical-json.mjs";
import { evaluateRequirementGate } from "./gate-evaluator.mjs";
import {
  digestRecord,
  stableId,
} from "./digest.mjs";
import { failPlanner } from "./planner-error.mjs";
import { schemaRegistry, schemas } from "./schemas.mjs";

const TYPE_BY_REQUIREMENT_KIND = Object.freeze({
  FUNCTIONAL: "IMPLEMENTATION",
  UX: "IMPLEMENTATION",
  SAFETY: "SECURITY_REVIEW",
  NON_FUNCTIONAL: "IMPLEMENTATION",
  POLICY: "DOCUMENTATION",
  ARCHITECTURE: "DESIGN",
  EXECUTION_CONSTRAINT: "DOCUMENTATION",
});

const RISK_BY_REQUIREMENT_KIND = Object.freeze({
  FUNCTIONAL: "MEDIUM",
  UX: "MEDIUM",
  SAFETY: "HIGH",
  NON_FUNCTIONAL: "MEDIUM",
  POLICY: "LOW",
  ARCHITECTURE: "HIGH",
  EXECUTION_CONSTRAINT: "HIGH",
});

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function sourceLocator(requirement) {
  return {
    path: requirement.source.document_path,
    repository_sha: requirement.source.repository_sha,
    section_anchor: requirement.source.section_anchor,
    line_start: requirement.source.line_range.start,
    line_end: requirement.source.line_range.end,
  };
}

function changePaths(requirement, inputSnapshot) {
  const modules = inputSnapshot.planning_scope.modules;
  return sortedUnique(
    modules.length > 0 ? modules : [requirement.source.document_path],
  );
}

function pathRules(paths, match = "EXACT") {
  return paths.map((path) => ({ path, match }));
}

function forbiddenPathRules(policy) {
  const paths = ["src/main/resources/db/migration"];
  if (!policy.allow_product_code_change) paths.push("src");
  if (!policy.allow_infrastructure_change) {
    paths.push(".github/workflows", "infra");
  }
  return pathRules(sortedUnique(paths));
}

function requiredTests(paths) {
  const tests = ["node scripts/harness/planner.test.mjs"];
  if (paths.some((path) => path === "docs" || path.startsWith("docs/"))) {
    tests.push("node scripts/docs/validate-docs.mjs");
  }
  return sortedUnique(tests);
}

function requiredChecks(paths) {
  const checks = ["owner-review", "scoped-diff"];
  if (paths.some((path) => path === "docs" || path.startsWith("docs/"))) {
    checks.push("documentation-validation");
  }
  return sortedUnique(checks);
}

function approvalRecord({
  repositoryUri,
  workPackageId,
  approvalType,
  state,
  source,
  scope,
  sourceSha,
  decidedBy = null,
  decidedAt = null,
  validUntil = null,
}) {
  return {
    approval_record_id: stableId(
      "APR",
      repositoryUri,
      `${workPackageId}\n${approvalType}`,
    ),
    approval_type: approvalType,
    state,
    required_actor_role: "owner",
    source,
    source_approval_record_id: null,
    scope,
    source_sha: sourceSha,
    decided_by: decidedBy,
    decided_at: decidedAt,
    valid_until: validUntil,
  };
}

function humanApproval(requirement, gate, repositoryUri, workPackageId, scope) {
  const source =
    requirement.implementation_gate.grant_source
    ?? requirement.authority.approval_record
    ?? sourceLocator(requirement);
  const granted = gate.gate === "READY";
  const execution = approvalRecord({
    repositoryUri,
    workPackageId,
    approvalType: "EXECUTION_APPROVAL",
    state: granted ? "GRANTED" : "REQUIRED",
    source,
    scope,
    sourceSha: requirement.source.repository_sha,
    decidedBy: granted ? requirement.implementation_gate.granted_by : null,
    decidedAt: granted ? requirement.implementation_gate.granted_at : null,
    validUntil: requirement.implementation_gate.valid_until,
  });
  return {
    execution,
    review: approvalRecord({
      repositoryUri,
      workPackageId,
      approvalType: "REVIEW_ACCEPTANCE",
      state: "REQUIRED",
      source,
      scope,
      sourceSha: requirement.source.repository_sha,
    }),
    merge: approvalRecord({
      repositoryUri,
      workPackageId,
      approvalType: "MERGE_APPROVAL",
      state: "REQUIRED",
      source,
      scope,
      sourceSha: requirement.source.repository_sha,
    }),
    follow_up_unlock: approvalRecord({
      repositoryUri,
      workPackageId,
      approvalType: "FOLLOW_UP_UNLOCK",
      state: "REQUIRED",
      source,
      scope,
      sourceSha: requirement.source.repository_sha,
    }),
  };
}

function acceptanceCriteria(requirement, repositoryUri, workPackageId) {
  const statements =
    requirement.acceptance_intent.length > 0
      ? requirement.acceptance_intent
      : [`Requirement ${requirement.requirement_id} is satisfied as written.`];
  return statements.map((statement, index) => ({
    criterion_id: stableId(
      "AC",
      repositoryUri,
      `${workPackageId}\n${index}\n${statement}`,
    ),
    source_requirements: [requirement.requirement_id],
    statement,
    verification_method: "owner-reviewed deterministic requirement check",
    required_evidence: ["test result"],
  }));
}

export function deriveWorkPackageId(repositoryUri, requirementId) {
  return stableId("WP", repositoryUri, `requirement\n${requirementId}`);
}

function compileWorkPackage({
  requirement,
  requirementSetDigest,
  inputSnapshot,
  repositoryUri,
  dependencyIds,
  blockIds,
}) {
  const policy = inputSnapshot.policy;
  const type = TYPE_BY_REQUIREMENT_KIND[requirement.requirement_kind];
  const riskLevel = RISK_BY_REQUIREMENT_KIND[requirement.requirement_kind];
  const paths = changePaths(requirement, inputSnapshot);
  const scope = sortedUnique(
    requirement.implementation_gate.scope.length > 0
      ? requirement.implementation_gate.scope
      : [
          ...inputSnapshot.execution_authority.allowed_scopes,
          ...inputSnapshot.planning_scope.modules,
          inputSnapshot.planning_scope.workstream,
        ],
  );
  const gate = evaluateRequirementGate(requirement, inputSnapshot);
  const touchesProduct = paths.some(
    (path) => path === "src" || path.startsWith("src/"),
  );
  const touchesInfrastructure = paths.some(
    (path) =>
      path === "infra"
      || path.startsWith("infra/")
      || path === ".github/workflows"
      || path.startsWith(".github/workflows/"),
  );
  const touchesMigration = paths.some(
    (path) =>
      path === "src/main/resources/db/migration"
      || path.startsWith("src/main/resources/db/migration/"),
  );
  if (
    !policy.allowed_work_package_types.includes(type)
    || !policy.allowed_risk_levels.includes(riskLevel)
    || (touchesProduct && !policy.allow_product_code_change)
    || (touchesInfrastructure && !policy.allow_infrastructure_change)
    || touchesMigration
  ) {
    gate.gate = "BLOCKED_OWNER";
    if (!policy.allowed_work_package_types.includes(type)) {
      gate.reason = "WORK_PACKAGE_TYPE_NOT_ALLOWED";
    } else if (!policy.allowed_risk_levels.includes(riskLevel)) {
      gate.reason = "RISK_LEVEL_NOT_ALLOWED";
    } else if (touchesMigration) {
      gate.reason = "MIGRATION_REQUIRES_SEPARATE_OWNER_GATE";
    } else if (touchesProduct) {
      gate.reason = "PRODUCT_CODE_CHANGE_NOT_ALLOWED";
    } else {
      gate.reason = "INFRASTRUCTURE_CHANGE_NOT_ALLOWED";
    }
  }
  const workPackageId = deriveWorkPackageId(
    repositoryUri,
    requirement.requirement_id,
  );
  const approvals = humanApproval(
    requirement,
    gate,
    repositoryUri,
    workPackageId,
    scope,
  );
  const workPackage = {
    schema_id:
      "https://github.com/woojinhong/metabus_social/schemas/automation/work-package.schema.json",
    schema_version: "1.0.0",
    record_kind: "CANONICAL_WORK_PACKAGE",
    work_package_id: workPackageId,
    work_package_revision: 1,
    title: requirement.title,
    type,
    workstream: inputSnapshot.planning_scope.workstream,
    vertical_slice: inputSnapshot.planning_scope.vertical_slice,
    source_snapshot: {
      repository: repositoryUri,
      repository_sha: requirement.source.repository_sha,
      requirement_set_digest: requirementSetDigest,
      policy_version: policy.policy_version,
    },
    source_requirements: [
      {
        requirement_id: requirement.requirement_id,
        requirement_record_hash: requirement.requirement_record_hash,
        authority_status: requirement.authority.source_authority,
        lifecycle: requirement.status.lifecycle,
        execution_grant: requirement.implementation_gate.state,
        evidence_state: requirement.external_evidence.state,
      },
    ],
    source_documents: [sourceLocator(requirement)],
    authority_status: {
      source_authority: requirement.authority.source_authority,
      execution_grant: requirement.implementation_gate.state,
      evidence_readiness: requirement.external_evidence.state,
      package_status: gate.gate === "READY" ? "READY" : "BLOCKED",
    },
    objective: `Satisfy ${requirement.requirement_id}: ${requirement.title}`,
    scope,
    out_of_scope: sortedUnique([
      "automatic execution",
      "authority promotion",
      "GitHub mutation",
      "runtime state mutation",
    ]),
    dependencies: sortedUnique(dependencyIds),
    blocks: sortedUnique(blockIds),
    owned_modules: sortedUnique(inputSnapshot.planning_scope.modules),
    path_policy: {
      allowed_paths: pathRules(paths),
      forbidden_paths: forbiddenPathRules(policy),
      shared_paths: [],
      required_paths: pathRules(paths),
      approved_exceptions: [],
    },
    expected_changes: paths.map((path) => ({ path, operation: "MODIFY" })),
    acceptance_criteria: acceptanceCriteria(
      requirement,
      repositoryUri,
      workPackageId,
    ),
    required_tests: requiredTests(paths),
    required_checks: requiredChecks(paths),
    required_evidence: ["scoped diff", "test results"],
    risk: {
      level: riskLevel,
      factors: [`requirement-kind:${requirement.requirement_kind}`],
      mitigations: ["Owner review", "read-only Planner output"],
    },
    agent_profile: {
      role: "read-only-planner-proposal",
      capabilities: ["READ_REPOSITORY", "PROPOSE_PLAN"],
      denied_capabilities: [
        "CREATE_BRANCH",
        "CREATE_GITHUB_ISSUE",
        "EXECUTE_WORKER",
        "MODIFY_REPOSITORY",
      ],
      network_policy: "DENY_BY_DEFAULT",
      secret_policy: "NONE",
    },
    execution_mode: "READ_ONLY",
    retry_policy: {
      max_retries: 0,
      retryable_errors: [],
      non_retryable_errors: ["AUTHORITY_MISMATCH", "SOURCE_STALE"],
      backoff: "NONE",
      same_error_limit: 1,
      new_attempt: true,
    },
    timeout_policy: {
      claim_seconds: 0,
      worker_seconds: 0,
      ci_seconds: 0,
      review_seconds: 0,
      human_approval_seconds: null,
    },
    budget: {
      max_execution_seconds: 0,
      max_tokens: 0,
      max_cost: 0,
      currency: "USD",
      max_external_calls: 0,
    },
    human_approval: approvals,
    external_evidence_gate: {
      requirement_ids: requirement.external_evidence.required
        ? [requirement.requirement_id]
        : [],
      required_evidence: requirement.external_evidence.references,
      acceptor: requirement.external_evidence.accepted_by,
      state: requirement.external_evidence.state,
      expires_at: requirement.external_evidence.revalidate_at,
      conflicts: requirement.conflicts
        .filter((conflict) => conflict.state !== "RESOLVED")
        .map((conflict) => conflict.conflict_id)
        .sort(),
      blocks_execution:
        requirement.external_evidence.required
        && requirement.external_evidence.state !== "ACCEPTED",
    },
    lock_requirements: {
      modules: sortedUnique(inputSnapshot.planning_scope.modules),
      paths,
      shared_resources: [],
    },
    rollback_or_recovery: [],
    completion_definition: acceptanceCriteria(
      requirement,
      repositoryUri,
      workPackageId,
    ).map(({ statement }) => statement),
    issue_mapping: {
      title: requirement.title,
      labels: [],
      milestone: null,
      parent_issue: null,
      existing_issue: null,
    },
    work_package_plan_digest:
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    created_at: inputSnapshot.existing_state.snapshot.as_of,
    generated_by: "ah-p1-01-planner@1.0.0",
  };
  workPackage.work_package_plan_digest = digestRecord(
    workPackage,
    schemas["work-package"],
  );
  canonicalRecordBytes(workPackage, {
    schema: schemas["work-package"],
    registry: schemaRegistry,
  });
  return { workPackage, gate };
}

function completedRefMatches(workPackage, completedRefs) {
  return completedRefs.some(
    (reference) =>
      reference.work_package_id === workPackage.work_package_id
      && reference.work_package_revision === workPackage.work_package_revision
      && reference.work_package_plan_digest === workPackage.work_package_plan_digest,
  );
}

export function compileWorkPackages({
  requirements,
  requirementSetDigest,
  inputSnapshot,
  repositoryUri,
}) {
  const requirementIds = new Set(
    requirements.map(({ requirement_id }) => requirement_id),
  );
  for (const requirement of requirements) {
    if (
      requirement.parent_requirement
      && !requirementIds.has(requirement.parent_requirement)
    ) {
      failPlanner({
        repositoryUri,
        code: "DRP_GRAPH_DEPENDENCY_MISSING",
        message: `Requirement ${requirement.requirement_id} references a missing parent`,
        details: {
          field: "parent_requirement",
          expected: "requirement in pinned input set",
          actual: requirement.parent_requirement,
          related_ids: [
            requirement.requirement_id,
            requirement.parent_requirement,
          ],
        },
      });
    }
  }
  const packageIds = new Map(
    requirements.map((requirement) => [
      requirement.requirement_id,
      deriveWorkPackageId(repositoryUri, requirement.requirement_id),
    ]),
  );
  const childIds = new Map(requirements.map(({ requirement_id }) => [requirement_id, []]));
  for (const requirement of requirements) {
    if (requirement.parent_requirement) {
      childIds.get(requirement.parent_requirement).push(
        packageIds.get(requirement.requirement_id),
      );
    }
  }
  const compiled = requirements.map((requirement) =>
    compileWorkPackage({
      requirement,
      requirementSetDigest,
      inputSnapshot,
      repositoryUri,
      dependencyIds: requirement.parent_requirement
        ? [packageIds.get(requirement.parent_requirement)]
        : [],
      blockIds: childIds.get(requirement.requirement_id),
    }),
  );
  const completed = new Set(
    compiled
      .filter(({ workPackage }) =>
        completedRefMatches(
          workPackage,
          inputSnapshot.existing_state.completed_work_packages,
        ),
      )
      .map(({ workPackage }) => workPackage.work_package_id),
  );
  const retained = compiled.filter(
    ({ workPackage }) => !completed.has(workPackage.work_package_id),
  );
  const retainedIds = new Set(
    retained.map(({ workPackage }) => workPackage.work_package_id),
  );
  for (const item of retained) {
    const unsatisfied = item.workPackage.dependencies.filter(
      (dependencyId) =>
        !completed.has(dependencyId) && retainedIds.has(dependencyId),
    );
    if (unsatisfied.length > 0) {
      item.gate = {
        gate: "BLOCKED_DEPENDENCY",
        reason: "PREDECESSOR_NOT_COMPLETED",
        approvalRecord: item.gate.approvalRecord,
        unsatisfiedDependencies: unsatisfied,
      };
      item.workPackage.authority_status.package_status = "BLOCKED";
    }
    const candidates = inputSnapshot.existing_state.open_issues.filter(
      (issue) =>
        issue.work_package_id === item.workPackage.work_package_id
        && issue.work_package_revision === item.workPackage.work_package_revision
        && issue.work_package_plan_digest
          === item.workPackage.work_package_plan_digest,
    );
    if (candidates.length === 1) {
      item.workPackage.issue_mapping.existing_issue = candidates[0].issue_number;
    }
    if (candidates.length > 1) {
      item.gate = {
        gate: "BLOCKED_OWNER",
        reason: "EXISTING_ISSUE_AMBIGUOUS",
        approvalRecord: item.gate.approvalRecord,
      };
      item.workPackage.authority_status.package_status = "BLOCKED";
    }
  }
  return {
    items: retained.sort((left, right) =>
      left.workPackage.work_package_id.localeCompare(
        right.workPackage.work_package_id,
      ),
    ),
    completedWorkPackageIds: [...completed].sort(),
  };
}
