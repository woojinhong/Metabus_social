---
title: Korean MVP Domain Capability Map
document_type: architecture SOT
classification: user decision
status: Approved high-level boundaries; contract promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../spec/data/domain-data-model.md","../spec/ux/README.md"]
decision_authority: D-001, D-009, D-020 through D-024
---

# Korean MVP Domain Capability Map

## Core capabilities

| Capability | Responsibility | Durable authority | MVP boundary |
| --- | --- | --- | --- |
| Identity and eligibility | account security, NICE result, adult gate, device/session revocation | PostgreSQL minimal outcomes | Core; exact UX/API pending |
| Profile and compatibility | private profile/preferences, reciprocal eligibility, safe projections | PostgreSQL + private Object Storage | Core |
| Scheduling and attendance | session inventory, reservation, confirmation, cohort, cancellation/no-show | PostgreSQL | Core |
| Session orchestration | authoritative stage intent, timer policy, readiness, operator control | PostgreSQL consequences; ephemeral projections | Core; state machine pending UX |
| Game and content | stable formats, pack versions, reviewed prompts/clues | PostgreSQL metadata + Object Storage media | Core |
| Disclosure and progression | resource consent, private interest, mutual progression, pair voice grant | PostgreSQL restricted records | Core; interaction/API pending |
| Trust, safety and moderation | block/report/case/evidence/sanction/appeal/audit | PostgreSQL + private evidence storage | Core |
| Notifications | intent, provider delivery and fallback | PostgreSQL intent/delivery | Core transactional only |
| Feedback and experimentation | voluntary feedback, device quality, privacy-safe experiments | PostgreSQL/analytics with limits | Core minimal |
| Administration | schedule/session/content/safety operations and access review | audited application authority | Core minimal; console contract pending |

## External boundaries

LiveKit carries media, never product authority. NICE supplies verification evidence, never account authorization. SENS/email deliver messages, never admission. Object Storage keeps private media, never reveal authority. NCP/Grafana telemetry receives sanitized operational data, never raw sensitive product values.

## Deferred capabilities

Payments/deposits, webcam, offline coordination, private text, temporary subgroups, live facilitation, biometric/document review, scoring, search/vector features and public social networking are outside the MVP.

## Module and extraction rule

Implement as modules in one Spring deployable after authorization. A module may be extracted only for measured independent scale, availability, compliance, ownership or release cadence. Until then, local transactions and an outbox separate durable facts from asynchronous vendor effects.

## UX gate

These boundaries do not decide routes, page permissions, request/response
fields, database schema, state enums or real-time payloads. D-024 is satisfied
for screen behavior; implementation contracts still require separate
promotion.

