import { execFile } from "node:child_process";

function processExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit(child, timeoutMs) {
  if (processExited(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.off("exit", onExit);
      resolve(value);
    };
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(processExited(child)), timeoutMs);
    timer.unref();
    child.once("exit", onExit);
  });
}

function taskkill(pid, force, executable = "taskkill.exe", timeoutMs = 5_000) {
  const args = windowsTaskkillArguments(pid, { force });
  return new Promise((resolve) => {
    execFile(executable, args, {
      windowsHide: true,
      shell: false,
      encoding: "utf8",
      timeout: timeoutMs,
    }, (error, stdout, stderr) => {
      resolve({
        code: error?.code && Number.isInteger(error.code) ? error.code : error ? -1 : 0,
        timed_out: error?.killed === true,
        stdout: stdout ?? "",
        stderr: stderr ?? error?.message ?? "",
      });
    });
  });
}

function validPid(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= 0xffff_ffff;
}

export function windowsTaskkillArguments(pid, { force = false } = {}) {
  if (!validPid(pid) || typeof force !== "boolean") {
    const error = new Error("taskkill requires a numeric PID and boolean force flag");
    error.code = "RUNNER_PROCESS_PID_INVALID";
    throw error;
  }
  return force
    ? ["/PID", String(pid), "/T", "/F"]
    : ["/PID", String(pid), "/T"];
}

export async function terminateProcessTree(child, {
  platform = process.platform,
  gracefulMs = 750,
  forceMs = 5_000,
  taskkillExecutable = "taskkill.exe",
  taskkillRunner = taskkill,
} = {}) {
  const pid = child?.pid;
  if (!validPid(pid)) {
    const error = new Error("Process-tree termination requires a valid numeric PID");
    error.code = "RUNNER_PROCESS_PID_INVALID";
    throw error;
  }
  if (processExited(child)) {
    return {
      pid,
      strategy: "ALREADY_EXITED",
      forced: false,
      descendants_targeted: false,
      verified: true,
      pid_reuse_protected: true,
    };
  }

  if (platform === "win32") {
    // Codex receives its prompt through stdin, so closing stdin is the only
    // dependency-free cooperative shutdown request available here. Windows
    // ChildProcess.kill signals are abrupt, not a graceful protocol.
    child.stdin?.end();
    if (await waitForExit(child, gracefulMs)) {
      return {
        pid,
        strategy: "WINDOWS_STDIN_COOPERATIVE",
        forced: false,
        descendants_targeted: false,
        verified: false,
        pid_reuse_protected: false,
        limitation: "Cooperative root exit does not prove descendant containment.",
      };
    }

    // Recheck the tracked ChildProcess immediately before the PID-based force
    // fallback. This narrows but cannot eliminate the documented PID-reuse race.
    if (processExited(child)) {
      return {
        pid,
        strategy: "WINDOWS_STDIN_COOPERATIVE",
        forced: false,
        descendants_targeted: false,
        verified: false,
        pid_reuse_protected: false,
        limitation: "Cooperative root exit does not prove descendant containment.",
      };
    }
    const forced = await taskkillRunner(pid, true, taskkillExecutable, forceMs);
    if (forced.code !== 0 && !processExited(child)) {
      child.kill();
    }
    if (!(await waitForExit(child, forceMs))) {
      const error = new Error("Windows process tree did not terminate within the force deadline");
      error.code = "RUNNER_PROCESS_TREE_TERMINATION_FAILED";
      error.details = {
        pid,
        force_code: forced.code,
      };
      throw error;
    }
    return {
      pid,
      strategy: "WINDOWS_TASKKILL_TREE",
      forced: true,
      descendants_targeted: true,
      verified: false,
      taskkill_succeeded: forced.code === 0,
      pid_reuse_protected: false,
      limitation: forced.code === 0
        ? "PID identity is not handle-pinned; Job Object containment is still required."
        : "taskkill tree termination failed; only the tracked direct child was terminated.",
    };
  }

  child.kill("SIGTERM");
  if (await waitForExit(child, gracefulMs)) {
    return {
      pid,
      strategy: "POSIX_PROCESS_SIGNAL",
      forced: false,
      descendants_targeted: false,
      verified: false,
      pid_reuse_protected: false,
    };
  }
  child.kill("SIGKILL");
  if (!(await waitForExit(child, forceMs))) {
    const error = new Error("Process did not terminate within the force deadline");
    error.code = "RUNNER_PROCESS_TREE_TERMINATION_FAILED";
    error.details = { pid };
    throw error;
  }
  return {
    pid,
    strategy: "POSIX_PROCESS_SIGNAL",
    forced: true,
    descendants_targeted: false,
    verified: false,
    pid_reuse_protected: false,
  };
}

export function processContainmentStatus(platform = process.platform) {
  return {
    platform,
    implementation: platform === "win32"
      ? "WINDOWS_TASKKILL_TREE_FALLBACK"
      : "DIRECT_PROCESS_SIGNAL_FALLBACK",
    independently_verified: false,
    strict_boundary: false,
    blocker: platform === "win32"
      ? "A handle-pinned Windows Job Object without breakaway is not implemented."
      : "Descendant process-group containment is not implemented.",
  };
}
