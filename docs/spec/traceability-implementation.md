---
title: Implementation Traceability Gate
document_type: traceability
classification: proposal
status: Proposal-only contract documentation approved; production promotion blocked
implementation_ready: false
last_verified: 2026-07-31
related_documents: ["../discovery/decisions.md","../discovery/slice-01-current-authority.md","../discovery/implementation-contract-promotion-proposal.md","traceability-ux-implementation.md","actor-authorization-contract.md","lifecycle-contract.md","realtime-contract.md","api-contract.md","data-contract.md","ux/README.md","../reviews/mvp-ux-prototype-validation-ko.md","api/README.md","api/realtime-capabilities.md","data/domain-data-model.md","../architecture/domain-boundaries.md","../architecture/integration-processing-contracts.md"]
decision_authority: D-024 and Issue #7 proposal-only documentation approval; bounded PR A/B state is recorded separately
---

# Implementation Traceability Gate

## Approved boundary trace

| Decision | Product/security requirement | Architecture/ADR | Current artifact | State |
| --- | --- | --- | --- | --- |
| D-001..004 | FR-SCP, FR-SES, FR-GAM, FR-DIS, FR-MAT | product/session specs | approved product rules and UX baseline | Approved; production contracts pending |
| D-006, D-014, D-023 | SR-SCP, SR-TSM, identity principles | ADR-009 | identity/admission principles and UX baseline | Approved principles and UX; API/security contracts pending |
| D-008 | UX-WM, NFR-REL/ACC | ADR-002 | web/mobile numeric gates | Approved non-functional boundary |
| D-009..012 | NFR-REL/SEC/OPS | ADR-001/004/005/008 | deployment/data concepts | Approved platform; schema pending |
| D-013 | NFR-CAP/OBS | ADR-003 | RTC provider/quota boundary | Approved Pilot integration; live gate pending |
| D-015..017 | FR-INV, NFR-OBS | ADR-006/007/010 | external-service register | Approved providers; procurement pending |
| D-018 | NFR-SEC-005 | retention matrix | approved privacy policy | Legal review pending |
| D-019 | SR-TSM, FR-ADM | moderation operations | approved policy and UX baseline | Operational readiness pending |
| D-020..022 | future operation/event/schema IDs | capability drafts | no OpenAPI/AsyncAPI/DBML | proposal-only traceability work authorized; production authority absent |

## Satisfied D-024 evidence

| Required evidence | Approved source |
| --- | --- |
| Information architecture and screen inventory | [UX closure matrix](ux/README.md#ux-gate-closure-matrix) |
| Primary journeys and session-stage wireflow | [UX closure matrix](ux/README.md#ux-gate-closure-matrix) |
| Disclosure, interest, matching and no-match | [UX closure matrix](ux/README.md#ux-gate-closure-matrix) |
| Reconnect, failure and late-join behavior | [UX closure matrix](ux/README.md#ux-gate-closure-matrix) |
| Report, block and moderator behavior | [UX closure matrix](ux/README.md#ux-gate-closure-matrix) |
| Responsive/mobile and accessibility behavior | [UX closure matrix](ux/README.md#ux-gate-closure-matrix) |
| Isolated low-fidelity prototype evidence | [Prototype validation](../reviews/mvp-ux-prototype-validation-ko.md) |

## Closure boundary

D-024 is satisfied only for the approved UX baseline and the isolated,
synthetic-data, local-state, low-fidelity prototype. This document remains
`implementation_ready: false`. D-024 closure did not authorize PR A/B, but
separate merge history now confirms their bounded completion. Neither path
authorizes PR C/D, V7+ or new migrations, OpenAPI/AsyncAPI, final endpoint/DTO,
broad schema, real-time state/payload, Production Frontend, vendor integration,
provisioning or live participant operation.

## Bounded Slice 1 implementation state

The [current authority register](../discovery/slice-01-current-authority.md)
records PR A Product Bootstrap and PR B Persistence Foundation, including
exact V1–V6, as bounded complete. Issue #37 approval wording remains
Unknown/Owner-confirmation because it is absent from current Git history.
Proposal-contract `implementation_ready: false` blocks broad promotion; it does
not relabel the merged PR A/B baseline as unimplemented.

## Approved documentation-only phase

Issue #7 authorizes proposal-only mapping of each approved behavior to actors,
preconditions, candidate responsibilities, data concerns, failure/recovery and
acceptance evidence. The first artifact is the
[UX-to-Implementation matrix](traceability-ux-implementation.md).
Its Actor/Authorization follow-up is the
[actor and authorization contract proposal](actor-authorization-contract.md).
The next proposal is the [lifecycle contract](lifecycle-contract.md).
Its realtime follow-up is the [realtime contract](realtime-contract.md).
Its API follow-up is the [API contract](api-contract.md).
Its Data follow-up is the [Data contract](data-contract.md).

The implementation-facing follow-up refines the existing
[logical API contract](api/README.md), [realtime delivery contract](api/realtime-capabilities.md),
[logical data model](data/domain-data-model.md), [module execution contract](../architecture/domain-boundaries.md),
and [integration processing contract](../architecture/integration-processing-contracts.md).

The [promotion proposal](../discovery/implementation-contract-promotion-proposal.md)
defines the approved documentation boundary. Machine-readable contracts,
schema proposals, final real-time payloads and production source code remain
blocked pending later explicit approval.

## Vertical Slice implementation sequence

The sequence describes the broader Slice progression. PR A/B foundation work is
bounded complete; authentication and later responsibilities remain proposal
material and are not authorized by this sequence.

| Slice | Purpose and included responsibility | Excluded responsibility | Logical API/data contract | Core tests | Completion and next-entry condition |
| --- | --- | --- | --- | --- | --- |
| 1 Account, session, basic authorization | Server session, authentication, coarse role, current authorization, forced logout, audit | IdP/MFA vendor, business workflows | login/logout/revoke/current authorization; Account, Auth Session, Grant, Audit | rotation, CSRF, suspension, revocation, scope denial, audit atomicity | Old session denied after revoke; enter Slice 2 after authorization path is repeatable |
| 2 Reservation and official session | Reservation, admission check, official start/end, conflicts, idempotency | RTC delivery and participant media | reserve/cancel/start/end/Snapshot; Reservation, Official Session, Idempotency | duplicate/retry, capacity race, stale version, disconnect-not-end | Commit alone reconstructs status; enter Slice 3 after lifecycle conflicts are deterministic |
| 3 SSE and LiveKit boundary | Post-commit hint, Snapshot reload, media token, connection observation, reconnect | WebSocket/gateway, provider failover | SSE connection, session Snapshot, token request; observation separate from Official Session | lost/duplicate/reordered hint, revoked token, reconnect, webhook replay | UI recovers only by Snapshot; enter Slice 4 after no media event changes official state |
| 4 Report, Case, Assignment | Report receipt, Case link, assignment conflict, Work Record | Sanction decision and Appeal | report/create-link/assign/release/search; Report, Case, Assignment, Work Record | reporter protection, duplicate report, concurrent assignment, row scope | Assignment end denies access without deleting work; enter Slice 5 after scoped queries pass |
| 5 Sanction and Appeal | Human sanction, current permission effect, independent Appeal and correction, audit | Automated irreversible decision, unproved notices | decide/reverse/appeal/review/status; Sanction, Appeal, authorization history | concurrence, reviewer conflict, stale Case, duplicate decision, correction ordering | Independent review and current authorization effects proven; enter Slice 6 after failure recovery passes |
| 6 Privacy deletion Workflow | Request, access/session end, Deletion Job, provider/object follow-up, retry, retention exception | Legal-period invention, backup/provider completion promise | request/status/retry; Privacy Request, Job, provider result, deletion audit | duplicate request, lease crash, provider outage, hold, partial deletion, manual retry | No false completion; live Pilot still waits for legal/vendor/restore evidence |

## Test strategy by risk

| Risk | Initial evidence | Conditional later evidence |
| --- | --- | --- |
| State and authorization | Domain transition unit tests; Spring Security session/CSRF/coarse-role tests; Application Service assignment/resource tests | External policy/IdP contract tests only if selected |
| PostgreSQL integrity | Real PostgreSQL integration tests with Testcontainers; unique/conditional update, optimistic conflict, idempotency and concurrent-request tests | Sustained load and multi-instance tests after numeric SLO/load exists |
| API and privacy | REST error-category tests; participant/workforce projection scope; no sensitive error/log/SSE payload | Broad compatibility suite after final executable contract |
| Provider and webhook | Adapter contract doubles; timeout/unknown-result; signature, replay, duplicate, reorder and reconciliation tests | Real vendor sandbox/account tests after B Evidence |
| Realtime/media | SSE loss/duplicate/reorder and Snapshot recovery; token-scope tests | iOS Safari/Android Chrome device matrix, network/audio-route interruption, RTC load |
| Recovery | Job lease/crash/retry/manual tests; deletion partial-failure test | Backup/restore, vendor-outage and fault-injection drills before live Pilot |

## Implementation readiness Gate

Statuses measure contract/evidence readiness only. `READY` does not authorize
code, schema, vendor use, deployment, Ready-for-review transition, or live operation.

| Gate | Status | Required evidence | Effect if missing | Next action |
| --- | --- | --- | --- | --- |
| API responsibility | READY | Resource/Command/Query ownership and authority | Operations could mix receipt and completion | Owner review logical operation catalog |
| DTO responsibility | PARTIALLY_READY | Input/output/provider/UI separation | Persistence or protected data could leak | Fix final categories with executable API review |
| Error model | PARTIALLY_READY | HTTP/category/retry/requery/privacy behavior | Unsafe retry or enumeration | Select final Problem Details/code vocabulary later |
| Data ownership | READY | Aggregate owner, relationships, privacy and transaction links | Cross-module mutation ambiguity | Owner review logical catalog |
| State transitions | PARTIALLY_READY | Candidate states, commands, preconditions and rejection | Stale/disconnect/provider events could become authority | Refine final state vocabulary without enum/schema |
| Transaction boundaries | READY | Local ACID boundary per consequential workflow | Partial commit and false completion | Verify against each Vertical Slice |
| Concurrency | READY | Expected state/version, uniqueness, conditional write, rare lock | Lost updates and duplicate active facts | Prove with PostgreSQL integration tests |
| Idempotency | PARTIALLY_READY | Operation scope, owner, conflict/result reuse | Network retry duplicates work | Decide validity and final normalization later |
| Authentication | PARTIALLY_READY | Server session/revoke/CSRF/rotation boundary | Stale or stolen sessions | Approve exact account/MFA/session-store configuration |
| Authorization | READY | Spring coarse role + Application scope + Query row scope | Role-only access or post-filter leak | Trace every operation to current scope |
| Audit | PARTIALLY_READY | Governed actions and minimum reference categories | No reliable accountability | Approve retention/tamper/access controls |
| Async Job/Outbox | PARTIALLY_READY | Claim/lease/attempt/retry/dedupe/reconciliation | Lost or duplicate follow-up | Select physical model in schema phase |
| External Adapter | PARTIALLY_READY | Port, timeout, retry, error, minimization, replacement | Vendor semantics leak into Domain | Produce provider-specific contract after B Evidence |
| Webhook | EXTERNAL_EVIDENCE_REQUIRED | Signature, event ID, ordering/replay and actual fields | Cannot safely apply provider callback | Verify executed provider documentation/account |
| SSE | PARTIALLY_READY | Minimal hint, auth, reconnect, Snapshot recovery | UI may infer completion or stay stale | Finalize envelope/retention after implementation measurement |
| Privacy/deletion | PARTIALLY_READY | Access-end/deletion/retention/backup/provider separation | False completion or unlawful retention | Legal/privacy review plus processor deletion proof |
| Backup/recovery | EXTERNAL_EVIDENCE_REQUIRED | NCP backup/PITR/failover and non-NCP restore drill | Unproved recovery and deletion propagation | Execute approved restore drill |
| Real devices | EXTERNAL_EVIDENCE_REQUIRED | iOS Safari/Android Chrome audio/network/accessibility matrix | Live voice/reconnect risk unknown | Run approved device tests |
| Vendor contracts/Evidence | EXTERNAL_EVIDENCE_REQUIRED | Quote, quota, SLA, DPA, subprocessor, location, support | No live provider or reliable promise | Close B-session procurement/evidence Gates |
| Testing strategy | PARTIALLY_READY | Risk-based suites above and acceptance mapping | Implementation may pass happy paths only | Convert Slice contracts to executable test plan after approval |
| Deployment basis | PARTIALLY_READY | Accepted NCP boundary plus health/rollback/secrets plan | No safe deployable environment | Implementation plan; provisioning remains separate |
| Source-code authorization | BOUNDED_PR_A_B_ONLY | Merged PR #36/#38/#42 and current files | No PR C/D, V7+, API/realtime/frontend or other production expansion | Owner confirms Issue #37 wording and separately decides later implementation |

## Overall judgment and open boundary

- [RECOMMENDED] The document set is ready for owner review as a proposal-only design package. Internal authority, ownership, execution, and test responsibilities can inform a later implementation plan.
- [OPEN] Beyond the exact PR B JPA/Flyway/V1–V6 baseline, endpoint/DTO/error strings, state enums, additional tables/columns/keys/mappings/migrations, SSE names, retry/lease values and PR C/D code remain unapproved.
- [OPEN] Provider behavior, contracts, pricing, quota, SLA, DPA/subprocessors, data location, device results, staffing, legal retention, backup/restore, RPO/RTO, deployment, and live Pilot require independent evidence.
- [NOT-RECOMMENDED] Redis, Kafka, RabbitMQ, search engine, Kubernetes, microservices, distributed locks/transactions, Saga, event sourcing, full CQRS, separate policy engine, and realtime gateway remain outside the default until their measured entry condition exists.
