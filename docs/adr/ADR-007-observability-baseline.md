---
title: ADR-007: Privacy-Safe OpenTelemetry and Managed Backends
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-017
---

# ADR-007: Privacy-Safe OpenTelemetry and Managed Backends

## Status

Accepted for the bounded Pilot by D-017. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Media reliability, application health, security and operations need separated telemetry without sensitive payload leakage.

## Decision

Use OpenTelemetry SDK/Collector. NCP Cloud Insight stores infrastructure metrics, Cloud Log Analytics Standard stores redacted logs, Cloud Activity Tracer records cloud control-plane audit, and Grafana Cloud Free stores sampled application metrics/traces and sanitized frontend errors. Session replay is disabled.

## Considered and rejected alternatives

Pinpoint Cloud is rejected for the Pilot due current runtime evidence gap; a self-managed observability stack and Sentry duplication are rejected.

## Consequences

- **Positive:** Portable instrumentation and bounded managed operations.
- **Negative:** Grafana introduces a cross-border processor; quotas, sampling and redaction require discipline.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Before live Pilot verify Grafana region/DPA/subprocessors/export/delete, NCP quotas/prices, OTLP TLS, redaction tests and alerts. D-024 must close before UI event names, frontend error context, and UX acceptance telemetry become implementation contracts. Retention: traces/application metrics 14 days in Grafana Free; CLA logs 30 days; no raw identity, interests, voice, photos, tokens or message content.

## Evidence and SOT

[External services](../architecture/external-services-selected.md), [NFR](../spec/non-functional-requirements.md).

