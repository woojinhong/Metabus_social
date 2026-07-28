---
title: Documentation Index
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-07-28
related_documents: ["discovery/decisions.md","spec/ux/README.md","operations/github-workflow.md","wiki/README.md"]
decision_authority: discovery/decisions.md and explicit repository-owner workflow delegation
---

# Documentation Index

## Current phase

The product/MVP and bounded Pilot platform baseline are approved. ADR-001 through ADR-010 are Accepted. The D-024 UX gate was satisfied on 2026-07-28 and authorizes only the isolated low-fidelity UX prototype; production source code, implementation contracts, provisioning, procurement and live operation are not authorized.

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

1. User product/gate decisions in decisions.md and repository workflow
   delegation in the approved operations policy.
2. Approved specification SOT.
3. Accepted ADRs.
4. Architecture and operations SOT.
5. Research findings.
6. Assumptions, proposals and open questions.
7. Wiki, reviews and summaries.

D-024 keeps the approved UX baseline separate from API capability, conceptual data and real-time capability documents. Only a later explicit phase may promote implementation contracts.

## Directory purposes

| Directory | Responsibility |
| --- | --- |
| docs/discovery | Approved decisions plus assumptions, questions and exploration |
| docs/spec | Approved product/security/NFR rules; UX/API/data drafts with explicit status |
| docs/spec/ux | Required UX approval package; no visual designs yet |
| docs/spec/api | High-level capability inventory only; no OpenAPI yet |
| docs/spec/data | Concepts/classification/retention; no schema or migrations |
| docs/adr | Accepted architecture decisions and their gates |
| docs/architecture | Selected deployment/vendor boundaries and broader analysis |
| docs/research | External evidence and limitations |
| docs/operations | Approved operational policy and procedural drafts |
| docs/wiki | Non-authoritative human/LLM navigation |

## Stable IDs and document rules

Functional FR-DOMAIN-###, UX UX-DOMAIN-###, safety SR-DOMAIN-###, non-functional NFR-DOMAIN-###, assumptions A-###, questions OQ-DOMAIN-### or UX-OQ-###, decisions D-### and ADRs ADR-###. Declare each once. Durable Markdown under root/docs is at most 200 lines, uses relative links and preserves classification/status. OMX/Codex runtime/cache files are excluded.

## Decision gates

The owner-approved documentation Git workflow is defined in [GitHub workflow](operations/github-workflow.md). Implementation contracts, code, cloud/procurement, live operation, biometric/payment changes, ADR changes, merge and destructive Git actions retain their separate explicit gates in AGENTS.md.

