import { createHash } from "node:crypto";
import { parseJsonStrict, serializeJcs } from "../canonical-json.mjs";

const DEFAULT_MAX_LOG_BYTES = 1024 * 1024;
const DEFAULT_MAX_LINE_BYTES = 256 * 1024;

const KNOWN_EVENT_TYPES = new Set([
  "thread.started",
  "turn.started",
  "turn.completed",
  "turn.failed",
  "item.started",
  "item.completed",
  "error",
]);

const INTERNAL_ITEM_TYPES = new Set([
  "agent_message",
  "reasoning",
  "command_execution",
  "file_change",
  "plan_update",
  "todo_list",
]);

const EXTERNAL_ITEM_TYPES = new Set(["mcp_tool_call", "web_search"]);
const EVENT_KEYS = new Map([
  ["thread.started", new Set(["type", "thread_id"])],
  ["turn.started", new Set(["type"])],
  ["turn.completed", new Set(["type", "usage"])],
  ["turn.failed", new Set(["type", "error"])],
  ["item.started", new Set(["type", "item"])],
  ["item.completed", new Set(["type", "item"])],
  ["error", new Set(["type", "message"])],
]);
const USAGE_KEYS = new Set([
  "input_tokens",
  "cached_input_tokens",
  "cache_write_input_tokens",
  "output_tokens",
  "reasoning_output_tokens",
  "total_tokens",
  "cost",
  "currency",
  "external_calls",
]);

function safeNonNegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0) ? value : null;
}

function checkedAdd(left, right) {
  const total = left + right;
  return Number.isSafeInteger(total) && total >= 0 ? total : null;
}

function safeCost(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && !Object.is(value, -0)
    ? value
    : null;
}

function usageNumberLexemesAreCanonical(line, usage) {
  const integerFields = [
    "input_tokens",
    "cached_input_tokens",
    "cache_write_input_tokens",
    "output_tokens",
    "reasoning_output_tokens",
    "total_tokens",
    "external_calls",
  ];
  for (const field of integerFields) {
    if (!Object.hasOwn(usage, field)) continue;
    const match = line.match(new RegExp(`"${field}"\\s*:\\s*(-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`, "u"));
    if (!match || !/^(?:0|[1-9]\d*)$/u.test(match[1])) return false;
  }
  if (Object.hasOwn(usage, "cost")) {
    const match = line.match(/"cost"\s*:\s*(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/u);
    if (!match || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(match[1])) return false;
    if (match[1] !== "0" && /^0\.0*[1-9]/u.test(match[1]) && Number(match[1]) === 0) return false;
  }
  return true;
}

function eventType(record) {
  return typeof record?.type === "string" ? record.type : null;
}

function hasUsageLikeField(value) {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, child] of Object.entries(current)) {
      if (/(?:usage|tokens?|cost|currency|external_calls)/iu.test(key)) return true;
      if (child && typeof child === "object") pending.push(child);
    }
  }
  return false;
}

function hasExternalCallLikeExtension(item) {
  const pending = [item];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, child] of Object.entries(current)) {
      if (current === item && key === "type") continue;
      if (/(?:external[_-]?calls?|mcp(?:[_-]?tool)?[_-]?call|web[_-]?search|tool[_-]?call)/iu.test(key)) {
        return true;
      }
      if (child && typeof child === "object") pending.push(child);
    }
  }
  return false;
}

function isSafeDiagnosticPreamble(line, parsedRecords) {
  return parsedRecords === 0
    && Buffer.byteLength(line) <= 4096
    && !/[{}\[\]"]/u.test(line)
    && !/(?:thread|turn|item|usage|tokens?|cost|currency|external|mcp|web_search)/iu.test(line);
}

function usageSnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, reason: "USAGE_NOT_OBJECT" };
  }
  const keys = Object.keys(value);
  if (keys.some((key) => !USAGE_KEYS.has(key))) {
    return { valid: false, reason: "UNKNOWN_USAGE_FIELD" };
  }

  const hasInput = Object.hasOwn(value, "input_tokens");
  const hasOutput = Object.hasOwn(value, "output_tokens");
  const hasTotal = Object.hasOwn(value, "total_tokens");
  if (
    !hasInput
    || !hasOutput
    || !Object.hasOwn(value, "cached_input_tokens")
    || !Object.hasOwn(value, "cache_write_input_tokens")
    || !Object.hasOwn(value, "reasoning_output_tokens")
  ) {
    return { valid: false, reason: "INCOMPLETE_TOKEN_TOTAL" };
  }

  const input = hasInput ? safeNonNegativeInteger(value.input_tokens) : null;
  const output = hasOutput ? safeNonNegativeInteger(value.output_tokens) : null;
  const explicitTotal = hasTotal ? safeNonNegativeInteger(value.total_tokens) : null;
  if ((hasInput && (input === null || output === null)) || (hasTotal && explicitTotal === null)) {
    return { valid: false, reason: "INVALID_TOKEN_NUMBER" };
  }
  const derivedTotal = hasInput ? checkedAdd(input, output) : null;
  if (hasInput && derivedTotal === null) {
    return { valid: false, reason: "TOKEN_TOTAL_OVERFLOW" };
  }
  if (hasTotal && hasInput && explicitTotal !== derivedTotal) {
    return { valid: false, reason: "TOKEN_TOTAL_CONFLICT" };
  }
  const total = explicitTotal ?? derivedTotal;

  const cached = Object.hasOwn(value, "cached_input_tokens")
    ? safeNonNegativeInteger(value.cached_input_tokens)
    : 0;
  const cacheWrite = Object.hasOwn(value, "cache_write_input_tokens")
    ? safeNonNegativeInteger(value.cache_write_input_tokens)
    : 0;
  const reasoning = Object.hasOwn(value, "reasoning_output_tokens")
    ? safeNonNegativeInteger(value.reasoning_output_tokens)
    : 0;
  if (cached === null || cacheWrite === null || reasoning === null) {
    return { valid: false, reason: "INVALID_TOKEN_SUBCOUNT" };
  }
  if (hasInput && (cached > input || cacheWrite > input || reasoning > output)) {
    return { valid: false, reason: "TOKEN_SUBCOUNT_EXCEEDS_PARENT" };
  }

  const hasCost = Object.hasOwn(value, "cost");
  const hasCurrency = Object.hasOwn(value, "currency");
  if (hasCost !== hasCurrency) {
    return { valid: false, reason: "INCOMPLETE_COST" };
  }
  const cost = hasCost ? safeCost(value.cost) : null;
  const currency = hasCurrency && /^[A-Z]{3}$/u.test(value.currency) ? value.currency : null;
  if (hasCost && (cost === null || currency === null)) {
    return { valid: false, reason: "INVALID_COST" };
  }

  const reportedExternalCalls = Object.hasOwn(value, "external_calls")
    ? safeNonNegativeInteger(value.external_calls)
    : null;
  if (Object.hasOwn(value, "external_calls") && reportedExternalCalls === null) {
    return { valid: false, reason: "INVALID_EXTERNAL_CALL_COUNT" };
  }

  return {
    valid: true,
    input_tokens: input,
    cached_input_tokens: cached,
    cache_write_input_tokens: cacheWrite,
    output_tokens: output,
    reasoning_output_tokens: reasoning,
    total_tokens: total,
    cost,
    currency,
    cost_available: hasCost,
    reported_external_calls: reportedExternalCalls,
  };
}

function unverifiedUsage(reason, overrides = {}) {
  return {
    record_kind: "CODEX_WORKER_USAGE",
    usage_model_version: "1.0.0",
    parser_profile: "codex-jsonl@0.146.0",
    input_tokens: null,
    cached_input_tokens: null,
    cache_write_input_tokens: null,
    output_tokens: null,
    reasoning_output_tokens: null,
    total_tokens: 0,
    tokens: 0,
    cost: null,
    currency: null,
    cost_available: false,
    cost_verified: false,
    external_calls: 0,
    external_calls_verified: false,
    process_calls: 0,
    source_event_type: null,
    source_event_id: null,
    source_thread_identity_sha256: null,
    verified: false,
    verification_reason: reason,
    ...overrides,
  };
}

export function parseCodexJsonlOutput(stdout, {
  maxTotalBytes = DEFAULT_MAX_LOG_BYTES,
  maxLineBytes = DEFAULT_MAX_LINE_BYTES,
} = {}) {
  const text = String(stdout);
  const totalBytes = Buffer.byteLength(text);
  let parsedRecords = 0;
  let malformedLines = 0;
  let diagnosticLines = 0;
  let oversizedLines = 0;
  let usageSchemaErrors = 0;
  let schemaUnsupported = false;
  let threadStarted = 0;
  let turnStarted = 0;
  let completionCount = 0;
  let completionIsFinal = false;
  let sawFailure = false;
  let lastEventType = null;
  let firstEventType = null;
  let threadIdentityValid = true;
  let sourceThreadIdentity = null;
  let completionSequenceValid = true;
  let sequencePhase = "EXPECT_THREAD";
  const eventTypeCounts = Object.create(null);
  const unknownEventTypes = new Set();
  const unknownItemTypes = new Set();
  const externalItemIds = new Set();
  const processItemIds = new Set();
  const snapshots = [];

  if (!Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 1
    || !Number.isSafeInteger(maxLineBytes) || maxLineBytes < 1
    || totalBytes > maxTotalBytes) {
    return {
      usage: unverifiedUsage("LOG_BOUNDS_EXCEEDED"),
      parsed_records: 0,
      malformed_lines: 0,
      diagnostic_lines: 0,
      oversized_lines: 0,
      total_bytes: totalBytes,
      event_type_counts: {},
      unknown_event_types: [],
      unknown_item_types: [],
      completion: { count: 0, final: false },
    };
  }

  for (const line of text.split(/\r?\n/u)) {
    if (line.trim() === "") continue;
    if (Buffer.byteLength(line) > maxLineBytes) {
      oversizedLines += 1;
      malformedLines += 1;
      continue;
    }
    let record;
    try {
      record = parseJsonStrict(line);
    } catch {
      if (isSafeDiagnosticPreamble(line, parsedRecords)) diagnosticLines += 1;
      else malformedLines += 1;
      continue;
    }
    parsedRecords += 1;
    const type = eventType(record);
    if (type === null) {
      unknownEventTypes.add("[missing]");
      schemaUnsupported = true;
      if (hasUsageLikeField(record)) usageSchemaErrors += 1;
      continue;
    }
    lastEventType = type;
    firstEventType ??= type;
    eventTypeCounts[type] = (eventTypeCounts[type] ?? 0) + 1;
    if (!KNOWN_EVENT_TYPES.has(type)) {
      unknownEventTypes.add(type);
      schemaUnsupported = true;
      if (hasUsageLikeField(record)) usageSchemaErrors += 1;
      continue;
    }
    if (Object.keys(record).some((key) => !EVENT_KEYS.get(type).has(key))) {
      schemaUnsupported = true;
    }
    if (type === "thread.started") {
      if (sequencePhase !== "EXPECT_THREAD") completionSequenceValid = false;
      else sequencePhase = "EXPECT_TURN";
    } else if (type === "turn.started") {
      if (sequencePhase !== "EXPECT_TURN") completionSequenceValid = false;
      else sequencePhase = "ACTIVE_TURN";
    } else if (type === "item.started" || type === "item.completed") {
      if (sequencePhase !== "ACTIVE_TURN") completionSequenceValid = false;
    } else if (type === "turn.completed") {
      if (sequencePhase === "ACTIVE_TURN") sequencePhase = "COMPLETED";
      else if (sequencePhase !== "COMPLETED") completionSequenceValid = false;
    } else if (type === "turn.failed" || type === "error") {
      if (sequencePhase !== "ACTIVE_TURN") completionSequenceValid = false;
      sequencePhase = "COMPLETED";
    }
    if (type === "thread.started") {
      threadStarted += 1;
      if (typeof record.thread_id !== "string" || record.thread_id === "") {
        threadIdentityValid = false;
      } else {
        sourceThreadIdentity = createHash("sha256").update(record.thread_id).digest("hex");
      }
    }
    if (type === "turn.started") turnStarted += 1;
    if (type === "turn.failed" || type === "error") sawFailure = true;
    if (type === "turn.completed") {
      completionCount += 1;
      const snapshot = usageSnapshot(record.usage);
      if (snapshot.valid && usageNumberLexemesAreCanonical(line, record.usage)) {
        snapshots.push({ raw: serializeJcs(record.usage), normalized: snapshot });
      } else {
        usageSchemaErrors += 1;
        if (snapshot.reason === "UNKNOWN_USAGE_FIELD") schemaUnsupported = true;
      }
    } else if (
      Object.hasOwn(record, "usage")
      || hasUsageLikeField(record)
    ) {
      usageSchemaErrors += 1;
      schemaUnsupported = true;
    }

    if (type === "item.started" || type === "item.completed") {
      const itemType = typeof record.item?.type === "string" ? record.item.type : null;
      const itemId = typeof record.item?.id === "string" && record.item.id !== ""
        ? record.item.id
        : null;
      if (itemType === null || itemId === null) {
        unknownItemTypes.add(itemType ?? "[missing]");
        schemaUnsupported = true;
      } else if (EXTERNAL_ITEM_TYPES.has(itemType)) {
        externalItemIds.add(itemId);
      } else if (itemType === "command_execution") {
        processItemIds.add(itemId);
      } else if (!INTERNAL_ITEM_TYPES.has(itemType)) {
        unknownItemTypes.add(itemType);
        schemaUnsupported = true;
      }
      if (hasExternalCallLikeExtension(record.item)) {
        unknownItemTypes.add(`${itemType}:external-call-like-extension`);
        schemaUnsupported = true;
      }
    }
  }

  completionIsFinal = lastEventType === "turn.completed";
  const uniqueSnapshots = new Map(snapshots.map(({ raw, normalized }) => [raw, normalized]));
  const snapshot = snapshots.at(-1)?.normalized ?? null;
  const externalCalls = externalItemIds.size;
  const externalCallsVerified = malformedLines === 0
    && oversizedLines === 0
    && unknownEventTypes.size === 0
    && unknownItemTypes.size === 0
    && !schemaUnsupported
    && completionSequenceValid
    && completionIsFinal
    && !sawFailure;
  const reportedExternalConsistent = snapshot?.reported_external_calls === null
    || snapshot?.reported_external_calls === externalCalls;
  const verified = snapshot !== null
    && uniqueSnapshots.size === 1
    && usageSchemaErrors === 0
    && !schemaUnsupported
    && completionCount >= 1
    && completionSequenceValid
    && threadStarted === 1
    && firstEventType === "thread.started"
    && threadIdentityValid
    && turnStarted === 1
    && completionIsFinal
    && !sawFailure
    && malformedLines === 0
    && oversizedLines === 0
    && externalCallsVerified
    && reportedExternalConsistent;
  const reason = verified
    ? (snapshot.cost_available
      ? "CODEX_FINAL_USAGE_COMPLETION_EXTERNAL_AND_COST_VERIFIED"
      : "CODEX_FINAL_USAGE_COMPLETION_AND_EXTERNAL_VERIFIED_COST_UNAVAILABLE")
    : (schemaUnsupported
      ? "CODEX_JSONL_SCHEMA_UNSUPPORTED"
      : uniqueSnapshots.size > 1
      ? "CONFLICTING_FINAL_USAGE_SNAPSHOTS"
      : !completionSequenceValid
      ? "INVALID_CODEX_EVENT_SEQUENCE"
      : "CODEX_JSONL_NOT_AUTHORITATIVE");

  const usage = snapshot === null
    ? unverifiedUsage(reason, {
        external_calls: externalCalls,
        external_calls_verified: externalCallsVerified,
        process_calls: processItemIds.size,
      })
    : {
        record_kind: "CODEX_WORKER_USAGE",
        usage_model_version: "1.0.0",
        parser_profile: "codex-jsonl@0.146.0",
        input_tokens: snapshot.input_tokens,
        cached_input_tokens: snapshot.cached_input_tokens,
        cache_write_input_tokens: snapshot.cache_write_input_tokens,
        output_tokens: snapshot.output_tokens,
        reasoning_output_tokens: snapshot.reasoning_output_tokens,
        total_tokens: snapshot.total_tokens,
        tokens: snapshot.total_tokens,
        cost: snapshot.cost,
        currency: snapshot.currency,
        cost_available: snapshot.cost_available,
        cost_verified: verified && snapshot.cost_available,
        external_calls: externalCalls,
        external_calls_verified: externalCallsVerified && reportedExternalConsistent,
        process_calls: processItemIds.size,
        source_event_type: "turn.completed",
        source_event_id: null,
        source_thread_identity_sha256: sourceThreadIdentity,
        verified,
        verification_reason: reason,
      };

  return {
    usage,
    parsed_records: parsedRecords,
    malformed_lines: malformedLines,
    diagnostic_lines: diagnosticLines,
    oversized_lines: oversizedLines,
    total_bytes: totalBytes,
    usage_schema_errors: usageSchemaErrors,
    schema_unsupported: schemaUnsupported,
    event_type_counts: { ...eventTypeCounts },
    unknown_event_types: [...unknownEventTypes].sort(),
    unknown_item_types: [...unknownItemTypes].sort(),
    completion: { count: completionCount, final: completionIsFinal },
  };
}

export function assertCodexOutputPolicy(parsed, budget, {
  stdoutTruncated = false,
  costAuthority = null,
} = {}) {
  const exactAllowedPath = costAuthority?.exact_allowed_path;
  const unavailableCostAuthorityValid = costAuthority?.authentication_mode === "CHATGPT"
    && costAuthority.monetary_cost_policy === "UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT"
    && costAuthority.publication_mode === "EXECUTE_PATCH_ONLY"
    && costAuthority.production === false
    && costAuthority.commit_allowed === false
    && costAuthority.push_allowed === false
    && costAuthority.pr_allowed === false
    && typeof exactAllowedPath === "string"
    && /^docs\/[A-Za-z0-9._/-]+\.md$/u.test(exactAllowedPath)
    && !exactAllowedPath.includes("//")
    && exactAllowedPath.split("/").every((segment) => segment !== "." && segment !== "..");
  if (!Number.isSafeInteger(budget?.max_external_calls) || budget.max_external_calls < 0) {
    const error = new Error("Real Codex Worker budget must pin a valid external-call limit");
    error.code = "RUNNER_WORKER_BUDGET_INVALID";
    throw error;
  }
  if (parsed.schema_unsupported) {
    const error = new Error("Codex JSONL schema is not supported by the pinned parser profile");
    error.code = "RUNNER_CODEX_USAGE_UNVERIFIED";
    error.details = {
      unknown_event_types: parsed.unknown_event_types,
      unknown_item_types: parsed.unknown_item_types,
      verification_reason: parsed.usage.verification_reason,
    };
    throw error;
  }
  if (
    stdoutTruncated
    || parsed.malformed_lines !== 0
    || !parsed.usage.verified
    || parsed.usage.external_calls_verified !== true
  ) {
    const error = new Error(
      "Codex Worker output cannot authoritatively prove completion, token, and external-tool usage",
    );
    error.code = "RUNNER_CODEX_USAGE_UNVERIFIED";
    error.details = {
      stdout_truncated: stdoutTruncated,
      malformed_lines: parsed.malformed_lines,
      usage_verified: parsed.usage.verified,
      verification_reason: parsed.usage.verification_reason,
    };
    throw error;
  }
  if (parsed.usage.external_calls > budget.max_external_calls) {
    const error = new Error("Codex Worker exceeded the Owner-approved external-call budget");
    error.code = "RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED";
    error.details = {
      external_calls: parsed.usage.external_calls,
      max_external_calls: budget.max_external_calls,
    };
    throw error;
  }
  if (!parsed.usage.cost_available || !parsed.usage.cost_verified) {
    if (
      !unavailableCostAuthorityValid
    ) {
      const error = new Error(
        "Codex JSONL does not prove monetary cost; an Owner-approved cost authority is required",
      );
      error.code = "RUNNER_CODEX_COST_AUTHORITY_REQUIRED";
      error.details = {
        cost: parsed.usage.cost,
        currency: parsed.usage.currency,
        cost_available: parsed.usage.cost_available,
        cost_verified: parsed.usage.cost_verified,
      };
      throw error;
    }
    return parsed.usage;
  }
  if (parsed.usage.currency !== budget.currency || parsed.usage.cost > budget.max_cost) {
    const error = new Error("Codex Worker exceeded the Owner-approved cost budget");
    error.code = "RUNNER_BUDGET_EXCEEDED";
    error.details = {
      cost: parsed.usage.cost,
      currency: parsed.usage.currency,
      max_cost: budget.max_cost,
      budget_currency: budget.currency,
    };
    throw error;
  }
  return parsed.usage;
}
