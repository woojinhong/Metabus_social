---
title: Integration, Job Queue, and Outbox Design Contract
document_type: architecture analysis
classification: proposal
status: Unapproved
implementation_ready: false
last_verified: 2026-07-29
related: [application-architecture.md, external-services-selected.md, domain-boundaries.md, ../spec/api/README.md, ../spec/data/domain-data-model.md]
decision_authority: Accepted ADRs select Pilot providers; Issue #25 scopes this proposal only
---

# Integration, Job Queue, and Outbox Design Contract

## Responsibility separation

| Responsibility | Durable authority | Delivery/execution rule |
| --- | --- | --- |
| Business Command | Owning domain state committed in PostgreSQL | Complete synchronously only when local work is finished |
| Audit | Dedicated record in the governed transaction | Never delegated solely to a queue or broker |
| Async Job | PostgreSQL Job state | Worker claims and records attempts/results; Job success is not owning-domain success |
| External delivery intent | PostgreSQL intent plus Outbox when atomic handoff is needed | Relay may redeliver; consumer/provider interaction is idempotent |
| Internal domain event | Minimal post-commit fact candidate | Used only for eventual effects; never repairs a local invariant |
| SSE hint | Non-authoritative post-commit projection | Loss, duplicate, or reorder recovers through REST Snapshot |

- [RECOMMENDED] Start with a PostgreSQL Job Queue. Use Transactional Outbox only when a domain commit and durable external-delivery intent must be atomic.
- [NOT-RECOMMENDED] Kafka, RabbitMQ, Redis Streams, and distributed transactions are not initial dependencies: there is one application/database, no multiple independent consumers, replay requirement, or measured DB polling limit.

## Job Queue contract

Candidate states are `READY`, `CLAIMED`/`RUNNING`, `SUCCEEDED`, `RETRY_WAIT`, `DEAD`, `MANUAL_REVIEW`, and `CANCELLED`. Exact enum and storage design are [OPEN].

| Concern | Contract |
| --- | --- |
| Registration | Store owning purpose/resource reference, Job type candidate, sanitized input reference, due time, priority, and correlation reference |
| Claim | Atomic conditional update selects a due Job whose lease is absent/expired; worker records identity and attempt |
| Lease | Time-bounded ownership; heartbeat/extension only while work continues; duration [OPEN] |
| Lease expiry | Another worker may reclaim after current state recheck; prior worker result cannot commit after lost lease |
| Attempt/backoff | Record attempt, bounded exponential backoff with jitter, next-run time, and safe error taxonomy |
| Duplicate execution | Expected under crash/timeout; work uses domain idempotency/provider reference and conditional result commit |
| Worker crash | Lease expires; Job returns to a claimable state without asserting business success |
| Result | Store minimized outcome/reference; owning Application Service reconciles any business transition |
| Manual retry | Authorized operator supplies reason; audit the action; a retry does not erase prior attempts |
| Deletion priority | Privacy deadlines and risk may raise priority without bypassing holds, authorization, or current-state checks |
| Operations visibility | Scoped queue, age/backlog, attempts, next run, safe failure, owner, and manual/dead state; no protected payload |

[RECOMMENDED] A worker claim is a short transaction; provider/file work runs outside it. Completion uses the current lease/version and owning state. Unlimited retries and application `synchronized` are prohibited.

## Transactional Outbox contract

```text
Owning Application Service
 -> business state + audit + external intent + Outbox in one transaction
 -> commit
 -> relay claims Outbox
 -> Adapter/provider or internal consumer
 -> delivery outcome
 -> retry or result-reconciliation Job
```

| Concern | Contract |
| --- | --- |
| Atomic registration | Outbox and source intent commit together; no external call inside the source transaction |
| Claim | Conditional claim with lease/version; relay crash permits redelivery |
| Delivery success | Record delivery/reference without treating it as domain completion |
| Failure | Categorize retryable, terminal, unknown, or manual; schedule bounded retry |
| Duplicate delivery | Expected at-least-once behavior; downstream/provider key and consumer record deduplicate |
| Consumer idempotency | Scope by consumer/purpose plus event identity; same event with incompatible payload hash is a conflict |
| Ordering | Per-resource ordering only where the owning lifecycle requires it; global order is not promised |
| Cleanup/retention | Retain enough for reconciliation/audit purpose, then delete; exact period and archive rule [OPEN] |

## Common provider Adapter contract

The selected providers remain those in [Selected External Services](external-services-selected.md). Adapter Ports prevent provider DTOs, credentials, and observed behavior from becoming Domain or API contracts.

| Provider need | Internal Port responsibility | Result/reconciliation boundary |
| --- | --- | --- |
| Adult eligibility | Start/inspect verification using minimized internal request/result | Provider result is input; current attempt/account/policy rechecked before eligibility change |
| LiveKit | Issue room-scoped token, revoke grant, reconcile observations | Join/leave/track/webhook never starts or ends the official session |
| Notifications | Deliver approved intent/template to minimum destination | Delivery does not create admission, sanction, appeal, or deletion fact |
| Object storage | Put/delete private bytes and issue short scoped access | PostgreSQL File Metadata and authorization remain authoritative |
| Logs/monitoring | Export sanitized telemetry | Telemetry loss does not widen access or replace audit |
| Future provider | Implement a purpose-specific Port | New provider cannot expand data, authority, or fallback without review |

Every Adapter defines:

- internal Request/Result DTOs separate from provider DTOs;
- explicit connect/read/overall timeout candidates and bounded retry only for classified safe operations;
- circuit-breaker or bulkhead behavior only when measured/provider failure justifies it; exact library is [OPEN];
- internal intent ID, provider reference, idempotency key, correlation reference, and safe error taxonomy;
- minimum fields sent, redaction, retention/deletion/export duties, and no credentials/raw payload in ordinary logs;
- retryable, terminal, unknown, mismatch, and manual-reconciliation outcomes;
- a replacement boundary and export plan without promising transparent mid-session failover.

[OPEN] Actual provider fields, idempotency/replay guarantees, signatures, quotas, callback ordering, deletion proof, SLA, DPA, subprocessors, data location, SDK behavior, and pricing require B-session evidence and executed terms.

## External request flow

```text
Application Service -> current authority/state check
 -> internal intent + optional Outbox + audit -> PostgreSQL commit
 -> worker/relay -> Adapter -> provider
 -> response or webhook -> receipt/deduplication
 -> current authority/state recheck -> reconciliation transaction
```

- [RECOMMENDED] Do not hold a PostgreSQL transaction open across a provider call.
- [RECOMMENDED] HTTP success, accepted request, provider dashboard status, and webhook receipt are observations until internal reconciliation commits.
- [RECOMMENDED] Unknown outcomes are queried or retried with the same provider/internal idempotency reference; after bounded attempts they enter manual review.

## Webhook receipt and reconciliation

```text
Provider -> public webhook entry -> signature + freshness/replay validation
 -> provider event-ID deduplication -> minimal receipt commit -> fast response
 -> async reconciliation -> owning state/authorization recheck
 -> internal transition + audit -> commit
```

| Condition | Receipt behavior | Reconciliation behavior |
| --- | --- | --- |
| Valid first event | Persist minimum metadata/hash/reference; acknowledge quickly | Enqueue/reconcile against current internal intent |
| Duplicate event ID | Return safe acknowledgement without a second effect | Reuse prior receipt/result |
| Same ID, different hash | Record security/mismatch category | No automatic transition; alert/manual review |
| Invalid signature/freshness/replay | Reject and record sanitized security event | No Job or business change |
| Out-of-order or delayed event | Persist once if otherwise valid | Compare provider reference and current state; stale event cannot overwrite |
| Unknown resource/reference | Persist minimum orphan receipt candidate | Quarantine/manual reconciliation; do not create authority |
| Ended/cancelled resource | Acknowledge valid receipt | Apply only an allowed historical/result update; never reopen implicitly |
| Provider retry | Same deduplication path | No duplicate audit/domain action |

Raw webhook payload storage is [NOT-RECOMMENDED] by default. If verification or dispute evidence requires a bounded encrypted copy, purpose, fields, access, and retention need separate privacy/security approval. Provider Event ID, safe headers, receipt time, payload hash, provider account, intent reference, and outcome are candidate metadata, not final fields.

## Failure and operational controls

- [RECOMMENDED] Retry only operations classified safe and idempotent; cap attempts, time, and cost. Circuit-open or provider outage keeps internal state pending/unknown/manual, never successful.
- [RECOMMENDED] Dead/Manual Jobs, growing backlog, lease churn, deletion failure, signature failure, mismatch, and provider error rate are operator-visible metrics without personal labels.
- [RECOMMENDED] Deletion Job failure is a privacy alert. General logs contain only correlation, opaque references, Adapter/operation, latency, and error category.
- [REVISIT-WHEN] Add a broker only for measured Job backlog/DB polling pressure, multiple independent consumers, complex routing, replay, or independent failure ownership. Add a separate Worker deployment only for independent resource/failure/load evidence.

## Promotion boundary

This proposal remains `implementation_ready: false`. Final Job/Outbox tables, columns, enums, leases, polling SQL, retry values, event names/payloads, Adapter interfaces, webhook routes/fields/signatures, SDKs, broker, and deployment are not authorized.
