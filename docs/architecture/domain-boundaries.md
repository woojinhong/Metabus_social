---
title: Modular Monolith Boundaries and Execution Contracts
document_type: architecture analysis
classification: proposal
status: Unapproved
implementation_ready: false
last_verified: 2026-07-29
related: [../discovery/product-concept.md, ../discovery/decisions.md, application-architecture.md, security-privacy.md, ../spec/api/README.md, ../spec/data/domain-data-model.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md and Accepted ADRs; Issue #25 scopes this proposal only
---

# Modular Monolith Boundaries and Execution Contracts

## Boundary and dependency rules

- [RECOMMENDED] One Spring application and PostgreSQL database contain logical modules with owned state, Application Ports, repositories, and tests. A module is not a service or deployment promise.
- [RECOMMENDED] Cross-module references use opaque IDs, immutable value snapshots, or explicit Application/Query Ports. Direct cross-module Entity associations and repository access are prohibited by default.
- [RECOMMENDED] Synchronous calls are allowed when one local transaction must protect an invariant. Post-commit internal events are used only when eventual effects are safe.
- [NOT-RECOMMENDED] Generic interfaces for every class, a full Clean/CQRS framework, and separate services/databases add indirection or distributed consistency without current evidence. Interfaces are justified at provider, clock, identity, query, and durable-delivery seams.

## Logical module catalog

Names are responsibility labels, not final Java packages, classes, repositories, event names, or deployment units. “Publish/subscribe” identifies candidate internal facts; final names remain [OPEN].

| Module | Public Application Port; owned Domain/Repository | Candidate events | Allowed dependency / forbidden dependency | Same transaction; extraction outlook |
| --- | --- | --- | --- | --- |
| Account | account status, closure; Account state | AccountSuspended/AccessClosed | Authentication, Audit / no Session repository | status + session-revoke intent; keep local |
| Authentication | login/logout/revoke; Auth Session | SessionIssued/Revoked | Account, Audit / no business-scope decision | revoke + audit; external IdP [OPEN] |
| Authorization | grant/revoke/current-scope; Grant/history | GrantChanged | Account, Assignment read Port, Audit / no UI/token-only authority | change + history + audit; keep local |
| Eligibility | request/reconcile eligibility; Eligibility | EligibilityChanged | Account, Provider, Audit / no raw provider ownership | intent/result reconcile; provider seam extractable |
| Reservation | reserve/cancel/rebook; Reservation | ReservationChanged | Account, Eligibility Query, Audit / no Session mutation | capacity + reservation + audit; load candidate |
| Session | admit/start/advance/end; Official Session | SessionChanged | Reservation, Eligibility, Authorization, Consent/Choice Query, Audit / no RTC observation authority | official transition + audit/capability effects; keep local |
| Consent | grant/withdraw/access check; Consent/Disclosure Access | ConsentChanged/AccessRevoked | Account, Session Query, Audit / no Choice inference | consent + access evidence; keep local |
| Choice | submit/withdraw/derive; Choice/Capability | CapabilityChanged | Session Query, Authorization, Audit / no peer-choice exposure | close + capability derivation; keep local |
| Report | submit/withdraw; Report | ReportReceived | Account, Session Query, Audit / no Case/Sanction repository | receipt + optional Case request; keep local |
| Case | create/link/triage; Case | CaseChanged | Report Query, Assignment, Audit / no Sanction decision | report link + Case/assignment candidate; keep local |
| Sanction | decide/reverse; Sanction/history | SanctionChanged | Case Query, Authorization, Audit / no Appeal review | decision + current authorization effect + audit; keep local |
| Appeal | submit/review; Appeal/history | AppealChanged | Sanction/Case Query, Assignment, Audit / no original-reviewer authority | outcome + correction reference + audit; keep local |
| Assignment | assign/change/release; Assignment/history | AssignmentChanged | Account/workforce Query, Audit / no Work Record deletion | old/new assignment + history; keep local |
| Operations | record work/read queue; Work Record | WorkRecorded | Assignment, scoped domain Ports, Audit / no scope expansion | work record with governed action where required |
| Privacy | request/status/retry; Privacy Request/Deletion Job | PrivacyStepChanged | Account, Authentication, Provider, Async, Audit / no access-end-as-deletion | receipt + Job + audit; Worker extraction candidate |
| Audit | append/query governed evidence; Audit Record | none as authority | authenticated actor/context / no general-log dependency | required record commits with action; keep local |
| Realtime | emit hint/snapshot notification; delivery projection | ChangeHintReady | authorized Query Ports, Async candidate / no Domain mutation | post-commit only; gateway candidate |
| Media | issue token/reconcile observation; media metadata | MediaObservation | Session/Choice/Consent Query, Provider / no official state mutation | token after current check; adapter candidate |
| Provider | create intent/reconcile/webhook; vendor intent/result/receipt | ProviderResultReady | owning module Ports, Async, Audit / no business completion | intent + Outbox; adapter seam extractable |
| Async | register/claim/complete; Job/Outbox | DeliveryAttempted | owning reference and Provider Ports / no business authority | source intent + Outbox atomic; Worker/broker candidate |

## Dependency direction and cycle controls

```text
API Entry -> Application Port -> Domain + owned Repository
                         -> authorized Query Port of another module
                         -> Audit / Async registration in the same transaction
Provider/Webhook -> Provider Port -> receipt -> Async reconciliation -> owning Application Port
Commit -> Realtime change hint -> client Snapshot Query
```

- [RECOMMENDED] A lower-level repository never invokes another module's Application Service. Orchestration stays in the initiating Application Service.
- [RECOMMENDED] Bidirectional domain calls are replaced by an owning orchestrator or a small read Port. Shared “common domain” objects must not become a backdoor dependency.
- [RECOMMENDED] Internal events cannot repair a same-transaction invariant; they are limited to notification, external delivery, projection, and independently retryable follow-up.
- [REVISIT-WHEN] Extract only after owned data, a stable Port, independent failure/scale need, migration plan, and named operations owner exist.

## Layer responsibilities

| Layer | Responsible for | Must not do |
| --- | --- | --- |
| Frontend | Input, temporary UI state, safe error display, SSE reconnect, Snapshot reload | Decide authorization, completion, official end, sanction, or deletion |
| API Entry | Shape validation, Principal binding, correlation, error/response mapping, Application Port call | Core scope decision, transaction orchestration, repository access |
| Application Service | Current authorization/scope, transaction, Aggregate loading, domain transition, cross-module coordination, audit and Job/Outbox registration | Provider/HTTP DTO leakage or long external call in transaction |
| Domain | State transition, invariant, business calculation, conflict rule | Framework, database, transport, actor lookup |
| Repository | Save owned Aggregate, conditional update, lock, constraint-error mapping | Cross-module Entity graph or authorization by post-filtering |
| Query Service | Read-only Projection DTO, workforce search, complex SQL candidate, row/field privacy scope | Domain mutation or unbounded protected export |
| External Adapter | Internal/provider DTO mapping, timeout, bounded retry, error taxonomy, reference and webhook verification | User permission or internal completion decision |

[RECOMMENDED] These layers exceed simple Controller-Service-Repository only where the contracts require independently testable current-scope checks, transitions, complex protected queries, audit, and volatile providers. Domain logic may remain a transaction script for simple CRUD; it becomes a richer model only where lifecycle invariants justify it.

## Authentication and authorization execution

```text
HTTP Request -> server-session authentication -> Spring Security coarse role
 -> Application Service -> Current Authorization load
 -> Assignment + resource relationship + lifecycle/sanction/consent checks
 -> Command -> Audit -> PostgreSQL commit
```

| Scenario | Spring Security | Application/Query responsibility |
| --- | --- | --- |
| User reads own information | Authenticated participant | Match Account subject; return minimized own projection |
| User enters official session | Authenticated participant | Recheck account, reservation, eligibility, admission, sanction, official state, capability |
| Operator reads assigned Case | Authenticated workforce + coarse role | Query current active Assignment and Case row/field scope |
| Operator changes Assignment | Authorized assignment-management role | Recheck current Assignment/version, target eligibility, separation of duty |
| Reviewer decides Appeal | Reviewer role | Prove independent active Assignment, no conflict, current Sanction/Case |
| Personal-data read | Authenticated approved role | Purpose, data category, target, assignment, minimum fields; privacy-access audit |
| Deletion Job action | Workforce/worker identity | Current Privacy Request, target step, lease, retention/hold exception |
| Break-glass | Strong workforce authentication candidate | Named reason, scope, expiry, alert, retrospective review; exact second approval [OPEN] |
| Suspended account uses old session | Session cookie may parse | Current account/revoke time denies and session is revoked |
| Released assignee uses old screen | Coarse role remains | Current Assignment/row scope denies; UI state is irrelevant |

## Transaction and concurrency patterns

Database constraints and conditional writes are the final defense. Optimistic versioning is the normal conflict mechanism; pessimistic locking is considered only for measured, short, rare contention. Distributed locks and application `synchronized` are [NOT-RECOMMENDED].

| Work | Local transaction and lock/condition | Unique/idempotency/retry | Audit/Outbox; failure response |
| --- | --- | --- | --- |
| Reservation create | load eligibility; conditional capacity/reservation write; optimistic slot candidate | active reservation constraint + idempotency; retry only transient DB conflict | audit; conflict returns current Snapshot |
| Capacity-limited admission | conditional count/seat allocation; short row lock only if condition cannot be atomic | membership uniqueness; bounded DB retry | audit; capacity/state conflict |
| Official start | Official Session expected state/version plus current prerequisites | start idempotency; no blind retry | start + audit; optional hint Outbox; stale-state conflict |
| Official end | expected active/paused state; revoke current capabilities | end idempotency | end + audit + follow-up registration; disconnect never substitutes |
| Report + Case link | insert idempotent Report; create/link Case under current policy | Report key and link uniqueness | receipt/audit; conflict reuses receipt or reloads |
| Assignment change | conditional current Assignment/version; single-active defense | idempotency + active uniqueness | old/new history + audit; stale assignment conflict |
| Sanction decision | current Case/version, reviewer authority/concurrence; optimistic | decision idempotency + active-sanction candidate | decision/auth effect/audit + notice Outbox; conflict or forbidden |
| Appeal submission | current sanction/appeal right | active-appeal uniqueness + idempotency | receipt/audit; reuse prior receipt |
| Appeal review | current independent Assignment, Appeal/Sanction versions | decision idempotency | outcome/correction reference/audit + notice intent; conflict |
| Privacy deletion request | current Account/request; no data deletion inline | active-request uniqueness + idempotency | request + Deletion Job + audit; return accepted status |
| Provider intent create | internal intent and optional Outbox only; no network call | server key/intent uniqueness | same commit Outbox; return pending/accepted |
| Webhook result apply | minimal receipt first; reconciliation locks/conditions owning state | provider event uniqueness; bounded retry after reread | result/domain transition/audit; duplicate acknowledged, mismatch manual |
| Async Job claim | conditional due-state and expired/no lease update | Job version/lease; worker may retry claim | attempt/lease record; no user business success |

## Audit contract

General logs diagnose runtime behavior and never replace audit. Required audit failure rolls back the governed action unless an explicitly approved durable follow-up preserves the same evidence guarantee.

| Audit candidates | Minimum reference categories |
| --- | --- |
| login/logout/session revoke; grant/revoke; assignment change; personal-data and safety-case access | actor and actor type, action, target, purpose, scope |
| official session start/end; sanction/reversal; appeal review; provider reconciliation | previous/result reference, outcome, policy/authority reference |
| deletion request/execution/retry; break-glass; manual reconciliation; administrator configuration | timestamp, correlation ID, source, reason, approval/review reference where required |

- [RECOMMENDED] Audit stores references and reasoned outcomes, not protected content copies, provider payloads, report narratives, credentials, or media.
- [OPEN] Exact tamper-evidence mechanism, legal retention, access reviewer, break-glass approval, and export process require security/legal/operations evidence.

## Promotion boundary

This proposal remains `implementation_ready: false`. Final packages, class/Port names, Entity mappings, repository methods, transaction annotations, query technology, lock syntax, constraints, events, endpoints, DTOs, and code require a later approved implementation plan.
