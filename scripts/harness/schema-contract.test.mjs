import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  canonicalBytes,
  canonicalRecordBytes,
  canonicalRecordDigest,
  parseJsonStrict,
  serializeJcs,
  sha256Digest,
} from "./canonical-json.mjs";
import {
  officialIdentityUuid,
  projectNamespaceUuid,
} from "./canonical-identity.mjs";

const harnessDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(harnessDirectory, "..", "..");
const schemaDirectory = path.join(repositoryRoot, "schemas", "automation");
const fixtureDirectory = path.join(harnessDirectory, "fixtures");
const expectedSchemaFiles = [
  "common.schema.json",
  "dry-run.schema.json",
  "error.schema.json",
  "requirement.schema.json",
  "work-package.schema.json",
  "workgraph.schema.json",
];

const schemaEntries = await Promise.all(expectedSchemaFiles.map(async (filename) => {
  const text = await readFile(path.join(schemaDirectory, filename), "utf8");
  return { filename, text, schema: parseJsonStrict(text) };
}));
const schemaById = new Map(schemaEntries.map((entry) => [entry.schema.$id, entry]));
const schemaByFilename = new Map(schemaEntries.map((entry) => [entry.filename, entry]));
const canonicalSchemaRegistry = new Map(
  schemaEntries.map((entry) => [entry.schema.$id, entry.schema]),
);

function pointerValue(root, fragment) {
  if (fragment === "" || fragment === "#") return root;
  if (!fragment.startsWith("#/")) throw new Error(`Unsupported JSON Pointer fragment: ${fragment}`);
  return fragment
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, part) => {
      if (value === undefined || value === null || !Object.hasOwn(value, part)) {
        throw new Error(`Unresolved JSON Pointer ${fragment}`);
      }
      return value[part];
    }, root);
}

function resolveRef(ref, currentEntry) {
  const [base = "", fragment = ""] = ref.split("#", 2);
  let targetEntry = currentEntry;
  if (base) {
    const absolute = new URL(base, currentEntry.schema.$id).toString();
    targetEntry = schemaById.get(absolute) ?? schemaByFilename.get(path.basename(base));
  }
  if (!targetEntry) throw new Error(`Unresolved schema document reference ${ref}`);
  return {
    entry: targetEntry,
    schema: pointerValue(targetEntry.schema, fragment ? `#${fragment}` : ""),
  };
}

function jsonTypeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function equalJson(left, right) {
  return serializeJcs(left) === serializeJcs(right);
}

function validateStructural(instance, schema, entry, pointer = "") {
  if (typeof schema === "boolean") return schema ? [] : [`${pointer || "/"}: false schema`];
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, entry);
    return validateStructural(instance, resolved.schema, resolved.entry, pointer);
  }

  const errors = [];
  const location = pointer || "/";
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => jsonTypeMatches(instance, type))) {
      return [`${location}: expected type ${types.join("|")}`];
    }
  }
  if (schema.const !== undefined && !equalJson(instance, schema.const)) {
    errors.push(`${location}: expected const ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((candidate) => equalJson(instance, candidate))) {
    errors.push(`${location}: value is not in enum`);
  }
  if (schema.oneOf) {
    const branchFindings = schema.oneOf.map(
      (candidate) => validateStructural(instance, candidate, entry, pointer),
    );
    const matches = branchFindings.filter((findings) => findings.length === 0);
    if (matches.length !== 1) {
      errors.push(`${location}: expected exactly one oneOf match, got ${matches.length}`);
      if (matches.length === 0) errors.push(...branchFindings.flat());
    }
  }
  if (schema.allOf) {
    for (const candidate of schema.allOf) {
      errors.push(...validateStructural(instance, candidate, entry, pointer));
    }
  }
  if (schema.if) {
    const conditionMatches = validateStructural(instance, schema.if, entry, pointer).length === 0;
    if (conditionMatches && schema.then) {
      errors.push(...validateStructural(instance, schema.then, entry, pointer));
    } else if (!conditionMatches && schema.else) {
      errors.push(...validateStructural(instance, schema.else, entry, pointer));
    }
  }

  if (typeof instance === "string") {
    if (schema.minLength !== undefined && [...instance].length < schema.minLength) {
      errors.push(`${location}: shorter than minLength ${schema.minLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(instance)) {
      errors.push(`${location}: pattern mismatch`);
    }
    if (schema.format === "date-time" && Number.isNaN(Date.parse(instance))) {
      errors.push(`${location}: invalid date-time`);
    }
  }
  if (typeof instance === "number" && schema.minimum !== undefined && instance < schema.minimum) {
    errors.push(`${location}: below minimum ${schema.minimum}`);
  }
  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) {
      errors.push(`${location}: fewer than minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && instance.length > schema.maxItems) {
      errors.push(`${location}: more than maxItems ${schema.maxItems}`);
    }
    if (schema.uniqueItems) {
      const values = instance.map(serializeJcs);
      if (new Set(values).size !== values.length) errors.push(`${location}: duplicate array item`);
    }
    if (schema.items) {
      instance.forEach((item, index) => {
        errors.push(...validateStructural(item, schema.items, entry, `${pointer}/${index}`));
      });
    }
  }
  if (instance !== null && typeof instance === "object" && !Array.isArray(instance)) {
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(instance, required)) errors.push(`${location}: missing required ${required}`);
    }
    for (const [key, value] of Object.entries(instance)) {
      const propertySchema = schema.properties?.[key];
      if (propertySchema) {
        errors.push(...validateStructural(value, propertySchema, entry, `${pointer}/${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${location}: unknown property ${key}`);
      } else if (
        schema.additionalProperties
        && typeof schema.additionalProperties === "object"
      ) {
        errors.push(
          ...validateStructural(value, schema.additionalProperties, entry, `${pointer}/${key}`),
        );
      }
    }
  }
  return errors;
}

function visitSchema(schema, callback, pointer = "") {
  if (schema === null || typeof schema !== "object") return;
  callback(schema, pointer);
  if (Array.isArray(schema)) {
    schema.forEach((item, index) => visitSchema(item, callback, `${pointer}/${index}`));
    return;
  }
  for (const [key, value] of Object.entries(schema)) {
    if (key === "enum" || key === "required") continue;
    visitSchema(value, callback, `${pointer}/${key}`);
  }
}

async function fixtureEntries(group) {
  const directory = path.join(fixtureDirectory, "schema", group);
  const filenames = (await readdir(directory)).filter((name) => name.endsWith(".json")).sort();
  return Promise.all(filenames.map(async (filename) => {
    const text = await readFile(path.join(directory, filename), "utf8");
    return { filename, instance: parseJsonStrict(text) };
  }));
}

test("all six Draft 2020-12 schemas parse with unique IDs and version 1.0.0", async () => {
  const actual = (await readdir(schemaDirectory)).filter((name) => name.endsWith(".schema.json")).sort();
  assert.deepEqual(actual, expectedSchemaFiles);
  assert.equal(schemaById.size, expectedSchemaFiles.length);
  for (const { schema } of schemaEntries) {
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema["x-schema-version"], "1.0.0");
    assert.match(schema.$id, /^https:\/\/github\.com\/woojinhong\/metabus_social\/schemas\/automation\//);
  }
});

test("every local reference resolves and schema object definitions fail closed", () => {
  for (const entry of schemaEntries) {
    visitSchema(entry.schema, (schema, pointer) => {
      if (schema.$ref) assert.doesNotThrow(() => resolveRef(schema.$ref, entry), `${entry.filename}${pointer}`);
      if (schema.type === "object") {
        assert.equal(
          schema.additionalProperties,
          false,
          `${entry.filename}${pointer} must explicitly fail closed`,
        );
      }
      if (schema.required && schema.properties) {
        for (const required of schema.required) {
          assert.ok(Object.hasOwn(schema.properties, required), `${entry.filename}${pointer} missing property ${required}`);
        }
      }
      if (schema.enum) {
        assert.equal(new Set(schema.enum.map(serializeJcs)).size, schema.enum.length);
      }
    });
  }
});

test("record schema IDs and versions are exact and prerelease inputs are absent", () => {
  for (const entry of schemaEntries.filter(({ filename }) => filename !== "common.schema.json")) {
    assert.ok(entry.schema["x-canonicalization"], `${entry.filename} lacks canonicalization metadata`);
    if (entry.filename === "requirement.schema.json") {
      for (const definition of ["candidate", "canonicalRequirement"]) {
        assert.equal(entry.schema.$defs[definition].properties.schema_id.const, entry.schema.$id);
      }
    } else {
      assert.equal(entry.schema.properties.schema_id.const, entry.schema.$id);
    }
  }
  const schemaText = schemaEntries.map(({ text }) => text).join("\n");
  assert.equal(schemaText.includes("1.0.0-proposal"), false);
});

test("WorkGraph plan contains no Runtime Ledger fields", () => {
  const text = schemaByFilename.get("workgraph.schema.json").text;
  for (const forbidden of [
    "attempt_id",
    "lease_expires_at",
    "heartbeat_at",
    "attempt_fence",
    "lock_fence",
    "active_attempt",
    "worker_id",
  ]) {
    assert.equal(text.includes(`\"${forbidden}\"`), false, forbidden);
  }
});

test("all valid fixtures pass the documented structural subset", async () => {
  for (const fixture of await fixtureEntries("valid")) {
    const entry = schemaById.get(fixture.instance.schema_id);
    assert.ok(entry, `${fixture.filename} has a registered schema_id`);
    assert.deepEqual(validateStructural(fixture.instance, entry.schema, entry), [], fixture.filename);
  }
});

test("all invalid fixtures fail the documented structural subset", async () => {
  const expectedFindings = {
    "requirement-approved-without-lineage.json": "/authority/approval_record: expected type object",
    "requirement-candidate-escalation.json": "unknown property requirement_id",
    "requirement-granted-without-approved-authority.json": "/authority/source_authority: expected const",
    "requirement-incompatible-version.json": "/schema_version: expected const",
    "requirement-unknown-field.json": "unknown property unexpected",
    "work-package.json": "/type: value is not in enum",
    "workgraph.json": "unknown property attempt_id",
    "dry-run.json": "/schema_version: expected const",
    "error.json": "/code: value is not in enum",
  };
  for (const fixture of await fixtureEntries("invalid")) {
    const entry = schemaById.get(fixture.instance.schema_id);
    assert.ok(entry, `${fixture.filename} has a registered schema_id`);
    const findings = validateStructural(fixture.instance, entry.schema, entry);
    assert.ok(findings.length > 0, fixture.filename);
    assert.ok(
      findings.some((finding) => finding.includes(expectedFindings[fixture.filename])),
      `${fixture.filename}: ${findings.join("; ")}`,
    );
  }
});

test("GRANTED Requirement gates require durable grant lineage and non-empty scope", async () => {
  const requirement = parseJsonStrict(
    await readFile(path.join(fixtureDirectory, "schema", "valid", "requirement.json"), "utf8"),
  );
  requirement.implementation_gate.state = "GRANTED";
  const entry = schemaByFilename.get("requirement.schema.json");
  const findings = validateStructural(requirement, entry.schema, entry);
  for (const expected of [
    "/implementation_gate/approval_record_id: expected type string",
    "/implementation_gate/grant_source: expected type object",
    "/implementation_gate/granted_by: expected type string",
    "/implementation_gate/granted_at: expected type string",
    "/implementation_gate/scope: fewer than minItems 1",
  ]) {
    assert.ok(findings.some((finding) => finding.includes(expected)), findings.join("; "));
  }
});

test("official record canonicalization is schema-bound and deterministic", async () => {
  for (const fixture of await fixtureEntries("valid")) {
    const entry = schemaById.get(fixture.instance.schema_id);
    const options = {
      schema: entry.schema,
      registry: canonicalSchemaRegistry,
    };
    if (fixture.instance.record_kind === "CANDIDATE") {
      assert.throws(
        () => canonicalRecordBytes(fixture.instance, options),
        (error) => error.code === "CANDIDATE_NOT_CANONICAL",
        fixture.filename,
      );
      assert.throws(
        () => canonicalRecordDigest(fixture.instance, options),
        (error) => error.code === "CANDIDATE_NOT_CANONICAL",
        fixture.filename,
      );
      continue;
    }
    assert.deepEqual(
      canonicalRecordBytes(fixture.instance, options),
      canonicalRecordBytes(structuredClone(fixture.instance), options),
      fixture.filename,
    );
    assert.equal(
      canonicalRecordDigest(fixture.instance, options),
      canonicalRecordDigest(structuredClone(fixture.instance), options),
      fixture.filename,
    );
  }
});

test("official Requirement normalization rejects drift and preserves semantic ordering", async () => {
  const requirement = parseJsonStrict(
    await readFile(path.join(fixtureDirectory, "schema", "valid", "requirement.json"), "utf8"),
  );
  const schema = schemaByFilename.get("requirement.schema.json").schema;
  const options = { schema, registry: canonicalSchemaRegistry };

  const unknown = structuredClone(requirement);
  unknown.unexpected = true;
  assert.throws(
    () => canonicalRecordBytes(unknown, options),
    (error) => error.code === "UNKNOWN_FIELD",
  );

  const incompatible = structuredClone(requirement);
  incompatible.schema_version = "2.0.0";
  assert.throws(
    () => canonicalRecordBytes(incompatible, options),
    (error) => error.code === "SCHEMA_MISMATCH",
  );

  const firstSetOrder = structuredClone(requirement);
  firstSetOrder.stable_aliases = ["AH-P0-02", "AH-P0-01"];
  const secondSetOrder = structuredClone(requirement);
  secondSetOrder.stable_aliases = ["AH-P0-01", "AH-P0-02"];
  assert.deepEqual(
    canonicalRecordBytes(firstSetOrder, options),
    canonicalRecordBytes(secondSetOrder, options),
  );

  const firstSemanticOrder = structuredClone(requirement);
  firstSemanticOrder.acceptance_intent = ["first", "second"];
  const secondSemanticOrder = structuredClone(requirement);
  secondSemanticOrder.acceptance_intent = ["second", "first"];
  assert.notDeepEqual(
    canonicalRecordBytes(firstSemanticOrder, options),
    canonicalRecordBytes(secondSemanticOrder, options),
  );

  const differentAudit = structuredClone(requirement);
  differentAudit.created_at = "2026-08-01T00:00:00Z";
  differentAudit.generated_by = "another-generator";
  assert.deepEqual(
    canonicalRecordBytes(requirement, options),
    canonicalRecordBytes(differentAudit, options),
  );

  const windowsPath = structuredClone(requirement);
  windowsPath.source.document_path = windowsPath.source.document_path.replaceAll("/", "\\");
  assert.deepEqual(
    canonicalRecordBytes(requirement, options),
    canonicalRecordBytes(windowsPath, options),
  );
});

test("Candidate schema exposes no official identity, digest or execution fields", () => {
  const candidate = schemaByFilename.get("requirement.schema.json").schema.$defs.candidate;
  for (const forbidden of [
    "requirement_id",
    "content_hash",
    "requirement_record_hash",
    "implementation_gate",
    "package_status",
    "execution_grant",
  ]) {
    assert.equal(Object.hasOwn(candidate.properties, forbidden), false, forbidden);
  }
});

test("canonical and identity golden fixtures remain stable", async () => {
  const canonical = parseJsonStrict(
    await readFile(path.join(fixtureDirectory, "canonical", "golden.json"), "utf8"),
  );
  assert.equal(canonicalBytes(canonical.input, canonical.options).toString("utf8"), canonical.expected.canonical_json);
  assert.equal(sha256Digest(canonical.input, canonical.options), canonical.expected.digest);

  const identity = parseJsonStrict(
    await readFile(path.join(fixtureDirectory, "identity", "golden.json"), "utf8"),
  );
  assert.equal(projectNamespaceUuid(identity.repository_uri), identity.project_namespace_uuid);
  const requirement = parseJsonStrict(
    await readFile(path.join(fixtureDirectory, "schema", "valid", "requirement.json"), "utf8"),
  );
  assert.equal(
    officialIdentityUuid({
      record: requirement,
      schema: schemaByFilename.get("requirement.schema.json").schema,
      registry: canonicalSchemaRegistry,
    }),
    identity.official_uuid,
  );
});
