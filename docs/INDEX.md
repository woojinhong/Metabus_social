---
title: Documentation Index
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-07-29
related_documents: ["discovery/decisions.md","discovery/implementation-contract-promotion-proposal.md","spec/traceability-ux-implementation.md","spec/actor-authorization-contract.md","spec/lifecycle-contract.md","spec/realtime-contract.md","spec/api-contract.md","spec/data-contract.md","spec/ux/README.md","operations/github-workflow.md","wiki/README.md"]
decision_authority: discovery/decisions.md, Issue #7 documentation-phase approval and repository-owner workflow delegation
---

# Documentation Index

## Current phase

The product/MVP and bounded Pilot platform baseline are approved. ADR-001
through ADR-010 are Accepted. D-024 is satisfied. The owner approved a
proposal-only Implementation Contract documentation phase in
[Issue #7](https://github.com/woojinhong/Metabus_social/issues/7); authoritative
contracts, production source code, provisioning, procurement and live operation
remain unauthorized.

## Required read order

1. Root [AGENTS.md](../AGENTS.md) and this index.
2. [Decision log](discovery/decisions.md).
3. [Approved product brief](discovery/product-brief.md) and [MVP scope](spec/mvp-scope.md).
4. [UX approval prerequisites](spec/ux/README.md) and [open UX decisions](spec/ux/open-ux-decisions.md).
5. Relevant approved specifications and [implementation traceability gate](spec/traceability-implementation.md).
6. [Accepted ADRs](adr/README.md), [architecture](architecture/README.md) and [operations](operations/README.md).
7. [Research](research/README.md), including [Korean MVP vendor verification](research/technology/korean-mvp-vendor-verification.md).
8. [Wiki](wiki/README.md) and [Korean owner overview](../korea.md) for non-authoritative navigation.

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

D-024 keeps the approved UX baseline separate from API capability, conceptual data and real-time capability documents. Only a later explicit phase may promote implementation contracts.

The [Implementation Contract phase proposal](discovery/implementation-contract-promotion-proposal.md)
records the approved documentation-only boundary. Its first
[UX-to-Implementation matrix](spec/traceability-ux-implementation.md) remains a
proposal with `implementation_ready: false`. The follow-up
[Actor/Authorization contract](spec/actor-authorization-contract.md) is also
non-authoritative and not implementation-ready. The next
[Lifecycle contract](spec/lifecycle-contract.md),
[Realtime contract](spec/realtime-contract.md), [API contract](spec/api-contract.md)
and [Data contract](spec/data-contract.md) preserve the same boundary.

## Directory purposes

| Directory | Responsibility |
| --- | --- |
| docs/discovery | Approved decisions plus assumptions, questions and exploration |
| docs/spec | Approved rules plus UX/API/data and Implementation Contract proposals with explicit status |
| docs/spec/ux | Required UX approval package; no visual designs yet |
| docs/spec/api | Proposal-only logical API, error, idempotency and realtime-delivery contracts; no OpenAPI |
| docs/spec/data | Proposal-only logical data ownership, lifecycle/classification/retention; no schema or migrations |
| docs/adr | Accepted architecture decisions and their gates |
| docs/architecture | Selected deployment/vendor boundaries and broader analysis |
| docs/research | External evidence and limitations |
| docs/operations | Approved operational policy and procedural drafts |
| docs/wiki | Non-authoritative human/LLM navigation |

## Stable IDs and document rules

Functional FR-DOMAIN-###, UX UX-DOMAIN-###, safety SR-DOMAIN-###, non-functional NFR-DOMAIN-###, assumptions A-###, questions OQ-DOMAIN-### or UX-OQ-###, decisions D-### and ADRs ADR-###. Declare each once. Durable Markdown under root/docs is at most 200 lines, uses relative links and preserves classification/status. OMX/Codex runtime/cache files are excluded.

## Decision gates

The owner-approved documentation Git workflow is defined in [GitHub workflow](operations/github-workflow.md). Implementation contracts, code, cloud/procurement, live operation, biometric/payment changes, ADR changes, merge and destructive Git actions retain their separate explicit gates in AGENTS.md.

