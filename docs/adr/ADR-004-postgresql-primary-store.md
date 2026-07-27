---
title: ADR-004: NCP Cloud DB for PostgreSQL as Durable Authority
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-011 and D-022
---

# ADR-004: NCP Cloud DB for PostgreSQL as Durable Authority

## Status

Accepted for the bounded Pilot by D-011 and D-022. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Reservations, stages, consent, interest, progression, moderation and audit need relational transactions and constraints.

## Decision

Use NCP Cloud DB for PostgreSQL in Korea as Pilot and production-target durable source of truth. Maintain logical exports and prove restoration to non-NCP PostgreSQL.

## Considered and rejected alternatives

NoSQL/document primary and Redis authority are rejected. Self-managed PostgreSQL is rejected for the real-participant Pilot because patch, backup and recovery risk outweigh cost savings.

## Consequences

- **Positive:** Managed backup/PITR, relational invariants and portable SQL.
- **Negative:** Higher Pilot cost, constrained extensions/superuser and NCP operational dependency.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Confirm engine/minor version, extensions, G3 quote, backup period, PITR/failover and logical restore. Conceptual entities and retention may proceed; tables, columns, enums, DBML and migrations remain pending D-024.

## Evidence and SOT

[Data capability draft](../spec/data/README.md), [deployment](../architecture/deployment-ncp-korea.md).

