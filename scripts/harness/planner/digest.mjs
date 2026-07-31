import {
  canonicalRecordDigest,
  sha256Digest,
} from "../canonical-json.mjs";
import {
  projectNamespaceUuid,
  uuidv5,
} from "../canonical-identity.mjs";
import { schemaRegistry } from "./schemas.mjs";

export function stableId(prefix, repositoryUri, name) {
  return `${prefix}-${uuidv5(`${prefix}\n${name}`, projectNamespaceUuid(repositoryUri))}`;
}

export function digestRecord(record, schema) {
  return canonicalRecordDigest(record, { schema, registry: schemaRegistry });
}

export function digestRequirementSet(repositorySha, requirements) {
  return sha256Digest({
    repository_sha: repositorySha,
    requirements: [...requirements]
      .map(({ requirement_id, requirement_record_hash }) => ({
        requirement_id,
        requirement_record_hash,
      }))
      .sort((left, right) => left.requirement_id.localeCompare(right.requirement_id)),
  });
}

export function digestWorkPackageSet(workPackages) {
  return sha256Digest({
    work_packages: [...workPackages]
      .map((workPackage) => ({
        work_package_id: workPackage.work_package_id,
        work_package_revision: workPackage.work_package_revision,
        work_package_plan_digest: workPackage.work_package_plan_digest,
      }))
      .sort((left, right) => left.work_package_id.localeCompare(right.work_package_id)),
  });
}

export function digestRequirementContent(requirement) {
  return sha256Digest({
    requirement_kind: requirement.requirement_kind,
    statement: requirement.statement,
    rationale: requirement.rationale,
    acceptance_intent: requirement.acceptance_intent,
  });
}
