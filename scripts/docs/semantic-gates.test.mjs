import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  formatSemanticFinding,
  inspectSemanticDocument,
  inspectSemanticRepository,
} from "./semantic-gates.mjs";

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "semantic-gates");

async function inspectFixture(name, file) {
  const text = await fs.promises.readFile(path.join(fixtureRoot, name), "utf8");
  return inspectSemanticDocument({ file, text });
}

test("accepts current gate wording", async () => {
  assert.deepEqual(await inspectFixture("current-state.md", "docs/operations/current-state.md"), []);
});

test("reports stale D-024 wording with normalized Windows path and line", async () => {
  const findings = await inspectFixture("stale-current.md", "docs\\operations\\current-state.md");
  assert.equal(findings.length, 1);
  assert.deepEqual(
    { id: findings[0].id, severity: findings[0].severity, file: findings[0].file, line: findings[0].line },
    { id: "SGV-D024-E001", severity: "error", file: "docs/operations/current-state.md", line: 10 },
  );
  const report = formatSemanticFinding(findings[0]);
  for (const label of ["matched wording:", "current authoritative state:", "recommended review action:"]) {
    assert.match(report, new RegExp(label));
  }
});

test("allows dated historical decision wording", async () => {
  assert.deepEqual(
    await inspectFixture("historical-decision.md", "docs/discovery/decisions.md"),
    [],
  );
});

test("allows explicit research quotations", async () => {
  assert.deepEqual(
    await inspectFixture("research-quotation.md", "docs/research/gate-history.md"),
    [],
  );
});

test("rejects implementation_ready true while promotion is unapproved", async () => {
  const findings = await inspectFixture("implementation-ready.md", "docs/spec/api/contract.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-IMPL-E001"]);
});

test("strips an unquoted front matter comment from implementation_ready true", async () => {
  const findings = await inspectFixture("implementation-ready-comment-true.md", "docs/spec/api/contract.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-IMPL-E001"]);
});

test("keeps commented false and quoted hash front matter values non-promoted", async () => {
  for (const fixture of [
    "implementation-ready-comment-false.md",
    "quoted-hash-status.md",
    "quoted-hash-approved-status.md",
  ]) {
    assert.deepEqual(await inspectFixture(fixture, "docs/spec/api/contract.md"), []);
  }
});

test("reports both rule IDs for two independent approval claims in one sentence", async () => {
  const findings = await inspectFixture("contract-promoted.md", "docs/operations/current-state.md");
  // Promotion approval and production implementation authority are separate claims.
  assert.deepEqual(
    findings.map(finding => finding.id),
    ["SGV-CONTRACT-E001", "SGV-CONTRACT-E002"],
  );
});

test("allows explicitly proposal-only Implementation Contract documentation approval", async () => {
  assert.deepEqual(
    await inspectFixture("documentation-only-phase-approved.md", "korea.md"),
    [],
  );
});

test("does not let an unrelated denial hide the following approval claim", async () => {
  const findings = await inspectFixture("unrelated-denial.md", "docs/operations/current-state.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-CONTRACT-E001"]);
});

test("does not carry historical context across a Markdown heading boundary", async () => {
  const findings = await inspectFixture("historical-section-boundary.md", "docs/operations/current-state.md");
  assert.deepEqual(
    findings.map(finding => [finding.id, finding.severity]),
    [["SGV-D024-E001", "error"]],
  );
});

test("does not carry distant historical context within the same section", async () => {
  const findings = await inspectFixture("historical-distance.md", "docs/operations/current-state.md");
  assert.deepEqual(
    findings.map(finding => [finding.id, finding.severity]),
    [["SGV-D024-E001", "error"]],
  );
});

test("detects a bounded multiline Implementation Contract approval claim", async () => {
  const findings = await inspectFixture("multiline-contract-promotion.md", "docs/operations/current-state.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-CONTRACT-E001"]);
});

test("does not join separate Markdown list items", async () => {
  assert.deepEqual(
    await inspectFixture("separate-list-items.md", "docs/operations/current-state.md"),
    [],
  );
});

test("detects approval in an indented continuation of the same list item", async () => {
  const findings = await inspectFixture("list-continuation-approved.md", "docs/operations/current-state.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-CONTRACT-E001"]);
});

test("does not join separate numbered list items", async () => {
  assert.deepEqual(
    await inspectFixture("numbered-list-boundary.md", "docs/operations/current-state.md"),
    [],
  );
});

test("does not join a prose line to a new blockquote", async () => {
  assert.deepEqual(
    await inspectFixture("blockquote-boundary.md", "docs/operations/current-state.md"),
    [],
  );
});

test("detects a bounded approval continuation after a colon", async () => {
  const findings = await inspectFixture("colon-continuation-approved.md", "docs/operations/current-state.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-CONTRACT-E001"]);
});

test("does not carry a colon continuation across blank, list, or table boundaries", async () => {
  assert.deepEqual(
    await inspectFixture("colon-structural-boundaries.md", "docs/operations/current-state.md"),
    [],
  );
});

test("keeps a denial that wraps immediately before its denied claim", async () => {
  assert.deepEqual(
    await inspectFixture("multiline-denial.md", "docs/spec/api/README.md"),
    [],
  );
});

test("rejects authoritative status on an approval-pending proposal", async () => {
  const findings = await inspectFixture("authoritative-proposal.md", "docs/spec/api/proposal.md");
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-FM-E001"]);
});

test("rejects an approved-for-implementation proposal status", async () => {
  const findings = await inspectFixture(
    "proposal-approved-for-implementation.md",
    "docs/spec/api/proposal.md",
  );
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-FM-E001"]);
});

test("allows explicit negative and pending proposal status variants", async () => {
  for (const fixture of [
    "proposal-not-approved.md",
    "proposal-approval-pending.md",
    "proposal-unapproved.md",
  ]) {
    assert.deepEqual(await inspectFixture(fixture, "docs/spec/api/proposal.md"), []);
  }
});

test("warns for ambiguous post-UX wording without failing it as a direct contradiction", async () => {
  const findings = await inspectFixture("ambiguous-after-ux.md", "docs/spec/api/README.md");
  assert.deepEqual(findings.map(finding => [finding.id, finding.severity]), [["SGV-D024-W002", "warning"]]);
});

test("warns when user-decision classification lacks an approval basis", async () => {
  const findings = await inspectFixture("user-decision-no-authority.md", "docs/operations/unsupported.md");
  assert.deepEqual(findings.map(finding => [finding.id, finding.severity]), [["SGV-FM-W001", "warning"]]);
});

test("detects prohibited authoritative artifact paths without changing repository documents", async t => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "semantic-gates-"));
  t.after(() => fs.promises.rm(root, { recursive: true, force: true }));
  const artifact = path.join(root, "docs", "spec", "api", "openapi.yaml");
  await fs.promises.mkdir(path.dirname(artifact), { recursive: true });
  await fs.promises.writeFile(artifact, "openapi: 3.1.0\n", "utf8");
  const findings = await inspectSemanticRepository(root, new Map());
  assert.deepEqual(findings.map(finding => finding.id), ["SGV-ARTIFACT-E001"]);
});

test("returns deterministic findings on repeated execution", async () => {
  const first = await inspectFixture("stale-current.md", "docs/operations/current-state.md");
  const second = await inspectFixture("stale-current.md", "docs/operations/current-state.md");
  assert.deepEqual(second, first);
});
