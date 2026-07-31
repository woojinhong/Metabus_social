const EXTERNAL_EVENT =
  /(?:web_search|network_request|mcp_tool_call|remote_tool_call|external_call)/iu;

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function usageFrom(value) {
  if (!value || typeof value !== "object") return null;
  const total = nonNegativeInteger(value.total_tokens);
  if (total !== null) return total;
  const input = nonNegativeInteger(value.input_tokens);
  const output = nonNegativeInteger(value.output_tokens);
  return input === null && output === null ? null : (input ?? 0) + (output ?? 0);
}

function costFrom(value) {
  return typeof value?.cost === "number" && Number.isFinite(value.cost) && value.cost >= 0
    ? value.cost
    : null;
}

function externalCallsFrom(value) {
  return nonNegativeInteger(value?.external_calls);
}

function eventType(record) {
  return [
    record?.type,
    record?.item?.type,
    record?.event?.type,
  ].filter((value) => typeof value === "string").join(" ");
}

export function parseCodexJsonlOutput(stdout) {
  let tokens = null;
  let externalCalls = 0;
  let reportedExternalCalls = null;
  let cost = null;
  let parsedRecords = 0;
  let malformedLines = 0;
  for (const line of String(stdout).split(/\r?\n/u)) {
    if (line.trim() === "") continue;
    let record;
    try {
      record = JSON.parse(line);
      parsedRecords += 1;
    } catch {
      malformedLines += 1;
      continue;
    }
    const candidates = [
      record.usage,
      record.turn?.usage,
      record.item?.usage,
      record.response?.usage,
    ];
    for (const candidate of candidates) {
      const next = usageFrom(candidate);
      if (next !== null) tokens = next;
      const nextCost = costFrom(candidate);
      if (nextCost !== null) cost = nextCost;
      const nextExternalCalls = externalCallsFrom(candidate);
      if (nextExternalCalls !== null) reportedExternalCalls = nextExternalCalls;
    }
    if (EXTERNAL_EVENT.test(eventType(record))) externalCalls += 1;
  }
  externalCalls = Math.max(externalCalls, reportedExternalCalls ?? 0);
  return {
    usage: {
      tokens: tokens ?? 0,
      cost: cost ?? 0,
      external_calls: externalCalls,
      verified: (
        tokens !== null
        && cost !== null
        && reportedExternalCalls !== null
        && externalCalls === 0
        && malformedLines === 0
      ),
    },
    parsed_records: parsedRecords,
    malformed_lines: malformedLines,
  };
}

export function assertCodexOutputPolicy(parsed, budget, {
  stdoutTruncated = false,
} = {}) {
  if (budget?.max_external_calls !== 0) {
    const error = new Error("Real Codex Worker budget must pin external calls to zero");
    error.code = "RUNNER_WORKER_BUDGET_INVALID";
    throw error;
  }
  if (parsed.usage.external_calls !== 0) {
    const error = new Error("Codex Worker emitted an external-call event");
    error.code = "RUNNER_EXTERNAL_CALL_DETECTED";
    error.details = { external_calls: parsed.usage.external_calls };
    throw error;
  }
  if (stdoutTruncated || parsed.malformed_lines !== 0 || !parsed.usage.verified) {
    const error = new Error(
      "Codex Worker output cannot authoritatively prove token, cost, and external-call usage",
    );
    error.code = "RUNNER_CODEX_USAGE_UNVERIFIED";
    error.details = {
      stdout_truncated: stdoutTruncated,
      malformed_lines: parsed.malformed_lines,
      usage_verified: parsed.usage.verified,
    };
    throw error;
  }
  if (parsed.usage.cost > budget.max_cost) {
    const error = new Error("Codex Worker exceeded the Owner-approved cost budget");
    error.code = "RUNNER_BUDGET_EXCEEDED";
    error.details = {
      cost: parsed.usage.cost,
      max_cost: budget.max_cost,
    };
    throw error;
  }
  return parsed.usage;
}
