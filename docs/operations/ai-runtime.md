---
title: AI Runtime
document_type: operations
classification: confirmed fact
status: Verified
last_verified: 2026-08-03
related_documents:
  - ../../AGENTS.md
  - ../INDEX.md
  - agent-automation-overview.md
  - openclaw-omx-workflow.md
decision_authority: repository guidance and explicit user approvals
---

# AI Runtime

## Verified setup

- **Confirmed fact:** Codex CLI is the primary coding-agent surface.
- **Confirmed fact:** The official oh-my-codex npm CLI is installed.
- **Confirmed fact:** The official oh-my-codex Plugin is enabled.
- **Confirmed fact:** User CODEX_HOME is C:\Users\hong\.codex.
- **Confirmed fact:** Project-local Codex configuration and native agents live under .codex/.
- **Confirmed fact:** Project-local OMX runtime state lives under .omx/ and is ignored by Git.
- **Confirmed fact:** AGENTS.md is the primary project guidance for Codex and OMX.
- **Confirmed fact:** CLAUDE.md is the minimal Claude Code adapter.
- **Confirmed fact:** Superpowers is not active in Codex.
- **Confirmed fact (user-provided environment constraint):** Native Windows may emit EPERM fsync durability warnings.

## Recommended OMX flow

1. $deep-interview for product and requirement clarification.
2. $best-practice-research for bounded official-source research when needed.
3. $ralplan for architecture and implementation planning.
4. $prometheus-strict only for high-risk plan stress testing.
5. $ultragoal for approved durable execution.
6. $team only when parallel execution is justified.
7. $code-review and $ultraqa for final verification.

## Propscans Phase 1 automation

The default next automation target is local and single-repository: native
`planner` -> task worktree -> native `executor` -> tests -> native `architect`
-> native `code-reviewer` -> commit/push/Draft PR -> configured Actions -> human
merge. Actions failure keeps the PR Draft and returns to fixes and local gates.
Initial concurrency is one. The workflow stops if native typed role routing is
absent.

OpenClaw, its Slack plugin, a Slack App, tokens, webhooks, polling and a
production Gateway are not installed or configured. They remain Phase 2 or
later work in [OpenClaw and OMX workflow](openclaw-omx-workflow.md). `.omx`,
OpenClaw session state, Slack and Agent memory are runtime context, not durable
repository authority.

## Security and boundaries

- Secrets and auth.json must never be copied into this repository.
- Local Fork-based OMX development is not used by this project.
- Application implementation remains blocked until explicit user approval.
- Agent automation does not grant product code, migration, provisioning,
  credential, deployment, merge, Ready-transition or Issue-close authority.
