import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { serializeJcs } from "../canonical-json.mjs";
import { failRunner } from "./runner-error.mjs";

export const RUN_STATES = Object.freeze([
  "PROPOSED",
  "APPROVED",
  "PREPARING",
  "RUNNING",
  "TESTING",
  "PR_DRAFT",
  "COMPLETED",
  "BLOCKED",
  "FAILED",
  "FAILED_BUDGET",
  "FAILED_PATH_POLICY",
  "NO_CHANGE",
  "PATCH_READY_FOR_OWNER_REVIEW",
  "CANCELLED",
]);

const TRANSITIONS = Object.freeze({
  PROPOSED: ["APPROVED", "BLOCKED", "CANCELLED"],
  APPROVED: ["PREPARING", "BLOCKED", "CANCELLED"],
  PREPARING: ["RUNNING", "BLOCKED", "FAILED", "FAILED_PATH_POLICY", "CANCELLED"],
  RUNNING: ["TESTING", "BLOCKED", "FAILED", "FAILED_BUDGET", "FAILED_PATH_POLICY", "CANCELLED"],
  TESTING: ["PR_DRAFT", "COMPLETED", "NO_CHANGE", "PATCH_READY_FOR_OWNER_REVIEW", "BLOCKED", "FAILED", "FAILED_BUDGET", "FAILED_PATH_POLICY", "CANCELLED"],
  PR_DRAFT: ["COMPLETED", "BLOCKED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  BLOCKED: [],
  FAILED: [],
  FAILED_BUDGET: [],
  FAILED_PATH_POLICY: [],
  NO_CHANGE: [],
  PATCH_READY_FOR_OWNER_REVIEW: [],
  CANCELLED: [],
});

function timestamp(now) {
  return (typeof now === "function" ? now() : new Date()).toISOString();
}

export async function readRunManifest(manifestPath) {
  return JSON.parse(await readFile(manifestPath, "utf8"));
}

export async function createRunManifest(input, {
  root = join(tmpdir(), "propscans-lightweight-runner"),
  now,
  initialState = "APPROVED",
} = {}) {
  if (!RUN_STATES.includes(initialState)) {
    failRunner("RUNNER_MANIFEST_INVALID", `Unknown initial state ${initialState}`);
  }
  await mkdir(root, { recursive: true });
  const runRoot = resolve(root, input.runId);
  try {
    await mkdir(runRoot, { recursive: false });
  } catch (error) {
    if (error.code === "EEXIST") {
      failRunner("RUNNER_RUN_ID_CONFLICT", `Manifest already exists for run_id ${input.runId}`, {
        runRoot,
      });
    }
    throw error;
  }
  const createdAt = timestamp(now);
  const manifest = {
    record_kind: "LIGHTWEIGHT_RUNNER_MANIFEST",
    run_id: input.runId,
    dry_run_id: input.dryRun.dry_run_id,
    planner_digest: input.dryRun.result_digest,
    selected_work_package_ids: input.selectedWorkPackageIds,
    current_state: initialState,
    created_at: createdAt,
    updated_at: createdAt,
    packages: input.selectedWorkPackages.map((item) => ({
      work_package_id: item.work_package_id,
      branch: item.proposed_branch,
      worktree_path: null,
      state: initialState,
      worker_pid: null,
      test_results: [],
      commit_sha: null,
      draft_pr_url: null,
      error_code: null,
      diagnostics_path: null,
      usage_budget: null,
    })),
    error_code: null,
    diagnostics_path: runRoot,
    claims: {
      crash_recovery: false,
      multi_host_authority: false,
      runtime_ledger: false,
    },
  };
  const manifestPath = join(runRoot, "manifest.json");
  await writeFile(manifestPath, `${serializeJcs(manifest)}\n`, { flag: "wx" });
  return { manifest, manifestPath, runRoot };
}

export async function updateRunManifest(manifestPath, nextState, patch = {}, { now } = {}) {
  const current = await readRunManifest(manifestPath);
  if (!RUN_STATES.includes(nextState)) {
    failRunner("RUNNER_MANIFEST_INVALID", `Unknown state ${nextState}`);
  }
  if (nextState !== current.current_state && !TRANSITIONS[current.current_state].includes(nextState)) {
    failRunner(
      "RUNNER_MANIFEST_TRANSITION_INVALID",
      `Invalid transition ${current.current_state} -> ${nextState}`,
    );
  }
  const next = {
    ...current,
    ...patch,
    current_state: nextState,
    updated_at: timestamp(now),
  };
  const temporaryPath = `${manifestPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${serializeJcs(next)}\n`, { flag: "wx" });
  await rename(temporaryPath, manifestPath);
  return next;
}
