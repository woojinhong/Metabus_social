---
title: Repository Operating Contract
document_type: guidance
classification: confirmed fact
status: Active
last_verified: 2026-07-27
related_documents: ["docs/INDEX.md","docs/discovery/decisions.md"]
decision_authority: explicit user approvals recorded in decisions.md
---

# Repository Operating Contract

## Phase and scope

- The bounded Korean MVP product/platform baseline is approved in [decisions.md](docs/discovery/decisions.md).
- ADR-001 through ADR-010 are Accepted for the bounded Pilot.
- Live participant operation is not approved until legal, procurement, vendor, real-device, moderation and privacy gates pass.
- Detailed UI/UX, OpenAPI endpoints/DTOs, database schema/enums, real-time state/payloads, frontend contracts and source-code implementation are not approved. D-024 is the controlling UX gate.
- No application source code, infrastructure, migrations, cloud resources, vendor accounts, credentials, charges or Git writes are authorized by the current documentation baseline.

## Required read order

1. [Documentation index](docs/INDEX.md).
2. [Approved decisions](docs/discovery/decisions.md).
3. Relevant approved product and security specifications.
4. [UX prerequisites](docs/spec/ux/README.md) and open UX decisions.
5. Relevant Accepted ADRs and architecture boundaries.
6. Research for evidence and procurement caveats.
7. Wiki only for non-authoritative navigation.
8. Current code only after explicit source-code authorization; code is evidence, not product authority.

## Authority hierarchy

1. Explicit decisions in decisions.md.
2. Approved specifications.
3. Accepted ADRs.
4. Architecture and operations SOT.
5. Confirmed facts and source-backed research.
6. Assumptions, proposals and open questions.
7. Wiki/reviews/summaries and current code as evidence only.

Canonical classifications: confirmed fact, user decision, assumption, research finding, proposal and open question. Preserve uncertainty and gates.

## Change gates

Explicit user approval is required before:

- changing approved product/MVP scope, cohort, session, disclosure or safety policy;
- closing D-024 or approving UI, information architecture, screens, wireflows, responsive/mobile or accessibility interactions;
- making OpenAPI, database schema, real-time payload/state machine or page authorization authoritative;
- accepting/superseding an ADR or changing selected stack/vendor/database/region;
- adding biometric/manual document review, payment/deposit or broader sensitive processing;
- creating application/infrastructure/migration/UI code or provisioning resources;
- committing, pushing, merging, resetting, cleaning, deleting or rewriting history.

## Documentation routing

| Material | Canonical location |
| --- | --- |
| Decisions | docs/discovery/decisions.md |
| External evidence | docs/research/ |
| Assumptions/questions/exploration | docs/discovery/ |
| Approved product rules and draft UX/API/data | docs/spec/ |
| Accepted technical choices | docs/adr/ |
| Deployment/vendor boundaries | docs/architecture/ |
| Operational policies | docs/operations/ |
| Non-authoritative navigation | docs/wiki/ and korea.md |

Do not repeat research in specifications. Do not infer UI from architecture. Draft API/data/realtime artifacts must include status: draft pending UX approval and implementation_ready: false.

## LLM working rules

- Use official sources for current technology, pricing, policy and regulation.
- Prefer one selected baseline, one fallback and explicit exit, without overstating procurement or compliance.
- Keep durable Markdown at 200 lines or fewer; split by responsibility.
- Declare stable IDs once, update traceability and verify local links.
- Do not log raw identity/DOB/CI/DI, phone, preferences, answers, interests, grants, credentials, voice, photos or message content.
- Do not treat Accepted platform ADRs as authorization to implement.
- Report files changed, decisions made/not made, evidence gaps, validation and required approval.

## OMX workflow

Use best-practice-research for official evidence, analyze for repository synthesis, ralplan for trade-offs, prometheus-strict for high-risk stress testing, code-review and ultraqa for documentation verification. Team/implementation workflows require an approved execution scope; do not recreate OMX skills locally.

## Git safety

Do not commit, push, merge, reset, clean, delete or rewrite history without explicit approval.

