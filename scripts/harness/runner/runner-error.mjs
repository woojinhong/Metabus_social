export class RunnerError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "RunnerError";
    this.code = code;
    this.details = details;
  }
}

export function failRunner(code, message, details = {}) {
  throw new RunnerError(code, message, details);
}

export function createRunnerErrorRecord(error, context = {}) {
  return {
    record_kind: "LIGHTWEIGHT_RUNNER_ERROR",
    code: error.code ?? "RUNNER_FAILED",
    message: error.message,
    details: error.details ?? null,
    run_id: context.runId ?? null,
    dry_run_id: context.dryRunId ?? null,
  };
}
