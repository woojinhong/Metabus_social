---
title: Application Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Application Architecture

## Recommendation proposal

**Proposal — unapproved:** use a hybrid architecture: a Java/Spring Boot modular monolith for product authority and a managed SFU for media transport. This favors one deployment and transaction boundary while isolating volatile vendors.

## Options considered

| Style | Initial cost | Consistency | Real-time fit | Operations | Exit path | Finding |
| --- | --- | --- | --- | --- | --- | --- |
| Modular monolith | Low-medium | Strong | Good with managed media | Lowest | Extract by context/event | Recommended proposal |
| Service-oriented modules | Medium | Mixed | Good | Medium | Already separated | Premature for small team |
| Microservices | High | Distributed | Good | High | Expensive consolidation | Rejected initially |
| Function-heavy serverless | Medium | Fragmented | Weak for authoritative sessions | Medium-high | Provider-specific | Rejected as core |
| Hybrid backend + managed media | Medium | Strong in app | Strong | Medium | Media adapter/export | Recommended shape |

## Module boundaries

Modules follow [domain boundaries](domain-boundaries.md). They own use cases, state transitions, tables or schemas, and emitted events. Cross-module calls may remain in-process; durable asynchronous work uses an outbox only when delivery consequences justify it.

## Clean boundaries without ceremony

| Boundary | Isolation valuable when | Direct framework use acceptable when |
| --- | --- | --- |
| Domain | Invariants span records or transitions | Simple validated CRUD |
| Application use case | Authorization, idempotency, consent, orchestration | Thin read-only query |
| Inbound adapter | HTTP, job, webhook, WebSocket differ | Request mapping |
| Outbound port | Vendor/data semantics may change | Stable low-risk utility |
| Persistence adapter | Aggregate transaction and sensitive access | Repository query implementation |
| Media adapter | Tokens, permissions, rooms, provider exit | Vendor DTO mapping inside adapter |
| Policy/moderation adapter | Rules need version/audit | Deterministic local validators |

Do not create one interface per class. Use a port for volatile vendors, time, randomness, durable messaging, or substitutable policy.

## Authoritative command path

1. Authenticate account and device session.
2. Load durable eligibility/reservation and stage.
3. Verify command preconditions and consent version.
4. Apply one idempotent transition in a transaction.
5. Persist domain/audit event and outbox item when needed.
6. Project ephemeral room state and issue vendor command.
7. Return the version; reject stale or unauthorized commands.

Commands carry request ID and expected state version. Duplicates return the prior outcome. Out-of-order commands fail with a refresh instruction.

## State reconstruction

PostgreSQL stores durable checkpoints and critical transitions. Optional Redis contains expiring projections only. After Redis loss, rebuild active room projections from durable stage, membership, consent, and provider presence; timers resume from persisted deadlines or operator policy.

## Failure isolation

Vendor adapters use timeouts, bounded retry, circuit breaking, webhook signature checks, and idempotent reconciliation. Media or notification failure cannot mutate consent or selection. Operator actions require reason, scope, and audit.

## Future extraction strategy

Extract only after measured pressure. Media orchestration, notifications, content publishing, or analytics ingestion are likely first because they have asynchronous/vendor boundaries. Keep identity, consent, interest, and reveal authorization together until consistency evidence supports separation.

## Approval gate

Approval is required for architecture style, stack, public contracts, vendors, and application implementation.

## Testing seams

Use contract tests for vendor adapters, state-machine tests for legal transitions, transaction tests for consent/interest/reveal, webhook replay tests, and reconstruction tests that delete ephemeral projections. End-to-end scenarios cover late join, reconnect, removal, duplicate selection, consent withdrawal, unauthorized reveal, and media outage.

## Deployment criteria

A single deployable remains preferred while one team can own it and availability needs align. Separate process or service proposals require measured resource isolation, independent release need, or a regulatory/access boundary that cannot be achieved inside the monolith.

## Observability boundary

Commands and transitions emit correlation-safe operational events. Logs exclude raw preferences, private choices, tokens, media URLs, identity evidence, and report narratives. Traces stop or redact at vendor and sensitive-data boundaries.
