import {
  officialIdentityUuid,
} from "../../../canonical-identity.mjs";
import { sha256Digest } from "../../../canonical-json.mjs";
import {
  digestRecord,
  digestRequirementContent,
  digestRequirementSet,
} from "../../../planner/digest.mjs";
import {
  schemaRegistry,
  schemas,
} from "../../../planner/schemas.mjs";

export const REPOSITORY_URI =
  "https://github.com/woojinhong/metabus_social";
export const REPOSITORY_SHA = "a".repeat(40);
export const DOCUMENT_BLOB_SHA = "b".repeat(40);
export const TEXT_HASH = `sha256:${"c".repeat(64)}`;
export const ZERO_DIGEST = `sha256:${"0".repeat(64)}`;
export const GENERATED_AT = "2026-07-31T00:00:00Z";

function locator(path, repositorySha, lineStart = 1, lineEnd = 20) {
  return {
    path,
    repository_sha: repositorySha,
    section_anchor: "owner-approved-requirement",
    line_start: lineStart,
    line_end: lineEnd,
  };
}

function baseRequirement({
  alias,
  title,
  statement,
  path,
  kind,
  gate,
  acceptance,
  repositorySha,
}) {
  const approvalId = `APPROVAL-${alias}`;
  const granted = gate === "GRANTED";
  return {
    schema_id:
      "https://github.com/woojinhong/metabus_social/schemas/automation/requirement.schema.json",
    schema_version: "1.0.0",
    record_kind: "CANONICAL_REQUIREMENT",
    requirement_id: "REQ-00000000-0000-5000-8000-000000000000",
    requirement_kind: kind,
    stable_aliases: [alias],
    title,
    source: {
      repository: REPOSITORY_URI,
      repository_sha: repositorySha,
      identity_path: path,
      document_path: path,
      document_blob_sha: DOCUMENT_BLOB_SHA,
      section_anchor: "owner-approved-requirement",
      line_range: { start: 1, end: 20 },
      source_text_hash: TEXT_HASH,
      previous_locations: [],
    },
    authority: {
      document_classification: "user decision",
      source_status: "Approved for deterministic Planner fixture",
      source_authority: "APPROVED",
      approval_record: locator(path, repositorySha),
      approved_by: "owner",
      approved_at: GENERATED_AT,
      supporting_sources: [],
    },
    status: {
      lifecycle: "APPROVED",
      changed_by: "owner",
      changed_at: GENERATED_AT,
    },
    statement,
    rationale: null,
    acceptance_intent: acceptance,
    implementation_gate: {
      state: gate,
      reason: granted ? "Owner granted bounded implementation." : "Owner gate required.",
      approval_record_id: granted ? approvalId : null,
      grant_source: granted ? locator(path, repositorySha) : null,
      granted_by: granted ? "owner" : null,
      granted_at: granted ? GENERATED_AT : null,
      valid_until: null,
      scope: granted ? ["scripts/harness/planner"] : [],
    },
    external_evidence: {
      required: false,
      state: "NOT_REQUIRED",
      references: [],
      accepted_by: null,
      accepted_at: null,
      revalidate_at: null,
    },
    parent_requirement: null,
    related_requirements: [],
    conflicts: [],
    supersedes: [],
    superseded_by: [],
    created_at: GENERATED_AT,
    generated_by: "ah-p1-01-test-fixture@1.0.0",
    content_hash: ZERO_DIGEST,
    requirement_record_hash: ZERO_DIGEST,
  };
}

function sealRequirement(requirement) {
  requirement.requirement_id = `REQ-${officialIdentityUuid({
    record: requirement,
    repositoryUri: REPOSITORY_URI,
    schema: schemas.requirement,
    registry: schemaRegistry,
  })}`;
  requirement.content_hash = digestRequirementContent(requirement);
  requirement.requirement_record_hash = digestRecord(
    requirement,
    schemas.requirement,
  );
  return requirement;
}

function approvalRecord(requirement, repositorySha) {
  const gate = requirement.implementation_gate;
  if (gate.state !== "GRANTED") return null;
  const record = {
    approval_record_id: gate.approval_record_id,
    approval_type: "EXECUTION_APPROVAL",
    state: "GRANTED",
    required_actor_role: "owner",
    source: gate.grant_source,
    source_approval_record_id: null,
    scope: [...gate.scope],
    source_sha: repositorySha,
    decided_by: "owner",
    decided_at: GENERATED_AT,
    valid_until: null,
    record_hash: ZERO_DIGEST,
  };
  const projection = { ...record };
  delete projection.record_hash;
  record.record_hash = sha256Digest(projection);
  return record;
}

export function makePlannerInput(specs = [{}], {
  repositorySha = REPOSITORY_SHA,
} = {}) {
  const requirements = specs.map((spec, index) =>
    baseRequirement({
      alias: spec.alias ?? `AH-TEST-${index + 1}`,
      title: spec.title ?? `Deterministic requirement ${index + 1}`,
      statement:
        spec.statement
        ?? `The Planner shall deterministically compile fixture ${index + 1}.`,
      path: spec.path ?? `docs/test/requirement-${index + 1}.md`,
      kind: spec.kind ?? "POLICY",
      gate: spec.gate ?? "GRANTED",
      acceptance: spec.acceptance ?? [`Fixture ${index + 1} is compiled.`],
      repositorySha,
    }),
  );
  const idByAlias = new Map();
  for (const requirement of requirements) {
    const sealed = sealRequirement(requirement);
    idByAlias.set(sealed.stable_aliases[0], sealed.requirement_id);
  }
  for (let index = 0; index < requirements.length; index += 1) {
    const parentAlias = specs[index]?.parentAlias;
    requirements[index].parent_requirement = parentAlias
      ? idByAlias.get(parentAlias)
      : null;
    requirements[index].requirement_record_hash = digestRecord(
      requirements[index],
      schemas.requirement,
    );
  }
  const sorted = requirements.sort((left, right) =>
    left.requirement_id.localeCompare(right.requirement_id),
  );
  const approvals = sorted
    .map((requirement) => approvalRecord(requirement, repositorySha))
    .filter((record) => record !== null)
    .sort((left, right) =>
      left.approval_record_id.localeCompare(right.approval_record_id),
    );
  const sourceDocuments = [...new Map(
    sorted.map((requirement) => [
      requirement.source.document_path,
      { ...requirement.source },
    ]),
  ).values()].sort((left, right) =>
    left.document_path.localeCompare(right.document_path),
  );
  const input = {
    input_snapshot: {
      repository: {
        canonical_uri: REPOSITORY_URI,
        repository_sha: repositorySha,
        default_branch: "master",
      },
      planning_scope: {
        vertical_slice: null,
        workstream: "autonomous-harness",
        modules: [...new Set(
          specs.map(({ targetPath }) => targetPath).filter(Boolean),
        )].sort(),
        source_documents: sourceDocuments,
        source_requirement_ids: sorted.map(({ requirement_id }) => requirement_id),
      },
      policy: {
        policy_version: "ah-p1-01@1.0.0",
        allowed_work_package_types: [
          "ARCHITECTURE_REVIEW",
          "DESIGN",
          "DOCUMENTATION",
          "IMPLEMENTATION",
          "SECURITY_REVIEW",
        ],
        allowed_risk_levels: ["LOW", "MEDIUM", "HIGH"],
        max_work_packages: 20,
        max_graph_nodes: 80,
        max_parallel_nodes: 8,
        allow_product_code_change: false,
        allow_infrastructure_change: false,
        allow_external_access: false,
      },
      execution_authority: {
        approval_record_ids: approvals.map(({ approval_record_id }) => approval_record_id),
        approval_records: approvals,
        allowed_scopes: ["scripts/harness/planner"],
      },
      external_evidence_context: {
        accepted_evidence_ids: [],
        accepted_evidence_records: [],
      },
      existing_state: {
        snapshot: {
          source: "Owner-pinned deterministic fixture",
          as_of: GENERATED_AT,
          source_sha: repositorySha,
          record_hash: ZERO_DIGEST,
        },
        open_issues: [],
        completed_work_packages: [],
        active_work_packages: [],
        existing_graphs: [],
      },
    },
    requirements: sorted,
    requirement_set_digest: "",
  };
  input.requirement_set_digest = digestRequirementSet(
    repositorySha,
    sorted,
  );
  const snapshotProjection = {
    ...input.input_snapshot.existing_state.snapshot,
  };
  delete snapshotProjection.record_hash;
  input.input_snapshot.existing_state.snapshot.record_hash =
    sha256Digest(snapshotProjection);
  return input;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
