import {
  canonicalRecordBytes,
  serializeJcs,
} from "../canonical-json.mjs";
import {
  digestRecord,
  digestWorkPackageSet,
  stableId,
} from "./digest.mjs";
import { renderIssueDrafts } from "./issue-draft-renderer.mjs";
import {
  createErrorRecord,
  PlannerError,
} from "./planner-error.mjs";
import { loadPlannerInput } from "./requirement-loader.mjs";
import { schemaRegistry, schemas } from "./schemas.mjs";
import { compileWorkPackages } from "./work-package-compiler.mjs";
import { compileWorkGraph } from "./workgraph-compiler.mjs";

const EMPTY_LOCK_ANALYSIS = Object.freeze({
  required_locks: [],
  conflicts: [],
  safe_parallel_groups: [],
  serialized_groups: [],
  integration_hold_required: false,
});

const RISK_ORDER = Object.freeze({
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
});

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function highestRisk(workPackages) {
  return workPackages.reduce(
    (highest, workPackage) =>
      RISK_ORDER[workPackage.risk.level] > RISK_ORDER[highest]
        ? workPackage.risk.level
        : highest,
    "LOW",
  );
}

function executionSummary(workgraph, items, blocked) {
  if (workgraph === null) {
    return {
      executable_nodes: [],
      blocked_nodes: [],
      human_nodes: [],
      evidence_nodes: [],
      review_nodes: [],
    };
  }
  const gateByPackage = new Map(
    items.map(({ workPackage, gate }) => [workPackage.work_package_id, gate.gate]),
  );
  const workNodes = workgraph.nodes.filter(({ node_type }) => node_type === "WORK");
  return {
    executable_nodes: blocked
      ? []
      : workNodes
          .filter(({ entrypoint }) => entrypoint)
          .map(({ node_id }) => node_id)
          .sort(),
    blocked_nodes: workNodes
      .filter(({ work_package_id }) => gateByPackage.get(work_package_id) !== "READY")
      .map(({ node_id }) => node_id)
      .sort(),
    human_nodes: workgraph.nodes
      .filter(({ node_type }) => node_type === "HUMAN_APPROVAL")
      .map(({ node_id }) => node_id)
      .sort(),
    evidence_nodes: workgraph.nodes
      .filter(({ node_type }) => node_type === "EVIDENCE")
      .map(({ node_id }) => node_id)
      .sort(),
    review_nodes: workgraph.nodes
      .filter(({ node_type }) =>
        ["REVIEW", "SECURITY_REVIEW", "ARCHITECTURE_REVIEW", "CI_VERIFICATION"]
          .includes(node_type),
      )
      .map(({ node_id }) => node_id)
      .sort(),
  };
}

function issueWarnings(repositoryUri, lockAnalysis) {
  if (lockAnalysis.conflicts.length === 0) return [];
  return [
    createErrorRecord({
      repositoryUri,
      code: "DRP_GRAPH_LOCK_CONFLICT",
      message: "Expected write paths overlap and require serialized review",
      result: "DRY_RUN_VALID_WITH_WARNINGS",
      severity: "WARNING",
      automaticFix: false,
      ownerIntervention: true,
      blocksDryRun: false,
      details: {
        field: "lock_analysis.conflicts",
        expected: "non-overlapping paths for parallel work",
        actual: lockAnalysis.conflicts.join(","),
      },
    }),
  ];
}

function gateErrors(repositoryUri, items) {
  return items
    .filter(({ gate }) => gate.gate === "BLOCKED_OWNER")
    .map(({ workPackage, gate }) => {
      const code = gate.reason === "EXTERNAL_EVIDENCE_REQUIRED"
        ? "DRP_WORK_PACKAGE_EVIDENCE_UNMET"
        : gate.reason === "RISK_LEVEL_NOT_ALLOWED"
          ? "DRP_RISK_POLICY_EXCEEDED"
          : "DRP_WORK_PACKAGE_GRANT_MISSING";
      return createErrorRecord({
        repositoryUri,
        code,
        message: `Owner authority is required for ${workPackage.work_package_id}`,
        result: "DRY_RUN_BLOCKED",
        details: {
          field: "authority_status.package_status",
          expected: "READY",
          actual: gate.reason,
          related_ids: [workPackage.work_package_id],
        },
      });
    });
}

function blockedReasons(items) {
  return sortedUnique(
    items
      .filter(({ gate }) => gate.gate !== "READY")
      .map(({ workPackage, gate }) => {
        const dependencySuffix = gate.gate === "BLOCKED_DEPENDENCY"
          ? `:${(gate.unsatisfiedDependencies ?? []).join(",")}`
          : "";
        return `${gate.gate}:${workPackage.work_package_id}${dependencySuffix}`;
      }),
  );
}

function humanDecisions(items) {
  return sortedUnique(
    items
      .filter(({ gate }) => gate.gate === "BLOCKED_OWNER")
      .map(({ workPackage, gate }) =>
        `${workPackage.work_package_id}:${gate.reason}`,
      ),
  );
}

function evidenceGaps(items) {
  return sortedUnique(
    items
      .filter(({ workPackage }) => workPackage.external_evidence_gate.blocks_execution)
      .flatMap(({ workPackage }) =>
        workPackage.external_evidence_gate.required_evidence.length > 0
          ? workPackage.external_evidence_gate.required_evidence
          : [`${workPackage.work_package_id}:EXTERNAL_EVIDENCE_REQUIRED`],
      ),
  );
}

function baseDryRun({
  inputSnapshot,
  requirements,
  requirementSetDigest,
  repositoryUri,
  workPackages,
  workPackageSetDigest,
  workgraph,
  issueDrafts,
  lockAnalysis,
  warnings,
  errors,
  blocked,
  reasons,
  items,
  result,
}) {
  const dryRun = {
    schema_id:
      "https://github.com/woojinhong/metabus_social/schemas/automation/dry-run.schema.json",
    schema_version: "1.0.0",
    record_kind: "READ_ONLY_DRY_RUN",
    dry_run_id: stableId(
      "DR",
      repositoryUri,
      [
        inputSnapshot.repository.repository_sha,
        JSON.stringify(inputSnapshot.planning_scope),
        requirementSetDigest,
        inputSnapshot.policy.policy_version,
      ].join("\n"),
    ),
    generated_at: inputSnapshot.existing_state.snapshot.as_of,
    generated_by: "ah-p1-01-planner@1.0.0",
    input_snapshot: inputSnapshot,
    requirements,
    requirement_set_digest: requirementSetDigest,
    work_packages: workPackages,
    work_package_set_digest: workPackageSetDigest,
    workgraph,
    issue_drafts: issueDrafts,
    lock_analysis: lockAnalysis,
    risk_summary: {
      highest_level: highestRisk(workPackages),
      factors: sortedUnique(
        workPackages.flatMap(({ risk }) => risk.factors),
      ),
      blocked,
    },
    human_decisions: humanDecisions(items),
    external_evidence_gaps: evidenceGaps(items),
    warnings,
    errors,
    blocked_reasons: reasons,
    execution_summary: executionSummary(workgraph, items, blocked),
    result,
    result_digest:
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  };
  dryRun.result_digest = digestRecord(dryRun, schemas["dry-run"]);
  canonicalRecordBytes(dryRun, {
    schema: schemas["dry-run"],
    registry: schemaRegistry,
  });
  return dryRun;
}

export function compilePlanner(text, repositorySha) {
  const loaded = loadPlannerInput(text, repositorySha);
  let compiled = { items: [], completedWorkPackageIds: [] };
  let workPackages = [];
  let workPackageSetDigest = digestWorkPackageSet([]);
  try {
    compiled = compileWorkPackages(loaded);
    workPackages = compiled.items.map(({ workPackage }) => workPackage);
    if (workPackages.length > loaded.inputSnapshot.policy.max_work_packages) {
      throw new PlannerError(
        createErrorRecord({
          repositoryUri: loaded.repositoryUri,
          code: "DRP_LIMIT_EXCEEDED",
          message: "Work Package count exceeds the approved policy limit",
          result: "DRY_RUN_BLOCKED",
          details: {
            field: "work_packages",
            expected: loaded.inputSnapshot.policy.max_work_packages,
            actual: workPackages.length,
            related_ids: workPackages.map(({ work_package_id }) => work_package_id),
          },
        }),
      );
    }
    workPackageSetDigest = digestWorkPackageSet(workPackages);
    const { workgraph, lockAnalysis } = compileWorkGraph({
      ...loaded,
      ...compiled,
      workPackageSetDigest,
    });
    const issueDrafts = renderIssueDrafts(compiled.items, loaded.repositoryUri);
    const reasons = blockedReasons(compiled.items);
    const blocked = reasons.length > 0;
    const warnings = issueWarnings(loaded.repositoryUri, lockAnalysis);
    const errors = gateErrors(loaded.repositoryUri, compiled.items);
    const result = blocked
      ? "DRY_RUN_BLOCKED"
      : warnings.length > 0
        ? "DRY_RUN_VALID_WITH_WARNINGS"
        : "DRY_RUN_VALID";
    return baseDryRun({
      ...loaded,
      workPackages,
      workPackageSetDigest,
      workgraph,
      issueDrafts,
      lockAnalysis,
      warnings,
      errors,
      blocked,
      reasons,
      items: compiled.items,
      result,
    });
  } catch (error) {
    if (!(error instanceof PlannerError)) throw error;
    const result = error.record.result;
    return baseDryRun({
      ...loaded,
      workPackages,
      workPackageSetDigest,
      workgraph: null,
      issueDrafts: [],
      lockAnalysis: EMPTY_LOCK_ANALYSIS,
      warnings: [],
      errors: [error.record],
      blocked: true,
      reasons: [error.record.code],
      items: compiled.items,
      result,
    });
  }
}

export function serializePlannerResult(record) {
  return `${serializeJcs(record)}\n`;
}
