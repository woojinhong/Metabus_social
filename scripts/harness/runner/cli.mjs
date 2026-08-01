#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseJsonStrict,
  serializeJcs,
} from "../canonical-json.mjs";
import { createCodexWorkerAdapter } from "./codex-worker-adapter.mjs";
import { runLightweightRunner } from "./runner.mjs";
import { createRunnerErrorRecord } from "./runner-error.mjs";
import { validateApprovedWorkerPolicy } from "./worker-policy.mjs";

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
    "    [--prepare-only | --execute-patch-only | --execute-and-publish]",
    "    [--real-codex-worker",
    "      --codex-executable <absolute-path>",
    "      --worker-sandbox <read-only|workspace-write>",
    "      --worker-approval <never>]",
    "",
    "Default mode is --prepare-only with the unavailable Worker adapter.",
    "Real Codex execution requires all explicit Worker flags, an exact approved",
    "worker_policy record, and independently verified containment evidence.",
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
    "--codex-executable",
    "--worker-sandbox",
    "--worker-approval",
  ]);
  const booleanFlags = new Set([
    "--prepare-only",
    "--execute-patch-only",
    "--execute-and-publish",
    "--real-codex-worker",
  ]);
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
  const selectedModes = [
    "--prepare-only",
    "--execute-patch-only",
    "--execute-and-publish",
  ].filter((flag) => parsed[flag]);
  if (selectedModes.length > 1) {
    throw new TypeError("Choose only one Runner mode");
  }
  if (!isAbsolute(parsed["--repository"]) || !isAbsolute(parsed["--worktree-root"])) {
    throw new TypeError("--repository and --worktree-root must be absolute paths");
  }
  const workerValues = [
    "--codex-executable",
    "--worker-sandbox",
    "--worker-approval",
  ];
  if (parsed["--real-codex-worker"]) {
    if (!parsed["--execute-and-publish"] && !parsed["--execute-patch-only"]) {
      throw new TypeError(
        "--real-codex-worker requires --execute-patch-only or --execute-and-publish",
      );
    }
    for (const flag of workerValues) {
      if (!parsed[flag]) throw new TypeError(`${flag} is required for --real-codex-worker`);
    }
    if (!isAbsolute(parsed["--codex-executable"])) {
      throw new TypeError("--codex-executable must be absolute");
    }
  } else if (workerValues.some((flag) => parsed[flag])) {
    throw new TypeError("Codex Worker options require --real-codex-worker");
  }
  return parsed;
}

export async function runCli(args, {
  runner = runLightweightRunner,
  codexAdapterFactory = createCodexWorkerAdapter,
} = {}) {
  const parsed = parseRunnerArgs(args);
  const repository = resolve(parsed["--repository"]);
  const repositorySha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repository,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
  const dryRun = parseJsonStrict(readFileSync(resolve(parsed["--dry-run"]), "utf8"));
  const approval = parseJsonStrict(readFileSync(resolve(parsed["--approval"]), "utf8"));
  let adapters = {};
  if (parsed["--real-codex-worker"]) {
    const configuration = {
      executable: resolve(parsed["--codex-executable"]),
      sandbox: parsed["--worker-sandbox"],
      approvalMode: parsed["--worker-approval"],
    };
    validateApprovedWorkerPolicy(approval, configuration);
    adapters = {
      worker: codexAdapterFactory({
        ...configuration,
        allowPartialContainment: parsed["--execute-patch-only"] === true,
        isolationEvidence: {
          network: false,
          filesystem: false,
          processTree: false,
        },
        costAuthority: {
          authentication_mode: approval.authentication_mode,
          monetary_cost_policy: approval.monetary_cost_policy,
          publication_mode: approval.publication_mode,
          production: approval.production,
          commit_allowed: approval.commit_allowed,
          push_allowed: approval.push_allowed,
          pr_allowed: approval.pr_allowed,
          exact_allowed_path: approval.allowed_paths?.length === 1
            ? approval.allowed_paths[0]
            : null,
        },
      }),
    };
  }
  const result = await runner({
    dryRun,
    approval,
    approvalRecordHash: parsed["--approval-hash"],
    selectedWorkPackageIds: parsed["--work-packages"].split(","),
    repositorySha,
    maxConcurrency: parsed["--max-concurrency"] === undefined
      ? undefined
      : Number(parsed["--max-concurrency"]),
    worktreeRoot: resolve(parsed["--worktree-root"]),
    repository,
    prepareOnly: !parsed["--execute-and-publish"] && !parsed["--execute-patch-only"],
    executionMode: parsed["--execute-and-publish"]
      ? "EXECUTE_AND_DRAFT_PR"
      : parsed["--execute-patch-only"]
        ? "EXECUTE_PATCH_ONLY"
        : "PREPARE_ONLY",
    adapters,
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
