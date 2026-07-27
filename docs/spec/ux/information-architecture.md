---
title: Draft Information Architecture
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved Information Architecture

## UX-OQ-001 owner-approved scope

Status: owner approved on 2026-07-27. D-024 was satisfied on 2026-07-28. The approved hybrid
information architecture is:

1. Pre-session preparation uses a guided linear flow.
2. Reservation and account management use a lightweight dashboard.
3. The live session uses `P10` as a dedicated persistent session shell.
4. `P11`–`P18` are sequential stage contents or protected subflows associated
   with that shell, not final routes or backend states.
5. Safety, exit, support and action-relevant privacy information remain
   contextually accessible without exposing private choices.
6. Browser back, forward, refresh or history navigation is never interpreted
   by itself as submission, withdrawal, consent revocation or session exit.

Rules/introduction is the first content stage rendered inside `P10`. It is not
a second meaning for `P10` and is not proposed as an independent top-level
navigation area.

Later UX decisions approved screen boundaries, controls, protected behavior,
recovery, responsive and accessibility review semantics. This document still
defines no route, page authorization, API, DTO, database or real-time state,
event, component or analytics contract.

## Approved service-area connections

| Area | Review surfaces | Navigation role |
| --- | --- | --- |
| Service introduction | `P01` | public orientation into preparation |
| Account and adult eligibility | `P02`–`P03` | guided prerequisite with recovery |
| Private profile and media preparation | `P04`–`P05` | guided, resumable preparation |
| Reservation and schedule management | `P06`–`P07` | lightweight dashboard management |
| Device check and waiting room | `P08`–`P09` | guided handoff into the live session |
| Live session | `P10` with `P11`–`P12` content | dedicated persistent shell |
| Private interest and progressive disclosure | `P13`–`P16` | sequential protected shell subflows |
| Result and safe closing | `P17`–`P19` | protected result followed by common close |
| Safety and support | `P20` | contextual entry plus account follow-up |
| Privacy and account management | `P21` | dashboard management; contextual notices where relevant |

## Implementation details remaining

| Area | Purpose | Entry/exit conditions | Required information | Unresolved navigation |
| --- | --- | --- | --- | --- |
| Public orientation | explain product, eligibility, safety and limitations | unauthenticated to register/login | session concept, capture limits, accessibility | landing depth, preview, FAQ placement |
| Account/eligibility | create/recover account and complete adult check | authenticated but not eligible to eligible/recovery | email status, eligibility status, support route | step grouping, resume and recovery entry |
| Profile/preferences | collect private compatibility and moderated media | eligible account to reservation-ready | required/optional fields, visibility explanation | progressive setup, edit boundaries |
| Sessions/reservation | discover fixed slots and manage reservation | profile-ready to reserved/cancelled | time, area, duration, confirmation rule | list/calendar, capacity wording |
| Attendance/device | reconfirm, test microphone, prepare | confirmed reservation to waiting/cancel | device result, cutoff, help | combined or separate steps |
| Waiting/live session | admit and conduct approved session | authorized waiting to session end/cancel | stage, timer, visible info, controls | waiting-to-live transition, responsive hierarchy |
| Interest/reveal/progression | make private choices and manage consent | stage-authorized to private result | choice limits, resource/audience, no-match | screen sequence, confirmation, privacy shielding |
| Safety/support | block, report, case, appeal and support | any eligible context to resolved/exit | subject/context, urgency, evidence, status | contextual placement and follow-up handoff |
| Account privacy | export, delete, sessions/devices and notices | authenticated to completed request | effects, holds, backup expiry | placement and confirmation behavior |
| Operations | schedule/session/content/safety administration | strong admin auth and role assignment | minimum operational/case data | console separation and escalation navigation |

## Constraints

No participant directory or public profile browsing. No open participant chat before mutual progression. Notifications/deep links never bypass authentication. Safety controls must be reachable from live and non-live contexts. Protected interest, consent, reveal and result surfaces are not ordinary dashboard destinations or history. Exact labels, routes, cross-links and later interaction details remain unapproved.

## Failure/empty/loading requirements

Every area needs explicit first-use/empty, loading, stale-state, permission,
provider-outage, recoverable-error, terminal-error and support states. Approved
presentation classes guide review but do not define final component or route units.

