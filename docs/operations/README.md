---
title: Operations Index
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-07-31
related_documents: ["../../schemas/automation/requirement.schema.json","../discovery/decisions.md","../discovery/slice-01-current-authority.md","../discovery/autonomous-harness-foundation-approval-plan.md","../discovery/autonomous-harness-readonly-planner-authority.md","../discovery/autonomous-harness-lightweight-worktree-runner-authority.md","autonomous-harness-readiness-audit-2026-07-31.md","../spec/ux/README.md","github-workflow.md","automation/requirement-schema.md","automation/work-package-and-issue-schema.md","automation/workgraph-state-lock-schema.md","automation/dry-run-planner-contract.md"]
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
  approves a future bounded Runner implementation after authority merge. Each actual
  run still needs Owner-approved Planner digest and selected READY Package IDs.
- [Machine schemas](../../schemas/automation/requirement.schema.json) and
  `scripts/harness` canonical tests implement AH-P0-02. The bounded
  `scripts/harness/planner` implementation compiles only Owner-pinned canonical
  Requirements to schema-valid `READ_ONLY_DRY_RUN` proposals.
- Read these after the repository authority sources in this order: Requirement
  Schema, Work Package and Issue Schema, WorkGraph State and Lock Schema, then
  Dry-run Planner Contract, audit, then AH-P0-01/AH-P1-01 authority and machine
  schemas. The Planner is merged and remains non-executing. The Runner authority
  is documented but Runner code does not exist. No Extractor, Project writer,
  Dispatcher, Runtime Ledger or Critic exists, and product execution remains gated.

Update procedure drafts after the relevant approval and before live Pilot.

## Current gates

Moderator staffing/training, live coverage, break-glass, incident tabletop,
NICE/RTC/notification/vendor operations, deletion verification and real-device
evidence must pass before real participants. D-024 is satisfied only for the
approved UX baseline and prototype. PR A/B and V1–V6 are bounded merged facts;
PR C/D, V7+, API/realtime/Production Frontend and operational expansion remain
separately gated. No vendor account, credential, cloud resource or paid service
is created by these documents.

