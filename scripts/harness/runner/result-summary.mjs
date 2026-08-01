export function summarizeRun({
  runId,
  dryRunId,
  state,
  prepareOnly,
  manifestPath,
  packages,
  error = null,
}) {
  return {
    record_kind: "LIGHTWEIGHT_RUNNER_RESULT",
    run_id: runId,
    dry_run_id: dryRunId,
    state,
    prepare_only: prepareOnly,
    manifest_path: manifestPath,
    packages: packages.map((entry) => ({
      work_package_id: entry.workPackageId,
      state: entry.state,
      branch: entry.branch,
      worktree_path: entry.worktreePath,
      worker_pid: entry.workerPid ?? null,
      changed_files: entry.changedFiles ?? [],
      tests: entry.tests ?? [],
      commit_sha: entry.commitSha ?? null,
      draft_pr_url: entry.draftPrUrl ?? null,
      error_code: entry.errorCode ?? null,
      diagnostics_path: entry.diagnosticsPath ?? null,
      artifact_paths: entry.artifactPaths ?? null,
    })),
    error: error === null
      ? null
      : {
          code: error.code ?? "RUNNER_FAILED",
          message: error.message,
          details: error.details ?? null,
        },
  };
}
