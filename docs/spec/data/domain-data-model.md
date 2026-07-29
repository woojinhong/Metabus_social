---
title: Logical Domain Data Model Contract
document_type: data model
classification: proposal
status: conceptual model retained; contract promotion pending
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["README.md","retention-matrix.md","../ux/README.md","../data-contract.md","../../architecture/data-architecture.md","../../architecture/domain-boundaries.md"]
decision_authority: D-011, D-018, D-022 and D-024; Issue #25 scopes this proposal only
---

# Logical Domain Data Model Contract

## Authority and modeling level

- [CONFIRMED] PostgreSQL is the durable business ledger. Frontend state, cache, messages, LiveKit observations, object bytes, and provider responses do not establish a business outcome.
- [RECOMMENDED] This document defines logical responsibilities, identifiers, ownership, relationships, lifecycle evidence, and concurrency defenses. It defines no final table, column, SQL type, index name, Entity, enum, DDL, DBML, or migration.
- [RECOMMENDED] Object storage owns encrypted binary bytes; PostgreSQL owns the resource metadata, purpose, subject, access policy, lifecycle, provider reference, and deletion evidence.
- [RECOMMENDED] Provider output is stored only as a minimized receipt/result candidate and becomes internal authority only after a current-state reconciliation transaction.

## Current state, history, audit, and logs

| Record class | Purpose | Rule |
| --- | --- | --- |
| Current state | Decide what is allowed now | One authoritative current projection per owned lifecycle; expected-state/version checks guard change |
| Change history | Explain domain transitions and restore lineage | Purpose-limited transition facts; not every debug detail |
| Audit record | Prove who performed or accessed a governed action, why, scope, and outcome | Written with the governed transaction where required; separately protected |
| Operations log | Diagnose runtime behavior | Redacted and expendable; never substitutes for state, history, audit, or deletion evidence |

[NOT-RECOMMENDED] Event sourcing is not the initial model: current authorization and workflow decisions need simple current-state reads and local ACID, while full event replay, projection repair, and deletion handling would add unproved complexity. Use relational current state plus required histories and audit records.

## Logical responsibility catalog

Identifiers below are opaque logical identities. “History”, “delete”, “retain”, “PII”, and “audit” describe responsibility, not physical fields or periods; legal periods remain [OPEN].

| Responsibility | Identity; owner; main relation | Current state / history | Privacy, deletion, audit | Concurrency, uniqueness, same-transaction need |
| --- | --- | --- | --- | --- |
| Account | Account ID; Account; eligibility/profile/sessions | access status; status history | PII; delete/anonymize subject to holds; audit status | version; unique account credential candidate; suspension + session revocation |
| Authentication Session | Session ID; Authentication; Account | issued/active/revoked/expired candidate; revocation history | secret reference; delete after security purpose; login/revoke audit | token/session uniqueness; revoke conditional on active |
| Current Authorization | Grant ID; Authorization; Account/resource | role, scope, lifetime, active status | restricted; delete after purpose/retention; grant/revoke audit | version; single-active grant candidate; grant + history |
| Authorization History | History ID; Authorization; Current Authorization | immutable transition evidence | restricted; retention [OPEN]; audit-linked | append once with grant/revoke transaction |
| Eligibility | Eligibility ID; Eligibility; Account/provider result | pending/eligible/ineligible/expired candidate | restricted identity outcome; no raw DOB/CI/DI; audit | attempt uniqueness candidate; reconcile current attempt |
| Reservation | Reservation ID; Reservation; Account/slot | requested/confirmed/cancelled/expired candidate; history | confidential; retention [OPEN]; audit changes | version, active reservation uniqueness; capacity condition |
| Official Session | Official Session ID; Session; reservations/participants | planned/ready/active/paused/ended/cancelled candidate; history | confidential; retain policy evidence; start/end audit | version and conditional transition; start/end + audit |
| Connection Observation | Observation ID; Realtime; Official Session/account | connected/disconnected/quality observation | ephemeral/minimized; short deletion; no completion audit | dedupe provider observation; never lock official state |
| Consent | Consent ID; Consent; subject/purpose/policy | granted/declined/withdrawn/expired candidate; history | highly restricted; separate retention; audit decision | exact-scope uniqueness; withdraw + access revoke |
| Disclosure Access | Access ID; Consent; consent/viewer/resource | allowed/revoked/expired candidate; access history | highly restricted; access audit; delete separately | exact-scope conditional grant; consent + access evidence |
| User Choice | Choice ID; Choice; subject/window/target | draft local only; confirmed/withdrawn/closed candidate | highly restricted; no peer exposure; audit minimum | one confirmed choice per scope; close/version condition |
| Derived Capability | Capability ID; Choice; compatible choices/policy | available/revoked/expired/consumed candidate | hides source choices; retain minimum issuance evidence | unique active capability; choice close + derivation |
| Report | Report ID; Report; reporter/context | received/withdrawn/contained candidate; history | highly restricted; protect reporter; audit receipt/access | idempotency; report + optional Case link |
| Case | Case ID; Case; reports/evidence | open/triaged/in_review/resolved/closed candidate; history | highly restricted; purpose retention; audit | version; report link uniqueness candidate; create/link atomic |
| Sanction | Sanction ID; Sanction; Case/subject | proposed/active/reversed/expired candidate; decision history | restricted; notice separation; audit/concurrence | version; single-active rule candidate; decision + auth effect |
| Appeal | Appeal ID; Appeal; Sanction/appellant | submitted/in_review/upheld/allowed/closed candidate; history | restricted; independence evidence; audit | one-active appeal candidate; outcome + correction references |
| Assignment | Assignment ID; Assignment; work resource/actor | active/released/reassigned/expired candidate; history | workforce/confidential; audit all changes | version; single-active assignment candidate; change + history |
| Work Record | Work Record ID; Operations; assignment/action | performed/corrected/voided candidate; append/correction history | restricted; retain by work purpose; audit link | never deleted by assignment release; append idempotently |
| Privacy Request | Request ID; Privacy; Account/subject | received/verified/processing/completed/rejected candidate; history | highly restricted; subject-visible minimum; audit | active-request uniqueness; receipt + Job registration |
| Deletion Job | Job ID; Privacy; Privacy Request/targets | ready/running/retry/dead/manual/completed candidate | deletion evidence minimized; retention [OPEN]; audit retry | lease/version; claim condition; completion reconciles request |
| Audit Record | Audit ID; Audit; actor/action/target | append-only outcome/reference | highly restricted; tamper/access/retention [OPEN] | append with governed action; unique source-action candidate |
| Idempotency Record | Key identity; owning operation/actor | pending/completed/failed-reusable candidate | request hash/result reference only; TTL [OPEN] | unique owner + key; same key/different intent conflicts |
| Vendor Request Intent | Intent ID; Provider integration; owning domain | pending/sent/unknown/retry/manual/reconciled candidate | minimum outbound data map; audit material action | unique intent/idempotency; intent + Outbox atomic |
| Vendor Result | Result ID; Provider integration; Intent | received/accepted/rejected/mismatch candidate | minimize provider payload; delete by purpose | provider reference uniqueness; current-state reconciliation |
| Vendor Webhook Receipt | Receipt ID; Provider integration; provider event | received/duplicate/rejected/queued/reconciled candidate | hash/minimum metadata; raw payload exceptional [OPEN] | provider account + event uniqueness; receipt quick commit |
| Async Job | Job ID; Async; owning purpose/resource | ready/claimed/running/retry/dead/manual/succeeded/cancelled candidate | payload reference, not protected copy; audit manual action | lease/version/next-run; claim conditional update |
| Outbox Event | Outbox ID; Async; source transaction/consumer purpose | pending/claimed/delivered/retry/dead candidate | minimum payload; retention [OPEN] | written with source commit; consumer idempotency |
| File Metadata | File ID; owning domain; object key/subject | pending/available/held/deleting/deleted/failed candidate | PII/sensitive classification; signed access; audit | version; object reference uniqueness; metadata + deletion job |

## Cross-aggregate ownership rules

- [RECOMMENDED] Modules relate through opaque IDs or explicit read/Application Ports; JPA object graphs do not cross module ownership by default.
- [RECOMMENDED] Report, Case, Sanction, Appeal, Assignment, and Work Record retain distinct identities and histories even when one transaction links them.
- [RECOMMENDED] User Choice is never replaced by Derived Capability; authorization end, authentication-session revoke, Privacy Request, active deletion, backup expiry, and deletion evidence remain distinct.
- [RECOMMENDED] Connection Observation may trigger reconciliation but never mutates Official Session without the Session Application Service validating a Command.

## Lifecycle transition candidates

State labels are documentation candidates, not final enums. Every Command also requires current authentication/authorization, scope, expected state/version, and applicable idempotency.

| Lifecycle | Current state | Command / preconditions | Next state | Same-transaction record | Reject when |
| --- | --- | --- | --- | --- | --- |
| Account | active | suspend; authorized policy and current account | suspended | status history, session/grant revocation intent, audit | already closed, stale version, missing authority |
| Account | active/suspended | close access; subject verified | access_closed | history, session revoke, Privacy Request candidate, audit | request cannot prove deletion completion |
| Authorization | inactive | grant; valid actor/resource/scope/lifetime | active | grant history and audit | overlapping prohibited grant or invalid source |
| Authorization | active | revoke/expire; current grant | revoked/expired | history, audit, affected capability invalidation | stale grant; never infer deletion |
| Reservation | absent/requested | reserve/confirm; eligible capacity available | requested/confirmed | idempotency, capacity/ownership evidence, audit | duplicate active reservation or capacity condition fails |
| Reservation | requested/confirmed | cancel; owner/operator scope current | cancelled | history and audit | already consumed/ended or stale version |
| Official Session | planned/ready | officially start; admission, consent, sanction, reservation valid | active | participant/capability changes and audit | presence/LiveKit join alone, stale or invalid prerequisite |
| Official Session | active/paused | officially end; authorized end reason | ended | end history, capability revoke, audit, optional Job/Outbox | disconnect alone or stale version |
| Report | absent | submit; reporter/context valid | received | idempotency, receipt, audit, optional Case link | same key/different intent or invalid scope |
| Case | open | triage/assign/review; current Case and assignment authority | triaged/in_review | history, Assignment/Work Record as applicable, audit | stale Case/assignment or unrelated evidence |
| Assignment | absent/active | assign/change/release; authorized owner and assignee eligible | active/reassigned/released | old/new assignment history and audit | single-active constraint or stale assignment |
| Sanction | proposed/absent | decide; current Case, human authority, concurrence if required | active/rejected candidate | decision history, authorization effect, audit, notice intent | conflicted reviewer, stale Case, missing concurrence |
| Appeal | absent/submitted | submit/review; appeal right or independent assignment current | submitted/in_review/upheld/allowed | appeal history, audit; correction reference if allowed | duplicate active appeal, conflict, stale sanction |
| Privacy Request | absent | request deletion; subject reauthenticated | received | idempotency, audit, Deletion Job | access closure treated as completion or conflicting intent |
| Privacy Request | processing | reconcile all required deletion steps | completed/exception candidate | step evidence, audit, retained-exception reference | provider acknowledgement alone, failed/unknown target |
| Vendor Intent | pending/sent/unknown | reconcile result; deduplicated result and current owner state | reconciled/retry/manual | Vendor Result, domain transition if allowed, audit | provider success alone, stale/closed owner, mismatch |
| Async Job | ready/retry | claim; due, lease free/expired | claimed/running | lease, attempt, worker reference | live lease or state/version mismatch |
| Async Job | running | succeed/retry/dead/manual; owned lease and result | succeeded/retry/dead/manual | result/next-run/error category and audit when manual | lost lease, duplicate completion, current purpose cancelled |

## Deletion and retention boundary

- [CONFIRMED] Permission end and session revocation stop future access; neither proves erasure.
- [RECOMMENDED] A Privacy Request coordinates active deletion, provider/object follow-up, cache invalidation where present, and evidence. Failure remains retryable or manual rather than falsely complete.
- [RECOMMENDED] Legal/business retention, pseudonymization, anonymization, hard deletion, object deletion, replica propagation, backup expiry, audit retention, and scoped legal hold use separate statuses/evidence.
- [OPEN] Exact retention periods, lawful bases, legal holds, backup expiry, tamper evidence, provider deletion proof, and foreign-transfer duties require qualified legal, security, and B-session evidence.

## Promotion boundary

This logical contract remains `implementation_ready: false`. Final cardinality, table/column/type/key/index/constraint names, physical history strategy, enum values, partitioning, encryption layout, ORM mapping, query library, DDL, migration, and executable deletion process require later review and approval.
