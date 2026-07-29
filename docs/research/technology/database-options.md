---
title: Database and Session-State Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-29
related: README.md; ../../discovery/decisions.md; ../../architecture/data-architecture.md; ../../architecture/application-architecture.md; ../../architecture/scalability-reliability.md; ../../adr/ADR-004-postgresql-primary-store.md; ../../adr/ADR-005-redis-ephemeral-session-state.md
decision_authority: docs/discovery/decisions.md and Accepted ADRs only
---

# Database and Session-State Options

## Decision context

- [CONFIRMED] ADR-004 selects PostgreSQL for durable product authority; ADR-005 selects no Redis for the bounded Pilot.
- [CONFIRMED] Client state, caches, messages, LiveKit observations, and provider responses are not business completion evidence. Provider outcomes reconcile into current PostgreSQL state.
- [RECOMMENDED] Start with PostgreSQL plus a database job queue; add Transactional Outbox where the same commit must record a business transition and a future delivery intent.
- [OPEN] Final schema, table/column/entity/migration design, exact database version/tier, Redis versus Valkey product, broker product, retention, capacity, backup/restore behavior, and cost remain later decisions.

## Technology comparison

| Candidate | Problem solved / current need | Advantages | Costs, privacy, and recovery | Decision and revisit condition |
| --- | --- | --- | --- | --- |
| PostgreSQL | Related authoritative state, transactions, history, idempotency; **required** | ACID, referential/unique/check constraints, conditional updates, locks, JSON, mature SQL/backup tooling | Schema/query/connection discipline; managed recovery must be verified | [CONFIRMED] Primary ledger; revisit product/version only at implementation |
| MySQL/MariaDB | Alternative relational authority; **no unmet need** | Mature SQL operations, replication, ecosystem | Migration and behavior differences without project benefit; same privacy/backup duties | [NOT-RECOMMENDED] ADR-004 selected PostgreSQL; revisit only if approved platform support fails |
| MongoDB | Flexible documents/high-variation records; **bounded provider metadata only** | Natural document payloads and flexible evolution | Cross-record grants/workflows and constraints move to application; another backup/privacy surface | [NOT-RECOMMENDED] Authority; revisit only for isolated document workload with ownership |
| Redis or Valkey | Shared TTL, sessions, rate limit, presence; **not initially required** | Fast ephemeral access and TTL primitives | Invalidation, stale authorization, extra personal copies, persistence/failover/on-call | [REVISIT-WHEN] Multi-instance session, shared rate/presence, high-frequency TTL, measured DB bottleneck |
| Elasticsearch/OpenSearch | Full-text, ranking, faceting over large corpus; **not established** | Specialized search and aggregation | Index lag, deletion/authorization sync, resource/operations cost, sensitive duplicate | [REVISIT-WHEN] Indexed PostgreSQL misses approved search SLO or required corpus/query |
| Kafka | High-throughput retained event log, replay, many consumers; **not required** | Partitioned scale, replay, consumer independence | Cluster/schema/offset/rebalance operations, duplicates, personal-event retention | [NOT-RECOMMENDED] Initial; revisit for approved replay/many-consumer throughput |
| RabbitMQ | Routed work queues and acknowledgements; **not required** | Flexible routing, retry/dead-letter patterns | Broker availability, topology, duplicate/idempotency, monitoring/on-call | [REVISIT-WHEN] Complex routing or independent consumers exceed DB queue |
| Redis Streams | Lightweight stream on Redis; **not required** | Consumer groups and one shared data service | Redis becomes durable-delivery dependency; trimming/recovery and privacy copies | [NOT-RECOMMENDED] No Redis/broker need; revisit with adopted Redis and stream fit |
| Database job queue | Bounded asynchronous work/retry; **required candidate** | One authority/backup/transaction system; simple operational start | Polling/lock/cleanup load; handlers must be idempotent | [RECOMMENDED] Initial jobs; revisit when measured backlog/polling limits |
| Transactional Outbox | Atomically record commit plus delivery intent; **needed for consequential delivery** | Prevents commit-without-intent gap; supports retry/reconciliation | Relay, ordering, cleanup, duplicate delivery, consumer idempotency | [RECOMMENDED] Use selectively; broker may later consume Outbox |

## Why PostgreSQL is the authority

PostgreSQL fits current permission, official session, report–case–sanction–appeal, assignment/work-record, privacy workflow, audit, idempotency, and provider reconciliation because those facts require relational integrity and local atomic transitions. A document or key-value authority would duplicate these invariants in application code and make partial change, delete propagation, and audit reconstruction harder.

JSON is appropriate only for bounded, versioned, minimized provider fragments or non-authoritative metadata whose fields are not used as unconstrained permission facts. Account identity, current authorization, lifecycle states, relationships, assignments, idempotency, job ownership, and audit references remain relationally constrained.

## State and work placement

| State/work | Initial placement | Recovery/correctness rule |
| --- | --- | --- |
| Account, session, authorization | PostgreSQL | Recheck current facts; stale token/cache never grants access |
| Choice and derived capability | Separate PostgreSQL responsibilities | One cannot be inferred or disclosed from the other |
| Official session lifecycle | PostgreSQL | Disconnect/LiveKit state never starts or ends it |
| Report, case, sanction, appeal | Separate linked PostgreSQL responsibilities | One lifecycle does not replace another |
| Assignment and work record | Separate PostgreSQL responsibilities | Assignment removal ends access, not recorded work |
| Privacy request/deletion steps | PostgreSQL workflow and evidence | Access end is not deletion completion; retry safely |
| Presence/realtime hint | App memory/SSE observation initially | Rebuild/requery; no authority |
| Provider call/result/webhook | Intent, verified receipt, reconciliation in PostgreSQL | Deduplicate, current-state recheck, internal commit |
| Async work | DB queue; selective Outbox | Lease/attempt/next-run/dead; idempotent handler |
| Binary file | Private object storage; PostgreSQL metadata | Scoped signed access and reconciled delete |
| Search | Indexed PostgreSQL query/read DTO | Enforce row scope in query; measure before extraction |

## Database queue and Outbox boundary

```text
Business transaction
  -> authoritative state + audit + optional job/Outbox intent
  -> commit
Worker/relay -> lease/read intent -> external action or notification
  -> idempotent result reconciliation transaction
```

- [RECOMMENDED] Use the DB queue for bounded internal work such as deletion steps, file processing, notification attempts, and failed-provider reconciliation where polling load is acceptable.
- [RECOMMENDED] Use Outbox when losing the post-commit delivery intent would violate the workflow. It does not make delivery exactly once; consumers and reconciliation remain idempotent.
- [RECOMMENDED] Record lease expiry, attempts, next run, and dead/manual disposition without payload secrets or unnecessary personal data; exact fields and schedules remain [OPEN].
- [NOT-RECOMMENDED] Audit and business completion never live only in a queue, stream, or broker. A realtime notification is not a standalone broker-adoption reason.

## Cache and search safety

- [RECOMMENDED] Recheck current authorization in PostgreSQL instead of caching it initially. Static assets may use browser/CDN caching under ordinary content controls.
- [RECOMMENDED] If an ephemeral store is later adopted, define reconstructability, TTL, invalidation, encryption, access, failure fallback, deletion propagation, persistence/failover, and privacy classification before use.
- [OPEN] Redis versus Valkey, managed offering, license/support, topology, persistence, and failure semantics are evaluated only at the actual adoption gate.
- [RECOMMENDED] Operator/reviewer search begins with scope-aware indexed SQL and query DTOs. A search index must never return rows/fields the current repository scope would deny.
- [REVISIT-WHEN] Search extraction requires measured query latency/DB CPU/IOPS failure against an approved SLO plus a tested authorization and deletion-synchronization design.

## Failure, recovery, and evidence limits

| Component | Failure behavior | Recovery requirement |
| --- | --- | --- |
| PostgreSQL | Authoritative operations fail closed | Verified backup/restore/failover; no revived grants/deleted workflow |
| DB worker | Work remains pending/retry/dead | Lease expiry, idempotent retry, manual reconciliation |
| Outbox relay | Commit remains; delivery delayed | Resume from durable intent and deduplicate |
| Future cache | Degrade/rebuild without widening access | Authority remains PostgreSQL |
| Future broker | Pause consumers/relay; do not lose business fact | Offset/queue/deduplication reconciliation |
| Future search | Search unavailable or stale | Fall back where safe; never bypass scope; delete/index repair |

- [OPEN] Workload volume, backlog objective, database polling cost, search corpus/query, consumer count, replay period, backup/restore/failover, managed-service SLA, price, DPA, and subprocessors are not verified.
- Official PostgreSQL documentation: <https://www.postgresql.org/docs/> and support policy: <https://www.postgresql.org/support/versioning/>; managed-service availability and supported versions must be rechecked at implementation.
- Technology documentation does not determine legal retention, deletion sufficiency, team operations, or product throughput; those require approved evidence and drills.
