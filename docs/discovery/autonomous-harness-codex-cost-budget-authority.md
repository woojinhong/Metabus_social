---
title: AH-P2-11 Codex Cost and Token Budget Authority
document_type: decision record
classification: user decision
status: Approved policy; Issue #68 implementation in Draft-PR review, Pilot not rerun
implementation_ready: false
last_verified: 2026-08-01
related_documents: ["autonomous-harness-lightweight-worktree-runner-authority.md","autonomous-harness-codex-jsonl-usage.md","../operations/github-workflow.md","../operations/README.md"]
decision_authority: explicit repository-owner approval in the Issue #66 task
---

# AH-P2-11 Codex cost and token budget authority

## Decision and evidence boundary

This decision permits a cost-unavailable exception only for a new, separately
approved, ChatGPT-authenticated, non-production, docs-only
`EXECUTE_PATCH_ONLY` Pilot. It does not authorize that run now. Runner and
approval-contract support must be reviewed separately before execution.

Codex CLI `0.146.0` emits final successful `turn.completed.usage` with input,
cached input, cache-write input, output and reasoning-output tokens. The pinned
parser derives authoritative `total_tokens` as input plus output when the CLI
does not emit an explicit total. Cached and reasoning values are subcounts and
are not added again. The observed AH-P2-10 total was `444962`.

The same JSONL provides no monetary cost or currency. Known `web_search` and
`mcp_tool_call` item schemas can prove event-level external-tool usage;
`command_execution` is a separate process event. OpenAI model transport is not
a Worker external tool call. `RUN-AH-P2-10-EXTERNAL-HOST-RUNBOOK-003` remains
`FAILED`, read-only and ineligible for reuse.

## Monetary-cost decision

For the bounded exception:

- `authentication_mode` is exactly `CHATGPT`;
- `cost` and `currency` are `null`;
- `cost_available` and `cost_verified` are `false`;
- absence of monetary evidence is never represented as zero;
- `max_cost: 0` never means verified zero monetary cost;
- `monetary_cost_policy` is
  `UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT`;
- the token budget is the enforceable post-run approval/publication gate
  available from JSONL.

The exception does not extend to API-key billing, product-code Pilots,
production, automatic publication or any run with actual monetary-spend
authority. Those require separate billing evidence and Owner authority.

## Token-budget decision

Each approval pins exact `max_total_tokens`. Runner uses only the authoritative
final successful completion total. The CLI reports usage after execution, so
this is a `POST_RUN_HARD_GATE`, not an in-process cutoff.

If `total_tokens > max_total_tokens`, the required outcome is:

- error `RUNNER_TOKEN_BUDGET_EXCEEDED` and state `FAILED_BUDGET`;
- no commit, push, PR, publication or patch-ready promotion;
- preserve the disposable clone, changed files, patch evidence, logs, manifest
  and diagnostics for Owner review;
- no automatic retry;
- rerun only under a new run ID and new Owner-approved budget.

Real Workers remain serialized. An active Worker can consume beyond the limit
before reporting it; after an aggregate excess no later Package may start. The
Owner accepts this residual boundary only for the exact bounded Pilot below.

## First docs-only Pilot budget

| Pin | Approved value |
| --- | --- |
| `max_total_tokens` | `600000` |
| `max_external_calls` | `0` |
| `max_retries` | `0` |
| `max_concurrency` | `1` |
| `publication_mode` | `EXECUTE_PATCH_ONLY` |
| commit / push / PR | `false / false / false` |
| `monetary_cost_policy` | `UNAVAILABLE_ACCEPTED_FOR_THIS_PILOT` |
| `token_budget_enforcement` | `POST_RUN_HARD_GATE` |

`600000` is finite and is `155038` tokens, about 34.8%, above the single
preserved observation of `444962`. That margin accommodates the observed
docs-only task shape without treating one run as a statistical forecast or
granting an unlimited budget. A different value requires rationale and a new
exact Owner approval.

## External calls and execution scope

Unique known-schema `web_search` and `mcp_tool_call` IDs count as
`external_calls`. `command_execution` counts only as `process_calls`; model
transport is excluded. Unknown external-call-like or usage schema fails closed.
The first Pilot authorizes exactly zero external calls.

The bounded execution scope is one exact `docs/**` path in an OS-temp
disposable clone, with no Git remote, a local `credential.helper=` reset,
`EXECUTE_PATCH_ONLY`, and a human-review patch only. Commit, push and PR are
disabled inside the Pilot.

The policy does not permit `src/**`, migrations, workflows, dependencies,
production, API-key billing, automatic publication, parallel Workers, retries,
Critic loops, Ledger or Dispatcher. It never permits treating unavailable cost
as zero.

## Required outcomes and error taxonomy

| Code/state | Meaning |
| --- | --- |
| `RUNNER_CODEX_USAGE_UNVERIFIED` | Authoritative final token usage cannot be verified. |
| `RUNNER_CODEX_COST_AUTHORITY_REQUIRED` | No Owner approval accepts unavailable cost for this run. |
| `RUNNER_TOKEN_BUDGET_EXCEEDED` | Authoritative total exceeds the exact token pin. |
| `RUNNER_EXTERNAL_CALL_BUDGET_EXCEEDED` | Authoritative external calls exceed the exact pin. |
| `PATCH_READY_FOR_OWNER_REVIEW` | Usage, budgets, exact path and required tests passed; no publication authority follows. |

Issue #68 wires these names into the Runner under Draft-PR review. Token and
external-call excess use `FAILED_BUDGET`; successful patch-only output uses
`PATCH_READY_FOR_OWNER_REVIEW`. Wall-clock and other runtime limits retain the
generic runtime-budget error.

## Required approval pins

A later Pilot approval must bind at least:

- `run_id`, `dry_run_id` and `result_digest`;
- `work_package_id`, Work Package revision and `plan_digest`;
- `source_sha` and absolute `source_root`;
- one `exact_allowed_path`;
- `authentication_mode: CHATGPT` and `codex_cli_version: 0.146.0`;
- exact `usage_schema_version` and parser profile;
- exact `max_total_tokens`, `token_budget_enforcement` and
  `monetary_cost_policy`;
- exact `max_external_calls`, `max_retries`, `max_concurrency` and
  `publication_mode`;
- `residual_risks_accepted`, including post-run token enforcement;
- `commit`, `push` and `pr` all `false`.

Issue #68 requires top-level `max_total_tokens` to equal the retained execution
budget token field, so no silent alias is accepted. It validates every pin,
keeps unavailable cost null/unverified, skips tests and publication after an
aggregate budget excess, and preserves clone, patch, logs, manifest and
diagnostics. `run-result.json`, `final-summary.md` and the manifest expose the
usage, limits, verification flags, error and terminal state.

No Codex Worker or Pilot ran for Issues #66 or #68. A real Pilot still requires
a fresh run ID, fresh exact Owner approval and containment-risk acceptance;
AH-P2-10 artifacts cannot be inputs or reused.
