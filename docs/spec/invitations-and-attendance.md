---
title: Approved Invitations and Attendance
document_type: specification
classification: user decision
status: Approved product and UX interaction baseline; implementation promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["mvp-scope.md","security/identity-admission-and-invitations.md"]
decision_authority: D-001, D-015 and D-023
---

# Approved Invitations and Attendance

## Lifecycle

Reservation -> cohort assignment -> T-24h confirmation -> reminders -> T-2h standby close -> device check -> waiting room -> one-time invitation exchange -> admission -> bounded reconnect -> close/cancel -> follow-up.

## Requirements

| ID | Approved behavior |
| --- | --- |
| FR-INV-001 | List fixed Seoul sessions with local time, duration and capacity without exposing participants |
| FR-INV-002 | Create one active reservation per account/session using an idempotency key |
| FR-INV-003 | Confirm only after eligibility and reciprocal cohort rules pass; never oversell or silently relax |
| FR-INV-004 | Require attendance reconfirmation by T-24h and support eligible standby replacement until T-2h |
| FR-INV-005 | Cancel/rebook without penalty if six confirmed eligible participants cannot be secured |
| FR-INV-006 | Send email confirmation, AlimTalk reminder and bounded SMS fallback; in-product state is authoritative |
| FR-INV-007 | Invitation/deep link contains no reusable room authority and may only open authenticated context |
| FR-INV-008 | Exchange one-time account-bound invitation for short-lived admission and RTC credentials |
| FR-INV-009 | Record no-show, late arrival, technical failure and operator cancellation separately |
| UX-INV-001 | Show time, area, rules, cancellation cutoff, device needs and no-penalty Pilot policy clearly |
| UX-INV-002 | Explain that notifications can fail and do not prove admission |
| SR-INV-001 | Admission rechecks account, eligibility, reservation, attendance, sanction, stage and credential replay |
| SR-INV-002 | Notification retries are idempotent, bounded and cost-capped |
| SR-INV-003 | Do not put participant identity, reveal, interest or report data in notification previews |
| SR-INV-004 | Operator cancellation revokes credentials and notifies through in-product state plus available channels |

## Channel policy

Email: reservation, calendar details, cancellation and support. AlimTalk: primary Korean transactional reminder after approved template. SMS: urgent fallback only, maximum two attempts per intent. Fallback order is in-product -> email/AlimTalk by purpose -> SMS if urgent. Delivery callbacks are audited by intent and provider reference for 90 days; message bodies are not retained in general logs.

