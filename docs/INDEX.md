---
title: Documentation Index
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-07-31
related_documents: ["../schemas/automation/requirement.schema.json","discovery/decisions.md","discovery/slice-01-current-authority.md","discovery/autonomous-harness-foundation-approval-plan.md","discovery/autonomous-harness-readonly-planner-authority.md","discovery/autonomous-harness-lightweight-worktree-runner-authority.md","operations/autonomous-harness-readiness-audit-2026-07-31.md","discovery/implementation-contract-promotion-proposal.md","discovery/slice-01-account-session-authorization-plan.md","discovery/slice-01-product-implementation-approval-plan.md","spec/traceability-ux-implementation.md","spec/actor-authorization-contract.md","spec/lifecycle-contract.md","spec/realtime-contract.md","spec/api-contract.md","spec/data-contract.md","spec/ux/README.md","operations/github-workflow.md","wiki/README.md"]
decision_authority: discovery/decisions.md, Issue #7 documentation-phase approval and repository-owner workflow delegation
---

# Documentation Index

## Current phase

The product/MVP and bounded Pilot platform baseline are approved. ADR-001
through ADR-010 are Accepted and D-024 is satisfied. The
[Slice 01 current authority](discovery/slice-01-current-authority.md) records
PR A Product Bootstrap and PR B Persistence Foundation, including V1–V6, as
bounded merged facts. PR C/D, V7+ or other migrations, authoritative API,
realtime and Production Frontend contracts, provisioning, procurement and live
operation remain separately gated.

## Required read order

1. Root [AGENTS.md](../AGENTS.md) and this index.
2. [Decision log](discovery/decisions.md).
3. [Slice 01 current implementation authority](discovery/slice-01-current-authority.md).
4. [Approved product brief](discovery/product-brief.md) and [MVP scope](spec/mvp-scope.md).
5. [UX approval prerequisites](spec/ux/README.md) and [open UX decisions](spec/ux/open-ux-decisions.md).
6. Relevant approved specifications and [implementation traceability gate](spec/traceability-implementation.md).
7. [Accepted ADRs](adr/README.md), [architecture](architecture/README.md) and [operations](operations/README.md).
8. [Research](research/README.md), including [Korean MVP vendor verification](research/technology/korean-mvp-vendor-verification.md).
9. [Wiki](wiki/README.md) and [Korean owner overview](../korea.md) for non-authoritative navigation.

For Harness work, read the [readiness audit](operations/autonomous-harness-readiness-audit-2026-07-31.md)
and [AH-P0-01 foundation](discovery/autonomous-harness-foundation-approval-plan.md),
then [AH-P1-01 authority](discovery/autonomous-harness-readonly-planner-authority.md)
and [AH-P2-01 authority](discovery/autonomous-harness-lightweight-worktree-runner-authority.md),
then the [AH-P0-02 machine schemas](../schemas/automation/requirement.schema.json).
PR #53 implements the non-executing Planner. Issue #56 Draft PR implements the
AH-P2-01 bounded Runner foundation with prepare-only and fake-adapter validation;
it does not run a Pilot. Each real run still needs an exact Owner-approved
Planner digest, selected READY Package IDs and a per-run approval record.

## Authority and promotion

1. User product/gate decisions in decisions.md, the Issue #7 documentation
   approval and repository workflow delegation in the approved operations
   policy.
2. Approved specification SOT.
3. Accepted ADRs.
4. Architecture and operations SOT.
5. Research findings.
6. Assumptions, proposals and open questions.
7. Wiki, reviews and summaries.

D-024 keeps the approved UX baseline separate from API capability, conceptual
data and real-time capability documents. Separately merged PR A/B do not promote
those proposal contracts or authorize PR C/D.

The [Implementation Contract phase proposal](discovery/implementation-contract-promotion-proposal.md)
records the approved documentation-only boundary. Its first
[UX-to-Implementation matrix](spec/traceability-ux-implementation.md) remains a
proposal with `implementation_ready: false`. The follow-up
[Actor/Authorization contract](spec/actor-authorization-contract.md) is also
non-authoritative and not implementation-ready. The next
[Lifecycle contract](spec/lifecycle-contract.md),
[Realtime contract](spec/realtime-contract.md), [API contract](spec/api-contract.md)
and [Data contract](spec/data-contract.md) preserve the same boundary.
The [Slice 01 implementation plan](discovery/slice-01-account-session-authorization-plan.md)
is an unapproved proposal; it does not authorize source code or migrations.
The [Slice 01 product implementation approval plan](discovery/slice-01-product-implementation-approval-plan.md)
is a partially superseded historical proposal: PR A/B are bounded complete,
while PR C/D remain ungranted. Proposal-contract `implementation_ready: false`
continues to block broad production promotion, not the exact merged PR A/B baseline.

## Directory purposes

| Directory | Responsibility |
| --- | --- |
| docs/discovery | Approved decisions plus assumptions, questions and exploration |
| docs/spec | Approved rules plus UX/API/data and Implementation Contract proposals with explicit status |
| docs/spec/ux | Required UX approval package; no visual designs yet |
| docs/spec/api | Proposal-only logical API, error, idempotency and realtime-delivery contracts; no OpenAPI |
| docs/spec/data | Proposal-only logical data ownership, lifecycle/classification/retention; no promotion of additional schema or migrations |
| docs/adr | Accepted architecture decisions and their gates |
| docs/architecture | Selected deployment/vendor boundaries and broader analysis |
| docs/research | External evidence and limitations |
| docs/operations | Approved operational policy and procedural drafts |
| docs/wiki | Non-authoritative human/LLM navigation |
| schemas/automation | AH-P0-02 machine-readable contract schemas; no runtime authority |
| scripts/harness | Deterministic canonicalization, identity, structural contracts, merged read-only Planner and Issue #56 bounded Runner foundation; no actual Pilot |

## Stable IDs and document rules

Functional FR-DOMAIN-###, UX UX-DOMAIN-###, safety SR-DOMAIN-###, non-functional NFR-DOMAIN-###, assumptions A-###, questions OQ-DOMAIN-### or UX-OQ-###, decisions D-### and ADRs ADR-###. Declare each once. Durable Markdown under root/docs is at most 200 lines, uses relative links and preserves classification/status. OMX/Codex runtime/cache files are excluded.

## Decision gates

The owner-approved documentation Git workflow is defined in [GitHub workflow](operations/github-workflow.md). Implementation contracts, code, cloud/procurement, live operation, biometric/payment changes, ADR changes, merge and destructive Git actions retain their separate explicit gates in AGENTS.md.

