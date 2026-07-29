---
title: Data Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-29
related: [../discovery/decisions.md, ../spec/data-contract.md, ../spec/lifecycle-contract.md, ../spec/actor-authorization-contract.md, application-architecture.md, ../adr/ADR-004-postgresql-primary-store.md, ../adr/ADR-005-redis-ephemeral-session-state.md, ../adr/ADR-006-object-storage-for-media.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md and Accepted ADRs
---

# Data Architecture

## Purpose and authority

- [RECOMMENDED] This document defines data responsibility, lifecycle, consistency, concurrency, and recovery boundaries; it does not define final tables, columns, entities, enums, or migrations.
- [CONFIRMED] PostgreSQL is the durable business ledger. A business outcome exists only after its valid state transition commits.
- [CONFIRMED] Frontend state, caches, messages, SSE/WebSocket delivery, and LiveKit room/participant state are projections or observations, never durable authority.
- [CONFIRMED] A provider response or webhook is reconciliation input, not internal completion. It must be deduplicated and checked against current state and authorization before commit.
- [CONFIRMED] Private object storage owns encrypted binary bytes; PostgreSQL owns purpose, classification, object reference, access scope, retention workflow, and audit metadata. Neither a stable public URL nor storage existence proves business authorization.

| Store or producer | Owns | Must not own | Failure default |
| --- | --- | --- | --- |
| PostgreSQL | Current business facts, required history, audit, idempotency, job/Outbox state, file metadata | Media packets or transient presence | Authoritative writes fail closed |
| Browser | Draft input and presentation state | Eligibility, authorization, session, sanction, deletion completion | Discard/requery REST snapshot |
| SSE/WebSocket/cache | Delivery or expiring projection | Sole copy of a business fact | Lose/rebuild without widening access |
| LiveKit | Media connection observations | Official session state or capability | Media degrades; business state remains |
| External provider | Provider-side result and reference | Internal completion or permission | Reconcile later; never assume success |
| Private object storage | Encrypted binary objects | Business metadata or permanent public access | Deny access and retain retryable workflow |

## Data responsibility classification

| Responsibility | Current fact | Separate history/evidence | Required separation |
| --- | --- | --- | --- |
| Account | Lifecycle and restriction state | Lifecycle history | Account closure is not deletion completion |
| Authentication session | Active/revoked/expired state | Rotation and revocation evidence | Cookie presence is not authentication authority |
| Current authorization | Grant, scope, resource, lifetime | Grant/revoke history | Rechecked for every consequential request |
| User choice | Private submitted choice | Submission/change evidence as approved | Must not disclose the choice to infer a result |
| Derived capability | Capability created from valid choices/policy | Create/revoke history | Separate from either participant's choice |
| Reservation | Current booking state | Booking changes | Does not itself admit or start a session |
| Official session | Current lifecycle state and durable deadlines | Start/stage/end history | Separate from connection and presence |
| Realtime observation | Connection/presence projection | Short operational evidence only if justified | Never proves official start/end |
| Report | Report fact and lifecycle | Submission/access history | Separate from case, sanction, and appeal |
| Case | Investigation/workflow state | Case transitions | May link reports without replacing them |
| Sanction | Current decision/effect | Decision/change history | Separate from case and appeal |
| Appeal | Request/review/result | Review history | Does not silently rewrite sanction history |
| Assignment | Current assignee/scope/lifetime | Assignment change history | Separate from work performed |
| Work record | Actual operator/reviewer action | Action chronology | Assignment is not proof of work |
| Privacy request | Requested scope and receipt state | Request evidence | Access revocation is not deletion |
| Deletion workflow | Step, retry, exception, completion state | Execution evidence and backup expiry | Completion requires reconciled required steps |
| Audit record | Governed action, actor, scope, reason, result | Durable append-oriented evidence | Separate from operational logs |
| Provider call intent | Intended operation and owning state version | Attempt chronology | Created before external execution |
| Provider result | Received result/reference | Reconciliation history | Not completion until internal commit |
| Webhook receipt | Provider event identity and verification result | Duplicate/replay disposition | Deduplicate before applying |
| Idempotency record | Request key, operation scope, recorded result reference | Expiry/cleanup evidence as approved | Same key cannot create a second fact |
| Async job | Status, lease, attempt, next run, dead/manual state | Attempt history | Job success is not sole business evidence |
| File metadata | Purpose, classification, object reference, scope, retention | Access/delete evidence | Binary remains outside relational rows |

Exact payloads, retention periods, identity fields, and provider-returned fields remain [OPEN] until contract, legal, privacy, and implementation review.

## Current state, history, audit, and logs

| Record type | Purpose | Recommended model | Not interchangeable with |
| --- | --- | --- | --- |
| Current state | Fast authoritative decision and transition | Normalized relational current row/aggregate | History or cache |
| Change history | Reconstruct material business changes | Separate immutable-or-correctable history by policy | General audit |
| Audit/privacy access | Who acted/accessed, why, scope, result | Dedicated durable record with restricted access | Debug log |
| Operational log | Diagnose software and infrastructure | Structured, redacted, short-purpose retention | Business completion evidence |

[RECOMMENDED] Keep current state plus only required histories in relational models. [NOT-RECOMMENDED] Event sourcing is not the Pilot default: replay semantics, schema evolution, privacy deletion, and operational tooling add cost without an approved replay requirement.

## Database options

| Candidate | Fit for this project | Advantages | Costs and risks | Decision |
| --- | --- | --- | --- | --- |
| PostgreSQL | Interrelated grants, sessions, safety workflow, assignments, idempotency | ACID, foreign/unique/check constraints, conditional updates, locking, JSON, mature backup/restore | One primary dependency; schema/query discipline required | [CONFIRMED] Durable authority |
| MySQL/MariaDB | Can model the same relational core | Mature operations and replication | Migration without a requirement; different SQL/locking/JSON behavior | [NOT-RECOMMENDED] ADR-004 already selects PostgreSQL |
| MongoDB/document store | Flexible documents and provider snapshots | Easy variable-shape documents | Cross-document invariants, relations, and state transitions become application burden | [NOT-RECOMMENDED] Not the authority |
| Key-value store | TTL, rate limit, presence, session acceleration | Fast expiring access | Weak relational integrity; cache invalidation and privacy copies | [REVISIT-WHEN] Measured ephemeral need |
| Search engine | Full-text, ranking, large faceted search | Specialized query performance | Index lag, deletion synchronization, extra access surface and operations | [REVISIT-WHEN] Indexed PostgreSQL misses approved SLO |
| Event store | Replay and temporal event streams | Complete event chronology | Event evolution, projection repair, deletion conflict, high complexity | [NOT-RECOMMENDED] No approved replay need |

PostgreSQL is preferred over document storage because permission, assignment, session, report–case–sanction–appeal, deletion workflow, and deduplication require strong multi-record consistency. JSON may hold bounded provider payload fragments or versioned non-authoritative metadata after minimization; identities, current authorization, lifecycle states, assignments, idempotency, and audit relationships remain normalized.

## Data access options

| Technology | Appropriate use | Limitation | Current decision |
| --- | --- | --- | --- |
| JPA | Aggregate writes, transactional lifecycle, simple reads | N+1, hidden SQL, bulk/complex search friction | [RECOMMENDED] Baseline candidate |
| QueryDSL | Type-safe dynamic JPA queries | Adds generation/tooling and still follows JPA limits | [OPEN] Evaluate for operator filters |
| jOOQ | SQL-controlled complex search, reporting, locking | Generated schema workflow and another model | [REVISIT-WHEN] Query complexity is demonstrated |
| MyBatis | Explicit mapped SQL | Mapping duplication and string-based maintenance | [NOT-RECOMMENDED] No present advantage |
| JDBC | Small explicit queries, bulk or vendor-neutral control | Manual mapping and boilerplate | [REVISIT-WHEN] A measured query needs it |

[RECOMMENDED] Do not force every query through JPA. Keep write models and API/query DTOs separate; exposing a JPA entity would leak persistence shape, lazy-loading behavior, internal relationships, and sensitive fields into the public contract. [OPEN] Final JPA, QueryDSL, jOOQ, and JDBC dependency combination waits for implementation planning.

## Transactions, concurrency, and duplicate handling

- [RECOMMENDED] Use expected-state conditional updates for every material transition and optimistic version checks for ordinary concurrent edits.
- [RECOMMENDED] Use unique constraints for invariants such as one active assignment or one accepted operation scope; the exact constraints remain [OPEN].
- [RECOMMENDED] Consider pessimistic locking only for short, rare contention where retry is unsafe; never hold it across a provider call.
- [RECOMMENDED] Scope idempotency keys to actor/operation/resource, reuse recorded outcomes, and deduplicate webhooks by verified provider event identity.
- [RECOMMENDED] A DB worker acquires a bounded lease, records attempts and next-run/dead state, and makes handlers idempotent before retry.
- [NOT-RECOMMENDED] Application locks and distributed locks are not initial correctness controls; the former fail across instances and the latter add another failure authority.
- [NOT-RECOMMENDED] Distributed transactions and Saga are unnecessary while one application and one authoritative database can use local ACID.

## Deletion, retention, and access end

| Lifecycle event | Immediate effect | Later work | Evidence status |
| --- | --- | --- | --- |
| Authorization end | Deny future scoped access | Revoke derived tokens/projections | Grant/revoke history |
| Login-session revocation | Reject future session use | Expire server session and rotate credentials as applicable | Revocation evidence |
| Privacy request | Register requested scope idempotently | Plan and queue required steps | Request receipt |
| Active deletion | Delete, redact, anonymize, or retain by approved rule | Reconcile DB, object, provider, analytics, cache/CDN | Step/exception evidence |
| Legal/business retention | Restrict use and access | Review hold and release | Reason, authority, expiry [OPEN] |
| Backup expiry | Prevent reintroduction after retention cycle | Verify restore procedure honors tombstones/revocation | Expiry/restore evidence |
| Audit retention | Preserve minimum accountability | Restrict, minimize, expire per approved schedule | Period and lawful basis [OPEN] |

[OPEN] Retention periods, legal holds, anonymization sufficiency, backup expiry, and provider deletion terms require qualified legal/privacy and B-session contract evidence. Soft delete alone is not privacy deletion; hard deletion is not always permitted; both require purpose-specific policy.

## Backup, restore, and validation gates

- [RECOMMENDED] Backups inherit classification, encryption, residency, access, and deletion restrictions. Restore tests must not revive expired grants, revoked sessions, sanctions, or completed deletion work.
- [RECOMMENDED] Before implementation, verify every write has a purpose/owner, every sensitive read is scoped and auditable, concurrent withdrawal blocks disclosure, duplicate requests produce one fact, and object/provider deletion can be reconciled.
- [OPEN] Numeric RPO/RTO, managed backup behavior, point-in-time restore, failover, and provider export/deletion capabilities require exercises and verified service terms.
