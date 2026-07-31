---
title: Repository Operating Contract
document_type: guidance
classification: confirmed fact
status: Active
last_verified: 2026-07-31
related_documents: ["docs/INDEX.md","docs/discovery/decisions.md","docs/discovery/slice-01-current-authority.md","docs/operations/github-workflow.md"]
decision_authority: explicit user approvals recorded in decisions.md and repository-owner workflow delegation
---

# Repository Operating Contract

## Phase and scope

- The bounded Korean MVP product/platform baseline is approved in [decisions.md](docs/discovery/decisions.md).
- ADR-001 through ADR-010 are Accepted for the bounded Pilot.
- Live participant operation is not approved until legal, procurement, vendor, real-device, moderation and privacy gates pass.
- D-024 is satisfied for the approved UX baseline and isolated low-fidelity prototype.
- PR A Product Bootstrap and PR B Persistence Foundation, including the exact V1–V6 migrations, are bounded merged repository facts. Their current scope is recorded in [Slice 01 current authority](docs/discovery/slice-01-current-authority.md).
- PR C Authentication, PR D Security Commands, V7+ or other new migrations, authoritative API/realtime/frontend contracts, vendor/provisioning/deployment and live Pilot operation remain separately gated.
- Proposal contracts retain `implementation_ready: false`: this blocks broad production promotion without denying the bounded PR A/B completion already present on `master`.

## Required read order

1. [Documentation index](docs/INDEX.md).
2. [Approved decisions](docs/discovery/decisions.md).
3. [Slice 01 current implementation authority](docs/discovery/slice-01-current-authority.md).
4. Relevant approved product and security specifications.
5. [UX prerequisites](docs/spec/ux/README.md) and open UX decisions.
6. Relevant Accepted ADRs and architecture boundaries.
7. Research for evidence and procurement caveats.
8. Wiki only for non-authoritative navigation.
9. Current code and Git history as implementation-state evidence; code is not authority for new work.

## Authority hierarchy

1. Explicit product/gate decisions in decisions.md and repository workflow
   delegation in the approved operations policy.
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
- reopening or changing the D-024-approved UX baseline, screens, wireflows, responsive/mobile or accessibility interactions;
- making OpenAPI, database schema, real-time payload/state machine or page authorization authoritative;
- accepting/superseding an ADR or changing selected stack/vendor/database/region;
- adding biometric/manual document review, payment/deposit or broader sensitive processing;
- creating or changing product/infrastructure/UI code beyond the bounded PR A/B baseline, adding V7+ or other migrations, or provisioning resources;
- Git writes outside the approved documentation workflow, including merge, ready-for-review transition, direct protected-branch push, reset, clean, force push, deletion or history rewrite.

## Documentation routing

| Material | Canonical location |
| --- | --- |
| Decisions | docs/discovery/decisions.md |
| Repository workflow policy | docs/operations/github-workflow.md |
| External evidence | docs/research/ |
| Assumptions/questions/exploration | docs/discovery/ |
| Approved product rules and draft UX/API/data | docs/spec/ |
| Accepted technical choices | docs/adr/ |
| Deployment/vendor boundaries | docs/architecture/ |
| Operational policies | docs/operations/ |
| Non-authoritative navigation | docs/wiki/ and korea.md |

Do not repeat research in specifications. Do not infer UI from architecture. Draft API/data/realtime artifacts must preserve `implementation_ready: false`, distinguish the bounded PR A/B baseline from broad production promotion, and accurately name their current promotion gate.

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

The owner-approved documentation workflow is:

`Issue -> working branch -> document changes -> document validation -> commit -> push -> Draft PR`

Within an explicitly delegated Markdown, research, discovery, UX, decision-draft,
traceability, review, operations, documentation-validation or harness scope, an
agent may create the Issue and branch, edit allowed files, validate, commit,
push the working branch and open a Draft PR. Follow the Issue criteria and
validation requirements in [GitHub workflow](docs/operations/github-workflow.md).

This delegation does not authorize automatic merge, automatic ready-for-review,
automatic Issue closure, owner decisions, ADR acceptance, direct push to `main`
or another protected branch, reset, clean, force push, history rewrite,
implementation artifacts, deployment, provisioning, vendor integration or
spend.

