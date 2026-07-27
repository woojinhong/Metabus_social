---
title: "Participant Journey Map"
document_type: specification
classification: proposal
status: "Proposal — Unapproved"
last_verified: 2026-07-27
related_documents: ["mvp-scope.md","journey-onboarding-eligibility.md","journey-reservation-entry.md","journey-session-progression.md","journey-follow-up-recovery.md"]
decision_authority: "Only explicit approvals in ../discovery/decisions.md"
---

> **Proposal — Unapproved.** This document defines reviewable candidate behavior. It does not authorize implementation.

# Participant Journey Map

## Reading rule

**Proposal:** Each detailed stage table uses the same 13 fields: user goal, anxiety, required information, hidden information, consent point, primary action, failure states, recovery path, accessibility, web behavior, mobile behavior, measurable event, and security boundary.

**Proposal:** Detailed rows are compact design hypotheses, not approved screens, flows, policies, or instrumentation.

## Journey sequence

| Stage | Candidate experience | Detail |
| --- | --- | --- |
| 1 | Account creation | [Onboarding and eligibility](journey-onboarding-eligibility.md) |
| 2 | Adult and identity verification | [Onboarding and eligibility](journey-onboarding-eligibility.md) |
| 3 | Profile and eligibility setup | [Onboarding and eligibility](journey-onboarding-eligibility.md) |
| 4 | Dating-preference compatibility | [Onboarding and eligibility](journey-onboarding-eligibility.md) |
| 5 | Required and optional photo submission | [Onboarding and eligibility](journey-onboarding-eligibility.md) |
| 6 | Game-content pre-submission | [Onboarding and eligibility](journey-onboarding-eligibility.md) |
| 7 | Session browsing and reservation | [Reservation and entry](journey-reservation-entry.md) |
| 8 | Payment or deposit | [Reservation and entry](journey-reservation-entry.md) |
| 9 | Attendance confirmation | [Reservation and entry](journey-reservation-entry.md) |
| 10 | Device and microphone check | [Reservation and entry](journey-reservation-entry.md) |
| 11 | Waiting room | [Reservation and entry](journey-reservation-entry.md) |
| 12 | Secure session entry | [Reservation and entry](journey-reservation-entry.md) |
| 13 | Rules and consent | [Session and progression](journey-session-progression.md) |
| 14 | Structured group interaction | [Session and progression](journey-session-progression.md) |
| 15 | Temporary smaller groups | [Session and progression](journey-session-progression.md) |
| 16 | Controlled free conversation | [Session and progression](journey-session-progression.md) |
| 17 | Initial interest selection | [Session and progression](journey-session-progression.md) |
| 18 | Limited profile reveal | [Session and progression](journey-session-progression.md) |
| 19 | Final mutual selection | [Session and progression](journey-session-progression.md) |
| 20 | One-to-one voice | [Follow-up and recovery](journey-follow-up-recovery.md) |
| 21 | Optional webcam | [Follow-up and recovery](journey-follow-up-recovery.md) |
| 22 | Optional offline-date coordination | [Follow-up and recovery](journey-follow-up-recovery.md) |
| 23 | Post-session feedback | [Follow-up and recovery](journey-follow-up-recovery.md) |
| 24 | Blocking, reporting, appeals, and support | [Follow-up and recovery](journey-follow-up-recovery.md) |
| 25 | Cancellation, no-show, technical failure, operator cancellation | [Follow-up and recovery](journey-follow-up-recovery.md) |

## Cross-journey requirements

| ID | Proposal — unapproved |
| --- | --- |
| UX-JRN-001 | Show stage, remaining time, current capabilities, and currently visible information without implying guaranteed progression |
| UX-JRN-002 | Offer pass, pause, text, repetition, and supported exit paths where they do not compromise another participant's privacy |
| UX-JRN-003 | Avoid public selection counts, rejection details, automatic private access, and forced clever answers |
| UX-JRN-004 | Explain what verification and moderation do and do not prove |
| UX-JRN-005 | Preserve function under zoom, keyboard navigation, screen readers, captions or text alternatives, reduced motion, and interruption |
| SR-JRN-001 | Server-authorized state, not client navigation, governs entry, disclosure, messaging, and media permissions |
| SR-JRN-002 | Repeated, late, replayed, or out-of-order actions must be idempotent or rejected without broader access |

## Measurement boundary

**Proposal:** Events use pseudonymous session and participant identifiers and avoid voice content, private answers, contact data, exact preferences, and unneeded reveal contents. Product, safety, and operational measures remain separately access-controlled.

## Deferred branches

**Proposal:** Temporary small groups, webcam, offline coordination, payments, deposits, biometrics, and manual identity review are represented so the journey remains complete, but they are outside the proposed initial MVP. Their rows must not create implementation dependencies.
