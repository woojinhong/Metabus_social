---
title: Conceptual Data Preparation
document_type: data specification
classification: proposal
status: conceptual boundary retained; contract promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../../discovery/decisions.md","domain-data-model.md","retention-matrix.md","../ux/README.md"]
decision_authority: D-011, D-018, D-022 and D-024
---

# Conceptual Data Preparation

## Authority boundary

PostgreSQL is the approved durable authority. This folder defines conceptual
information, aggregate boundaries, sensitivity and retention. D-024 is
satisfied, but final tables, columns, types, enums, migrations and production
schema remain blocked pending Implementation Contract promotion and later
API/event review.

## Durable capabilities

- Account authentication and device/session revocation.
- Adult eligibility result without raw DOB, CI, DI, document or biometric.
- Profile, private preferences and moderated participant media.
- Scheduled session, reservation, cohort and attendance.
- Consequential stage transitions and operator actions.
- Game/content version and submitted response reference.
- Consent/disclosure grant and restricted access audit.
- Private interest and minimal mutual progression.
- Block, report, evidence, moderation, sanction and appeal.
- Notification intent/delivery, feedback and audit.

## Non-durable or excluded

Presence, timers, active speaker, local microphone level and transient connectivity are ephemeral and deleted after the session/recovery window. RTC/provider metadata is observation only. Redis is not provisioned for Pilot and never replaces PostgreSQL authority. Raw voice, recordings, transcripts, screenshots, CI/DI, liveness, biometrics and vector data are not stored.

## Invariants independent of UI

- Only currently eligible accounts may be admitted.
- One account has at most one active reservation for a scheduled session and cannot occupy a cohort twice.
- Only backend-authorized commands create consequential stage transitions.
- Private interest counts and rejection reasons are never peer-visible.
- Disclosure is scoped to subject, viewer, resource, purpose, session/stage and expiry.
- Pair voice requires compatible mutual progression and is revoked by block/removal/sanction.
- Sanctions and appeals are auditable and reversible when appeal succeeds.
- PostgreSQL facts outlive and reconstruct Redis/RTC projections.

## Approval gate

After separate Implementation Contract approval, proposal documents may define
candidate state vocabulary, lifecycle ownership, constraints and API/event use
cases. No DBML or executable migration is authorized, and a schema may not
infer screens or interactions from architecture alone.

