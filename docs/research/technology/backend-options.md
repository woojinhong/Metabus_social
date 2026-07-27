---
title: Backend Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/application-architecture.md
decision_authority: docs/discovery/decisions.md only
---

# Backend Options

## Candidate comparison

| Candidate | Domain modeling and testing | Real-time and vendor adapters | Operations | Developer fit | Proposal assessment |
| --- | --- | --- | --- | --- | --- |
| Java + Spring Boot 4.1 | Strong transactional and domain ecosystem | WebSocket and HTTP integrations | Mature JVM operations | Aligns with stated primary experience | Recommended |
| Kotlin + Spring Boot or Ktor 3.5 | Concise JVM model | Comparable JVM integrations | Mixed framework choice | Kotlin learning and choice cost | Fallback |
| TypeScript + NestJS 11 | Fast shared-language iteration | Mature API ecosystem | Node concurrency discipline needed | Strong web hiring pool | Rejected for now; revisit if team fit changes |

## Proposal - unapproved recommendation

- Recommended: Java with Spring Boot as a modular monolith, with vendor ports at media, identity, notification, storage, and observability boundaries.
- Fallback: Kotlin with Spring Boot if Kotlin becomes an approved team preference; Ktor needs an operational prototype first.
- Rejected now: NestJS is viable but does not outweigh current developer fit and a proven transactional backend path.
- Migration: extract an independently measured adapter or bounded context only after a demonstrated reliability or team-boundary need.
- Lock-in and exit: keep domain policies and vendor contracts framework-light where that improves tests and replacement.
- Approval gate: backend and architecture choice require explicit approval.

## Criteria, security, cost, and scale

Research finding: a modular monolith lowers deployment and transactional-consistency burden for a small team. Proposal - unapproved: do not introduce microservices merely for anticipated scale; media remains vendor transport while application state is authoritative. Evidence gap: JVM hosting cost depends on region, runtime memory, support tier, and actual session load.

## Source ledger

- Title: Spring Boot system requirements
  - Publisher: Spring
  - URL: https://docs.spring.io/spring-boot/system-requirements.html
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Official documentation identifies the Spring Boot 4.1 line.
  - Limitations: Adoption must verify Java and dependency compatibility.

- Title: Ktor releases
  - Publisher: JetBrains
  - URL: https://ktor.io/docs/releases.html
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Official releases list Ktor 3.5.1.
  - Limitations: Team operability remains unproven.

- Title: NestJS documentation
  - Publisher: NestJS
  - URL: https://docs.nestjs.com/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: NestJS v11 is a documented alternative.
  - Limitations: Documentation does not compare it to JVM systems.


## Decision criteria

| Criterion | Why it matters | Evidence required before acceptance |
| --- | --- | --- |
| Transactional consistency | Interest, consent, and reveal progression must not partially commit | Idempotency and race-condition test design |
| Domain isolation | Safety and progression policies change independently of vendors | Boundary map and use-case review |
| Real-time integration | Media provider is transport, not policy authority | Token, webhook, outage, and reconnect prototype |
| Operational maturity | Small team needs diagnosable failure handling | Logs, traces, metrics, and runbook review |
| Security review | Sensitive data needs constrained access | Threat model and least-privilege design review |
| Future extraction | Avoid premature services while retaining a path | Measured bottleneck or separate ownership evidence |

## Rejected-option rationale

- Microservices are rejected for the proposed pilot because distributed transactions, deployment, observability, and on-call complexity arrive before demonstrated scale.
- Function-heavy/serverless design is not rejected categorically, but is not recommended as a session-state authority without explicit ordering, reconnect, and long-lived coordination evidence.
- A service-oriented modular backend remains a future extraction pattern, not an initial topology.
- Direct framework use is reasonable in HTTP, persistence, and vendor adapters; isolate policy only where domain tests or vendor replacement justify it.


## Evidence limits

- Framework versions and published documentation do not establish throughput, latency, staffing, or secure configuration for this product.
- A backend proof must exercise authorized stage transition, duplicate interest selection, consent withdrawal, provider webhook disorder, and outage recovery.
