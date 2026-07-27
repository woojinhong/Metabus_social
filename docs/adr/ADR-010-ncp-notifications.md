---
title: ADR-010: NCP Transactional Notification Family
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-015
---

# ADR-010: NCP Transactional Notification Family

## Status

Accepted for the bounded Pilot by D-015. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Reservations, reminders, cancellation and support need Korean transactional channels, but no channel may authorize admission.

## Decision

Use SENS AlimTalk for primary reminder, SENS SMS for urgent fallback, and NCP email for confirmations/support. Before 2026-09-17 the implementation target is Cloud Outbound Mailer; after that date use SENS Mail only after official integration verification.

## Considered and rejected alternatives

Push is deferred; reusable room links and separate long-lived non-NCP messaging vendors are rejected.

## Consequences

- **Positive:** Korean channel fit and one provider family.
- **Negative:** Business account, sender/template approval, service transition, retention discrepancy and unpublished rates remain.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Verify business account, sender, Kakao templates, final rates/quotas, 30-vs-90-day history, SENS Mail API/IAM after 2026-09-17, retry/idempotency and cost caps. Notification screens/DTOs remain pending D-024.

## Evidence and SOT

[Invitations](../spec/invitations-and-attendance.md), [external services](../architecture/external-services-selected.md).

