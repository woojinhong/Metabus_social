---
title: Architecture and Vendor Traceability
document_type: specification traceability
classification: user decision
status: Approved boundary
last_verified: 2026-07-27
related_documents:
  - traceability.md
  - ../adr/README.md
  - ../architecture/external-services-selected.md
decision_authority: D-008 through D-017
---

# Architecture and Vendor Traceability

## Accepted baseline

| Need | Evidence | Selected boundary | ADR | Remaining gate |
| --- | --- | --- | --- | --- |
| application | [backend research](../research/technology/backend-options.md) | Java 25/Spring Boot 4.1 modular monolith | [ADR-001](../adr/ADR-001-modular-monolith-managed-rtc.md) | source-code authorization |
| delivery | [web/mobile research](../research/technology/web-mobile-options.md) | React/Vite PWA first | [ADR-002](../adr/ADR-002-web-first-delivery.md) | D-024 satisfied; device evidence and contract promotion pending |
| RTC | [vendor verification](../research/technology/korean-mvp-vendor-verification.md) | LiveKit Cloud Build Pilot | [ADR-003](../adr/ADR-003-realtime-media-provider.md) | Korean-device, DPA/transfer and quota gate |
| durable data | [database research](../research/technology/database-options.md) | NCP Cloud DB for PostgreSQL | [ADR-004](../adr/ADR-004-postgresql-primary-store.md) | version, restore/failover; schema promotion unapproved |
| ephemeral state | [database research](../research/technology/database-options.md) | no Redis Pilot; introduce only on measured trigger | [ADR-005](../adr/ADR-005-redis-ephemeral-session-state.md) | evidence of multi-instance TTL need |
| participant media | [vendor verification](../research/technology/korean-mvp-vendor-verification.md) | private NCP Object Storage | [ADR-006](../adr/ADR-006-object-storage-for-media.md) | scanning/deletion/export test |
| observability | [vendor verification](../research/technology/korean-mvp-vendor-verification.md) | OTel + Cloud Insight/CLA/CAT + Grafana Cloud traces | [ADR-007](../adr/ADR-007-observability-baseline.md) | redaction, DPA/transfer, quota |
| hosting | [vendor verification](../research/technology/korean-mvp-vendor-verification.md) | NCP Korea VPC and managed PostgreSQL | [ADR-008](../adr/ADR-008-ncp-korea-hosting.md) | account, quote, provisioning approval |
| adult eligibility | [identity evidence](../research/technology/korean-mvp-vendor-verification.md) | NICE mobile identity, minimum result | [ADR-009](../adr/ADR-009-adult-eligibility.md) | contract, legal/privacy, coverage |
| notifications | [NCP evidence](../research/technology/korean-mvp-vendor-verification.md) | SENS AlimTalk/SMS and dated NCP email rule | [ADR-010](../adr/ADR-010-ncp-notifications.md) | sender, template, current service notice |

## Capacity and exit

Six participants per main room means `ceil(concurrency / 6)` rooms. LiveKit Pilot budgets 660 participant-minutes per complete session and six monthly sessions at 3,960 minutes, with reservation safeguards in ADR-003.

PostgreSQL owns product authority; RTC rooms, telemetry and future Redis never replace it. There is no mid-session provider migration. Exportable object keys, minimized vendor references and OpenTelemetry keep bounded exit paths.

## Decision boundary

All ten ADRs are Accepted with matching decisions. This accepts technology and provider boundaries, not UI behavior, detailed contracts, provisioning, procurement, production compliance or source-code creation. Prices and service notices must be reverified at their implementation/procurement gate.
