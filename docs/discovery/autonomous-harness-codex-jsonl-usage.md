---
title: Codex 0.146.0 JSONL Usage Evidence
document_type: discovery record
classification: confirmed fact
status: Cost authority required before a new Pilot
last_verified: 2026-08-01
related_documents: ["autonomous-harness-lightweight-worktree-runner-authority.md","../operations/github-workflow.md","../operations/README.md"]
decision_authority: Issue #64 implementation scope and preserved AH-P2-10 evidence; no new cost-policy decision
---

# Codex 0.146.0 JSONL usage evidence

## Evidence boundary

`RUN-AH-P2-10-EXTERNAL-HOST-RUNBOOK-003` remains `FAILED` and read-only. Its
`worker-stdout.log` SHA-256 is
`529b37ddca6e4e08a990ce446c0fba1c8e36093855da8ed78045dff9d8372299`.
The analysis copied no prompt, response, command, command output, path, session
identifier or secret. The repository fixture keeps only sequencing, item type,
status, exit code and usage fields. The official Codex non-interactive guide
also identifies `turn.completed.usage` as the JSONL completion usage surface.

## Observed inventory

| Event | Count | Relevant shape |
| --- | ---: | --- |
| `thread.started` | 1 | `type`, `thread_id` |
| `turn.started` | 1 | `type` |
| `item.started` | 23 | `item.id/type/status`; all `command_execution` |
| `item.completed` | 29 | 23 commands and 6 agent messages |
| `turn.completed` | 1 | final record with `usage` |

All 55 non-empty lines are strict JSON; malformed count is zero. The final
usage is input `440678`, cached input `377856`, cache-write input `0`, output
`4284` and reasoning output `431`. The CLI emits no `total_tokens`, monetary
cost, currency or external-call counter.

The old Runner's `444962` is correct for tokens: `440678 + 4284`. It is not a
repeated-snapshot sum or fallback. Cached input is an input subcount and
reasoning output is an output subcount, so neither is added again.

## Authoritative parser rule

For `CODEX_CLI_0_146`, one `thread.started`, one `turn.started`, a final
successful `turn.completed`, strict valid usage and complete bounded output are
required. Items are authoritative only inside that active turn; after the first
completion, only contiguous structurally identical completion retransmissions
are allowed. The source thread identity is retained only as a SHA-256 digest.
The final snapshot supplies `input_tokens`, `cached_input_tokens`,
`cache_write_input_tokens`, `output_tokens`, `reasoning_output_tokens` and
derived `total_tokens`. An explicit total must equal input plus output. Values
must be canonical safe non-negative integers; subcounts may not exceed their
parent counts. Usage artifacts identify record model `1.0.0` and parser profile
`codex-jsonl@0.146.0`.

Exact repeated final snapshots are structurally deduplicated and the final copy
is used; conflicting finals fail closed. Codex 0.146.0 supplied no delta usage
event, so no delta event name is invented. Any future delta or unknown usage
schema fails closed until a versioned mapping and stable event identity are
approved. The bounded parsed JSON tree is scanned in full for nested usage-like
extensions. Unknown event/item types are counted but cannot establish verified
zero external calls.

Only a bounded plain-text preamble before the first JSON event is diagnostic.
It must contain no JSON delimiters or event/usage terms. Any malformed line
after JSON begins, duplicate JSON key, overlong line, oversized/truncated log or
usage-like unknown record makes usage non-authoritative.

## Cost and external-call separation

Monetary cost is `null`, `cost_available: false` and `cost_verified: false`
when absent; it is never converted to zero. A supplied cost requires a finite
non-negative value and three-letter currency. The current Owner approval pins
`max_cost: 0` USD but does not pin ChatGPT versus API-key authentication.
Therefore the real adapter returns `RUNNER_CODEX_COST_AUTHORITY_REQUIRED` as
`BLOCKED` before Worker launch. A supplied JSONL result without authoritative
cost is separately rejected as `RUNNER_CODEX_COST_UNVERIFIED`; a new
Owner-approved authentication/cost authority is required before a real run.

Unique `web_search` and `mcp_tool_call` item IDs count as external tool calls.
Start/completion pairs with the same ID count once. `command_execution` is a
separate process count; OpenAI model transport is not a Worker tool call.
Complete known-schema JSONL with neither external item type verifies zero for
this event-level policy. It does not upgrade the separately acknowledged lack
of OS-level network denial.

## Run consequence

The original failure was caused by requiring non-existent `usage.cost` and
`usage.external_calls` fields. Token parsing itself produced `444962` correctly.
The replacement parser verifies completion, token accounting and event-level
external-tool absence. The adapter also probes an exact `codex 0.146.0` version
before launch, serializes real Codex packages for aggregate-budget enforcement,
and blocks before execution while monetary authority is missing. A future
approval must additionally pin how an authoritative cost is supplied; this
change does not infer that ChatGPT authentication means zero monetary cost.
The CLI exposes usage only after completion, so `max_tokens` is a post-reported
publication gate, not an in-process hard stop. Real Codex packages are serialized
and an aggregate excess prevents every later package launch, but one active
Worker may report an excess after consuming it. A future Owner approval must
explicitly accept or replace this enforcement boundary before enabling execution.
The failed run and artifacts are not reusable. Any later Pilot requires a new
run ID, new Owner approval, exact pins and the existing containment acceptance;
no Pilot or Codex Worker was run for Issue #64.
