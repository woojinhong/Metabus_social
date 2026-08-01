function launcherError(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function runnerArgsBlock(text) {
  let state = "CODE";
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (state === "COMMENT") {
      if (character === "\n") state = "CODE";
      continue;
    }
    if (state === "SINGLE") {
      if (character === "'" && text[index + 1] === "'") index += 1;
      else if (character === "'") state = "CODE";
      continue;
    }
    if (state === "DOUBLE") {
      if (character === "`") index += 1;
      else if (character === '"') state = "CODE";
      continue;
    }
    if (character === "#") {
      state = "COMMENT";
      continue;
    }
    if (character === "'") {
      state = "SINGLE";
      continue;
    }
    if (character === '"') {
      state = "DOUBLE";
      continue;
    }
    const match = text.slice(index).match(/^\$RunnerArgs\s*=\s*@\(/u);
    if (!match) continue;
    const start = index + match[0].length;
    let depth = 1;
    let innerState = "CODE";
    for (let cursor = start; cursor < text.length; cursor += 1) {
      const inner = text[cursor];
      if (innerState === "COMMENT") {
        if (inner === "\n") innerState = "CODE";
        continue;
      }
      if (innerState === "SINGLE") {
        if (inner === "'" && text[cursor + 1] === "'") cursor += 1;
        else if (inner === "'") innerState = "CODE";
        continue;
      }
      if (innerState === "DOUBLE") {
        if (inner === "`") cursor += 1;
        else if (inner === '"') innerState = "CODE";
        continue;
      }
      if (inner === "#") innerState = "COMMENT";
      else if (inner === "'") innerState = "SINGLE";
      else if (inner === '"') innerState = "DOUBLE";
      else if (inner === "(") depth += 1;
      else if (inner === ")") {
        depth -= 1;
        if (depth === 0) return text.slice(start, cursor);
      }
    }
    launcherError("RUNNER_EXTERNAL_LAUNCHER_INVALID", "$RunnerArgs array is unterminated");
  }
  launcherError("RUNNER_EXTERNAL_LAUNCHER_INVALID", "Active $RunnerArgs array is required");
}

function stringTokens(block) {
  const tokens = [];
  let state = "CODE";
  let value = "";
  for (let index = 0; index < block.length; index += 1) {
    const character = block[index];
    if (state === "COMMENT") {
      if (character === "\n") state = "CODE";
      continue;
    }
    if (state === "SINGLE") {
      if (character === "'" && block[index + 1] === "'") {
        value += "'";
        index += 1;
      } else if (character === "'") {
        tokens.push(value);
        value = "";
        state = "CODE";
      } else value += character;
      continue;
    }
    if (state === "DOUBLE") {
      if (character === "`" && index + 1 < block.length) {
        value += block[index + 1];
        index += 1;
      } else if (character === '"') {
        tokens.push(value);
        value = "";
        state = "CODE";
      } else value += character;
      continue;
    }
    if (character === "#") state = "COMMENT";
    else if (character === "'") state = "SINGLE";
    else if (character === '"') state = "DOUBLE";
  }
  if (state === "SINGLE" || state === "DOUBLE") {
    launcherError("RUNNER_EXTERNAL_LAUNCHER_INVALID", "Quoted Runner argument is unterminated");
  }
  return tokens;
}

export function parseExternalHostRunnerArgs(text) {
  if (typeof text !== "string" || text.trim() === "") {
    launcherError("RUNNER_EXTERNAL_LAUNCHER_INVALID", "External-host launcher text is required");
  }
  return stringTokens(runnerArgsBlock(text));
}

export function validatePatchOnlyLauncherText(text) {
  const args = parseExternalHostRunnerArgs(text);
  const sandboxIndexes = args
    .map((value, index) => value === "--worker-sandbox" ? index : -1)
    .filter((index) => index >= 0);
  if (
    sandboxIndexes.length !== 1
    || args[sandboxIndexes[0] + 1] !== "workspace-write"
  ) {
    launcherError(
      "RUNNER_WORKER_SANDBOX_MODE_INVALID",
      "EXECUTE_PATCH_ONLY external-host launchers must pin --worker-sandbox workspace-write",
    );
  }
  if (args.filter((value) => value === "--require-effective-sandbox-probe").length !== 1) {
    launcherError(
      "RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED",
      "EXECUTE_PATCH_ONLY external-host launchers must require an effective sandbox probe",
    );
  }
  return {
    sandbox: "workspace-write",
    effective_sandbox_probe: "REQUIRED",
  };
}
