import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  deriveProjectIdentity,
  normalizeRepositoryUri,
  officialIdentityUuid,
  projectNamespaceUuid,
  requirementIdentityName,
  uuidv5,
} from "./canonical-identity.mjs";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/identity/golden.json", import.meta.url), "utf8"),
);
const canonicalRequirement = JSON.parse(
  await readFile(new URL("./fixtures/schema/valid/requirement.json", import.meta.url), "utf8"),
);
const candidateRequirement = JSON.parse(
  await readFile(new URL("./fixtures/schema/valid/requirement-candidate.json", import.meta.url), "utf8"),
);
const requirementSchema = JSON.parse(
  await readFile(new URL("../../schemas/automation/requirement.schema.json", import.meta.url), "utf8"),
);
const commonSchema = JSON.parse(
  await readFile(new URL("../../schemas/automation/common.schema.json", import.meta.url), "utf8"),
);
const schemaOptions = {
  schema: requirementSchema,
  registry: new Map([[commonSchema.$id, commonSchema]]),
};

test("canonical repository URI produces the golden project namespace UUIDv5", () => {
  assert.equal(
    uuidv5("www.example.com", "6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
    "2ed6657d-e927-568b-95e1-2665a8aea6a2",
  );
  assert.equal(normalizeRepositoryUri(fixture.repository_uri), fixture.repository_uri);
  assert.equal(projectNamespaceUuid(fixture.repository_uri), fixture.project_namespace_uuid);
  for (const variant of fixture.repository_variants) {
    assert.equal(normalizeRepositoryUri(variant), fixture.repository_uri);
    assert.equal(projectNamespaceUuid(variant), fixture.project_namespace_uuid);
  }
});

test("canonical Requirement fields produce the golden name and stable official UUID", () => {
  const first = officialIdentityUuid({ record: canonicalRequirement, ...schemaOptions });
  const second = officialIdentityUuid({
    record: structuredClone(canonicalRequirement),
    ...schemaOptions,
  });
  const changedRecord = structuredClone(canonicalRequirement);
  changedRecord.statement = `${changedRecord.statement} Changed.`;
  const changed = officialIdentityUuid({ record: changedRecord, ...schemaOptions });
  assert.equal(requirementIdentityName(canonicalRequirement), fixture.official_name);
  assert.equal(first, fixture.official_uuid);
  assert.equal(first, second);
  assert.notEqual(first, changed);
});

test("candidate records cannot produce official identity even without caller hints", () => {
  assert.throws(
    () => officialIdentityUuid({
      record: candidateRequirement,
      ...schemaOptions,
    }),
    /Candidate records cannot produce official canonical bytes/,
  );
});

test("official identity requires pinned approval lineage and matching repository", () => {
  const missingLineage = structuredClone(canonicalRequirement);
  missingLineage.authority.approval_record = null;
  assert.throws(
    () => officialIdentityUuid({
      record: missingLineage,
      ...schemaOptions,
    }),
    /Expected one schema branch|Unexpected type/,
  );
  assert.throws(
    () => officialIdentityUuid({
      record: canonicalRequirement,
      repositoryUri: "https://github.com/woojinhong/another_repository",
      ...schemaOptions,
    }),
    /does not match/,
  );
});

test("official identity rejects forged approval lineage before UUID generation", () => {
  const emptyLocator = structuredClone(canonicalRequirement);
  emptyLocator.authority.approval_record = {};
  assert.throws(
    () => officialIdentityUuid({ record: emptyLocator, ...schemaOptions }),
    /Missing required field/,
  );

  const invalidTimestamp = structuredClone(canonicalRequirement);
  invalidTimestamp.authority.approved_at = "not-a-time";
  assert.throws(
    () => officialIdentityUuid({ record: invalidTimestamp, ...schemaOptions }),
    /String does not match pattern|Invalid date-time/,
  );

  const incomplete = structuredClone(canonicalRequirement);
  delete incomplete.title;
  assert.throws(
    () => officialIdentityUuid({ record: incomplete, ...schemaOptions }),
    /Expected one schema branch|Missing required field/,
  );
});

test("local path, branch and worktree are excluded from repository identity", () => {
  const first = deriveProjectIdentity({
    repositoryUri: fixture.repository_uri,
    localPath: "C:\\one",
    branch: "master",
    worktree: "worktree-a",
  });
  const second = deriveProjectIdentity({
    repositoryUri: fixture.repository_uri,
    localPath: "D:\\two",
    branch: "feature",
    worktree: "worktree-b",
  });
  assert.deepEqual(first, second);
});

test("repository identity rejects credentials, non-HTTPS and non-repository paths", () => {
  for (const uri of [
    "http://github.com/woojinhong/metabus_social",
    "https://token@github.com/woojinhong/metabus_social",
    "https://github.com:444/woojinhong/metabus_social",
    "https://github.com/woojinhong/metabus_social/issues",
  ]) {
    assert.throws(() => normalizeRepositoryUri(uri));
  }
});
