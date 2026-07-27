---
title: Draft Information Architecture
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft Information Architecture

## Candidate content areas

| Area | Purpose | Entry/exit conditions | Required information | Unresolved navigation |
| --- | --- | --- | --- | --- |
| Public orientation | explain product, eligibility, safety and limitations | unauthenticated to register/login | session concept, capture limits, accessibility | landing depth, preview, FAQ placement |
| Account/eligibility | create/recover account and complete adult check | authenticated but not eligible to eligible/recovery | email status, eligibility status, support route | linear wizard vs dashboard tasks |
| Profile/preferences | collect private compatibility and moderated media | eligible account to reservation-ready | required/optional fields, visibility explanation | progressive setup, edit boundaries |
| Sessions/reservation | discover fixed slots and manage reservation | profile-ready to reserved/cancelled | time, area, duration, confirmation rule | list/calendar, capacity wording |
| Attendance/device | reconfirm, test microphone, prepare | confirmed reservation to waiting/cancel | device result, cutoff, help | combined or separate steps |
| Waiting/live session | admit and conduct approved session | authorized waiting to session end/cancel | stage, timer, visible info, controls | waiting-to-live transition, responsive hierarchy |
| Interest/reveal/progression | make private choices and manage consent | stage-authorized to private result | choice limits, resource/audience, no-match | screen sequence, confirmation, privacy shielding |
| Safety/support | block, report, case, appeal and support | any eligible context to resolved/exit | subject/context, urgency, evidence, status | global vs contextual entry points |
| Account privacy | export, delete, sessions/devices and notices | authenticated to completed request | effects, holds, backup expiry | placement and confirmation behavior |
| Operations | schedule/session/content/safety administration | strong admin auth and role assignment | minimum operational/case data | console separation and escalation navigation |

## Constraints

No participant directory or public profile browsing. No open participant chat before mutual progression. Notifications/deep links never bypass authentication. Safety controls must be reachable from live and non-live contexts. Exact hierarchy, labels, routes and cross-links remain unapproved.

## Failure/empty/loading requirements

Every area needs explicit first-use/empty, loading, stale-state, permission, provider-outage, recoverable-error, terminal-error and support states. Future design must define whether state is inline, page-level, modal or routed; this draft does not choose.

