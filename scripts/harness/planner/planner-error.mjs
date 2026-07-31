import { canonicalRecordBytes } from "../canonical-json.mjs";
import { stableId } from "./digest.mjs";
import { schemaRegistry, schemas } from "./schemas.mjs";

const ERROR_SCHEMA_ID =
  "https://github.com/woojinhong/metabus_social/schemas/automation/error.schema.json";

export class PlannerError extends Error {
  constructor(record) {
    super(record.message);
    this.name = "PlannerError";
    this.record = record;
  }
}

export function createErrorRecord({
  repositoryUri,
  code,
  message,
  result = "DRY_RUN_REJECTED",
  severity = "ERROR",
  automaticFix = false,
  ownerIntervention = true,
  blocksDryRun = true,
  source = null,
  details = {},
}) {
  const normalizedDetails = {
    field: details.field ?? null,
    expected: details.expected ?? null,
    actual: details.actual ?? null,
    related_ids: [...new Set(details.related_ids ?? [])].sort(),
  };
  const identity = JSON.stringify({
    code,
    message,
    result,
    source,
    details: normalizedDetails,
  });
  const record = {
    schema_id: ERROR_SCHEMA_ID,
    schema_version: "1.0.0",
    record_kind: "HARNESS_ERROR",
    error_id: stableId("ERR", repositoryUri, identity),
    code,
    severity,
    message,
    result,
    automatic_fix: automaticFix,
    owner_intervention: ownerIntervention,
    blocks_dry_run: blocksDryRun,
    source,
    details: normalizedDetails,
  };
  canonicalRecordBytes(record, { schema: schemas.error, registry: schemaRegistry });
  return record;
}

export function failPlanner(options) {
  throw new PlannerError(createErrorRecord(options));
}
