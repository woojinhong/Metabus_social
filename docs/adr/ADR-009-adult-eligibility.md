---
title: ADR-009: NICE Mobile Identity for Adult Eligibility
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-006 and D-014
---

# ADR-009: NICE Mobile Identity for Adult Eligibility

## Status

Accepted for the bounded Pilot by D-006 and D-014. This does not authorize source code, provisioning, procurement, or public operation.

## Context

A Korean dating Pilot needs stronger adult eligibility than phone possession while minimizing identity data.

## Decision

Select NICE mobile identity verification with PASS and provider-supported SMS fallback. Derive 19th-birthday eligibility transiently; persist outcome, timestamp, provider, policy version and minimal opaque transaction reference only. Store no DOB, CI, DI, document or biometric.

## Considered and rejected alternatives

Ordinary SMS possession, manual document review, MyPIN by default, raw documents, liveness and face comparison are rejected.

## Consequences

- **Positive:** Korean conversion path with minimal stored result.
- **Negative:** Contract, returned fields, foreign/MVNO coverage, outage and deletion terms remain procurement/legal gates.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Block live participation until lawful basis/notices, contract/DPA, callback security, exact requested fields, accessibility/recovery and deletion are verified. Page/endpoint flow remains pending D-024.

## Evidence and SOT

[Identity principles](../spec/security/identity-admission-and-invitations.md), [vendor verification](../research/technology/korean-mvp-vendor-verification.md).

