---
title: Approved Decision Log
document_type: decision-log
classification: user decision
status: Approved baseline
last_verified: 2026-07-28
related_documents: ["product-brief.md","../spec/mvp-scope.md","../adr/README.md"]
decision_authority: explicit project-owner delegation in the 2026-07-27 task
---

# Decision Log

These decisions are approved for the bounded Korean MVP Pilot. Approval does not claim legal compliance, vendor procurement, production readiness, or permission to create application source code.

## Approved decisions

### D-001 — Initial MVP boundary
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation in this task.
- **Decision/scope:** Approve the free, scheduled, private, voice-first Pilot in [mvp-scope.md](../spec/mvp-scope.md).
- **Rationale/rejected:** Smallest coherent test of the core thesis; reject generic social networking and feature-complete dating app scope.
- **Reversibility/gate:** Reversible after Pilot evidence; live recruitment still requires legal, procurement, safety, and device gates.
- **ADR/SOT:** [MVP SOT](../spec/mvp-scope.md).

### D-002 — Pilot cohort
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Seoul activity area, ages 25–39, dating intent, six participants, target 3 women and 3 men in mutually compatible heterosexual cohorts; all must be 19+ on participation date.
- **Rationale/rejected:** Bounded liquidity experiment; reject broader geography, variable size, and silent constraint relaxation.
- **Reversibility/gate:** Pilot-only and reversible; recruitment fairness, inclusion, discrimination, and sensitive-preference processing require qualified review.
- **ADR/SOT:** [MVP SOT](../spec/mvp-scope.md), [matching](../spec/matching-and-progression.md).

### D-003 — Session structure
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** 90 minutes: 5-minute rules, three 15-minute games, 20-minute free conversation, 5-minute initial interest, 5-minute reveal, 5-minute final selection/close, and 5 minutes of flexible recovery budget.
- **Rationale/rejected:** Preserves structured discovery and natural conversation; reject temporary subgroups and live facilitator in MVP.
- **Reversibility/gate:** Content/timing may change by versioned experiment after safety review.
- **ADR/SOT:** [session SOT](../spec/session-experience.md), [game SOT](../spec/game-content-system.md).

### D-004 — Disclosure and progression
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Required private face-photo submission; initial display is nickname, five-year age band, Seoul area, one clue. Initial interest allows up to two people. Limited reveal requires mutual initial interest plus resource-specific subject consent. Final romantic choice allows one person or none; compatible mutual choice grants one 10-minute voice room.
- **Rationale/rejected:** Tests pre/post-visual interest without treating a photo as entitlement; reject public counts, automatic contact, friendship mixing, or reusable reveal URLs.
- **Reversibility/gate:** Revocation stops future access but cannot undo viewing or local capture; reveal UX must pass consent testing.
- **ADR/SOT:** [disclosure](../spec/progressive-disclosure.md), [progression](../spec/matching-and-progression.md).

### D-005 — Payment exclusion
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** No fee, deposit, authorization hold, no-show charge, refund, or payment integration in MVP.
- **Rationale/rejected:** Avoids payment/legal friction before core validation; reject monetization as attendance proof.
- **Reversibility/gate:** New product decision, policy, legal review, and ADR required before payment work.
- **ADR/SOT:** [MVP SOT](../spec/mvp-scope.md).

### D-006 — Biometric and identity-artifact exclusion
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** No raw identity documents, liveness video, face comparison, biometric templates, CI, DI, or informal manual document review.
- **Rationale/rejected:** Data minimization and lack of approved legal/operational basis; reject SMS possession as adulthood proof.
- **Reversibility/gate:** Any addition requires a new decision, DPIA/privacy review, provider contract, retention, appeal, and security design.
- **ADR/SOT:** [ADR-009](../adr/ADR-009-adult-eligibility.md), [identity SOT](../spec/security/identity-admission-and-invitations.md).

### D-007 — Deferred product capabilities
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Defer webcam, offline booking, participant recording, temporary subgroups, private text before mutual progression, social deduction, relationship scoring, and popularity ranking.
- **Rationale/rejected:** Not necessary for core thesis and increases safety/operations burden.
- **Reversibility/gate:** Separate discovery evidence and approval required.
- **ADR/SOT:** [MVP SOT](../spec/mvp-scope.md).

### D-008 — Web/PWA delivery
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** React + Vite responsive Web/PWA first; Expo/React Native evaluation is triggered only by the numeric gates in [web-mobile-experience.md](../spec/web-mobile-experience.md).
- **Rationale/rejected:** Fast link-based Pilot with measurable escape; reject immediate separate native apps and maximum-sharing as goals.
- **Reversibility/gate:** PWA must pass target-device runs before participant Pilot.
- **ADR/SOT:** [ADR-002](../adr/ADR-002-web-first-delivery.md).

### D-009 — Backend topology and runtime
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** OpenJDK 25 LTS, Spring Boot 4.1, modular monolith, and managed RTC adapter. Approve only a high-level REST and authenticated real-time capability boundary; exact transport and contracts remain pending D-024.
- **Rationale/rejected:** Current LTS and mature transactions with low operational surface; reject microservices, function-heavy architecture, and stale NCP Java SDK.
- **Reversibility/gate:** Pin exact supported patch versions during implementation planning; no source code is authorized here.
- **ADR/SOT:** [ADR-001](../adr/ADR-001-modular-monolith-managed-rtc.md), [API SOT](../spec/api/README.md).

### D-010 — NCP Korea hosting
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** NAVER Cloud Platform Korea Region, VPC, private application and database boundaries, managed secrets, least-privilege Sub Accounts.
- **Rationale/rejected:** Korean regional control and integrated operations; reject Micro and public all-in-one sensitive-data hosting.
- **Reversibility/gate:** Account, quote, quota, DPA, restore, and security review precede provisioning.
- **ADR/SOT:** [ADR-008](../adr/ADR-008-ncp-korea-hosting.md), [deployment](../architecture/deployment-ncp-korea.md).

### D-011 — PostgreSQL authority
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** NCP Cloud DB for PostgreSQL is the Pilot and production-target durable source of truth; logical exports must restore to non-NCP PostgreSQL.
- **Rationale/rejected:** Managed backup/PITR and relational invariants outweigh Pilot cost; reject NoSQL primary and self-managed sensitive Pilot database.
- **Reversibility/gate:** Exact version, extension, G3 quote, restore and failover tests are procurement gates.
- **ADR/SOT:** [ADR-004](../adr/ADR-004-postgresql-primary-store.md), [data SOT](../spec/data/README.md).

### D-012 — Conditional Redis rule
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Do not provision Redis for the Pilot; adopt a Redis-compatible TTL store only after multi-instance coordination, presence/timer load, or database contention is measured.
- **Rationale/rejected:** Avoid unnecessary state and failure modes; reject Redis as product authority.
- **Reversibility/gate:** Addition requires load evidence and reconstruction/fail-closed tests.
- **ADR/SOT:** [ADR-005](../adr/ADR-005-redis-ephemeral-session-state.md).

### D-013 — Pilot RTC
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** LiveKit Cloud Build for controlled Pilot; Daily is first fallback, Agora second, self-hosted LiveKit exit. No mid-session failover. Recording/Egress disabled.
- **Rationale/rejected:** SDK/grant model and open-source exit; reject self-managed SFU for Pilot operations.
- **Reversibility/gate:** Japan/Singapore path, DPA/subprocessors, retention, Korea device latency, and quota tests block live participants.
- **ADR/SOT:** [ADR-003](../adr/ADR-003-realtime-media-provider.md), [RTC architecture](../architecture/realtime-media.md).

### D-014 — Adult eligibility
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** NICE mobile identity verification using PASS with provider-supported SMS fallback; derive 19th-birthday eligibility transiently and store only outcome, time, provider, and minimal transaction reference. No CI/DI.
- **Rationale/rejected:** Stronger than phone possession with minimal retention; reject documents, biometrics, and manual bypass.
- **Reversibility/gate:** Contract, lawful basis, returned fields, foreign resident/MVNO accessibility, outage and deletion tests block participation.
- **ADR/SOT:** [ADR-009](../adr/ADR-009-adult-eligibility.md), [identity SOT](../spec/security/identity-admission-and-invitations.md).

### D-015 — Transactional notifications
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** NCP SENS AlimTalk primary reminder, SENS SMS urgent fallback, email for confirmations/support. Use Cloud Outbound Mailer before 2026-09-17; use SENS Mail only after official integration verification.
- **Rationale/rejected:** Korean transactional channels and one provider family; reject reusable admission links and push in MVP.
- **Reversibility/gate:** Business account, sender, Kakao template, rates, retention and SENS Mail API/IAM review required.
- **ADR/SOT:** [ADR-010](../adr/ADR-010-ncp-notifications.md).

### D-016 — Participant media storage
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Private NCP Object Storage in Korea with application authorization, short-lived signed delivery, EXIF removal, file/QR/contact/malware review, inventory and deletion jobs.
- **Rationale/rejected:** Separate binary lifecycle and Korean region; reject database blobs and permanent public URLs.
- **Reversibility/gate:** Lifecycle, cache deletion, export/restore, access-log, and AWS SDK v2 compatibility tests required.
- **ADR/SOT:** [ADR-006](../adr/ADR-006-object-storage-for-media.md).

### D-017 — Observability
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** OpenTelemetry SDK/Collector; NCP Cloud Insight for infrastructure metrics, Cloud Log Analytics Standard for redacted logs, Cloud Activity Tracer for NCP audit, Grafana Cloud Free for application metrics/traces and sanitized frontend errors; no replay.
- **Rationale/rejected:** OTel portability plus NCP operations; reject Pinpoint due current runtime evidence gap and self-managed stack.
- **Reversibility/gate:** Grafana region/DPA/subprocessors and all quotas must be verified; no sensitive payloads or raw identifiers may leave the application.
- **ADR/SOT:** [ADR-007](../adr/ADR-007-observability-baseline.md), [external services](../architecture/external-services-selected.md).

### D-018 — Retention and deletion
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Apply the privacy-minimizing periods in [retention-matrix.md](../spec/data/retention-matrix.md); raw identity responses/DOB/CI/DI and voice content are never stored.
- **Rationale/rejected:** Purpose limitation, safety review, recovery; reject indefinite retention and undocumented legal claims.
- **Reversibility/gate:** Qualified Korean privacy/legal review may shorten or require explicit statutory holds before live Pilot.
- **ADR/SOT:** [retention SOT](../spec/data/retention-matrix.md).

### D-019 — Moderation, sanctions, appeals
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Layered deterministic hold, participant explanation, human review, removal, 7/30-day suspension, senior-reviewed permanent ban, and independent appeal.
- **Rationale/rejected:** Proportionate, auditable enforcement; reject LLM-only or unappealable irreversible sanctions.
- **Reversibility/gate:** Staffing, training, emergency/legal escalation and incident tabletop precede live Pilot.
- **ADR/SOT:** [operations SOT](../operations/moderation-sanctions-and-appeals.md).

### D-020 — API capability boundary and UX gate
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Approve only a high-level API capability inventory. Endpoint paths, DTOs, page-specific authorization and OpenAPI remain Draft pending UX approval.
- **Rationale/rejected:** Prevent interface behavior from being guessed before screen and wireflow decisions; reject implementation-ready API claims now.
- **Reversibility/gate:** UX gates D-024 and security review must pass before OpenAPI can become authoritative.
- **ADR/SOT:** [API capability draft](../spec/api/README.md).

### D-021 — Real-time authority boundary
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Backend remains authoritative for session stage and permissions; RTC events are observations. Transport details, state machine, event names and payloads remain Draft pending UX approval.
- **Rationale/rejected:** Preserve security boundary without fixing interaction-dependent protocol; reject client/RTC authority and implementation-ready event contracts.
- **Reversibility/gate:** Session, reconnect and failure wireflows under D-024 must be approved first.
- **ADR/SOT:** [real-time capability draft](../spec/api/realtime-capabilities.md).

### D-022 — Conceptual data boundary
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Approve PostgreSQL authority, conceptual entities, aggregate boundaries, classifications and retention only. Tables, columns, types, enums and DBML remain Draft pending UX approval.
- **Rationale/rejected:** Preserve domain/data minimization without guessing UI-driven states; reject production-schema or migration claims.
- **Reversibility/gate:** D-024 plus API/event review must precede schema approval.
- **ADR/SOT:** [conceptual data draft](../spec/data/README.md), [ADR-004](../adr/ADR-004-postgresql-primary-store.md).

### D-023 — Authentication and admission principles
- **Status/date/authority:** Approved; 2026-07-27; explicit user delegation.
- **Decision/scope:** Separate account authentication, NICE eligibility, reservation ownership, one-time admission and short-lived RTC authority; exact page flow, endpoint and token-exchange DTO remain pending UX/security design.
- **Rationale/rejected:** Enforce purpose separation and fail-closed entry; reject reusable room links, SMS possession as adulthood proof and device fingerprinting.
- **Reversibility/gate:** Account recovery, device replacement, waiting-room and reconnect wireflows require D-024 approval.
- **ADR/SOT:** [identity principles](../spec/security/identity-admission-and-invitations.md).

<a id="d-024-required-ux-approval-gate"></a>

### D-024 — Required UX approval gate
- **Status/date/authority:** Gate satisfied; 2026-07-28; explicit project-owner delegation.
- **Decision/scope:** API, database, real-time and implementation planning cannot become authoritative until information architecture, screen inventory, primary journeys, session wireflow, disclosure, interest/no-match, reconnect/failure, report/block/moderator, responsive/mobile and accessibility behavior are explicitly approved.
- **Rationale/rejected:** Interaction behavior determines contracts and states; reject architecture-derived UI inference.
- **Reversibility/gate:** UX approval is complete; production contracts and code still require a new explicit phase.
- **ADR/SOT:** [UX gate](../spec/ux/README.md), [traceability](../spec/traceability-implementation.md).

#### UX approval record
- **Owner approvals:** Items 001–002 approved 2026-07-27; items 003–013 approved 2026-07-28 under explicit autonomous delegation. The complete decision and rejected-alternative record is in [Open UX Decisions](../spec/ux/open-ux-decisions.md).
- **Approved boundaries:** Hybrid preparation/dashboard/`P10` shell; distinct `P01`–`P21` and `O01`–`O07` review boundaries; private choices and consent; safe waiting/live/game/result/recovery/reporting; mobile, accessibility, visual language and Korean copy.
- **Closure evidence:** Required UX areas, low-fidelity prototype scope and acceptance criteria are explicit; documentation validation passed before prototype authorization.
- **Authorized next work:** An isolated, synthetic-data, local-state, low-fidelity React Mock Prototype for UX validation.
- **Still not authorized:** Production frontend/backend code, routes or page authorization, OpenAPI/AsyncAPI, endpoints/DTOs, schema/migrations, real-time contracts, vendor integration, cloud provisioning or live participant operation.
