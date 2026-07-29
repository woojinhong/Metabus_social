---
title: Scalability and Reliability
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-29
related: [../discovery/decisions.md, application-architecture.md, data-architecture.md, realtime-media.md, deployment-ncp-korea.md, capacity-and-cost-model.md, ../adr/ADR-001-modular-monolith-managed-rtc.md, ../adr/ADR-004-postgresql-primary-store.md, ../adr/ADR-005-redis-ephemeral-session-state.md, ../adr/ADR-008-ncp-korea-hosting.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md and Accepted ADRs
---

# Scalability and Reliability

## Initial bounded topology

| Component | Initial posture | Authority or failure boundary |
| --- | --- | --- |
| Business application | [RECOMMENDED] One modular-monolith deployable | Shared application failure boundary; current permission checked per request |
| PostgreSQL | [CONFIRMED] One managed authoritative database | Committed business state is authoritative; unavailable means fail closed |
| Redis/cache cluster | [NOT-RECOMMENDED] None | No cached authorization or session dependency initially |
| Message broker | [NOT-RECOMMENDED] None | DB jobs/Outbox provide durable intent |
| Search engine | [NOT-RECOMMENDED] None | Indexed PostgreSQL queries first |
| Realtime gateway | [NOT-RECOMMENDED] None | SSE remains inside the application initially |
| Media | [CONFIRMED] Managed LiveKit RTC | Transport only; connection is not official session state |
| Files | [CONFIRMED] Private managed object storage | PostgreSQL owns scoped metadata and workflow |

[OPEN] Request rate, participant count, concurrent sessions/connections, data volume, staffing, budget, and numeric SLOs are not established. Therefore no capacity tier or technology threshold is asserted.

## Required observations

| Area | Signals | Decision supported |
| --- | --- | --- |
| REST/API | RPS, latency distribution, error/timeout/conflict rate | App capacity, endpoint/query remediation |
| PostgreSQL | CPU, IOPS, storage, connections/pool wait, slow queries, lock wait/deadlocks, replica/backup state | Query/index/connection work and scaling |
| SSE | Concurrent connections, fan-out latency, disconnect/reconnect/drop rate | Gateway extraction or delivery tuning |
| JVM | Heap, allocation, GC pause/frequency, thread pools, CPU | Resource tuning and realtime isolation |
| LiveKit | Room/participant count, join success, first audio, packet loss/jitter/RTT, TURN/relay, webhook lag/errors | Quota, device/media policy, provider gate |
| DB jobs/Outbox | Ready/running/retry/dead backlog, oldest age, attempts, processing latency | Worker capacity or broker review |
| Search | Query latency, rows examined, timeout, DB CPU/IOPS contribution | Read model/search engine gate |
| Object storage | Upload/download bytes, errors, latency, signed-URL failures, deletion backlog | File-worker/storage operation |
| Providers | Request latency, timeout/error/retry, duplicate/replay, reconciliation/manual backlog | Circuit/pause/vendor isolation |
| Privacy/operations | Deletion backlog/age/failures, audit-write failures, break-glass activity | Privacy staffing and incident action |

Metrics, logs, and traces use opaque identifiers and aggregates; they exclude raw identity, preferences, choices, report content, credentials, voice/media, and provider payloads. General telemetry is not an audit or completion record.

## Failure handling matrix

| Failure | Impact | Automatic recovery/retry | Manual action and record | User treatment and minimum recovery |
| --- | --- | --- | --- | --- |
| Application restart | Requests/connections interrupt | Process restart; clients reconnect with jitter and reload snapshot | Inspect crash/deploy correlation; operational incident | Show interruption; no inferred state; committed facts survive |
| Application instance loss | Pilot app unavailable under single-instance ADR-008 baseline | Health check can replace/restart instance if platform supports it [OPEN] | Restore service, reconcile jobs/provider intents | Fail closed until healthy; no silent authorization widening |
| PostgreSQL outage | No authoritative reads/writes | Bounded connection retry only | Managed recovery/restore/failover per verified capability [OPEN]; DB incident/audit exceptions | Reject critical work; do not acknowledge completion |
| Cache outage | No initial impact because cache absent | If later adopted, bypass/rebuild only where safe | Investigate invalidation/session impact | Never widen permission; session store uncertainty rejects auth |
| Broker outage | No initial impact because broker absent | DB jobs/Outbox remain durable | If later adopted, pause relay and reconcile offsets/deduplication | Core committed request remains queryable |
| External provider outage | Eligibility, notification, or media step unavailable | Timeout, circuit/pause, bounded idempotent retry | Manual reconciliation after retry limit; provider incident/reference | State remains pending/paused/cancelled by approved policy, never false success |
| SSE disconnect | Change hints stop | Backoff reconnect, then snapshot; polling fallback | Alert on sustained fan-out/drop anomaly | Show stale/reconnecting state; business state unchanged |
| WebRTC/LiveKit failure | Audio/media unavailable | Device recovery or bounded reconnect | Operator pause/cancel/reconcile; media incident | Connection loss is not official end; no mid-session provider switch by default |
| Network uncertainty | Response/outcome unknown | Requery using same idempotency key | Reconcile unmatched request if needed | Show pending/unknown, never duplicate action |
| Deployment failure | New version unhealthy/partial | Health gate stops rollout where supported [OPEN] | Roll back to known artifact; record version/config/decision | Keep or restore previous healthy service; no schema guess |
| Incorrect data change | Wrong authoritative fact or access | No blind automated reversal | Freeze affected workflow, inspect audit/history, approved corrective transaction or restore | Notify operations/affected user as policy requires; preserve evidence |
| Privacy deletion failure | Data remains beyond planned step | Idempotent retry with attempt/next-run/dead state | Privacy/operations alert, scoped manual repair, completion recheck | Do not claim deletion complete; access remains restricted |

Retries are bounded, classified as safe or unsafe, and idempotent. Every retryable external/job operation records attempt, next run, last error class, owning state/reference, and dead/manual disposition without sensitive payloads. Exact fields remain [OPEN].

## Recovery and correctness principles

- [RECOMMENDED] PostgreSQL is the recovery anchor. Restore must not revive revoked sessions/permissions, expired assignments, old sanctions, completed deletion work, or stale Outbox delivery.
- [RECOMMENDED] Clients recover from realtime loss by reauthentication/current-scope check and REST snapshot, not by replaying UI state or assuming the last event succeeded.
- [RECOMMENDED] External recovery reconciles intent, provider reference/event, idempotency key, current state, and current authorization before any transition.
- [RECOMMENDED] Keep rollback artifacts and configuration identity; do not combine an unverified schema change with automatic application rollback.
- [OPEN] Numeric RPO/RTO, backup interval/retention, point-in-time restore, failover time, replacement automation, and regional disaster policy require verified platform behavior and recovery drills.

## Technology revisit gates

| Technology | Evidence required before adoption | Cost accepted on adoption |
| --- | --- | --- |
| Redis-compatible store | Multiple app instances need shared sessions; shared rate limit/presence/high-frequency TTL; or measured DB bottleneck | New consistency, expiry, privacy copy, persistence, failover, and on-call boundary |
| RabbitMQ/Kafka/managed broker | DB-job backlog breaches approved objective; many independent consumers; complex routing; replay; or DB polling becomes measured bottleneck | Delivery semantics, duplicates, offsets/queues, schema, monitoring, recovery |
| Realtime gateway | Connection/fan-out/thread/heap/GC load materially degrades approved REST SLO and independent owner exists | Auth propagation, routing, cross-process trace, deployment/on-call |
| Search engine | Indexed PostgreSQL misses approved search SLO or approved full-text/faceted corpus cannot be served | Index lag, delete/privacy synchronization, another datastore |
| Kubernetes | Several independently deployed services, sustained multi-instance scaling/rollout needs, and staffed platform/on-call ownership | Cluster security, upgrades, networking, observability, cost |
| Microservices | Independent data ownership, scale, failure boundary, release cadence, and operating team are all demonstrated | Distributed consistency, contracts, compensation, cross-service security/observability |

Exact thresholds remain [OPEN]; “traffic increased” alone is not an entry condition. Evidence must link the measured bottleneck to the technology's specific benefit.

## Reliability testing gates

- [RECOMMENDED] Unit-test every allowed/forbidden domain transition and invariant, including choice/capability, report/case/sanction/appeal, assignment/work, and access-end/deletion separation.
- [RECOMMENDED] Spring Security and API tests cover authentication, CSRF, coarse roles, session revocation, assignment/resource row scope, stable error classes, conflict, and idempotent retry.
- [RECOMMENDED] Use Testcontainers with the real PostgreSQL engine for transaction, optimistic conflict, constraints, concurrent commands, job lease, Outbox, backup/restore, and revoked/deleted-state restoration behavior.
- [RECOMMENDED] Adapter contract tests and webhook tests cover timeout, bounded retry, signature, replay, duplicate, disorder, provider error mapping, and reconciliation without false completion.
- [RECOMMENDED] Browser E2E covers participant, operator, and reviewer critical journeys; actual-device tests cover iOS Safari/Android Chrome media, accessibility, interruption, and SSE-to-polling recovery.
- [RECOMMENDED] Run application restart, LiveKit/vendor outage, DB-job retry/dead recovery, backup/restore, and privacy deletion reprocessing drills before live operation.
- [REVISIT-WHEN] Large load, fault injection, multi-instance failover, and broad service-to-service contract tests become required only when their corresponding topology exists or capacity risk is approved.
