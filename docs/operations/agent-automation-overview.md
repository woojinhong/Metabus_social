---
title: Agent Automation Overview
document_type: operations
classification: proposal
status: Proposed default automation direction
last_verified: 2026-08-03
related_documents:
  - ../../AGENTS.md
  - ../INDEX.md
  - github-workflow.md
  - ai-runtime.md
  - openclaw-omx-workflow.md
  - agent-lessons.md
  - ../archive/autonomous-harness-experiment.md
decision_authority: explicit repository-owner direction for Issue #78; merge remains owner-controlled
---

# Agent Automation Overview

## 1. Purpose and current default

Propscans automates work for this repository; it does not build a reusable
multi-project Agent Platform. The default next target is the local Phase 1
workflow in [OpenClaw and OMX workflow](openclaw-omx-workflow.md):

```text
GitHub Issue or direct request
  -> native Planner (read-only)
  -> duplicate search -> exactly one Issue
  -> one task branch and Git worktree
  -> native Executor (workflow label: Worker)
  -> local tests
  -> native Architect
  -> required fixes
  -> native Code Reviewer (final Critic gate)
  -> commit -> push -> GitHub Draft PR
  -> configured Actions
     -> failure: Executor -> local tests/reviews -> push loop
  -> required Actions pass
  -> human review and merge
```

Slack and OpenClaw are planned Phase 2 integration surfaces. They are not
installed, configured, connected or running for this repository.

## 2. Target architecture and responsibilities

| Surface | Responsibility | Authority boundary |
| --- | --- | --- |
| Slack | Future request, owner start/approval relay, status and result channel | Runtime signal only; no durable product decision |
| OpenClaw | Future Slack gateway, Propscans route and result relay | Runtime integration only; not repository SOT |
| OMX / oh-my-codex | Typed role orchestration and bounded sequencing | Replaces custom Requirement/WorkGraph orchestration as the default path |
| Codex CLI | Repository analysis, edits, tests and review execution | Operates only inside the granted task scope |
| Git worktree | One isolated checkout per task | Initial concurrency is one; no shared branch checkout |
| GitHub Issue | Request scope and activity record | Labels are status projection, not product authority |
| Draft PR | Human review point for AI output | Draft only; AI never merges or marks Ready |
| GitHub Actions | Configured and triggered validation results | Checks do not expand implementation authority |
| Repository | AGENTS, Decisions, Specs, ADRs and tests | Durable source of truth |

OpenClaw, OMX runtime state, `.omx`, Slack messages and Agent memory never
override repository authority.

## 3. Delivery phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1. Local manual workflow | Direct request/Issue through typed roles, one worktree, tests and Draft PR | Official next target |
| 2. Slack connection | Slack -> OpenClaw normalization -> OMX -> thread status and Draft PR link | Planned; no installation or credentials |
| 3. Scheduled execution | Select one `agent:ready` Issue at a defined time and send a morning summary | Future only; no cron or polling |
| 4. Limited parallelism | At most two non-overlapping worktrees/Workers | Future only; sequential on any conflict risk |

Each later phase requires a separate Issue, security review, exact scope and
owner-controlled Draft PR. Phase 2 must verify the repository-specific
OpenClaw-to-OMX bridge rather than assume it is built in.

## 4. Minimal status projection

No Runtime Ledger is created. Proposed Issue labels are:

- `agent:backlog`
- `agent:ready`
- `agent:running`
- `agent:blocked`
- `agent:review`
- `agent:done`

This PR does not create labels. Draft PR state and configured Actions checks
provide publication and validation status. A future Slack thread shows only:
request received, plan complete, implementing, testing, reviewing, Draft PR
complete, or blocked/failed. While required Actions are pending, it remains
“reviewing”; “Draft PR complete” means the required triggered checks passed.

## 5. Authority and publication gates

- The user decides final requirements and merges PRs.
- Each task needs an exact repository, scope, allowed files, tests and risks.
- A direct or Slack request is read-only input until duplicate search identifies
  an existing Issue or creates exactly one Issue under the approved policy.
- `master` is never edited directly; one task uses one branch and worktree.
- Initial maximum concurrency is one.
- Commit, push and one Draft PR are allowed only by the applicable Issue scope.
- Merge, Ready transition and Issue closure remain human-controlled.
- A failed required local test blocks PR creation.
- Architect must report `CLEAR`, and Architect/Reviewer must have no unresolved
  CRITICAL, HIGH or MEDIUM finding before PR creation.
- After Draft PR creation, observe configured and triggered Actions. Failure
  keeps the PR Draft and returns the task to Executor, local tests and reviews.
- Product code, migrations, dependencies, workflows, credentials, provisioning
  and live operation retain their separate repository gates.

## 6. Failure and recovery

Preserve the failing command, exit status, relevant sanitized output, current
commit and worktree path before judging or retrying. Do not delete a failed
worktree automatically. Classify authority, environment, deterministic test and
conflict failures separately. Retry only when the cause and retry boundary are
known; otherwise report a blocker to the user.

The historical Harness remains available as evidence and reference under the
[experiment inventory](../archive/autonomous-harness-experiment.md), but it is
not the default execution path and receives no new platform features.
