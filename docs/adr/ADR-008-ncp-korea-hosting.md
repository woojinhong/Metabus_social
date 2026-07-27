---
title: ADR-008: NAVER Cloud Platform Korea VPC Hosting
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-010
---

# ADR-008: NAVER Cloud Platform Korea VPC Hosting

## Status

Accepted for the bounded Pilot by D-010. This does not authorize source code, provisioning, procurement, or public operation.

## Context

The Pilot handles account, dating-preference and safety data and needs a bounded Korean infrastructure region.

## Decision

Use NCP Korea Region VPC. Pilot uses public Application Load Balancer, one private Standard-g2 application server, private Cloud DB for PostgreSQL, NAT-controlled outbound, Secret Manager, Sub Accounts, Object Storage and NCP observability. Production target adds multi-zone application instances and HA database.

## Considered and rejected alternatives

NCP Micro, a public all-in-one host, multi-cloud and Kubernetes are rejected for the Pilot.

## Consequences

- **Positive:** Regional infrastructure, managed database and integrated access/audit.
- **Negative:** Paid baseline and NCP network/IAM lock-in; one Pilot app instance is an accepted availability limit.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

No provisioning until business account, VAT-inclusive quote, quotas, ACG/subnet review, secret rotation, backup/restore, legal/DPA and cost alarms pass. UI/API deployment artifacts await D-024 and source-code authorization.

## Evidence and SOT

[Deployment SOT](../architecture/deployment-ncp-korea.md), [vendor verification](../research/technology/korean-mvp-vendor-verification.md).

