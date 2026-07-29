---
title: Traceability Index
document_type: specification traceability
classification: confirmed fact
status: Active
last_verified: 2026-07-28
related_documents:
  - ../discovery/decisions.md
  - traceability-implementation.md
  - ux/README.md
decision_authority: decisions.md
---

# Traceability

## Purpose

This index routes approved product/platform/UX decisions, supporting evidence
and pending implementation gates without promoting drafts.

## Ledgers

- [Product and UX](traceability-product-ux.md)
- [Safety and data](traceability-safety-data.md)
- [Architecture and vendors](traceability-architecture-vendors.md)
- [Implementation gate](traceability-implementation.md)

## Authority contract

| Item | Current authority |
| --- | --- |
| Product/MVP/session boundary | Approved by D-001 through D-007 |
| Platform, data technology and Pilot vendors | Approved by D-008 through D-017 and Accepted ADRs |
| Retention and moderation principles | Approved by D-018 and D-019 |
| High-level API, real-time and data capabilities | Approved boundary only; contract promotion pending after D-024 |
| Information architecture, screens and wireflows | D-024 approved UX baseline; implementation authority absent |
| External research | Evidence only; procurement/legal revalidation still required |
| Validation result | Evidence, not automatic approval |

## Domain routing

| Domain | Product/spec owner | Architecture/operations owner | Current gate |
| --- | --- | --- | --- |
| MVP boundary | [MVP scope](mvp-scope.md) | [system context](../architecture/system-context.md) | Product and UX baselines approved |
| UX journeys | [UX baseline](ux/README.md) | [application analysis](../architecture/application-architecture.md) | D-024 satisfied; prototype only |
| Web/mobile | [experience](web-mobile-experience.md) | [delivery ADR](../adr/ADR-002-web-first-delivery.md) | Contract promotion and device evidence |
| Session/games | [session](session-experience.md), [games](game-content-system.md) | [RTC ADR](../adr/ADR-003-realtime-media-provider.md) | Contract promotion |
| Disclosure/progression | [disclosure](progressive-disclosure.md), [matching](matching-and-progression.md) | [security](../architecture/security-privacy.md) | Contract promotion |
| Admission | [security](security/identity-admission-and-invitations.md) | [identity ADR](../adr/ADR-009-adult-eligibility.md) | Contract promotion and procurement |
| Moderation | [safety](trust-safety-moderation.md) | [operations](../operations/moderation-sanctions-and-appeals.md) | Contract promotion and operations readiness |
| Data | [data proposals](data/README.md) | [PostgreSQL ADR](../adr/ADR-004-postgresql-primary-store.md) | Contract promotion before schema |
| API/events | [capability proposals](api/README.md) | [application boundary](../architecture/domain-capability-map.md) | Contract promotion pending |
| Vendors/deployment | [NFRs](non-functional-requirements.md) | [selected services](../architecture/external-services-selected.md) | Legal/procurement/provisioning |

## Stable-ID ownership

| Namespace | Declaration owner |
| --- | --- |
| D-* | discovery/decisions.md |
| ADR-* | docs/adr individual files |
| A-* | discovery/assumptions.md |
| UX-OQ-* | spec/ux/open-ux-decisions.md |
| Existing FR/UX/SR/NFR IDs | their named spec; approval follows document status |

## Deferred boundary

Payment, deposits, webcam, offline booking, biometric/liveness/face comparison, raw identity documents, CI/DI, recording, temporary subgroups and pre-mutual private text remain excluded or deferred. Creating detailed contracts for them requires a new approved decision.
