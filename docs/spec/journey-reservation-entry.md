---
title: "Journey: Reservation and Session Entry"
document_type: specification
classification: proposal
status: "Proposal — Unapproved"
last_verified: 2026-07-27
related_documents: ["user-journeys.md","invitations-and-attendance.md","non-functional-requirements.md"]
decision_authority: "Only explicit approvals in ../discovery/decisions.md"
---

> **Proposal — Unapproved.** This document defines reviewable candidate behavior. It does not authorize implementation.

# Journey: Reservation and Session Entry

| ID / stage | Goal | Anxiety | Required information | Hidden information | Consent point | Primary action | Failure states | Recovery | Accessibility | Web | Mobile | Measurable event | Security boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UX-JRN-201 / Stage 7 — Session browsing and reservation | Find viable time | Empty or incompatible room | Time, broad area, duration, rules | Other reservations and constraints | Reservation terms and notifications | Reserve eligible slot | Full; cohort risk; duplicate | Waitlist/rebook/cancel | Time-zone and duration clarity | Responsive schedule; calendar file | Deep link and calendar handoff | slot_viewed/reserved/unavailable | Eligibility rechecked server-side |
| UX-JRN-202 / Stage 8 — Payment or deposit | Understand cost | Refund or access ambiguity | Free initial-pilot statement | Payment data: N/A | None in initial boundary | Continue without payment | Any payment request is invalid | Stop and report; no paywall | No payment-only access | Same free flow | Same free flow | payment_stage_skipped | Proposal — Deferred/N/A; no payment FR or processor |
| UX-JRN-203 / Stage 9 — Attendance confirmation | Keep or release seat | Penalty; uncertain cohort | Deadline and consequence | Other confirmations | Reconfirmation communication | Confirm, decline, or cancel | Missed reminder; cohort failure | Grace rule; rebook; replacement policy | Multiple channels; clear deadlines | Authenticated action; email fallback | Push/deep link with account check | attendance_confirmed/declined/expired | Link cannot authorize admission |
| UX-JRN-204 / Stage 10 — Device and microphone check | Know device is ready | Being unheard; permission fear | Supported device, test outcome | Test audio stays local where possible | Microphone access only on action | Run mic/output/network test | Denied permission; Bluetooth; weak network | Guided fix; text/support; rejoin test | Captions/text instructions; keyboard; visual level plus nonvisual status | Browser-specific permission help | Interruption/Bluetooth route checks | device_check_passed/failed_reason | No stored voice; permission scoped to test/session |
| UX-JRN-205 / Stage 11 — Waiting room | Arrive calmly | Public exposure; delay | Start time, readiness, current visibility | Cohort identities until admission | Restate live-session rules | Check readiness and wait | Early/late; cohort cancelled; support need | Countdown, notice, rebook, support | Screen-reader live regions; no autoplay sound dependency | Tab visibility warning | Background/lock warning; local notification | waiting_entered/ready/timeout | No participant chat; no room credential exposure |
| UX-JRN-206 / Stage 12 — Secure session entry | Join assigned room | Leaked link; wrong room | Account, reservation, readiness | Provider room identity/token | Live voice participation grant at join | Request admission and connect | Expired token; stale stage; duplicate device; provider outage | Fresh account-bound token; reconnect; operator cancellation | Announce connection state; retry without motor precision | User gesture before audio; reload-safe recovery | App-link validation; call interruption handling | admission_requested/joined/rejected/reconnected | One-time short-TTL room/stage token; device-session limit |

## Entry invariants

| ID | Proposal — unapproved |
| --- | --- |
| SR-JRN-201 | A URL, calendar entry, notification, or provider room name must never authorize entry by itself |
| SR-JRN-202 | Token refresh requires an active account session, matching reservation, current admission state, and allowed device session |
| SR-JRN-203 | Late join and reconnect restore only the current authorized stage; they never replay broader prior permissions |
| UX-JRN-207 | Cohort failure, operator cancellation, and technical failure use distinct messages and measurements without blaming participants |

**Proposal:** Rebooking is the initial recovery because fees, deposits, penalties, refunds, and financial compensation remain outside scope.
