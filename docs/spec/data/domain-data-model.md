---
title: Conceptual Domain Data Model
document_type: data model
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["README.md","retention-matrix.md","../ux/README.md"]
decision_authority: D-022 and D-024
---

# Conceptual Domain Data Model

## Aggregate candidates

| Boundary | Conceptual entities | Independent invariant | Sensitivity |
| --- | --- | --- | --- |
| Account | account, auth session, device | session/recovery revocation belongs to account | confidential |
| Eligibility | identity verification, adult eligibility | only minimum outcome metadata persists | restricted identity |
| Profile | profile, preference, profile media | media cannot become visible without moderation and grant | restricted dating/profile |
| Scheduling | scheduled session, reservation, attendance, cohort | one active reservation/account/slot; no duplicate cohort member | confidential |
| Orchestration | session instance, participant, consequential stage transition | backend version orders consequential transitions | confidential |
| Game/content | game format, content pack, response reference | assigned content version is stable during session | confidential/content |
| Disclosure | disclosure grant, access audit | subject-viewer-resource-purpose-stage-expiry scope | highly restricted |
| Progression | interest selection, mutual progression, pair voice grant | mutual compatible choices required; counts never disclosed | highly restricted |
| Safety | block, report, evidence reference, moderation case, sanction, appeal | block revokes progression; sanctions/appeals audited | highly restricted |
| Communication | notification intent/delivery | channel never authorizes admission | confidential |
| Learning | feedback, privacy-safe experiment assignment | no raw sensitive content in routine analytics | internal/restricted |
| Audit | audit event, legal hold reference | append-only or tamper-evident high-impact facts | highly restricted |

## Consistency boundaries

Reservation/cohort assignment, admission eligibility, stage transition, interest close, mutual progression, disclosure grant/revocation, block, sanction and appeal require durable transactions or an outbox-linked atomic commit. Notification delivery, media scan and vendor callbacks are asynchronous observations reconciled to durable intent.

## Conceptual relationships

An account owns one profile and many devices/reservations. A scheduled session may create one cohort and one session instance. A session participant links an eligible reservation to an instance. Content versions create response references. A disclosure grant links subject/viewer/media and session context. Interest submissions may create one mutual progression and pair grant. Safety cases reference minimum evidence and may create sanctions/appeals.

## Pending UX decisions

Final states and multiplicities depend on cancellation, waiting room, reveal, no-match, reconnect, report and moderator wireflows. Therefore no table/column/status enum/index/DBML is authoritative yet. Encryption layout, partial unique indexes and transition constraints are specified only after D-024.

