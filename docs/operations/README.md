---
title: Operations Index
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-08-01
related_documents: ["../../schemas/automation/requirement.schema.json","../discovery/decisions.md","../discovery/slice-01-current-authority.md","../discovery/autonomous-harness-foundation-approval-plan.md","../discovery/autonomous-harness-readonly-planner-authority.md","../discovery/autonomous-harness-lightweight-worktree-runner-authority.md","../discovery/autonomous-harness-codex-jsonl-usage.md","../discovery/autonomous-harness-codex-cost-budget-authority.md","autonomous-harness-readiness-audit-2026-07-31.md","../spec/ux/README.md","github-workflow.md","automation/requirement-schema.md","automation/work-package-and-issue-schema.md","automation/workgraph-state-lock-schema.md","automation/dry-run-planner-contract.md"]
decision_authority: decisions.md and approved operations policies
---

# Operations Index

## Approved policy principles

- [Moderation, sanctions and appeals](moderation-sanctions-and-appeals.md)
- [GitHub documentation workflow](github-workflow.md)

## Operating guidance and drafts

- [AI runtime](ai-runtime.md) records current repository execution guidance.
- [Initial backlog](github-initial-backlog.md) is a reconciled historical/candidate register; it does not override the approved GitHub workflow.
- [Content operations](content-operations.md), [session operations](session-operations.md), [trust/safety operations](trust-safety-operations.md) and [vendor operations](vendor-operations.md) remain procedure drafts where they conflict with current decisions.
- [Requirement extraction schema](automation/requirement-schema.md) retains the
  semantic proposal while its Candidate/canonical machine structure is implemented.
- [Work Package and GitHub Issue schema](automation/work-package-and-issue-schema.md)
  is the second proposal-only contract. It specifies bounded task records and
  Issue projection without creating an Issue or granting Agent execution.
- [WorkGraph state and lock schema](automation/workgraph-state-lock-schema.md)
  is the third proposal-only contract. It defines ordering, state, lease and
  lock requirements without executing a graph.
- [Dry-run Planner contract](automation/dry-run-planner-contract.md) is the
  fourth proposal-only contract. Its bounded implementation emits a read-only
  Plan Proposal without modifying the repository or GitHub.
- [Autonomous Harness readiness audit](autonomous-harness-readiness-audit-2026-07-31.md)
  records the historical evidence and [AH-P0-01 foundation](../discovery/autonomous-harness-foundation-approval-plan.md)
  records the approved canonical identity, authority and projection boundary.
- [AH-P1-01 authority](../discovery/autonomous-harness-readonly-planner-authority.md)
  approved deterministic read-only Proposal generation; PR #53 implemented it.
- [AH-P2-01 authority](../discovery/autonomous-harness-lightweight-worktree-runner-authority.md)
  approved the bounded Runner foundation implemented in Issue #56. The
  implementation uses prepare-only by default. Issue #58 adds an explicit real
  Codex adapter boundary and fake/local process tests, but its temp read-only smoke
  is environment-blocked; each actual run still needs exact pins, a separate
  per-run approval and verified network/filesystem/process containment.
- Issue #60 adds `EXECUTE_PATCH_ONLY` for one exact docs file in a disposable
  OS-temp clone. It emits patch/log/test/result artifacts with commit, push, PR
  and GitHub adapters disabled. Its containment remains `PARTIALLY_VERIFIED`,
  so every actual run needs separate Owner acceptance of the unproved OS
  network, race-free filesystem and Job Object boundaries.
- Issue #62 handles source dubious ownership only with command-scoped
  `safe.directory=<verified absolute source git-dir>` on the clone command.
  Owner approval pins the local source root; global/system/user config and
  source ownership remain unchanged. AH-P2-06
  artifacts stay preserved; a real retry needs a new run ID and Owner approval.
  This does not authorize product-code Pilots.
- [Codex 0.146.0 JSONL evidence](../discovery/autonomous-harness-codex-jsonl-usage.md)
  fixes final token and event-level external-tool verification. Monetary cost is
  absent from JSONL and is never represented as zero.
- [AH-P2-11 cost and token authority](../discovery/autonomous-harness-codex-cost-budget-authority.md)
  approves a narrow ChatGPT/docs-only cost exception and a 600000-token post-run
  hard gate. Issue #68 wires the exact approval, cost-null, token/external-call,
  status and artifact contracts under Draft-PR review. No Pilot was rerun; a
  fresh run ID and fresh per-run approval remain mandatory.
- AH-P2-13 executed one real patch-only Worker, verified 369026 tokens and zero
  external calls, but its effective read-only sandbox rejected its CREATE and
  the run ended `NO_CHANGE`. The run and artifacts are preserved and not reusable.
  Issue #70 requires patch-only CLI, approval and adapter pins to agree on
  `workspace-write`, while exact-path and Git-state postchecks retain control.
  CREATE/MODIFY uses read-only `git ls-tree` at the pinned source SHA and is
  rechecked before Worker launch and after Worker/tests. Ignored files are part
  of the exact-path delta; a later Pilot needs a new run ID and fresh approval.
- AH-P2-15 pinned requested `workspace-write` but Codex 0.146.0 applied effective
  read-only under `--ignore-user-config`; its CREATE was denied and reported
  `NO_CHANGE`. The run is preserved, immutable and never reusable.
- Issue #72 removes that conflicting flag and requires a fresh OS-temp write
  probe for every real patch-only host/config/version/environment binding. It
  must write inside the workspace and fail outside the workspace/temp boundary;
  probe tokens and time consume the same Owner budget. A read-only
  denial is `RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH`; absent, unsafe or stale
  evidence is `RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED`. Both block before
  Worker launch and are operationally `BLOCKED_ENVIRONMENT`, never `NO_CHANGE`.
- Issue #74 persists sanitized raw probe JSONL/stdout/stderr, event inventory,
  usage, binding and filesystem verification to an atomically finalized OS-temp
  artifact directory before sandbox or budget classification. Parser failure,
  truncation, mismatch and `FAILED_BUDGET` retain the evidence; artifact write
  failure exposes no partial final directory and uses
  `RUNNER_PROBE_ARTIFACT_WRITE_FAILED`.
- `RUN-AH-P2-17-EXTERNAL-HOST-RUNBOOK-006` retained only a manifest reporting
  two external calls, so their item types and whether calls or parsing produced
  the number are unavailable evidence. Artifact-less usage is not authoritative
  investigation evidence. That run is immutable; a next Pilot waits for this
  fix to merge and requires a new run ID and fresh Owner approval.
- [Machine schemas](../../schemas/automation/requirement.schema.json) and
  `scripts/harness` canonical tests implement AH-P0-02. The bounded
  `scripts/harness/planner` implementation compiles only Owner-pinned canonical
  Requirements to schema-valid `READ_ONLY_DRY_RUN` proposals.
- Read these after the repository authority sources in this order: Requirement
  Schema, Work Package and Issue Schema, WorkGraph State and Lock Schema, then
  Dry-run Planner Contract, audit, then AH-P0-01/AH-P1-01 authority and machine
  schemas. The Planner is merged and remains non-executing. Issue #56 implements
  the Runner foundation without running a Pilot. Issues #58/#60 add fake/local
  adapter and patch-only validation but run no actual Codex Pilot. No
  Extractor, Project writer, Dispatcher, Runtime
  Ledger or Critic exists, and product execution remains gated.

Update procedure drafts after the relevant approval and before live Pilot.

## Current gates

Moderator staffing/training, live coverage, break-glass, incident tabletop,
NICE/RTC/notification/vendor operations, deletion verification and real-device
evidence must pass before real participants. D-024 is satisfied only for the
approved UX baseline and prototype. PR A/B and V1–V6 are bounded merged facts;
PR C/D, V7+, API/realtime/Production Frontend and operational expansion remain
separately gated. No vendor account, credential, cloud resource or paid service
is created by these documents.

