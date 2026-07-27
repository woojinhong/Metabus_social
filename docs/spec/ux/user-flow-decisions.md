---
title: Draft User-Flow Decisions
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft User-Flow Decisions

## Approved product constraints

- Six eligible participants, Seoul, 25-39 recruitment, target 3:3 compatible heterosexual cohort.
- Account-bound reservation, T-24h confirmation, device check, waiting room and fail-closed admission.
- Ninety-minute voice-first group session with three games and free conversation.
- Required private face photo; initial display excludes face and exact details.
- Initial interest allows zero to two; limited reveal needs mutual initial interest and independent resource consent.
- Final romantic choice allows zero or one; final mutual grants ten-minute pair voice only.
- No public counts, rejection reason, group webcam, private text, payment, recording or external-contact exchange.

## Interaction decisions requiring approval

| Flow | Decision required | Why it matters downstream |
| --- | --- | --- |
| Registration | page sequence, email verification timing, recovery confirmation | auth API/session and abandonment measurement |
| Eligibility | provider handoff/return, retry/support presentation | callback status model and accessibility |
| Profile/media | progressive vs single setup, photo replacement/hold explanation | media states and persistence |
| Reservation | list/detail split, underfill/standby wording, cancel confirmation | query model and notification timing |
| Device/waiting | combined vs separate, readiness definition, missing-member presentation | real-time presence and support events |
| Session | control hierarchy, participant representation, prompt/turn behavior | state/event and accessibility model |
| Interest/reveal | selection layout, confirmation/edit, shoulder-surfing protection, revoke path | privacy/API/state requirements |
| No-match | timing, language, exit/follow-up and safe blocking | outcome model and notifications |
| Reconnect/failure | overlay vs route, retry ownership, cancel/rebook handoff | event replay and error contracts |
| Safety | contextual/global entry, immediate block order, evidence capture | authorization and case model |

No flow is approved merely because its product rule is fixed. Wireflows below are decision checklists, not designs.

