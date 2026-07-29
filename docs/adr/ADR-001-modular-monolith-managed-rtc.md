---
title: ADR-001: Java and Spring Modular Monolith with Managed RTC
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-009 and D-013
---

# ADR-001: Java and Spring Modular Monolith with Managed RTC

## Status

Accepted for the bounded Pilot by D-009 and D-013. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Booking, consent, progression, safety and audit require transactions; SFU/TURN do not justify distributed application services.

## Decision

Use OpenJDK 25 LTS and Spring Boot 4.1 in one modular deployable backend.
Isolate managed RTC and other vendors behind focused adapters. Use high-level
REST plus authenticated real-time capability. D-024 is satisfied; final
contracts remain blocked pending separate promotion.

## Considered and rejected alternatives

Service-oriented backend, microservices and function-heavy serverless are rejected for the Pilot. A stale general NCP Java SDK is rejected; use current service APIs through thin adapters.

## Consequences

- **Positive:** Low deployment burden, local transactions and explicit future extraction.
- **Negative:** Shared application failure domain and discipline required at module boundaries.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Pin patches and dependencies during implementation planning. D-024 is
satisfied; endpoint, event and page-specific adapter contracts remain blocked
pending separate promotion. Extract a service only after measured scaling,
failure isolation or ownership need.

## Evidence and SOT

[Application architecture](../architecture/application-architecture.md), [API capability draft](../spec/api/README.md).

