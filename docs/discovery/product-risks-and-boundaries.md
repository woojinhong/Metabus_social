---
title: Product Risks and Boundaries
document_type: discovery
classification: assumption
status: Unapproved
last_verified: 2026-07-27
related_documents:
  - product-concept.md
  - assumptions.md
  - open-questions.md
  - ../architecture/security-privacy.md
decision_authority: decisions.md only
---

# Product Risks and Boundaries

## Trust, Safety, and Misuse Risks

| Risk | Classification | Evidence needed or boundary |
| --- | --- | --- |
| Delayed-photo rejection | assumption | fairness, disappointment, return, before/after reveal behavior |
| Photo-as-reward | risk proposal | treat disclosure as subject consent, never a game prize |
| Liquidity fragmentation | assumption | eligibility yield, confirmation, cancellation, attendance by segment |
| Popularity concentration | assumption | attention and selection concentration by voice, humor, fluency, status clues |
| Performance pressure | assumption | segmented pressure and accessibility outcomes; pass/text alternatives |
| Hidden incompatibility | assumption | private verification must preserve relevance without opaque relaxation |
| Webcam/privacy | deferred risk | capture, coercion, background exposure, sexual misconduct; no prevention promise |
| Facilitation | open question | safety/participation benefit versus labor, bias, consistency, unit economics |
| Game overload | assumption | natural follow-up, perceived workshop/interview burden |
| Deposit/no-show | deferred risk | friction, refunds, disputes, technical failure, romantic-access perception |

## Liquidity and cohort risk

**Assumption:** time, geography, age, dating intent, orientation compatibility, composition, confirmation, cancellation, and attendance fragment supply. Six attended seats may require materially more reservations. Exact ratios require field evidence.

**Open question:** whether balanced composition is inclusive, lawful, desirable, and operationally feasible. No equal binary ratio is a fixed requirement.

## Consent and disclosure risk

**Boundary proposal:** consent must distinguish collection, storage, processing, a named disclosure audience, private messaging, one-to-one voice, future webcam publish/view, and future offline coordination.

Unknown, expired, withdrawn, conflicting, or unverifiable consent fails closed. Withdrawal stops future server-mediated access; previously captured material cannot be recalled.

## Business-Model Hypotheses

- **Proposal:** initial validation is free; payments and deposits are outside the proposed initial MVP.
- **Assumption:** a future session fee could fund operations without implying that payment buys romantic access.
- **Assumption:** a future deposit might reduce no-shows enough to justify conversion, refund, dispute, and legal burden.
- **Evidence gap:** authorization holds, penalties, partial refunds, app-store rules, tax, and consumer-law treatment require separate research and legal review.
- **Boundary:** no payment provider, payment flow, refund workflow, or deposit policy is selected.

## Operational risks

- Facilitator labor may improve safety but create consistency, bias, and cost risks.
- Automated prompts reduce labor but may respond poorly to conflict or accessibility needs.
- Content operations require review, versioning, retirement, and incident feedback.
- Operator cancellation and media-provider outages require safe cancellation/rebooking.
- Private interests and sensitive preferences create insider-access risk.

## Explicit Non-Goals

The current concept does not approve:

- guaranteed romantic matching or relationship outcomes;
- public attractiveness, popularity, or selection scores;
- automatic one-to-one contact;
- photo access without the subject's consent;
- webcam without independent mutual consent;
- exact-location exposure in group sessions;
- sale of ranking or preferential access to people;
- payment for safety features or genuine mutual interest;
- automatic offline booking;
- mandatory photo reveal or webcam;
- generic open social networking;
- application implementation.

## Decision Boundaries

Only explicit approvals in [decisions.md](decisions.md) can resolve product scope. Architecture and specifications must preserve alternatives for photo timing, cohort rules, facilitation, and progression until those choices are approved.
