import { runProcess } from "./process-utils.mjs";
import { minimalWorkerEnvironment } from "./worker-process.mjs";

const EXACT_COMMANDS = new Map([
  ["node scripts/docs/semantic-gates.test.mjs", ["node", ["scripts/docs/semantic-gates.test.mjs"]]],
  ["node scripts/docs/validate-docs.mjs", ["node", ["scripts/docs/validate-docs.mjs"]]],
  ["git diff --check", ["git", ["diff", "--check"]]],
]);
const HARNESS_TEST = /^node scripts\/harness\/[a-z0-9._-]+\.test\.mjs$/u;

export function parseAllowedTestCommand(command) {
  if (typeof command !== "string" || command.trim() !== command) {
    throw Object.assign(new Error("Test command must be canonical text"), {
      code: "RUNNER_TEST_COMMAND_DENIED",
    });
  }
  if (EXACT_COMMANDS.has(command)) return EXACT_COMMANDS.get(command);
  if (HARNESS_TEST.test(command)) {
    return ["node", [command.slice("node ".length)]];
  }
  throw Object.assign(new Error(`Test command is not allowlisted: ${command}`), {
    code: "RUNNER_TEST_COMMAND_DENIED",
  });
}

export function createTestRunner({
  run = runProcess,
  networkIsolationVerified = false,
  filesystemIsolationVerified = false,
  processTreeIsolationVerified = false,
  allowPartialContainment = false,
} = {}) {
  return {
    async assertAvailable() {
      if (
        !allowPartialContainment
        && (!networkIsolationVerified
        || !filesystemIsolationVerified
        || !processTreeIsolationVerified)
      ) {
        const error = new Error(
          "Required-test network, filesystem, and process-tree isolation must be independently verified",
        );
        error.code = "RUNNER_TEST_SANDBOX_UNVERIFIED";
        throw error;
      }
      return allowPartialContainment
        ? { status: "PARTIALLY_VERIFIED" }
        : { status: "VERIFIED" };
    },
    async runRequired({ cwd, commands, timeoutMs = 120_000 }) {
      const results = [];
      const deadline = Date.now() + timeoutMs;
      for (const command of commands) {
        const [executable, args] = parseAllowedTestCommand(command);
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          const error = new Error("Required-test wall-clock budget exhausted");
          error.code = "RUNNER_REQUIRED_TEST_FAILED";
          error.results = results;
          throw error;
        }
        const result = await run(executable, args, {
          cwd,
          timeoutMs: remainingMs,
          env: minimalWorkerEnvironment(),
        });
        results.push({
          command,
          exit_code: result.code,
          timed_out: result.timedOut,
          stdout: result.stdout,
          stderr: result.stderr,
        });
        if (result.code !== 0 || result.timedOut) {
          const error = new Error(`Required test failed: ${command}`);
          error.code = "RUNNER_REQUIRED_TEST_FAILED";
          error.results = results;
          throw error;
        }
      }
      return results;
    },
  };
}
