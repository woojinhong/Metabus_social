import { createWriteStream } from "node:fs";
import { access } from "node:fs/promises";
import { delimiter, isAbsolute } from "node:path";
import { runProcess } from "./process-utils.mjs";

const SECRET_ENV_PATTERN =
  /(TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|COOKIE|AUTH|KEY|GH_|GITHUB_)/iu;

export function minimalWorkerEnvironment(source = process.env) {
  const allowed = new Set([
    "PATH", "Path", "PATHEXT", "SystemRoot", "WINDIR", "COMSPEC",
    "TMP", "TEMP", "TMPDIR", "LANG", "LC_ALL", "TERM",
  ]);
  return Object.fromEntries(
    Object.entries(source)
      .filter(([key, value]) =>
        allowed.has(key) && !SECRET_ENV_PATTERN.test(key) && typeof value === "string"),
  );
}

export function createWorkerProcessAdapter({
  executable,
  argsBuilder,
  usageParser,
  networkIsolationVerified = false,
  filesystemIsolationVerified = false,
  processTreeIsolationVerified = false,
  run = runProcess,
} = {}) {
  if (!executable || typeof argsBuilder !== "function" || typeof usageParser !== "function") {
    throw new TypeError("A verified Worker executable, argsBuilder, and usageParser are required");
  }
  return {
    async assertAvailable() {
      if (
        !networkIsolationVerified
        || !filesystemIsolationVerified
        || !processTreeIsolationVerified
      ) {
        const error = new Error(
          "Worker network, filesystem, and process-tree isolation must be independently verified",
        );
        error.code = "RUNNER_WORKER_SANDBOX_UNVERIFIED";
        throw error;
      }
      if (isAbsolute(executable)) await access(executable);
      return {
        executable,
        pathSearch: !isAbsolute(executable),
        delimiter,
        networkIsolationVerified,
        filesystemIsolationVerified,
        processTreeIsolationVerified,
      };
    },
    async run({
      cwd,
      promptPath,
      contextPath,
      logDirectory,
      timeoutMs,
      budget,
    }) {
      const stdoutPath = `${logDirectory}/worker.stdout.log`;
      const stderrPath = `${logDirectory}/worker.stderr.log`;
      const stdoutStream = createWriteStream(stdoutPath, { flags: "wx" });
      const stderrStream = createWriteStream(stderrPath, { flags: "wx" });
      try {
        const result = await run(executable, argsBuilder({
          promptPath,
          contextPath,
          budget,
        }), {
          cwd,
          env: minimalWorkerEnvironment(),
          timeoutMs,
          stdoutStream,
          stderrStream,
        });
        return {
          ...result,
          usage: usageParser(result),
          stdoutPath,
          stderrPath,
        };
      } finally {
        stdoutStream.end();
        stderrStream.end();
      }
    },
  };
}

export function unavailableCodexAdapter() {
  return {
    async assertAvailable() {
      const error = new Error(
        "Codex CLI interface is unavailable or has not been verified in this environment",
      );
      error.code = "RUNNER_CODEX_UNAVAILABLE";
      throw error;
    },
    async run() {
      return this.assertAvailable();
    },
  };
}
