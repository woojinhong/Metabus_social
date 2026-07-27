---
title: External Services Architecture Analysis
document_type: architecture analysis
classification: research finding and proposal
status: Superseded for Pilot selection
last_verified: 2026-07-27
related_documents: ["external-services-selected.md","../discovery/decisions.md"]
decision_authority: D-010 and D-013 through D-017
---

# External Services Architecture Analysis

## Current authority

The Pilot selections are authoritative in [Selected External Services](external-services-selected.md) and Accepted ADRs. This file preserves cross-provider boundary principles and does not reopen those choices.

## Selected Pilot boundaries

| Need | Approved selection | Remaining gate / exit |
| --- | --- | --- |
| RTC | LiveKit Cloud Build | Korea-device and cross-border/DPA gate; Daily first fallback, self-hosted LiveKit exit |
| Adult eligibility | NICE mobile identity, minimum result | contract, returned fields, foreign/MVNO, outage, privacy/legal gate |
| Notifications | SENS AlimTalk primary, SENS SMS urgent fallback, dated NCP email rule | sender/template/service-notice validation; in-product state authoritative |
| Media | private NCP Object Storage | scan, lifecycle, deletion/export and SDK compatibility |
| Observability | OTel + NCP metrics/log/audit + Grafana Cloud app telemetry | redaction, quotas, DPA/transfer/export |
| Payments | excluded | new product/legal/provider decision required |

## Integration contract

Every adapter documents purpose, data sent/received, authentication, secrets, timeout, bounded retry, circuit breaker, idempotency, webhook signature/replay, rate/quota, retention/deletion, data location/subprocessors, incident path, monitoring, fallback, export and termination. Vendor success never overrides application authorization.

## Failure principles

- Fail closed for admission, eligibility, consent, reveal, progression and sanctions.
- Queue or degrade notifications and noncritical telemetry within bounded retry/cost limits.
- Pause/cancel and rebook when media cannot sustain the session; no mid-session provider migration.
- Notification links never authorize entry.
- PostgreSQL and application policy remain authoritative over vendor observations.

## Lock-in controls

Use provider-neutral domain identifiers, focused adapters, pseudonymous vendor references, portable object keys, logical PostgreSQL exports and OTLP telemetry. Keep vendor credentials, tokens and response bodies out of domain models and general logs.

## Gates

No account, contract, credential, cloud resource, spend or production compliance is approved by this analysis. UI-dependent requests, errors and recovery presentation remain pending D-024.
