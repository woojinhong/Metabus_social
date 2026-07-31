import {
  canonicalRecordBytes,
  parseJsonStrict,
  sha256Digest,
} from "../canonical-json.mjs";
import {
  normalizeRepositoryUri,
  officialIdentityUuid,
} from "../canonical-identity.mjs";
import {
  digestRecord,
  digestRequirementContent,
  digestRequirementSet,
} from "./digest.mjs";
import { failPlanner } from "./planner-error.mjs";
import { schemaRegistry, schemas } from "./schemas.mjs";

function sourceLocator(requirement) {
  return {
    path: requirement.source.document_path,
    repository_sha: requirement.source.repository_sha,
    section_anchor: requirement.source.section_anchor,
    line_start: requirement.source.line_range.start,
    line_end: requirement.source.line_range.end,
  };
}

function reject(repositoryUri, requirement, code, message, details = {}, result) {
  failPlanner({
    repositoryUri,
    code,
    message,
    result,
    source: requirement?.source ? sourceLocator(requirement) : null,
    details,
  });
}

function validateConflictLineage(repositoryUri, requirement) {
  for (const conflict of requirement.conflicts) {
    if (conflict.state !== "RESOLVED") {
      reject(
        repositoryUri,
        requirement,
        "DRP_REQUIREMENT_CONFLICT_UNRESOLVED",
        `Requirement ${requirement.requirement_id} has an unresolved conflict`,
        {
          field: "conflicts",
          expected: "RESOLVED",
          actual: conflict.state,
          related_ids: [requirement.requirement_id, conflict.conflicts_with],
        },
      );
    }
    if (
      !conflict.resolution_record
      || !conflict.resolved_by
      || !conflict.resolved_at
    ) {
      reject(
        repositoryUri,
        requirement,
        "DRP_REQUIREMENT_CONFLICT_UNRESOLVED",
        `Requirement ${requirement.requirement_id} has incomplete conflict resolution lineage`,
        {
          field: "conflicts",
          expected: "resolution_record, resolved_by and resolved_at",
          actual: "incomplete",
          related_ids: [requirement.requirement_id, conflict.conflicts_with],
        },
      );
    }
  }
}

function validateRequirementIdentity(repositoryUri, requirement) {
  if (!requirement.requirement_id.startsWith("REQ-")) return;
  const expected = `REQ-${officialIdentityUuid({
    record: requirement,
    repositoryUri,
    schema: schemas.requirement,
    registry: schemaRegistry,
  })}`;
  if (expected !== requirement.requirement_id) {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
      `Requirement identity mismatch for ${requirement.requirement_id}`,
      {
        field: "requirement_id",
        expected,
        actual: requirement.requirement_id,
        related_ids: [requirement.requirement_id],
      },
    );
  }
}

function validateRequirement(repositoryUri, repositorySha, requirement) {
  if (requirement?.record_kind !== "CANONICAL_REQUIREMENT") {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_EXTRACTION_FAILED",
      "Planner input must contain CANONICAL_REQUIREMENT records",
      {
        field: "record_kind",
        expected: "CANONICAL_REQUIREMENT",
        actual: requirement?.record_kind ?? null,
      },
    );
  }
  if (requirement.schema_version !== "1.0.0") {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_EXTRACTION_FAILED",
      `Unsupported Requirement schema version ${requirement.schema_version}`,
      {
        field: "schema_version",
        expected: "1.0.0",
        actual: requirement.schema_version,
        related_ids: [requirement.requirement_id],
      },
    );
  }
  try {
    canonicalRecordBytes(requirement, {
      schema: schemas.requirement,
      registry: schemaRegistry,
    });
  } catch (error) {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_EXTRACTION_FAILED",
      `Requirement schema validation failed: ${error.message}`,
      {
        field: "requirement",
        expected: "schema-valid canonical record",
        actual: error.code ?? error.name,
        related_ids: requirement.requirement_id ? [requirement.requirement_id] : [],
      },
    );
  }
  if (normalizeRepositoryUri(requirement.source.repository) !== repositoryUri) {
    reject(
      repositoryUri,
      requirement,
      "DRP_SOURCE_NOT_FOUND",
      `Requirement ${requirement.requirement_id} belongs to another repository`,
      {
        field: "source.repository",
        expected: repositoryUri,
        actual: requirement.source.repository,
        related_ids: [requirement.requirement_id],
      },
    );
  }
  if (requirement.source.repository_sha !== repositorySha) {
    reject(
      repositoryUri,
      requirement,
      "DRP_SOURCE_STALE",
      `Requirement ${requirement.requirement_id} is pinned to a stale repository SHA`,
      {
        field: "source.repository_sha",
        expected: repositorySha,
        actual: requirement.source.repository_sha,
        related_ids: [requirement.requirement_id],
      },
      "DRY_RUN_STALE",
    );
  }
  if (
    requirement.authority.source_authority !== "APPROVED"
    || !requirement.authority.approval_record
    || !requirement.authority.approved_by
    || !requirement.authority.approved_at
  ) {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_EXTRACTION_FAILED",
      `Requirement ${requirement.requirement_id} lacks approved authority lineage`,
      {
        field: "authority",
        expected: "APPROVED with durable lineage",
        actual: requirement.authority.source_authority,
        related_ids: [requirement.requirement_id],
      },
    );
  }
  if (requirement.authority.approval_record.repository_sha !== repositorySha) {
    reject(
      repositoryUri,
      requirement,
      "DRP_SOURCE_STALE",
      `Requirement ${requirement.requirement_id} approval lineage is stale`,
      {
        field: "authority.approval_record.repository_sha",
        expected: repositorySha,
        actual: requirement.authority.approval_record.repository_sha,
        related_ids: [requirement.requirement_id],
      },
      "DRY_RUN_STALE",
    );
  }
  const expectedContentHash = digestRequirementContent(requirement);
  if (requirement.content_hash !== expectedContentHash) {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
      `Requirement content digest mismatch for ${requirement.requirement_id}`,
      {
        field: "content_hash",
        expected: expectedContentHash,
        actual: requirement.content_hash,
        related_ids: [requirement.requirement_id],
      },
    );
  }
  const expectedRecordHash = digestRecord(requirement, schemas.requirement);
  if (requirement.requirement_record_hash !== expectedRecordHash) {
    reject(
      repositoryUri,
      requirement,
      "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
      `Requirement record digest mismatch for ${requirement.requirement_id}`,
      {
        field: "requirement_record_hash",
        expected: expectedRecordHash,
        actual: requirement.requirement_record_hash,
        related_ids: [requirement.requirement_id],
      },
    );
  }
  validateRequirementIdentity(repositoryUri, requirement);
  validateConflictLineage(repositoryUri, requirement);
  return requirement;
}

function validateInputSnapshot(repositoryUri, inputSnapshot) {
  const zeroDigest =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000";
  const probe = {
    schema_id:
      "https://github.com/woojinhong/metabus_social/schemas/automation/dry-run.schema.json",
    schema_version: "1.0.0",
    record_kind: "READ_ONLY_DRY_RUN",
    dry_run_id: "DR-00000000-0000-5000-8000-000000000000",
    generated_at: inputSnapshot?.existing_state?.snapshot?.as_of
      ?? "1970-01-01T00:00:00Z",
    generated_by: "ah-p1-01-input-validator@1.0.0",
    input_snapshot: inputSnapshot,
    requirements: [],
    requirement_set_digest: zeroDigest,
    work_packages: [],
    work_package_set_digest: zeroDigest,
    workgraph: null,
    issue_drafts: [],
    lock_analysis: {
      required_locks: [],
      conflicts: [],
      safe_parallel_groups: [],
      serialized_groups: [],
      integration_hold_required: false,
    },
    risk_summary: {
      highest_level: "LOW",
      factors: [],
      blocked: true,
    },
    human_decisions: [],
    external_evidence_gaps: [],
    warnings: [],
    errors: [],
    blocked_reasons: ["INPUT_VALIDATION_PROBE"],
    execution_summary: {
      executable_nodes: [],
      blocked_nodes: [],
      human_nodes: [],
      evidence_nodes: [],
      review_nodes: [],
    },
    result: "DRY_RUN_BLOCKED",
    result_digest: zeroDigest,
  };
  try {
    canonicalRecordBytes(probe, {
      schema: schemas["dry-run"],
      registry: schemaRegistry,
    });
  } catch (error) {
    failPlanner({
      repositoryUri,
      code: "DRP_REQUIREMENT_EXTRACTION_FAILED",
      message: `Planner input snapshot validation failed: ${error.message}`,
      details: {
        field: "input_snapshot",
        expected: "schema-valid pinned input snapshot",
        actual: error.code ?? error.name,
      },
    });
  }
}

function validatePinnedInputRelationships({
  repositoryUri,
  repositorySha,
  inputSnapshot,
  requirements,
}) {
  if (inputSnapshot.existing_state.snapshot.source_sha !== repositorySha) {
    failPlanner({
      repositoryUri,
      code: "DRP_SOURCE_STALE",
      message: "Existing-state snapshot is pinned to another repository SHA",
      result: "DRY_RUN_STALE",
      details: {
        field: "existing_state.snapshot.source_sha",
        expected: repositorySha,
        actual: inputSnapshot.existing_state.snapshot.source_sha,
      },
    });
  }
  const requirementIds = requirements.map(({ requirement_id }) => requirement_id);
  const scopedIds = [...inputSnapshot.planning_scope.source_requirement_ids].sort();
  if (JSON.stringify(requirementIds) !== JSON.stringify(scopedIds)) {
    failPlanner({
      repositoryUri,
      code: "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
      message: "Planning scope Requirement IDs do not match the canonical input set",
      details: {
        field: "planning_scope.source_requirement_ids",
        expected: requirementIds.join(","),
        actual: scopedIds.join(","),
        related_ids: sortedUnique([...requirementIds, ...scopedIds]),
      },
    });
  }
  const approvalIds = [...inputSnapshot.execution_authority.approval_record_ids].sort();
  const approvalRecordIds = inputSnapshot.execution_authority.approval_records
    .map(({ approval_record_id }) => approval_record_id)
    .sort();
  if (JSON.stringify(approvalIds) !== JSON.stringify(approvalRecordIds)) {
    failPlanner({
      repositoryUri,
      code: "DRP_WORK_PACKAGE_GRANT_MISSING",
      message: "Approval record IDs and pinned approval records are not bijective",
      details: {
        field: "execution_authority.approval_record_ids",
        expected: approvalRecordIds.join(","),
        actual: approvalIds.join(","),
        related_ids: sortedUnique([...approvalIds, ...approvalRecordIds]),
      },
    });
  }
  const evidenceIds = [
    ...inputSnapshot.external_evidence_context.accepted_evidence_ids,
  ].sort();
  const evidenceRecordIds =
    inputSnapshot.external_evidence_context.accepted_evidence_records
      .map(({ evidence_id }) => evidence_id)
      .sort();
  if (JSON.stringify(evidenceIds) !== JSON.stringify(evidenceRecordIds)) {
    failPlanner({
      repositoryUri,
      code: "DRP_EXTERNAL_EVIDENCE_REQUIRED",
      message: "Evidence IDs and pinned evidence records are not bijective",
      result: "DRY_RUN_BLOCKED",
      details: {
        field: "external_evidence_context.accepted_evidence_ids",
        expected: evidenceRecordIds.join(","),
        actual: evidenceIds.join(","),
        related_ids: sortedUnique([...evidenceIds, ...evidenceRecordIds]),
      },
    });
  }
  validatePinnedRecordDigests(repositoryUri, inputSnapshot);
  const sourceKeys = inputSnapshot.planning_scope.source_documents
    .map((source) => JSON.stringify([
      source.identity_path,
      source.document_path,
      source.section_anchor,
      source.line_range.start,
      source.line_range.end,
    ]));
  if (new Set(sourceKeys).size !== sourceKeys.length) {
    failPlanner({
      repositoryUri,
      code: "DRP_SOURCE_BLOB_MISMATCH",
      message: "Pinned source locators must be unique",
      details: {
        field: "planning_scope.source_documents",
        expected: "one pinned snapshot per source locator",
        actual: sourceKeys.join(","),
      },
    });
  }
  for (const requirement of requirements) {
    const source = inputSnapshot.planning_scope.source_documents.find(
      (candidate) =>
        candidate.document_path === requirement.source.document_path
        && candidate.identity_path === requirement.source.identity_path
        && candidate.section_anchor === requirement.source.section_anchor
        && candidate.line_range.start === requirement.source.line_range.start
        && candidate.line_range.end === requirement.source.line_range.end,
    );
    if (!source) {
      reject(
        repositoryUri,
        requirement,
        "DRP_SOURCE_NOT_FOUND",
        `Pinned source document is missing for ${requirement.requirement_id}`,
        {
          field: "planning_scope.source_documents",
          expected: requirement.source.document_path,
          actual: null,
          related_ids: [requirement.requirement_id],
        },
      );
    }
    if (
      normalizeRepositoryUri(source.repository) !== repositoryUri
      || source.repository_sha !== repositorySha
    ) {
      reject(
        repositoryUri,
        requirement,
        "DRP_SOURCE_STALE",
        `Pinned source locator differs for ${requirement.requirement_id}`,
        {
          field: "planning_scope.source_documents",
          expected: JSON.stringify(source),
          actual: JSON.stringify(requirement.source),
          related_ids: [requirement.requirement_id],
        },
        "DRY_RUN_STALE",
      );
    }
    if (source.document_blob_sha !== requirement.source.document_blob_sha) {
      reject(
        repositoryUri,
        requirement,
        "DRP_SOURCE_BLOB_MISMATCH",
        `Pinned source blob differs for ${requirement.requirement_id}`,
        {
          field: "source.document_blob_sha",
          expected: source.document_blob_sha,
          actual: requirement.source.document_blob_sha,
          related_ids: [requirement.requirement_id],
        },
      );
    }
    if (source.source_text_hash !== requirement.source.source_text_hash) {
      reject(
        repositoryUri,
        requirement,
        "DRP_SOURCE_TEXT_HASH_MISMATCH",
        `Pinned source text hash differs for ${requirement.requirement_id}`,
        {
          field: "source.source_text_hash",
          expected: source.source_text_hash,
          actual: requirement.source.source_text_hash,
          related_ids: [requirement.requirement_id],
        },
        "DRY_RUN_STALE",
      );
    }
  }
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function digestWithoutRecordHash(record) {
  const projection = { ...record };
  delete projection.record_hash;
  return sha256Digest(projection);
}

function validateRecordHash(repositoryUri, record, label, relatedId) {
  const expected = digestWithoutRecordHash(record);
  if (record.record_hash !== expected) {
    failPlanner({
      repositoryUri,
      code: "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
      message: `${label} digest does not match its pinned canonical fields`,
      details: {
        field: `${label}.record_hash`,
        expected,
        actual: record.record_hash,
        related_ids: relatedId ? [relatedId] : [],
      },
    });
  }
}

function validatePinnedRecordDigests(repositoryUri, inputSnapshot) {
  validateRecordHash(
    repositoryUri,
    inputSnapshot.existing_state.snapshot,
    "existing_state.snapshot",
    null,
  );
  for (const record of inputSnapshot.execution_authority.approval_records) {
    validateRecordHash(
      repositoryUri,
      record,
      "execution_authority.approval_records",
      record.approval_record_id,
    );
  }
  for (
    const record
    of inputSnapshot.external_evidence_context.accepted_evidence_records
  ) {
    validateRecordHash(
      repositoryUri,
      record,
      "external_evidence_context.accepted_evidence_records",
      record.evidence_id,
    );
  }
  for (const record of inputSnapshot.existing_state.open_issues) {
    validateRecordHash(
      repositoryUri,
      record,
      "existing_state.open_issues",
      String(record.issue_number),
    );
  }
}

function sortRecords(records, key) {
  return [...records].sort((left, right) =>
    String(left[key]).localeCompare(String(right[key])),
  );
}

function normalizeInputSnapshot(inputSnapshot) {
  const normalized = structuredClone(inputSnapshot);
  normalized.planning_scope.modules.sort();
  normalized.planning_scope.source_requirement_ids.sort();
  normalized.planning_scope.source_documents = [
    ...normalized.planning_scope.source_documents,
  ]
    .sort((left, right) =>
      JSON.stringify([
        left.document_path,
        left.identity_path,
        left.section_anchor,
        left.line_range.start,
        left.line_range.end,
      ]).localeCompare(JSON.stringify([
        right.document_path,
        right.identity_path,
        right.section_anchor,
        right.line_range.start,
        right.line_range.end,
      ])),
    )
    .map((source) => ({
      ...source,
      previous_locations: [...source.previous_locations].sort(),
    }));
  normalized.policy.allowed_work_package_types.sort();
  normalized.policy.allowed_risk_levels.sort();
  normalized.execution_authority.approval_record_ids.sort();
  normalized.execution_authority.allowed_scopes.sort();
  normalized.execution_authority.approval_records = sortRecords(
    normalized.execution_authority.approval_records,
    "approval_record_id",
  ).map((record) => ({ ...record, scope: [...record.scope].sort() }));
  normalized.external_evidence_context.accepted_evidence_ids.sort();
  normalized.external_evidence_context.accepted_evidence_records = sortRecords(
    normalized.external_evidence_context.accepted_evidence_records,
    "evidence_id",
  ).map((record) => ({
    ...record,
    scope: [...record.scope].sort(),
    conflicts: [...record.conflicts].sort(),
  }));
  normalized.existing_state.open_issues = sortRecords(
    normalized.existing_state.open_issues,
    "issue_number",
  );
  normalized.existing_state.completed_work_packages = sortRecords(
    normalized.existing_state.completed_work_packages,
    "work_package_id",
  );
  normalized.existing_state.active_work_packages = sortRecords(
    normalized.existing_state.active_work_packages,
    "work_package_id",
  );
  normalized.existing_state.existing_graphs = sortRecords(
    normalized.existing_state.existing_graphs,
    "graph_id",
  );
  return normalized;
}

function normalizeRequirement(requirement) {
  const normalized = structuredClone(requirement);
  normalized.stable_aliases.sort();
  normalized.source.previous_locations.sort();
  normalized.implementation_gate.scope.sort();
  normalized.external_evidence.references.sort();
  normalized.related_requirements.sort();
  normalized.conflicts.sort((left, right) =>
    left.conflict_id.localeCompare(right.conflict_id),
  );
  normalized.supersedes.sort();
  normalized.superseded_by.sort();
  return normalized;
}

export function loadPlannerInput(text, repositorySha) {
  let input;
  try {
    input = parseJsonStrict(text);
  } catch (error) {
    failPlanner({
      repositoryUri: "https://github.com/woojinhong/metabus_social",
      code: "DRP_REQUIREMENT_EXTRACTION_FAILED",
      message: `Planner input is not strict JSON: ${error.message}`,
      details: {
        field: "requirements",
        expected: "strict JSON",
        actual: error.code ?? error.name,
      },
    });
  }
  const inputKeys = input && typeof input === "object" && !Array.isArray(input)
    ? Object.keys(input).sort()
    : [];
  const expectedKeys = [
    "input_snapshot",
    "requirement_set_digest",
    "requirements",
  ];
  if (JSON.stringify(inputKeys) !== JSON.stringify(expectedKeys)) {
    failPlanner({
      repositoryUri: "https://github.com/woojinhong/metabus_social",
      code: "DRP_REQUIREMENT_EXTRACTION_FAILED",
      message: "Planner input envelope has missing or unknown fields",
      details: {
        field: "input",
        expected: expectedKeys.join(","),
        actual: inputKeys.join(","),
      },
    });
  }
  let repositoryUri;
  try {
    repositoryUri = normalizeRepositoryUri(
      input.input_snapshot?.repository?.canonical_uri ?? "",
    );
  } catch (error) {
    failPlanner({
      repositoryUri: "https://github.com/woojinhong/metabus_social",
      code: "DRP_SOURCE_NOT_FOUND",
      message: `Canonical repository URI is invalid: ${error.message}`,
      details: {
        field: "input_snapshot.repository.canonical_uri",
        expected: "credential-free canonical HTTPS repository URI",
        actual: input.input_snapshot?.repository?.canonical_uri ?? null,
      },
    });
  }
  validateInputSnapshot(repositoryUri, input?.input_snapshot);
  if (!/^[0-9a-f]{40}$/.test(repositorySha ?? "")) {
    failPlanner({
      repositoryUri,
      code: "DRP_INPUT_SHA_MISSING",
      message: "Repository SHA must be 40 lowercase hexadecimal characters",
      details: {
        field: "repository_sha",
        expected: "40 lowercase hexadecimal characters",
        actual: repositorySha ?? null,
      },
    });
  }
  if (input?.input_snapshot?.repository?.repository_sha !== repositorySha) {
    failPlanner({
      repositoryUri,
      code: "DRP_SOURCE_STALE",
      message: "CLI repository SHA does not match the pinned input snapshot",
      result: "DRY_RUN_STALE",
      details: {
        field: "input_snapshot.repository.repository_sha",
        expected: repositorySha,
        actual: input?.input_snapshot?.repository?.repository_sha ?? null,
      },
    });
  }
  if (!Array.isArray(input.requirements) || input.requirements.length === 0) {
    failPlanner({
      repositoryUri,
      code: "DRP_REQUIREMENT_EXTRACTION_FAILED",
      message: "Planner input requires at least one canonical Requirement",
      details: {
        field: "requirements",
        expected: "non-empty array",
        actual: Array.isArray(input.requirements) ? input.requirements.length : null,
      },
    });
  }
  const requirements = input.requirements
    .map((requirement) => validateRequirement(repositoryUri, repositorySha, requirement))
    .map(normalizeRequirement)
    .sort((left, right) => left.requirement_id.localeCompare(right.requirement_id));
  const seen = new Map();
  for (const requirement of requirements) {
    const previous = seen.get(requirement.requirement_id);
    if (previous && previous !== requirement.requirement_record_hash) {
      reject(
        repositoryUri,
        requirement,
        "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
        `Requirement ID ${requirement.requirement_id} has conflicting record digests`,
        {
          field: "requirements",
          expected: previous,
          actual: requirement.requirement_record_hash,
          related_ids: [requirement.requirement_id],
        },
      );
    }
    if (previous) {
      reject(
        repositoryUri,
        requirement,
        "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
        `Requirement ID ${requirement.requirement_id} is duplicated`,
        {
          field: "requirements",
          expected: "unique requirement IDs",
          actual: requirement.requirement_id,
          related_ids: [requirement.requirement_id],
        },
      );
    }
    seen.set(requirement.requirement_id, requirement.requirement_record_hash);
  }
  const requirementSetDigest = digestRequirementSet(repositorySha, requirements);
  validatePinnedInputRelationships({
    repositoryUri,
    repositorySha,
    inputSnapshot: input.input_snapshot,
    requirements,
  });
  if (
    !/^sha256:[0-9a-f]{64}$/.test(input.requirement_set_digest)
    || input.requirement_set_digest !== requirementSetDigest
  ) {
    failPlanner({
      repositoryUri,
      code: "DRP_REQUIREMENT_SET_DIGEST_MISMATCH",
      message: "Pinned Requirement set digest does not match canonical input",
      details: {
        field: "requirement_set_digest",
        expected: requirementSetDigest,
        actual: input.requirement_set_digest,
        related_ids: requirements.map(({ requirement_id }) => requirement_id),
      },
    });
  }
  return {
    inputSnapshot: normalizeInputSnapshot(input.input_snapshot),
    requirements,
    requirementSetDigest,
    repositoryUri,
    repositorySha,
  };
}
