import { spawn } from "node:child_process";

export async function runProcess(executable, args, {
  cwd,
  env = process.env,
  timeoutMs = 60_000,
  maxOutputBytes = 1_048_576,
  stdoutStream = null,
  stderrStream = null,
} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    let settled = false;

    const collect = (chunks, stream, chunk, counter) => {
      stream?.write(chunk);
      if (counter.value < maxOutputBytes) {
        const remaining = maxOutputBytes - counter.value;
        chunks.push(chunk.subarray(0, remaining));
        counter.value += Math.min(chunk.length, remaining);
      }
    };
    const stdoutCounter = { value: stdoutBytes };
    const stderrCounter = { value: stderrBytes };
    child.stdout.on("data", (chunk) =>
      collect(stdout, stdoutStream, chunk, stdoutCounter));
    child.stderr.on("data", (chunk) =>
      collect(stderr, stderrStream, chunk, stderrCounter));

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 2_000).unref();
    }, timeoutMs);
    timer.unref();

    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        code: code ?? -1,
        signal,
        timedOut,
        pid: child.pid,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdoutTruncated: stdoutCounter.value >= maxOutputBytes,
        stderrTruncated: stderrCounter.value >= maxOutputBytes,
      });
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
