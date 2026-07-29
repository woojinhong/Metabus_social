---
title: Application Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-29
related: [../discovery/product-concept.md, ../discovery/decisions.md, ../spec/traceability-ux-implementation.md, ../spec/actor-authorization-contract.md, ../spec/lifecycle-contract.md, ../spec/realtime-contract.md, ../spec/api-contract.md, ../spec/data-contract.md, ../adr/ADR-001-modular-monolith-managed-rtc.md, ../adr/ADR-002-web-first-delivery.md, ../adr/ADR-003-realtime-media-provider.md, ../adr/ADR-004-postgresql-primary-store.md, ../adr/ADR-005-redis-ephemeral-session-state.md, ../adr/ADR-006-object-storage-for-media.md, ../adr/ADR-007-observability-baseline.md, ../adr/ADR-008-ncp-korea-hosting.md, ../adr/ADR-009-adult-eligibility.md, ../adr/ADR-010-ncp-notifications.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md and Accepted ADRs
---

# Application Architecture

## Purpose and scope

- [RECOMMENDED] This document defines pre-implementation system responsibilities and placement boundaries for the bounded Pilot, not implementation code.
- [OPEN] It does not decide final endpoints, DTOs, tables, columns, entities, enums, migrations, or wire protocols; the linked contract drafts remain `implementation_ready: false`.
- [RECOMMENDED] Start with the least complex structure that preserves current authorization, durable state transitions, privacy boundaries, and vendor reconciliation. Add scaling technology only after measured load, failure-isolation, or independent-deployment evidence.
- [CONFIRMED] ADR-001 records OpenJDK 25 and Spring Boot 4.1 for the approved platform baseline. [OPEN] Exact patch versions, support window, and library compatibility remain implementation-planning decisions. [RECOMMENDED] Use a blocking Spring MVC business server.

## Authority and evidence boundary

| Subject | Authoritative source | Non-authoritative representation or transport | Completion or change condition |
| --- | --- | --- | --- |
| User authentication state | Server-validated credential plus committed session/revocation state | Browser memory, cookie presence, URL, displayed login state | Server validation against current account/session state |
| Current authorization | PostgreSQL grant, scope, lifetime, and assignment facts | Hidden/visible controls, cached claims, token-only role | Current actor, role, scope, lifetime, and resource boundary pass again |
| Assignee | PostgreSQL current assignment plus assignment history | Operator screen selection or presence | Conditional commit of a valid assignment change |
| Business state | PostgreSQL committed domain state | Frontend state, URL, SSE/WebSocket payload, cache | Valid transition and transaction commit |
| Official session start | PostgreSQL session-lifecycle state | RTC room join, participant presence, timer display | Admission, consent, authorization, and transition commit |
| Official session end | PostgreSQL session-lifecycle state and audit fact | Disconnect, room close, client timer, delivery loss | Authorized end transition commit |
| Realtime connection state | Realtime connection observation | Browser indicator or last message | Connection-layer observation only; it never proves business completion |
| Voice/media connection state | LiveKit room/participant observation | WebRTC peer state or webhook | Media observation only; it never starts or ends the official session |
| Report | PostgreSQL report fact and lifecycle | Submitted toast or delivered event | Idempotent report transaction commit |
| Case | PostgreSQL case fact and report link | Operator queue projection | Valid case transition commit |
| Sanction | PostgreSQL sanction decision and history | Notice delivery or provider action | Authorized decision transaction commit |
| Appeal | PostgreSQL appeal and review history | Reviewer screen state | Authorized appeal/review transaction commit |
| Privacy deletion request | PostgreSQL privacy-workflow request | Account closure or access revocation | Idempotent request transaction commit |
| Privacy deletion progress | PostgreSQL workflow steps and evidence | Worker log, queue state, vendor acknowledgement | Required steps reconcile and durable status commits; access end is not deletion |
| External provider result | Internal intent/result/reconciliation facts in PostgreSQL | HTTP success, callback, webhook, provider dashboard | Deduplicate, recheck current state and authorization, then reconcile in a transaction |
| Audit record | Dedicated durable audit and privacy-access records | General application log, metric, trace | Audit record commits with the governed action or registered follow-up |
[CONFIRMED] PostgreSQL-committed business facts are authoritative. Frontend memory, URL and display values are projections; SSE and WebSocket are transports; LiveKit state is observation; provider success alone is not internal completion. General logs and realtime events must not contain private choices, report content, raw identity data, or other unnecessary personal data.

## Topology candidates

| Criterion | A — modular monolith | B — business server + realtime gateway | C — feature services |
| --- | --- | --- | --- |
| Transaction consistency | Local PostgreSQL ACID | Business ACID; delivery is separate | Cross-service consistency and compensation required |
| Immediate authorization changes | Same request and database | Gateway must revalidate or receive revocation | Propagation delay and stale policy risk |
| Data ownership | Logical module ownership, one database | Business server owns facts; gateway owns connections | Physical ownership must be partitioned |
| Failure isolation | Shared application failure boundary | Connection failures isolated | Strongest isolation when boundaries are correct |
| Deployment complexity | One app plus bounded worker | Two coordinated deployables | Many deployables and compatibility matrices |
| Operations complexity | Lowest; shared resource contention remains | Connection routing and state added | Discovery, routing, retries, ownership, on-call added |
| Test complexity | Local integration and contract seams | Adds cross-process auth/reconnect tests | Adds distributed contract and failure tests |
| Observability | One trace/log context | Cross-process correlation needed | Full distributed correlation needed |
| Initial development speed | Fastest while preserving module boundaries | Slower for gateway contract and deployment | Slowest due to distributed scaffolding |
| Future scalability | Vertical/horizontal app scaling; selective extraction | Independent connection scaling | Independent feature scaling/deployment |
| Extraction/data-move risk | Deferred but interfaces and ownership must be added | Realtime data is limited; lower move risk | Immediate partitioning and migration risk |
| Current fit | [RECOMMENDED] Best fit for strong consistency and unknown load | [REVISIT-WHEN] connection load harms business API | [NOT-RECOMMENDED] no independent scale/team evidence |
[RECOMMENDED] Choose A: authorization and official state can change atomically; report–case–sanction–appeal links, assignment/work records, and access-end/deletion workflow stay consistent. No measured load or independent operating teams justify distributed consistency now.
[RECOMMENDED] This gives up B's connection isolation and C's independent scaling/deployment. It shares one application failure boundary and can decay into an unstructured codebase unless dependencies are enforced; later extraction requires explicit APIs, data ownership, and Outbox boundaries.

## System components and responsibilities

| Component | Responsible for | Not responsible for | Authoritative data access | Default on failure |
| --- | --- | --- | --- | --- |
| Participant web frontend | Input, display, temporary UI state, errors, reconnect/requery | Final authorization, completion, session end, sanction, deletion completion | REST snapshots only | Preserve no authority; show uncertainty and requery |
| Operator/reviewer web frontend | Scoped queues, decisions, errors, requery | Expanding scope or proving assignment/work completion | Scope-filtered REST snapshots | Fail closed and refresh scope |
| Spring Boot business application | REST commands/queries and orchestration | Media transport or trusting UI/provider state | Read/write PostgreSQL | Reject authoritative changes when DB unavailable |
| Authentication/session layer | Principal validation, session/revocation checks | Resource-level business scope | Current account/session facts | Fail closed |
| Authorization/scope check | Actor, role, scope, lifetime, assignment, resource checks | UI visibility policy as proof | Current PostgreSQL facts | Deny |
| Application Service | Preconditions, local transaction, cross-module coordination, audit/job registration | HTTP/vendor DTO details | Transactional repositories | Roll back |
| Domain state transition | Invariants, allowed transitions, conflict decisions | Persistence and transport | Supplied current facts | Refuse invalid transition |
| Repository/query layer | Persistence, scoped queries, constraints, conditional updates | Business completion by query side effect | PostgreSQL | Surface conflict/error |
| PostgreSQL | Durable authority, history, idempotency, jobs/outbox | Presence or media packets | Primary committed data | Authority unavailable; fail closed |
| SSE delivery | Minimal post-commit change hints | Completion evidence or full sensitive state | Event projection/identifier only | Drop/reconnect; REST requery |
| Polling fallback | Snapshot recovery when SSE fails | Creating a second authority | REST snapshots | Backoff and retry |
| WebRTC/LiveKit | SFU, TURN, voice/media connection | Business API, official session state | Short-lived connection authorization only | Media unavailable; business state unchanged |
| External provider Adapter | DTO mapping, timeout, bounded retry, error mapping, references, webhook verification | Internal completion or authorization | Intent/result records through service | Retryable/manual state, never false success |
| DB job queue/Outbox | Durable post-commit work and delivery intent | Sole audit or business truth | PostgreSQL job/intent records | Attempt/next-run/dead handling |
| Private object storage | Encrypted evidence/file bytes and expiring access | Business metadata authority | PostgreSQL metadata and scoped signed access | Deny access; preserve retryable workflow |
| Operational logs | Diagnostics with redaction | Audit, privacy-access, or completion record | Identifiers minimized/pseudonymized | Degraded diagnosis, not widened access |
| OpenTelemetry metrics/traces | Latency, errors, backlog, correlation | Sensitive payload storage | Aggregates and opaque IDs | Business continues; alert on telemetry loss |
| Audit/privacy-access records | Governed action and sensitive-access evidence | General debugging output | Dedicated durable records | Required audit failure rolls back the governed action |
## Logical module boundaries

| Module | Owns and may change | May reference / same-transaction link | Must not do / extraction outlook |
| --- | --- | --- | --- |
| Account and Authentication | Account/session/revocation | Account status; revoke + history | No business scope decision; IdP choice [OPEN] |
| Authorization and Scope | Current grants, scopes, lifetimes | Assignment, case, session; mutation + authorization fact | No UI-state trust; keep local initially |
| Eligibility and Admission | Eligibility/admission decisions | Account, consent, reservation; admission + session start | No RTC-based admission; later only with clear ownership |
| Reservation | Reservation lifecycle | Eligibility and availability | No official admission; separable on independent load |
| Session Lifecycle | Official start/stage/end | Admission, consent, capability; state + audit | No disconnect-as-end; candidate only on distinct load |
| Realtime Projection | Post-commit hints and reconnect projection | Committed facts; optional Outbox | No durable transition; gateway extraction candidate |
| Media Integration | Media token/reference/observations | Current session authorization | No official state; provider-isolation candidate |
| Consent and Disclosure | Consent and disclosure-access lifetimes | Account/session; grant/revoke + audit | No choice/capability inference |
| Choice and Derived Capability | Private choice and separately derived capability | Eligible session; choice + derived grant | No private choice disclosure |
| Report | Report lifecycle | Actor/session; report + optional case link | No case/sanction ownership |
| Case | Case lifecycle and report relation | Reports/assignment; case + assignment | No sanction/appeal ownership |
| Sanction | Sanction decision/history | Case/account; sanction + revocation + audit | No appeal review |
| Appeal | Appeal/review history | Sanction/reviewer scope; decision + history | No silent sanction rewrite |
| Assignment and Operations | Assignment and separate work records | Case/current scope; assignment + history | No assignment-as-work proof |
| Privacy and Deletion | Request, steps, evidence, retention state | Account/session/jobs; request + job + audit | No access-end-as-deletion |
| Audit | Governed action/access evidence | Every consequential mutation in same transaction | No general-log substitution; extraction not initial |
| External Provider Integration | Intent, provider references, reconciled results | Owning domain; intent + Outbox | No provider-success-as-completion |
| Async Job and Outbox | Attempts, next run, dead/delivery intent | Owning transaction registration | No business authority; broker extraction candidate |
[OPEN] Concrete package, class, entity, and dependency names remain undecided. [RECOMMENDED] Use interfaces at volatile provider, clock, and durable-delivery seams, not one interface per class.

## Layer responsibilities

| Layer | Responsibilities | Exclusions |
| --- | --- | --- |
| Frontend | Input, display, temporary state, error handling, reconnect, current-state requery | Final authorization/completion, official end, sanction or deletion completion |
| API Entry | Shape validation, Principal binding, response/error mapping, Application Service call | Core authorization, whole transaction, direct repository calls |
| Application Service | Current authorization/scope and transition preconditions, transaction, domain coordination, audit and Outbox/job registration | Transport rendering |
| Domain Logic | Allowed transitions, invariants, business rules, conflict decisions | Database/vendor operations |
| Repository and Query | Durable writes, scope-aware reads, concurrency/unique constraints, conditional updates | Leaking persistence objects as API contracts |
| External Adapter | Internal/provider DTO mapping, timeout, bounded retry, error mapping, reference recording, webhook signature/replay/duplicate checks | Internal completion and user authorization |
## Authoritative request and provider flows

```text
Browser -> REST -> API Entry -> Application Service -> current authentication/scope check
 -> transition validation -> PostgreSQL transaction -> audit + optional Outbox/job -> commit
 -> response -> minimal SSE hint -> client REST snapshot requery
```

[RECOMMENDED] Send SSE only after commit; delivery failure never rolls back the commit. A client never finalizes state from an SSE payload and, after reconnect, reloads the snapshot by REST. If a network result is uncertain, it reuses the idempotency key to retrieve the recorded result.

```text
Application Service -> internal intent + Outbox transaction -> commit -> DB worker/relay
 -> provider Adapter -> provider -> response/webhook -> deduplicate + current-state recheck
 -> reconciliation transaction
```

[RECOMMENDED] Do not hold a database transaction across an external call. Link internal request ID, provider reference, and idempotency key; verify webhook signature, replay, and duplicate event ID. Treat provider output only as transition input, recheck current authorization/state, and separate retryable failure from manual-action-required state.

## Realtime and media boundary

| Technology | Role | Authoritative | Initial use | Revisit condition |
| --- | --- | ---: | ---: | --- |
| REST | Business commands and snapshot queries | No transport is authority; committed result is | [RECOMMENDED] Yes | Add another API style only for measured client need |
| SSE | Server-to-browser minimal change hint | No | [RECOMMENDED] Yes | Fan-out/connection metrics exceed app boundary |
| Polling | SSE recovery and snapshot refresh | No | [RECOMMENDED] Fallback | Tune from measured recovery load |
| WebSocket | Bidirectional realtime signaling | No | [NOT-RECOMMENDED] No | Client-to-server realtime need cannot use REST |
| WebRTC | Voice/media packets | No | [CONFIRMED] Yes | Media requirements change |
| LiveKit | Managed SFU/TURN and connection observations | No | [CONFIRMED] Yes | Procurement, privacy, latency, or reliability gate fails |
| Separate realtime gateway | Connection isolation/fan-out | No | [NOT-RECOMMENDED] No | Concurrent connections, fan-out delay, heap/GC, or API latency justify it |
[CONFIRMED] WebRTC is not a business API. LiveKit participant state and webhook are observations. A disconnect may trigger an end request, but only a business-server transition and PostgreSQL commit officially start or end a session.

## Transactions, concurrency, and duplicate handling

- [RECOMMENDED] Local PostgreSQL transaction candidates: grant/revoke + history; official session start/end + audit; report creation and report–case link; assignment change; sanction decision; appeal request/review; privacy request; external intent + Outbox.
- [NOT-RECOMMENDED] Distributed transactions and Saga: there are no independent services/databases, and local ACID is simpler and safer than partial commits and compensation.
- [RECOMMENDED] Perform transitions with expected-state conditional updates; use optimistic version checks for ordinary conflicts and unique constraints for single-active assignment/sanction candidates. Consider pessimistic locks only for short, rare contention.
- [RECOMMENDED] Use idempotency keys for network retries, provider event IDs for webhook deduplication, and recorded-result reuse. UI click suppression is convenience, not integrity.
- [NOT-RECOMMENDED] Application `synchronized` is not multi-instance safety; distributed locks are not the initial default.

## Initial cache and messaging

- [NOT-RECOMMENDED] Redis is not initially required: recheck current authorization in PostgreSQL; start idempotency, one-time tokens, and job state there. Cache static assets in browser/CDN, not personal or authorization data indiscriminately.
- [REVISIT-WHEN] Redis: multi-instance session sharing, shared rate limits, high-frequency short-TTL data, shared presence, or a measured database bottleneck.
- [NOT-RECOMMENDED] Kafka and RabbitMQ are not initially required. Start asynchronous work in a DB queue; use Transactional Outbox when commit and delivery intent must be atomic. Never store audit only in a broker, and realtime notification alone does not justify one.
- [REVISIT-WHEN] Broker: DB-worker backlog exceeds capacity, several independent consumers, complex routing, replay, independent failure isolation, or measured DB polling load.

## Areas not split initially

| Cohesive area | Concrete split risk |
| --- | --- |
| Admission + Session Lifecycle | Admission/session partial commit or stale permission |
| Consent + Disclosure Access | Revocation propagation delay and unauthorized disclosure |
| Choice + Derived Capability | Private choice leakage or capability without valid choice |
| Report + Case creation | Duplicate/orphan case and event-order error |
| Case + Sanction + Appeal | Distributed decisions, compensation, and inconsistent histories |
| Assignment + Work Record | Assignment end confused with completed work |
| Account Closure + Session Revocation + Privacy Workflow | Access end confused with deletion completion |
| Current Authorization + Business Transition | Permission change race and stale authorization |

## Future extraction candidates

| Candidate | Initial location | Metrics | Entry condition | Cost |
| --- | --- | --- | --- | --- |
| Realtime gateway | Business app | Concurrent connections, fan-out delay, heap/GC, API latency | Sustained measured interference; threshold [OPEN] | Auth propagation, routing, deploy/observe |
| Media integration | Adapter/module | Provider errors, retries, independent releases | Provider failures/releases require isolation | Reconciliation API and operational ownership |
| Notification processing | DB worker | Backlog, delivery latency, retry rate | Independent consumers or backlog breach; threshold [OPEN] | Broker/queue operations and deduplication |
| Privacy deletion worker | DB worker | Backlog age, failures, manual interventions | SLA risk or separate privacy operator exists; SLA [OPEN] | Sensitive-job controls and recovery |
| Search read model | PostgreSQL query layer | Search latency, DB CPU/IOPS, index lag | Indexed SQL misses approved SLO; SLO [OPEN] | Sync/deletion correctness and extra datastore |
| Statistics processing | PostgreSQL/worker | Query cost, lag, independent release rate | Analytics harms transactional SLO | Data minimization and pipeline operation |
| File processing | App/worker + object storage | CPU, file size, queue time, failure rate | CPU/backlog harms business API | Secure transfer, scanning, lifecycle operation |

## Failure defaults

- [RECOMMENDED] If PostgreSQL is unavailable, authoritative work fails closed. After realtime loss, reconnect and reload the REST snapshot.
- [RECOMMENDED] Bound provider retries; provider failure cannot mark core state complete. On uncertain network results, query by the same idempotency key.
- [RECOMMENDED] Jobs record attempt, next-run, and dead/manual state. Deletion failure raises operations and privacy alerts.
- [CONFIRMED] General logs never replace audit records; logs, metrics, traces, and realtime events exclude sensitive payloads.
- [OPEN] Numeric RPO/RTO remain undecided until backup/restore and recovery exercises provide evidence.

## Open decisions and non-goals

[OPEN] This document does not decide final API endpoints; request/response fields; OpenAPI/AsyncAPI; tables/columns; JPA entities; enums; migrations; SSE event names/payloads; WebSocket protocol; exact Java/Spring patch versions, support window, or dependency compatibility; JPA/jOOQ/JDBC combination; Redis; Kafka/RabbitMQ; Docker versus managed containers; IdP; provider contracts; numeric RPO/RTO; provisioning; implementation code; or a live-user Pilot. B-session gaps such as exact provider behavior, contract fields, retention, quotas, and operational thresholds remain unconfirmed.

[NOT-RECOMMENDED] The initial topology excludes microservices, Kubernetes, multiple business databases, distributed transactions, Saga, event sourcing, full CQRS, a separate authentication server or policy engine, a search engine, realtime gateway, Redis Cluster, Kafka, RabbitMQ, and service mesh. [REVISIT-WHEN] Adopt any of them only when the corresponding measured load, isolation, ownership, deployment, recovery, or replay requirement is approved.
