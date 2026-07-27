---
title: Initial Korean MVP Boundary
document_type: specification
classification: user decision
status: Approved product boundary; UX pending
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","session-experience.md","security/identity-admission-and-invitations.md"]
decision_authority: D-001 through D-007
---

# Initial Korean MVP Boundary

## Purpose

The approved MVP is a free, scheduled, private, voice-first dating Pilot. It validates the interaction mechanism and operating safety; it does not approve public launch, production compliance, or source-code creation.

## Cohort

| Rule | Approved value |
| --- | --- |
| Area | Broad Seoul activity area |
| Recruitment age | 25–39; participant must have reached the 19th birthday |
| Intent | Dating |
| Orientation scope | Mutually compatible heterosexual Pilot cohort |
| Size/composition | Exactly six; target three women and three men |
| Compatibility | Reciprocal age preference, gender/orientation, area, dating intent, hard lifestyle constraints, availability |

The cohort rule is a reversible Pilot decision. Fairness, inclusion, discrimination, and sensitive-preference processing require qualified review before recruitment.

## Included requirements

| ID | Approved behavior |
| --- | --- |
| FR-SCP-001 | Account registration, secure login, deletion, device registration, and account-bound reservation |
| FR-SCP-002 | Private compatibility evaluation without public profile browsing or silent constraint relaxation |
| FR-SCP-003 | Attendance confirmation, device check, waiting room, rules, consent summary, and one-time admission exchange |
| FR-SCP-004 | Exactly six-person group voice with server-authoritative stages and no group webcam |
| FR-SCP-005 | Three approved games, free group conversation, pass/text alternatives, timer and recovery |
| FR-SCP-006 | Private initial interest, mutual-consent limited reveal, final private interest, and compatible mutual progression |
| FR-SCP-007 | One ten-minute one-to-one voice room after final compatible mutual selection |
| FR-SCP-008 | Block, report, operator mute/remove/pause/cancel, sanction, appeal, feedback, and support |
| FR-SCP-009 | NICE mobile identity verification and conservative 19th-birthday eligibility before reservation confirmation |

## Session start and failure rules

- A slot is confirmed only after six compatible participants confirm by T-24h; eligible standby replacement closes at T-2h.
- The live session starts only when six eligible participants pass admission. Otherwise it is cancelled and rebooked without penalty.
- If a participant permanently leaves after start, the operator pauses. Continuation with five requires all remaining participants' explicit consent and no broken compatibility rule; otherwise cancel and rebook.
- Vendor, quota, safety, or authority uncertainty fails closed; operations never substitute an ineligible person or widen access.

## Explicit exclusions

Payment, deposits, financial penalties, webcam, offline coordination, private text before mutual progression, temporary subgroups, live facilitator, recording, automated desirability/relationship scoring, popularity counts, biometric/liveness/face comparison, raw identity documents, CI/DI, manual identity review, public media URLs, and LLM-only moderation.

## Implementation and operation gates

- **Specification approval:** approved by D-001 through D-023.
- **Source code:** not created or authorized by this documentation task.
- **Live Pilot:** blocked until all legal, procurement, vendor, real-device, moderator, deletion, and incident-readiness gates in [traceability-implementation.md](traceability-implementation.md) pass.

