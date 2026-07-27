---
title: Documentation Index
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-07-27
related_documents: ["discovery/decisions.md","spec/ux/README.md","wiki/README.md"]
decision_authority: discovery/decisions.md
---

# Documentation Index

## Current phase

The product/MVP and bounded Pilot platform baseline are approved. ADR-001 through ADR-010 are Accepted. Detailed UX and implementation-level contracts remain pending D-024; source-code creation, provisioning, procurement and live operation are not authorized.

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

1. User decisions in decisions.md.
2. Approved specification SOT.
3. Accepted ADRs.
4. Architecture and operations SOT.
5. Research findings.
6. Assumptions, proposals and open questions.
7. Wiki, reviews and summaries.

D-024 prevents draft UX, API capability, conceptual data and real-time capability documents from becoming implementation contracts. Only later explicit approval may promote them.

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

UX approval, implementation contracts, code, cloud/procurement, live operation, biometric/payment changes, ADR changes and destructive Git actions all require explicit authority as described in AGENTS.md.

