---
title: Draft User-Flow Decisions
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved User-Flow Decisions

## Approved product constraints

- Six eligible participants, Seoul, 25-39 recruitment, target 3:3 compatible heterosexual cohort.
- Account-bound reservation, T-24h confirmation, device check, waiting room and fail-closed admission.
- Ninety-minute voice-first group session with three games and free conversation.
- Required private face photo; initial display excludes face and exact details.
- Initial interest allows zero to two; limited reveal needs mutual initial interest and independent resource consent.
- Final romantic choice allows zero or one; final mutual grants ten-minute pair voice only.
- No public counts, rejection reason, group webcam, private text, payment, recording or external-contact exchange.

## Approved interaction decisions

| Flow | Approved review behavior | Deferred implementation boundary |
| --- | --- | --- |
| Registration | page sequence, email verification timing, recovery confirmation | auth API/session and abandonment measurement |
| Eligibility | provider handoff/return, retry/support presentation | callback status model and accessibility |
| Profile/media | progressive vs single setup, photo replacement/hold explanation | media states and persistence |
| Reservation | list/detail split, underfill/standby wording, cancel confirmation | query model and notification timing |
| Device/waiting | distinct `P08`/`P09`, explicit readiness, neutral cohort state | presence and notification contracts |
| Session | persistent hierarchy, neutral stable participants, restrained timer | state/event and layout implementation |
| Interest/reveal | explicit choices, resource-specific live consent, protected view | privacy/API/state contracts |
| No-match | capability-only result, common timing and closing | outcome model and notifications |
| Reconnect/failure | inline/overlay/blocking classes and current-authority recovery | replay and error contracts |
| Safety | persistent entry with independent leave/block/report | authorization and case contracts |

Registration, eligibility, profile/media and reservation detail layouts remain
within the approved screen/IA boundaries but are outside the first prototype.
No row defines a final route, component, API, state or event.

