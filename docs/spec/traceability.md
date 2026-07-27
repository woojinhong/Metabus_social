---
title: Traceability Index
document_type: specification traceability
classification: confirmed fact
status: Active
last_verified: 2026-07-27
related_documents:
  - ../discovery/decisions.md
  - traceability-implementation.md
  - ux/README.md
decision_authority: decisions.md
---

# Traceability

## Purpose

This index routes approved product/platform decisions, pending UX behavior, supporting evidence and implementation gates without promoting drafts.

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
| High-level API, real-time and data capabilities | Approved boundary only; implementation details blocked by D-020 through D-024 |
| Information architecture, screens and wireflows | Draft pending UX approval |
| External research | Evidence only; procurement/legal revalidation still required |
| Validation result | Evidence, not automatic approval |

## Domain routing

| Domain | Product/spec owner | Architecture/operations owner | Current gate |
| --- | --- | --- | --- |
| MVP boundary | [MVP scope](mvp-scope.md) | [system context](../architecture/system-context.md) | Approved boundary; UX pending |
| UX journeys | [UX prerequisites](ux/README.md) | [application analysis](../architecture/application-architecture.md) | D-024 |
| Web/mobile | [experience](web-mobile-experience.md) | [delivery ADR](../adr/ADR-002-web-first-delivery.md) | Device evidence and UX |
| Session/games | [session](session-experience.md), [games](game-content-system.md) | [RTC ADR](../adr/ADR-003-realtime-media-provider.md) | Presentation/wireflow |
| Disclosure/progression | [disclosure](progressive-disclosure.md), [matching](matching-and-progression.md) | [security](../architecture/security-privacy.md) | Consent and no-match UX |
| Admission | [security](security/identity-admission-and-invitations.md) | [identity ADR](../adr/ADR-009-adult-eligibility.md) | Interaction details and procurement |
| Moderation | [safety](trust-safety-moderation.md) | [operations](../operations/moderation-sanctions-and-appeals.md) | Entry points/moderator UX |
| Data | [data drafts](data/README.md) | [PostgreSQL ADR](../adr/ADR-004-postgresql-primary-store.md) | Schema after UX |
| API/events | [capability drafts](api/README.md) | [application boundary](../architecture/domain-capability-map.md) | Contracts after UX |
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
