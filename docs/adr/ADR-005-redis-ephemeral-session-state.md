---
title: ADR-005: Conditional Redis-Compatible Ephemeral State
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-012
---

# ADR-005: Conditional Redis-Compatible Ephemeral State

## Status

Accepted for the bounded Pilot by D-012. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Presence, timers, reconnect leases and rate limits may later need shared TTL coordination, but the smallest Pilot has one application instance.

## Decision

Do not provision Redis for the Pilot. Add a Redis-compatible TTL store only after measured multi-instance coordination, presence/timer load or database contention. PostgreSQL remains authority.

## Considered and rejected alternatives

Immediate Redis and persistent product authority in Redis are rejected.

## Consequences

- **Positive:** Avoids cost and a new failure mode until justified.
- **Negative:** Later horizontal scale may require a migration and reconstruction path.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Adoption requires load evidence, key/TTL/data-classification design, reconstruction test and fail-closed behavior. UI-specific session state remains pending D-024.

## Evidence and SOT

[Data architecture](../architecture/data-architecture.md), [data capability draft](../spec/data/README.md).

