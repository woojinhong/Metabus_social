---
title: API Implementation Design Contract
document_type: API specification
classification: proposal
status: capability boundary retained; contract promotion pending
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["../ux/README.md","../security/identity-admission-and-invitations.md","../data/README.md","../api-contract.md","realtime-capabilities.md","../../architecture/application-architecture.md"]
decision_authority: D-020, D-023 and D-024; Issue #25 scopes this proposal only
---

# API Implementation Design Contract

## Purpose and authority

- [CONFIRMED] REST carries business Commands and authorized Snapshot Queries; only a valid PostgreSQL commit establishes a changed business fact.
- [CONFIRMED] Browser state, HTTP receipt, SSE delivery, LiveKit state, and provider success are not completion evidence.
- [RECOMMENDED] This document fixes logical API responsibilities for implementation planning, not final URLs, methods, DTO fields, OpenAPI, persistence identifiers, or source code.
- [RECOMMENDED] Every Command rechecks the current Principal, role, assignment, resource scope, sanction, lifecycle, and expected version in the server transaction.
- [OPEN] Exact routes, field names, pagination shape, rate limits, message copy, and stable error-code strings require the later executable-contract review.

## Operation families

| Family | Logical responsibility | Authority and response rule |
| --- | --- | --- |
| Business Command | Request a named intent such as reserve, officially start/end, report, assign, sanction, appeal, or request deletion | Reauthorize and validate current state; return committed result or explicit accepted-processing status |
| Snapshot Query | Read the current permitted account, reservation, session, capability, safety, privacy, or job projection | Filter by current resource scope; never grant capability by reading |
| Operations Search Query | Search assigned schedules, cases, appeals, jobs, or protected work queues | Apply row and field scope in the query; post-filtering is insufficient |
| History/Audit Query | Read purpose-limited transition, work, access, or audit evidence | Separate privileges and retention; never expose general logs as audit |
| Provider Callback/Webhook | Receive an external observation or result | Authenticate provider, persist minimum receipt, deduplicate, and reconcile asynchronously |
| SSE Connection | Deliver a post-commit change hint | Reauthenticate connection; client reloads the authorized REST snapshot |

## Candidate business operations

| Resource responsibility | Command candidates | Query candidates |
| --- | --- | --- |
| Account/authentication | login, logout, revoke session, close access | current account/session and active authorization |
| Eligibility/admission | request verification, reconcile result, admit or deny | minimized eligibility and admission status |
| Reservation | reserve, cancel, rebook | eligible slots and own reservation snapshot |
| Official session | officially start, advance/pause, officially end | current stage, capabilities, and official status |
| Consent/disclosure | grant, decline, withdraw, record protected access | own grants and exact authorized resource projection |
| Choice/capability | submit/withdraw choice, derive/revoke capability | own confirmed choice and own derived capability |
| Report/case | submit report, create/link case, triage | own coarse report status or assigned case projection |
| Assignment/work | assign, change, release, record work | assigned queue, current assignee, work history |
| Sanction/appeal | decide/reverse sanction, submit/review appeal | protected sanction or appeal status |
| Privacy/deletion | request deletion, retry deletion step | own request and authorized processing status |
| Provider/async | register intent, retry or request manual reconciliation | provider result, Job/Outbox status for authorized operators |

[RECOMMENDED] Commands name intent instead of exposing generic CRUD. Report, Case, Sanction, Appeal, Assignment, and Work Record remain separate responsibilities; account-access end, session revocation, and deletion completion also remain separate.

## DTO responsibility boundary

| DTO category | Contains | Must not contain or decide |
| --- | --- | --- |
| Command input | User intent, target reference, expected version, idempotency reference, necessary reason/evidence reference | Client-asserted role, assignment, final authority, provider DTO, persistence object |
| Query input | Filters, cursor/sort candidate, target scope | Scope expansion or unbounded protected search |
| Command result | Accepted/committed outcome category, resource reference, current version, processing reference where asynchronous | JPA Entity, hidden peer state, full audit/provider payload |
| Snapshot output | Current authorized projection and version | Private choices, reporter identity, unrelated case data, internal persistence shape |
| Error output | Error category/code candidate, safe message, retry/requery hints, correlation reference | Stack trace, SQL/provider details, credentials, personal or protected content |
| Provider DTO | Adapter-only provider request/response fields | API contract or domain-model ownership |

[RECOMMENDED] Input and output DTOs are separate, API DTOs never expose JPA Entities, participant and workforce projections differ by current scope, and sensitive fields use minimum disclosure. Client-supplied authorization facts are ignored and reloaded from authority.

## Idempotency contract

Validity is operation-specific and [OPEN]; it must cover the maximum client retry/reconciliation window without becoming indefinite. Same key plus different normalized intent is a conflict. Database uniqueness and expected-state checks remain final defenses.

| Command | Key | Key owner and duplicate scope | Repeat result / conflict and DB defense |
| --- | --- | --- | --- |
| Reservation | Required | Participant client; actor + reservation intent | Reuse result; conflict on changed slot; active-reservation uniqueness |
| Official session start | Required | Orchestrator/operator client; session + start intent | Reuse committed start; expected-state/version condition |
| Official session end | Required | Participant/operator client; session + end intent | Reuse committed end; end-state condition |
| Report | Required | Reporter client; reporter + incident intent | Reuse receipt; distinct incident needs a new key; report uniqueness candidate |
| Assignment change | Required | Workforce client; resource + assignment intent | Reuse result; conflict on different assignee; single-active-assignment constraint |
| Sanction decision | Required | Reviewer client; case + decision intent | Reuse decision; changed decision conflicts; authority/version/concurrence constraints |
| Appeal submission | Required | Appellant client; sanction + appeal intent | Reuse receipt; one active appeal candidate |
| Privacy deletion request | Required | Subject client; account + request intent | Reuse workflow reference; active-request uniqueness |
| Provider call | Required | Server-owned intent ID; provider + purpose | Reuse recorded attempt/result; provider key plus internal unique intent |
| Webhook | Provider event ID required; payload hash fallback candidate | Provider Adapter; provider account + event | Duplicate receipt acknowledged; hash mismatch conflicts; receipt uniqueness |
| Async retry | Required operator action ID | Server/operator; Job + requested retry | Reuse retry outcome; lease/state/version prevents duplicate claim |

## Common error model

Final code strings are [OPEN]. HTTP status expresses transport semantics; the internal category controls safe UI behavior and operations diagnostics. Every response may carry an opaque correlation reference, never personal data.

| Category | HTTP candidate | Client treatment | Retry / snapshot |
| --- | ---: | --- | --- |
| Authentication required | 401 | Reauthenticate without account enumeration | After authentication |
| Permission denied | 403 | Neutral denial; hide protected cause | No blind retry |
| Resource scope mismatch | 403 | Refresh current assignment/resource context | Snapshot required if scope may have changed |
| Privacy restriction | 403 | Show minimum lawful denial without protected detail | No retry unless purpose/authority changes |
| Resource not found | 404 | Neutral absence | No, unless a prior uncertain creation exists |
| Validation failure | 400 or 422 | Correct identified safe fields | After correction |
| Invalid lifecycle transition | 409 | Show state changed/unavailable | Snapshot required |
| Version conflict | 409 | Discard stale projection | Snapshot then explicit resubmit |
| Duplicate request | 409 or prior result | Show/reuse recorded outcome | Query recorded result |
| Idempotency-key reuse conflict | 409 | Generate a new key only for a genuinely new intent | Snapshot required |
| Provider temporary failure | 503 | Show pending/unavailable; no false success | Bounded retry or status query |
| Rate limit | 429 | Back off without changing intent | `Retry-After` candidate |
| Provider-result mismatch | 409 or 202 | Mark reconciliation/manual review | Snapshot/status required |
| Async processing | 202 | Show receipt and processing status | Poll authorized status |
| Manual action required | 409 or 202 | Route to protected operations workflow | No automatic loop |
| Internal failure | 500 | Safe generic message | Requery before retrying a Command |

[RECOMMENDED] Operational logs use the correlation reference, category, operation, and opaque resource identifiers; they do not copy the user message or protected payload. Retryability and snapshot-required flags are explicit response responsibilities, not inferred from message text.

## Authentication and authorization execution

```text
HTTP request -> server-session authentication -> coarse Spring Security role
 -> Application Service -> current authorization + assignment/resource scope
 -> lifecycle/sanction/consent checks -> Command or scoped Query
 -> audit + optional Job/Outbox -> PostgreSQL commit -> response
```

- [RECOMMENDED] Spring Security owns authentication, CSRF, session lifecycle, and coarse role checks. Application Services own current relationship, purpose, lifecycle, and scope checks; Query Services enforce row/field scope.
- [RECOMMENDED] A suspended account, revoked session, expired assignment, or ended capability fails at the next request even if an old screen still exposes an action.
- [OPEN] Exact session store, CSRF token mechanism, account/MFA policy, IdP, and break-glass second approval remain separate security decisions.

## Promotion boundary

This proposal is still `implementation_ready: false`. It defines logical operations, DTO duties, error behavior, and idempotency responsibilities but no final endpoint, HTTP method, field schema, error string, OpenAPI, Entity, table, migration, controller, or application code. B-session vendor fields, contracts, SLA, DPA, callback behavior, and device evidence remain [OPEN].
