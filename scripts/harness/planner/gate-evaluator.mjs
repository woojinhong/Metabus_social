function arrayContainsAll(values, required) {
  const available = new Set(values);
  return required.every((value) => available.has(value));
}

function approvalRecordFor(requirement, inputSnapshot) {
  const id = requirement.implementation_gate.approval_record_id;
  return inputSnapshot.execution_authority.approval_records.find(
    (record) => record.approval_record_id === id,
  );
}

function sameLocator(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function evidenceRecordsAreValid(requirement, inputSnapshot) {
  const evidence = requirement.external_evidence;
  const recordsById = new Map(
    inputSnapshot.external_evidence_context.accepted_evidence_records
      .map((record) => [record.evidence_id, record]),
  );
  return evidence.references.every((evidenceId) => {
    const record = recordsById.get(evidenceId);
    return (
      record
      && record.state === "ACCEPTED"
      && record.source_sha === requirement.source.repository_sha
      && record.conflicts.length === 0
      && arrayContainsAll(record.scope, requirement.implementation_gate.scope)
      && (
        record.revalidate_at === null
        || record.revalidate_at > inputSnapshot.existing_state.snapshot.as_of
      )
    );
  });
}

export function evaluateRequirementGate(requirement, inputSnapshot) {
  const implementationGate = requirement.implementation_gate;
  const evidence = requirement.external_evidence;
  if (
    implementationGate.state !== "GRANTED"
    || requirement.status.lifecycle !== "APPROVED"
  ) {
    return {
      gate: "BLOCKED_OWNER",
      reason: "EXECUTION_GRANT_MISSING",
      approvalRecord: null,
    };
  }
  const approvalRecord = approvalRecordFor(requirement, inputSnapshot);
  if (
    !approvalRecord
    || approvalRecord.approval_type !== "EXECUTION_APPROVAL"
    || approvalRecord.state !== "GRANTED"
    || approvalRecord.required_actor_role !== "owner"
    || approvalRecord.source_sha !== requirement.source.repository_sha
    || approvalRecord.decided_by === null
    || approvalRecord.decided_at === null
    || !sameLocator(approvalRecord.source, implementationGate.grant_source)
    || !arrayContainsAll(approvalRecord.scope, implementationGate.scope)
    || !arrayContainsAll(
      inputSnapshot.execution_authority.allowed_scopes,
      implementationGate.scope,
    )
  ) {
    return {
      gate: "BLOCKED_OWNER",
      reason: "APPROVAL_RECORD_INVALID",
      approvalRecord: approvalRecord ?? null,
    };
  }
  if (
    approvalRecord.valid_until !== null
    && approvalRecord.valid_until <= inputSnapshot.existing_state.snapshot.as_of
  ) {
    return {
      gate: "BLOCKED_OWNER",
      reason: "APPROVAL_RECORD_EXPIRED",
      approvalRecord,
    };
  }
  if (
    evidence.required
    && (
      evidence.state !== "ACCEPTED"
      || !arrayContainsAll(
        inputSnapshot.external_evidence_context.accepted_evidence_ids,
        evidence.references,
      )
      || !evidenceRecordsAreValid(requirement, inputSnapshot)
    )
  ) {
    return {
      gate: "BLOCKED_OWNER",
      reason: "EXTERNAL_EVIDENCE_REQUIRED",
      approvalRecord,
    };
  }
  return {
    gate: "READY",
    reason: null,
    approvalRecord,
  };
}
