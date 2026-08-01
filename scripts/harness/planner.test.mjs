import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalRecordBytes,
} from "./canonical-json.mjs";
import {
  compilePlanner,
  serializePlannerResult,
} from "./planner/compiler.mjs";
import { PlannerError } from "./planner/planner-error.mjs";
import { createGitSourcePathOperation } from "./planner/source-tree-inspector.mjs";
import { schemaRegistry, schemas } from "./planner/schemas.mjs";
import {
  clone,
  makePlannerInput,
  REPOSITORY_SHA,
} from "./fixtures/planner/valid/fixture-factory.mjs";

const golden = JSON.parse(
  readFileSync(
    new URL("./fixtures/planner/golden/scenario-summary.json", import.meta.url),
    "utf8",
  ),
);

function compile(input, sourcePathOperation = () => "MODIFY") {
  return compilePlanner(JSON.stringify(input), REPOSITORY_SHA, {
    sourcePathOperation,
  });
}

function assertDryRun(record) {
  assert.doesNotThrow(() =>
    canonicalRecordBytes(record, {
      schema: schemas["dry-run"],
      registry: schemaRegistry,
    }),
  );
}

function assertRejected(mutator, code) {
  const input = makePlannerInput();
  mutator(input);
  assert.throws(
    () => compile(input),
    (error) =>
      error instanceof PlannerError
      && error.record.record_kind === "HARNESS_ERROR"
      && error.record.code === code,
  );
}

test("single approved Requirement produces one schema-valid proposal", () => {
  const result = compile(makePlannerInput());
  assertDryRun(result);
  assert.equal(result.result, golden.single.result);
  assert.equal(result.work_packages.length, golden.single.work_packages);
  assert.equal(result.issue_drafts.length, golden.single.issue_drafts);
  assert.equal(result.issue_drafts[0].renderer_version, golden.renderer_version);
  assert.deepEqual(result.work_packages[0].path_policy.allowed_paths, [{
    path: "docs/test/requirement-1.md",
    match: "EXACT",
  }]);
  assert.deepEqual(
    result.work_packages[0].path_policy.required_paths,
    result.work_packages[0].path_policy.allowed_paths,
  );
  assert.match(result.issue_drafts[0].body, /\nRefs:/);
  assert.doesNotMatch(result.issue_drafts[0].body, /\b(?:Closes|Fixes|Resolves)\b/);
  assert.deepEqual(result.work_packages[0].expected_changes, [{
    path: "docs/test/requirement-1.md",
    operation: "MODIFY",
  }]);
});

test("pinned source tree distinguishes CREATE from MODIFY independently of source documents", () => {
  const input = makePlannerInput([{
    path: "docs/discovery/source-authority.md",
    targetPath: "docs/operations/new-runbook.md",
  }]);
  const observations = [];
  const result = compile(input, ({ path, repositorySha }) => {
    observations.push({ path, repositorySha });
    return "CREATE";
  });
  assertDryRun(result);
  assert.deepEqual(result.work_packages[0].expected_changes, [{
    path: "docs/operations/new-runbook.md",
    operation: "CREATE",
  }]);
  assert.equal(
    result.input_snapshot.planning_scope.source_documents
      .some(({ document_path: documentPath }) =>
        documentPath === "docs/operations/new-runbook.md"),
    false,
  );
  assert.deepEqual(observations, [{
    path: "docs/operations/new-runbook.md",
    repositorySha: REPOSITORY_SHA,
  }]);
});

test("Git source inspector classifies absent and regular targets and rejects symlinks", () => {
  const calls = [];
  const inspect = createGitSourcePathOperation({
    run(executable, args) {
      calls.push({ executable, args });
      const path = args.at(-1);
      if (path === "docs/new.md") return { status: 0, stdout: "", stderr: "" };
      if (path === "docs/existing.md") {
        return {
          status: 0,
          stdout: `100644 blob ${"b".repeat(40)}\tdocs/existing.md\0`,
          stderr: "",
        };
      }
      return {
        status: 0,
        stdout: `120000 blob ${"c".repeat(40)}\tdocs/link.md\0`,
        stderr: "",
      };
    },
  });
  assert.equal(inspect({ path: "docs/new.md", repositorySha: REPOSITORY_SHA }), "CREATE");
  assert.equal(inspect({ path: "docs/existing.md", repositorySha: REPOSITORY_SHA }), "MODIFY");
  assert.throws(
    () => inspect({ path: "docs/link.md", repositorySha: REPOSITORY_SHA }),
    { code: "DRP_SOURCE_TARGET_UNSUPPORTED" },
  );
  assert(calls.every(({ args }) => args[2] === REPOSITORY_SHA));
});

test("two independent Requirements produce parallel Work Package candidates", () => {
  const result = compile(makePlannerInput([
    { alias: "AH-TEST-A", path: "docs/test/a.md" },
    { alias: "AH-TEST-B", path: "docs/test/b.md" },
  ]));
  assertDryRun(result);
  assert.equal(result.result, golden.independent.result);
  assert.equal(result.work_packages.length, golden.independent.work_packages);
  assert.equal(
    result.lock_analysis.safe_parallel_groups[0].length,
    golden.independent.safe_parallel_work_nodes,
  );
});

test("parent Requirement becomes a hard dependency and blocks its child", () => {
  const result = compile(makePlannerInput([
    { alias: "AH-TEST-PARENT", path: "docs/test/parent.md" },
    {
      alias: "AH-TEST-CHILD",
      path: "docs/test/child.md",
      parentAlias: "AH-TEST-PARENT",
    },
  ]));
  assertDryRun(result);
  assert.equal(result.result, golden.blocked_dependency.result);
  assert(result.blocked_reasons.some((reason) =>
    reason.startsWith(golden.blocked_dependency.gate_prefix),
  ));
  assert(result.workgraph.edges.some(({ type }) => type === "REQUIRES"));
});

test("missing implementation grant is BLOCKED_OWNER", () => {
  const result = compile(makePlannerInput([{ gate: "NOT_GRANTED" }]));
  assertDryRun(result);
  assert.equal(result.result, golden.blocked_owner.result);
  assert(result.blocked_reasons.some((reason) =>
    reason.startsWith(golden.blocked_owner.gate_prefix),
  ));
  assert.equal(result.execution_summary.executable_nodes.length, 0);
});

test("matching completed Work Package is omitted as an explicit NO_OP", () => {
  const input = makePlannerInput();
  const initial = compile(input);
  const workPackage = initial.work_packages[0];
  input.input_snapshot.existing_state.completed_work_packages = [{
    work_package_id: workPackage.work_package_id,
    work_package_revision: workPackage.work_package_revision,
    work_package_plan_digest: workPackage.work_package_plan_digest,
  }];
  const result = compile(input);
  assertDryRun(result);
  assert.equal(result.work_packages.length, golden.no_op.work_packages);
  assert.equal(result.issue_drafts.length, golden.no_op.issue_drafts);
  assert.equal(result.workgraph, golden.no_op.workgraph);
});

test("overlapping expected paths emit a deterministic conflict warning", () => {
  const result = compile(makePlannerInput([
    { alias: "AH-TEST-A", path: "docs/test/shared.md" },
    { alias: "AH-TEST-B", path: "docs/test/shared.md", statement: "A second deterministic statement." },
  ]));
  assertDryRun(result);
  assert.equal(result.result, golden.conflict.result);
  assert(result.warnings.some(({ code }) => code === golden.conflict.warning_code));
  assert.equal(result.lock_analysis.serialized_groups.length, 1);
});

test("hard dependency cycle fails closed in a rejected dry-run", () => {
  const input = makePlannerInput([
    { alias: "AH-TEST-A", parentAlias: "AH-TEST-B" },
    { alias: "AH-TEST-B", parentAlias: "AH-TEST-A" },
  ]);
  const result = compile(input);
  assertDryRun(result);
  assert.equal(result.result, golden.cycle.result);
  assert(result.errors.some(({ code }) => code === golden.cycle.error_code));
  assert.equal(result.execution_summary.executable_nodes.length, 0);
});

test("Candidate, missing lineage, stale SHA, unknown field and digest mismatch reject", () => {
  assertRejected((input) => {
    const requirement = input.requirements[0];
    input.input_snapshot.planning_scope.source_requirement_ids = [];
    input.requirements = [{
      schema_id: requirement.schema_id,
      schema_version: "1.0.0",
      record_kind: "CANDIDATE",
      candidate_ref: "candidate:test",
      candidate_status: "PROPOSED",
      requirement_kind: requirement.requirement_kind,
      title: requirement.title,
      statement: requirement.statement,
      rationale: null,
      source: requirement.source,
      acceptance_intent: requirement.acceptance_intent,
    }];
  }, golden.candidate.error_code);
  assertRejected((input) => {
    input.requirements[0].authority.approval_record = null;
  }, "DRP_REQUIREMENT_EXTRACTION_FAILED");
  assertRejected((input) => {
    input.requirements[0].source.repository_sha = "f".repeat(40);
  }, golden.stale.error_code);
  assertRejected((input) => {
    input.requirements[0].unexpected = true;
  }, "DRP_REQUIREMENT_EXTRACTION_FAILED");
  assertRejected((input) => {
    input.requirements[0].content_hash = `sha256:${"f".repeat(64)}`;
  }, "DRP_REQUIREMENT_SET_DIGEST_MISMATCH");
  assertRejected((input) => {
    input.requirements[0].schema_version = "2.0.0";
  }, "DRP_REQUIREMENT_EXTRACTION_FAILED");
  assertRejected((input) => {
    input.input_snapshot.planning_scope.source_documents[0].source_text_hash =
      `sha256:${"f".repeat(64)}`;
  }, "DRP_SOURCE_TEXT_HASH_MISMATCH");
  assertRejected((input) => {
    input.input_snapshot.execution_authority.approval_records[0].record_hash =
      `sha256:${"f".repeat(64)}`;
  }, "DRP_REQUIREMENT_SET_DIGEST_MISMATCH");
});

test("a GRANTED claim without its pinned approval record is BLOCKED_OWNER", () => {
  const input = makePlannerInput();
  input.input_snapshot.execution_authority.approval_record_ids = [];
  input.input_snapshot.execution_authority.approval_records = [];
  const result = compile(input);
  assertDryRun(result);
  assert.equal(result.result, golden.unapproved.result);
  assert(result.blocked_reasons.some((reason) =>
    reason.startsWith(golden.unapproved.gate_prefix),
  ));
});

test("same input and Requirement reordering are byte-identical", () => {
  const input = makePlannerInput([
    { alias: "AH-TEST-A", path: "docs/test/a.md" },
    { alias: "AH-TEST-B", path: "docs/test/b.md" },
  ]);
  const first = serializePlannerResult(compile(input));
  const second = serializePlannerResult(compile(clone(input)));
  const reordered = clone(input);
  reordered.requirements.reverse();
  reordered.input_snapshot.planning_scope.source_requirement_ids.reverse();
  reordered.input_snapshot.planning_scope.source_documents.reverse();
  reordered.input_snapshot.execution_authority.approval_record_ids.reverse();
  reordered.input_snapshot.execution_authority.approval_records.reverse();
  const third = serializePlannerResult(compile(reordered));
  assert.equal(first, second);
  assert.equal(first, third);
});

test("CLI writes stdout or a new OS-temp file only", () => {
  const directory = mkdtempSync(join(tmpdir(), "ah-p1-01-"));
  try {
    const inputPath = join(directory, "input.json");
    const outputPath = join(directory, "output.json");
    const repositorySha = spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).stdout.trim();
    writeFileSync(inputPath, JSON.stringify(makePlannerInput([{}], {
      repositorySha,
    })), "utf8");
    const cliPath = fileURLToPath(new URL("./planner/cli.mjs", import.meta.url));
    const stdoutRun = spawnSync(
      process.execPath,
      [
        cliPath,
        "--requirements",
        inputPath,
        "--repository-sha",
        repositorySha,
      ],
      { encoding: "utf8" },
    );
    assert.equal(stdoutRun.status, 0, stdoutRun.stderr);
    assert.equal(JSON.parse(stdoutRun.stdout).record_kind, "READ_ONLY_DRY_RUN");
    const fileRun = spawnSync(
      process.execPath,
      [
        cliPath,
        "--requirements",
        inputPath,
        "--repository-sha",
        repositorySha,
        "--output",
        outputPath,
      ],
      { encoding: "utf8" },
    );
    assert.equal(fileRun.status, 0, fileRun.stderr);
    assert(existsSync(outputPath));
    const overwrite = spawnSync(
      process.execPath,
      [
        cliPath,
        "--requirements",
        inputPath,
        "--repository-sha",
        repositorySha,
        "--output",
        outputPath,
      ],
      { encoding: "utf8" },
    );
    assert.notEqual(overwrite.status, 0);
    assert.equal(JSON.parse(overwrite.stderr).record_kind, "HARNESS_ERROR");
    const repositoryOutput = join(
      process.cwd(),
      `.ah-p1-01-forbidden-${process.pid}.json`,
    );
    assert.equal(existsSync(repositoryOutput), false);
    const rejectedRepositoryWrite = spawnSync(
      process.execPath,
      [
        cliPath,
        "--requirements",
        inputPath,
        "--repository-sha",
        repositorySha,
        "--output",
        repositoryOutput,
      ],
      { encoding: "utf8" },
    );
    assert.notEqual(rejectedRepositoryWrite.status, 0);
    assert.equal(
      JSON.parse(rejectedRepositoryWrite.stderr).record_kind,
      "HARNESS_ERROR",
    );
    assert.equal(existsSync(repositoryOutput), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("Planner runtime has no mutation, network, or Worker imports and only source inspection may spawn", () => {
  const plannerFiles = [
    "cli.mjs",
    "compiler.mjs",
    "digest.mjs",
    "gate-evaluator.mjs",
    "issue-draft-renderer.mjs",
    "planner-error.mjs",
    "requirement-loader.mjs",
    "schemas.mjs",
    "source-tree-inspector.mjs",
    "work-package-compiler.mjs",
    "workgraph-compiler.mjs",
  ];
  for (const file of plannerFiles) {
    const source = readFileSync(new URL(`./planner/${file}`, import.meta.url), "utf8");
    if (file !== "source-tree-inspector.mjs") {
      assert.doesNotMatch(source, /node:(?:child_process|http|https|net|worker_threads)/);
    }
    assert.doesNotMatch(source, /\b(?:fetch|Octokit|sqlite|worktree)\s*\(/i);
    if (file !== "source-tree-inspector.mjs") {
      assert.doesNotMatch(source, /\b(?:exec|spawn|fork|gh|git)\s*\(/i);
    }
  }
  const inspector = readFileSync(
    new URL("./planner/source-tree-inspector.mjs", import.meta.url),
    "utf8",
  );
  assert.match(inspector, /\["ls-tree", "-z", repositorySha, "--", path\]/u);
  assert.doesNotMatch(inspector, /\b(?:add|commit|push|fetch|checkout|reset|clean)\b/u);
  assert.equal(pathToFileURL(process.cwd()).protocol, "file:");
});
