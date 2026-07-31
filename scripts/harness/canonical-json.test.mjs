import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canonicalBytes,
  canonicalizeJsonText,
  normalizeCanonicalJson,
  normalizePosixPath,
  parseJsonStrict,
  serializeJcs,
  sha256Digest,
} from "./canonical-json.mjs";

const fixtureUrl = new URL("./fixtures/canonical/golden.json", import.meta.url);
const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));

test("golden canonical bytes and digest are deterministic", () => {
  const first = canonicalBytes(fixture.input, fixture.options);
  const second = canonicalBytes(fixture.input, fixture.options);
  assert.deepEqual(first, second);
  assert.equal(first.toString("utf8"), fixture.expected.canonical_json);
  assert.equal(sha256Digest(fixture.input, fixture.options), fixture.expected.digest);
});

test("normalizes NFC, LF, POSIX paths and set-like arrays", () => {
  const normalized = normalizeCanonicalJson(fixture.input, fixture.options);
  assert.equal(normalized.title, "Café\nowner");
  assert.equal(normalized.source.path, "docs/spec/example.md");
  assert.deepEqual(normalized.tags, ["alpha", "zeta"]);
  assert.deepEqual(
    normalized.requirements.map(({ requirement_id }) => requirement_id),
    ["REQ-a", "REQ-b"],
  );
  assert.deepEqual(normalized.steps, ["second", "first"]);
  assert.equal(Object.hasOwn(normalized, "generated_at"), false);
});

test("preserves semantic array order and distinguishes null from omission", () => {
  const base = { steps: ["first", "second"] };
  const reordered = { steps: ["second", "first"] };
  assert.notEqual(sha256Digest(base), sha256Digest(reordered));
  assert.notEqual(sha256Digest({ optional: null }), sha256Digest({}));
});

test("rejects unknown fields under an explicit schema contract", () => {
  assert.throws(
    () => normalizeCanonicalJson({ allowed: true, surprise: true }, {
      allowedKeys: { "": ["allowed"] },
    }),
    ({ code }) => code === "UNKNOWN_FIELD",
  );
});

test("rejects non-finite numbers and unsupported JSON values", () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => canonicalBytes({ value }), ({ code }) => code === "NON_FINITE_NUMBER");
  }
  assert.throws(() => canonicalBytes({ value: undefined }), ({ code }) => code === "UNDEFINED_VALUE");
});

test("strict JSON parser rejects duplicate keys and unpaired surrogates", async () => {
  const duplicate = await readFile(new URL("./fixtures/canonical/duplicate-key.json", import.meta.url), "utf8");
  const surrogate = await readFile(new URL("./fixtures/canonical/unpaired-surrogate.json", import.meta.url), "utf8");
  assert.throws(() => parseJsonStrict(duplicate), ({ code }) => code === "DUPLICATE_KEY");
  assert.throws(
    () => parseJsonStrict('{"a":1,"\\u0061":2}'),
    ({ code }) => code === "DUPLICATE_KEY",
  );
  assert.throws(() => parseJsonStrict(surrogate), ({ code }) => code === "UNPAIRED_SURROGATE");
});

test("strict parsing and JCS key ordering produce stable UTF-8 bytes", () => {
  const bytes = canonicalizeJsonText('{"z":1,"a":{"b":2,"a":1}}');
  assert.equal(bytes.toString("utf8"), '{"a":{"a":1,"b":2},"z":1}');
  assert.equal(serializeJcs({ negativeZero: -0 }), '{"negativeZero":0}');
  assert.equal(
    serializeJcs({ n: 333333333.33333329, small: 1e-7, threshold: 0.000001, zero: -0 }),
    '{"n":333333333.3333333,"small":1e-7,"threshold":0.000001,"zero":0}',
  );
});

test("root-relative POSIX paths reject absolute and traversal inputs", () => {
  assert.equal(normalizePosixPath("docs\\spec\\file.md"), "docs/spec/file.md");
  for (const path of ["/docs/file.md", "../file.md", "docs/../file.md", "C:\\repo\\file.md"]) {
    assert.throws(() => normalizePosixPath(path), ({ code }) => code === "INVALID_POSIX_PATH");
  }
});
