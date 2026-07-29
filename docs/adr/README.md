---
title: Architecture Decision Records
document_type: navigation
classification: confirmed fact
status: Active
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: decisions.md
---

# Architecture Decision Records

Allowed statuses: Proposed, Accepted, Rejected, Superseded. Every Accepted ADR below has matching approved decision authority. Acceptance does not authorize source code, provisioning, procurement or live operation.

## Accepted

- [ADR-001: Java/Spring modular monolith and managed RTC](ADR-001-modular-monolith-managed-rtc.md)
- [ADR-002: Web/PWA first with native gate](ADR-002-web-first-delivery.md)
- [ADR-003: LiveKit Cloud controlled Pilot](ADR-003-realtime-media-provider.md)
- [ADR-004: NCP Cloud DB for PostgreSQL](ADR-004-postgresql-primary-store.md)
- [ADR-005: Conditional Redis-compatible state](ADR-005-redis-ephemeral-session-state.md)
- [ADR-006: Private NCP Object Storage](ADR-006-object-storage-for-media.md)
- [ADR-007: Privacy-safe observability](ADR-007-observability-baseline.md)
- [ADR-008: NCP Korea VPC hosting](ADR-008-ncp-korea-hosting.md)
- [ADR-009: NICE adult eligibility](ADR-009-adult-eligibility.md)
- [ADR-010: NCP transactional notifications](ADR-010-ncp-notifications.md)

## UX-dependent implementation gate

D-024 is satisfied for the approved UX baseline. Endpoint-level OpenAPI,
database tables/columns/enums, real-time state/event payloads, page
authorization and frontend contracts remain blocked pending separate
Implementation Contract promotion. Accepted ADRs define platform and security
boundaries only.

