import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { terminateProcessTree } from "./process-tree.mjs";

export async function runProcess(executable, args, {
  cwd,
  env = process.env,
  timeoutMs = 60_000,
  maxOutputBytes = 1_048_576,
  stdinData = null,
  stdoutStream = null,
  stderrStream = null,
  terminate = terminateProcessTree,
  pipeCloseMs = 2_000,
  terminationTimeoutMs = 12_000,
} = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = performance.now();
    const child = spawn(executable, args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: [stdinData === null ? "ignore" : "pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutSeenBytes = 0;
    let stderrSeenBytes = 0;
    let stdoutCapturedBytes = 0;
    let stderrCapturedBytes = 0;
    let timedOut = false;
    let settled = false;
    let terminationPromise = null;
    let terminationTimer = null;
    let pipeTimer = null;
    let closeRecord = null;

    const clearTimers = () => {
      clearTimeout(timer);
      if (terminationTimer !== null) clearTimeout(terminationTimer);
      if (pipeTimer !== null) clearTimeout(pipeTimer);
    };
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      clearTimers();
      if (Number.isSafeInteger(child.pid) && child.pid > 0 && !error.processResult) {
        error.processResult = {
          code: closeRecord?.code ?? null,
          signal: closeRecord?.signal ?? null,
          timedOut,
          pid: child.pid,
          stdout: Buffer.concat(stdout).toString("utf8"),
          stderr: Buffer.concat(stderr).toString("utf8"),
          stdoutBytes: stdoutSeenBytes,
          stderrBytes: stderrSeenBytes,
          stdoutTruncated: stdoutSeenBytes > stdoutCapturedBytes,
          stderrTruncated: stderrSeenBytes > stderrCapturedBytes,
          durationMs: Math.round(performance.now() - startedAt),
          termination: null,
          partial: true,
        };
      }
      reject(error);
    };
    const resolveOnce = (termination) => {
      if (settled || closeRecord === null) return;
      settled = true;
      clearTimers();
      resolve({
        code: closeRecord.code ?? -1,
        signal: closeRecord.signal,
        timedOut,
        pid: child.pid,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdoutBytes: stdoutSeenBytes,
        stderrBytes: stderrSeenBytes,
        stdoutTruncated: stdoutSeenBytes > stdoutCapturedBytes,
        stderrTruncated: stderrSeenBytes > stderrCapturedBytes,
        durationMs: Math.round(performance.now() - startedAt),
        termination,
      });
    };

    const collect = (chunks, stream, chunk, counters) => {
      stream?.write(chunk);
      counters.seen += chunk.length;
      if (counters.captured < maxOutputBytes) {
        const remaining = maxOutputBytes - counters.captured;
        chunks.push(chunk.subarray(0, remaining));
        counters.captured += Math.min(chunk.length, remaining);
      }
    };
    const stdoutCounter = {
      get seen() { return stdoutSeenBytes; },
      set seen(value) { stdoutSeenBytes = value; },
      get captured() { return stdoutCapturedBytes; },
      set captured(value) { stdoutCapturedBytes = value; },
    };
    const stderrCounter = {
      get seen() { return stderrSeenBytes; },
      set seen(value) { stderrSeenBytes = value; },
      get captured() { return stderrCapturedBytes; },
      set captured(value) { stderrCapturedBytes = value; },
    };
    child.stdout.on("data", (chunk) =>
      collect(stdout, stdoutStream, chunk, stdoutCounter));
    child.stderr.on("data", (chunk) =>
      collect(stderr, stderrStream, chunk, stderrCounter));

    const timer = setTimeout(async () => {
      timedOut = true;
      const terminationDeadline = Date.now() + terminationTimeoutMs;
      const hardDeadline = new Promise((unusedResolve, rejectDeadline) => {
        terminationTimer = setTimeout(() => {
          child.kill();
          child.stdout.destroy();
          child.stderr.destroy();
          const error = new Error(
            "Worker process-tree termination exceeded the hard deadline",
          );
          error.code = "RUNNER_PROCESS_TREE_TERMINATION_FAILED";
          error.details = { pid: child.pid, termination_timeout_ms: terminationTimeoutMs };
          rejectDeadline(error);
        }, terminationTimeoutMs);
        terminationTimer.unref();
      });
      terminationPromise = Promise.race([
        Promise.resolve().then(() => terminate(child)),
        hardDeadline,
      ]);
      let termination;
      try {
        termination = await terminationPromise;
      } catch (error) {
        rejectOnce(error);
        return;
      }
      if (closeRecord !== null) {
        resolveOnce(termination);
        return;
      }
      const remainingMs = Math.max(1, terminationDeadline - Date.now());
      pipeTimer = setTimeout(() => {
        child.stdout.destroy();
        child.stderr.destroy();
        const error = new Error(
          "Worker root exited but descendant-held pipes did not close within the deadline",
        );
        error.code = "RUNNER_PROCESS_TREE_TERMINATION_FAILED";
        error.details = { pid: child.pid, termination };
        rejectOnce(error);
      }, Math.min(pipeCloseMs, remainingMs));
      pipeTimer.unref();
    }, timeoutMs);
    timer.unref();

    if (stdinData !== null) {
      child.stdin.on("error", () => {});
      child.stdin.end(stdinData);
    }

    child.once("error", (error) => {
      rejectOnce(error);
    });
    child.once("close", async (code, signal) => {
      if (settled) return;
      closeRecord = { code, signal };
      let termination = null;
      if (terminationPromise !== null) {
        try {
          termination = await terminationPromise;
        } catch (error) {
          rejectOnce(error);
          return;
        }
      }
      resolveOnce(termination);
    });
  });
}

export async function runChecked(executable, args, options = {}) {
  const result = await runProcess(executable, args, options);
  if (result.code !== 0) {
    const error = new Error(
      `${executable} ${args.join(" ")} exited ${result.code}: ${result.stderr.trim()}`,
    );
    error.code = "PROCESS_FAILED";
    error.result = result;
    throw error;
  }
  return result;
}
