import { createHash } from "node:crypto";

export class CanonicalizationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CanonicalizationError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new CanonicalizationError(code, message);
}

function assertValidUnicode(value, path = "") {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        fail("UNPAIRED_SURROGATE", `Unpaired high surrogate at ${path || "/"}`);
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      fail("UNPAIRED_SURROGATE", `Unpaired low surrogate at ${path || "/"}`);
    }
  }
}

export function normalizeText(value) {
  if (typeof value !== "string") {
    fail("INVALID_TEXT", "Text normalization requires a string");
  }
  assertValidUnicode(value);
  return value.replace(/\r\n?/g, "\n").normalize("NFC");
}

export function normalizePosixPath(value) {
  const normalized = normalizeText(value).replaceAll("\\", "/");
  if (
    normalized.length === 0
    || normalized.startsWith("/")
    || /^[a-zA-Z]:/.test(normalized)
    || normalized.includes("\0")
  ) {
    fail("INVALID_POSIX_PATH", `Path must be root-relative: ${value}`);
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    fail("INVALID_POSIX_PATH", `Path contains an empty or traversal segment: ${value}`);
  }
  return normalized;
}

function splitPointer(pointer) {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) {
    fail("INVALID_CONTRACT_PATH", `Contract path must be a JSON Pointer: ${pointer}`);
  }
  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
}

function pathMatches(pattern, path) {
  const expected = splitPointer(pattern);
  const actual = splitPointer(path);
  return expected.length === actual.length
    && expected.every((segment, index) => segment === "*" || segment === actual[index]);
}

function firstMatching(paths, path) {
  return paths.find((candidate) => pathMatches(candidate, path));
}

function childPath(parent, key) {
  const escaped = String(key).replaceAll("~", "~0").replaceAll("/", "~1");
  return `${parent}/${escaped}`;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertAllowedKeys(value, path, allowedKeys) {
  const rule = Object.entries(allowedKeys).find(([pattern]) => pathMatches(pattern, path));
  if (!rule) return;
  const allowed = new Set(rule[1]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      fail("UNKNOWN_FIELD", `Unknown field ${childPath(path, key) || "/"} for canonical contract`);
    }
  }
}

function setKey(value, key) {
  if (key === "$value") return serializeJcs(value);
  if (!isPlainObject(value) || !Object.hasOwn(value, key)) {
    fail("SET_KEY_MISSING", `Set-like item is missing stable key ${key}`);
  }
  return serializeJcs(value[key]);
}

function normalizeValue(value, path, contract, stack) {
  if (value === null) return null;
  if (typeof value === "string") {
    const text = normalizeText(value);
    return firstMatching(contract.pathPaths, path) ? normalizePosixPath(text) : text;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("NON_FINITE_NUMBER", `Non-finite number at ${path || "/"}`);
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "undefined") {
    fail("UNDEFINED_VALUE", `Undefined is not an explicit JSON value at ${path || "/"}`);
  }
  if (Array.isArray(value)) {
    if (stack.has(value)) fail("CYCLIC_VALUE", `Cycle detected at ${path || "/"}`);
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        fail("SPARSE_ARRAY", `Sparse arrays are not JSON values at ${path || "/"}`);
      }
    }
    stack.add(value);
    const normalized = value.map(
      (item, index) => normalizeValue(item, childPath(path, index), contract, stack),
    );
    stack.delete(value);
    const rule = contract.setLike.find(({ path: pattern }) => pathMatches(pattern, path));
    if (!rule) return normalized;
    const decorated = normalized.map((item) => ({ item, key: setKey(item, rule.key) }));
    decorated.sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0));
    for (let index = 1; index < decorated.length; index += 1) {
      if (decorated[index - 1].key === decorated[index].key) {
        fail("DUPLICATE_SET_KEY", `Duplicate set key ${decorated[index].key} at ${path || "/"}`);
      }
    }
    return decorated.map(({ item }) => item);
  }
  if (!isPlainObject(value)) {
    fail("NON_JSON_VALUE", `Only plain JSON objects are canonicalizable at ${path || "/"}`);
  }
  if (stack.has(value)) fail("CYCLIC_VALUE", `Cycle detected at ${path || "/"}`);

  assertAllowedKeys(value, path, contract.allowedKeys);
  stack.add(value);
  const result = Object.create(null);
  for (const key of Object.keys(value)) {
    const nextPath = childPath(path, key);
    if (firstMatching(contract.excludedPaths, nextPath)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value")) {
      fail("NON_JSON_VALUE", `Accessor properties are not JSON values at ${nextPath}`);
    }
    const normalizedKey = normalizeText(key);
    if (Object.hasOwn(result, normalizedKey)) {
      fail("DUPLICATE_KEY", `Object keys collide after normalization at ${nextPath}`);
    }
    Object.defineProperty(result, normalizedKey, {
      value: normalizeValue(descriptor.value, nextPath, contract, stack),
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  stack.delete(value);
  return result;
}

export function normalizeCanonicalJson(value, options = {}) {
  const contract = {
    pathPaths: options.pathPaths ?? [],
    setLike: options.setLike ?? [],
    excludedPaths: options.excludedPaths ?? [],
    allowedKeys: options.allowedKeys ?? {},
  };
  return normalizeValue(value, "", contract, new WeakSet());
}

function pointerValue(root, fragment) {
  if (fragment === "" || fragment === "#") return root;
  if (!fragment.startsWith("#/")) {
    fail("UNSUPPORTED_SCHEMA_REF", `Only JSON Pointer schema fragments are supported: ${fragment}`);
  }
  return fragment
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, part) => {
      if (value === undefined || value === null || !Object.hasOwn(value, part)) {
        fail("UNRESOLVED_SCHEMA_REF", `Unresolved schema pointer ${fragment}`);
      }
      return value[part];
    }, root);
}

function schemaRegistryMap(schema, registry) {
  const schemas = new Map([[schema.$id, schema]]);
  if (registry instanceof Map) {
    for (const [key, value] of registry) {
      const candidate = value?.schema ?? value;
      if (candidate?.$id) {
        schemas.set(candidate.$id, candidate);
        schemas.set(key, candidate);
      }
    }
  } else {
    for (const candidate of registry ?? []) {
      if (candidate?.$id) schemas.set(candidate.$id, candidate);
    }
  }
  return schemas;
}

function resolveSchemaRef(ref, documentSchema, schemas) {
  const target = new URL(ref, documentSchema.$id);
  const targetId = `${target.origin}${target.pathname}`;
  const targetSchema = schemas.get(targetId);
  if (!targetSchema) fail("UNRESOLVED_SCHEMA_REF", `Unresolved schema document ${targetId}`);
  return {
    documentSchema: targetSchema,
    schema: pointerValue(targetSchema, target.hash),
  };
}

function schemaTypeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return isPlainObject(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function schemaBranchMatches(value, schema, documentSchema, schemas) {
  let candidate = schema;
  let candidateDocument = documentSchema;
  if (candidate.$ref) {
    const resolved = resolveSchemaRef(candidate.$ref, candidateDocument, schemas);
    candidate = resolved.schema;
    candidateDocument = resolved.documentSchema;
  }
  if (candidate.const !== undefined && serializeJcs(value) !== serializeJcs(candidate.const)) {
    return false;
  }
  if (candidate.enum && !candidate.enum.some((item) => serializeJcs(item) === serializeJcs(value))) {
    return false;
  }
  if (candidate.type !== undefined) {
    const types = Array.isArray(candidate.type) ? candidate.type : [candidate.type];
    if (!types.some((type) => schemaTypeMatches(value, type))) return false;
  }
  if (isPlainObject(value) && candidate.properties) {
    for (const [key, propertySchema] of Object.entries(candidate.properties)) {
      if (!Object.hasOwn(value, key)) continue;
      if (!schemaBranchMatches(value[key], propertySchema, candidateDocument, schemas)) return false;
    }
  }
  for (const required of candidate.required ?? []) {
    if (!isPlainObject(value) || !Object.hasOwn(value, required)) return false;
  }
  return true;
}

function addAllowedKeys(allowedKeys, path, keys) {
  const existing = new Set(allowedKeys[path] ?? []);
  for (const key of keys) existing.add(key);
  allowedKeys[path] = [...existing].sort();
}

function validateAndCompile(value, schema, documentSchema, schemas, path, contract) {
  if (typeof schema === "boolean") {
    if (!schema) fail("SCHEMA_MISMATCH", `False schema at ${path || "/"}`);
    return;
  }
  if (schema.$ref) {
    const isPosixPath = schema.$ref.endsWith("#/$defs/posixPath");
    if (isPosixPath) contract.pathPaths.push(path);
    const resolved = resolveSchemaRef(schema.$ref, documentSchema, schemas);
    validateAndCompile(
      isPosixPath ? normalizePosixPath(value) : value,
      resolved.schema,
      resolved.documentSchema,
      schemas,
      path,
      contract,
    );
    return;
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter(
      (branch) => schemaBranchMatches(value, branch, documentSchema, schemas),
    );
    if (matches.length !== 1) {
      fail("SCHEMA_MISMATCH", `Expected one schema branch at ${path || "/"}, got ${matches.length}`);
    }
    validateAndCompile(value, matches[0], documentSchema, schemas, path, contract);
  }
  if (schema.allOf) {
    for (const branch of schema.allOf) {
      validateAndCompile(value, branch, documentSchema, schemas, path, contract);
    }
  }
  if (schema.if) {
    const conditionMatches = schemaBranchMatches(value, schema.if, documentSchema, schemas);
    if (conditionMatches && schema.then) {
      validateAndCompile(value, schema.then, documentSchema, schemas, path, contract);
    } else if (!conditionMatches && schema.else) {
      validateAndCompile(value, schema.else, documentSchema, schemas, path, contract);
    }
  }

  const location = path || "/";
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => schemaTypeMatches(value, type))) {
      fail("SCHEMA_MISMATCH", `Unexpected type at ${location}`);
    }
  }
  if (schema.const !== undefined && serializeJcs(value) !== serializeJcs(schema.const)) {
    fail("SCHEMA_MISMATCH", `Unexpected constant at ${location}`);
  }
  if (schema.enum && !schema.enum.some((item) => serializeJcs(item) === serializeJcs(value))) {
    fail("SCHEMA_MISMATCH", `Unexpected enum value at ${location}`);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) {
      fail("SCHEMA_MISMATCH", `String is shorter than minLength at ${location}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value)) {
      fail("SCHEMA_MISMATCH", `String does not match pattern at ${location}`);
    }
    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) {
      fail("SCHEMA_MISMATCH", `Invalid date-time at ${location}`);
    }
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    fail("SCHEMA_MISMATCH", `Number is below minimum at ${location}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      fail("SCHEMA_MISMATCH", `Array is shorter than minItems at ${location}`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      fail("SCHEMA_MISMATCH", `Array is longer than maxItems at ${location}`);
    }
    if (schema.uniqueItems) {
      const serialized = value.map(serializeJcs);
      if (new Set(serialized).size !== serialized.length) {
        fail("SCHEMA_MISMATCH", `Array items are not unique at ${location}`);
      }
    }
    if (schema.items) {
      value.forEach((item, index) => {
        validateAndCompile(
          item,
          schema.items,
          documentSchema,
          schemas,
          childPath(path, index),
          contract,
        );
      });
    }
  }
  if (isPlainObject(value)) {
    const properties = schema.properties ?? {};
    if (schema.additionalProperties === false) {
      addAllowedKeys(contract.allowedKeys, path, Object.keys(properties));
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(properties, key)) {
          fail("UNKNOWN_FIELD", `Unknown field ${childPath(path, key)} for ${documentSchema.$id}`);
        }
      }
    }
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(value, required)) {
        fail("SCHEMA_MISMATCH", `Missing required field ${childPath(path, required)}`);
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.hasOwn(value, key)) {
        validateAndCompile(
          value[key],
          propertySchema,
          documentSchema,
          schemas,
          childPath(path, key),
          contract,
        );
      }
    }
  }
}

function canonicalizationProfile(record, schema) {
  const annotation = schema["x-canonicalization"];
  if (!annotation) {
    fail("MISSING_CANONICALIZATION_PROFILE", `Schema ${schema.$id} has no canonicalization profile`);
  }
  if (!annotation.profiles) return annotation;
  const profile = annotation.profiles[record?.record_kind];
  if (!profile) {
    fail(
      "MISSING_CANONICALIZATION_PROFILE",
      `Schema ${schema.$id} has no profile for ${record?.record_kind ?? "unknown record kind"}`,
    );
  }
  return profile;
}

export function canonicalRecordBytes(record, { schema, registry = [] } = {}) {
  if (!schema?.$id || !schema["x-schema-version"]) {
    fail("INVALID_CANONICAL_SCHEMA", "Official canonicalization requires a versioned schema");
  }
  if (!isPlainObject(record)) {
    fail("SCHEMA_MISMATCH", "Official canonicalization requires a record object");
  }
  if (record.record_kind === "CANDIDATE") {
    fail("CANDIDATE_NOT_CANONICAL", "Candidate records cannot produce official canonical bytes");
  }
  if (record.schema_id !== schema.$id || record.schema_version !== schema["x-schema-version"]) {
    fail("SCHEMA_MISMATCH", "Record schema identity/version does not match its canonical schema");
  }
  const profile = canonicalizationProfile(record, schema);
  const contract = {
    pathPaths: [],
    setLike: profile.set_like ?? [],
    excludedPaths: profile.excluded_paths ?? [],
    allowedKeys: {},
  };
  validateAndCompile(
    record,
    schema,
    schema,
    schemaRegistryMap(schema, registry),
    "",
    contract,
  );
  return canonicalBytes(record, contract);
}

export function canonicalRecordDigest(record, options) {
  return `sha256:${createHash("sha256").update(canonicalRecordBytes(record, options)).digest("hex")}`;
}

export function serializeJcs(value) {
  if (value === null) return "null";
  if (typeof value === "string") {
    assertValidUnicode(value);
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("NON_FINITE_NUMBER", "JCS does not allow non-finite numbers");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map(serializeJcs).join(",")}]`;
  if (!isPlainObject(value)) fail("NON_JSON_VALUE", "JCS only accepts JSON values");

  const keys = Object.keys(value).sort();
  const members = keys.map((key) => {
    assertValidUnicode(key);
    return `${JSON.stringify(key)}:${serializeJcs(value[key])}`;
  });
  return `{${members.join(",")}}`;
}

export function canonicalBytes(value, options = {}) {
  return Buffer.from(serializeJcs(normalizeCanonicalJson(value, options)), "utf8");
}

export function sha256Digest(value, options = {}) {
  return `sha256:${createHash("sha256").update(canonicalBytes(value, options)).digest("hex")}`;
}

class StrictJsonParser {
  constructor(text) {
    this.text = text;
    this.index = 0;
  }

  parse() {
    const value = this.parseValue();
    this.skipWhitespace();
    if (this.index !== this.text.length) fail("INVALID_JSON", `Trailing JSON data at ${this.index}`);
    return value;
  }

  skipWhitespace() {
    while (/[\t\n\r ]/.test(this.text[this.index] ?? "")) this.index += 1;
  }

  parseValue() {
    this.skipWhitespace();
    const token = this.text[this.index];
    if (token === "{") return this.parseObject();
    if (token === "[") return this.parseArray();
    if (token === "\"") return this.parseString();
    if (token === "t") return this.parseLiteral("true", true);
    if (token === "f") return this.parseLiteral("false", false);
    if (token === "n") return this.parseLiteral("null", null);
    return this.parseNumber();
  }

  parseObject() {
    this.index += 1;
    const result = {};
    const keys = new Set();
    this.skipWhitespace();
    if (this.text[this.index] === "}") {
      this.index += 1;
      return result;
    }
    while (true) {
      this.skipWhitespace();
      if (this.text[this.index] !== "\"") fail("INVALID_JSON", `Expected object key at ${this.index}`);
      const key = this.parseString();
      if (keys.has(key)) fail("DUPLICATE_KEY", `Duplicate object key ${key}`);
      keys.add(key);
      this.skipWhitespace();
      if (this.text[this.index] !== ":") fail("INVALID_JSON", `Expected colon at ${this.index}`);
      this.index += 1;
      Object.defineProperty(result, key, {
        value: this.parseValue(),
        enumerable: true,
        configurable: true,
        writable: true,
      });
      this.skipWhitespace();
      if (this.text[this.index] === "}") {
        this.index += 1;
        return result;
      }
      if (this.text[this.index] !== ",") fail("INVALID_JSON", `Expected comma at ${this.index}`);
      this.index += 1;
    }
  }

  parseArray() {
    this.index += 1;
    const result = [];
    this.skipWhitespace();
    if (this.text[this.index] === "]") {
      this.index += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue());
      this.skipWhitespace();
      if (this.text[this.index] === "]") {
        this.index += 1;
        return result;
      }
      if (this.text[this.index] !== ",") fail("INVALID_JSON", `Expected comma at ${this.index}`);
      this.index += 1;
    }
  }

  parseString() {
    const start = this.index;
    this.index += 1;
    let escaped = false;
    while (this.index < this.text.length) {
      const character = this.text[this.index];
      if (!escaped && character === "\"") {
        this.index += 1;
        let parsed;
        try {
          parsed = JSON.parse(this.text.slice(start, this.index));
        } catch {
          fail("INVALID_JSON", `Invalid JSON string at ${start}`);
        }
        assertValidUnicode(parsed, `offset ${start}`);
        return parsed;
      }
      if (!escaped && character === "\\") {
        escaped = true;
      } else {
        escaped = false;
      }
      this.index += 1;
    }
    fail("INVALID_JSON", `Unterminated JSON string at ${start}`);
  }

  parseLiteral(literal, value) {
    if (this.text.slice(this.index, this.index + literal.length) !== literal) {
      fail("INVALID_JSON", `Invalid token at ${this.index}`);
    }
    this.index += literal.length;
    return value;
  }

  parseNumber() {
    const match = this.text.slice(this.index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) fail("INVALID_JSON", `Invalid JSON value at ${this.index}`);
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) fail("NON_FINITE_NUMBER", `Non-finite JSON number at ${this.index}`);
    return value;
  }
}

export function parseJsonStrict(text) {
  if (typeof text !== "string") fail("INVALID_JSON", "JSON input must be text");
  return new StrictJsonParser(text).parse();
}

export function canonicalizeJsonText(text, options = {}) {
  return canonicalBytes(parseJsonStrict(text), options);
}
