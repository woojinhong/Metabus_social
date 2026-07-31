#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseJsonStrict,
  serializeJcs,
} from "../canonical-json.mjs";
import { runLightweightRunner } from "./runner.mjs";
import { createRunnerErrorRecord } from "./runner-error.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/harness/runner/cli.mjs",
    "    --dry-run <planner-output.json>",
    "    --approval <owner-run-approval.json>",
    "    --approval-hash <sha256:...>",
    "    --work-packages <wp-id-1,wp-id-2>",
    "    --repository <absolute-path>",
    "    --worktree-root <absolute-path>",
    "    [--max-concurrency <1..3>]",
    "    [--prepare-only | --execute-and-publish]",
    "",
    "Default mode is --prepare-only. Execution requires a verified injected",
    "Codex Worker adapter and exact Owner publication approval.",
  ].join("\n");
}

export function parseRunnerArgs(args) {
  const valueFlags = new Set([
    "--dry-run",
    "--approval",
    "--approval-hash",
    "--work-packages",
    "--repository",
    "--worktree-root",
    "--max-concurrency",
  ]);
  const booleanFlags = new Set(["--prepare-only", "--execute-and-publish"]);
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (booleanFlags.has(flag)) {
      if (Object.hasOwn(parsed, flag)) throw new TypeError(`Duplicate option ${flag}\n${usage()}`);
      parsed[flag] = true;
      continue;
    }
    if (!valueFlags.has(flag)) throw new TypeError(usage());
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) throw new TypeError(usage());
    if (Object.hasOwn(parsed, flag)) throw new TypeError(`Duplicate option ${flag}\n${usage()}`);
    parsed[flag] = value;
    index += 1;
  }
  for (const required of [
    "--dry-run", "--approval", "--approval-hash", "--work-packages",
    "--repository", "--worktree-root",
  ]) {
    if (!parsed[required]) throw new TypeError(usage());
  }
  if (parsed["--prepare-only"] && parsed["--execute-and-publish"]) {
    throw new TypeError("Choose only one Runner mode");
  }
  if (!isAbsolute(parsed["--repository"]) || !isAbsolute(parsed["--worktree-root"])) {
    throw new TypeError("--repository and --worktree-root must be absolute paths");
  }
  return parsed;
}

export async function runCli(args, { runner = runLightweightRunner } = {}) {
  const parsed = parseRunnerArgs(args);
  const repository = resolve(parsed["--repository"]);
  const repositorySha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repository,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
  const result = await runner({
    dryRun: parseJsonStrict(readFileSync(resolve(parsed["--dry-run"]), "utf8")),
    approval: parseJsonStrict(readFileSync(resolve(parsed["--approval"]), "utf8")),
    approvalRecordHash: parsed["--approval-hash"],
    selectedWorkPackageIds: parsed["--work-packages"].split(","),
    repositorySha,
    maxConcurrency: parsed["--max-concurrency"] === undefined
      ? undefined
      : Number(parsed["--max-concurrency"]),
    worktreeRoot: resolve(parsed["--worktree-root"]),
    repository,
    prepareOnly: !parsed["--execute-and-publish"],
  });
  process.stdout.write(`${serializeJcs(result)}\n`);
  return 0;
}

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  runCli(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`${serializeJcs(createRunnerErrorRecord(error))}\n`);
      process.exitCode = 1;
    },
  );
}
