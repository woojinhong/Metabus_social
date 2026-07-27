---
title: Data Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Data Architecture

## Recommendation proposal

**Proposal — unapproved:** PostgreSQL is the durable source of truth; optional Redis holds TTL projections only; private object storage holds reviewed media; analytics receives minimized derived events. No NoSQL, search engine, vector database, or permanent event stream is justified initially.

## State ownership

| State owner | Proposed contents | Explicit exclusions |
| --- | --- | --- |
| PostgreSQL | Accounts, reservations, attendance, durable stages, consent, interests, progression, reveal authorization, reports, moderation, audit | Raw voice and transient presence |
| Optional Redis | Presence, timers, room projection, reconnect lease, rate limit | Sole copy of authority or consent |
| Media provider | Transport presence and quality metadata | Product stage, selections, reveal authority |
| Client | Drafts, device preference, presentation state | Authoritative eligibility or progression |
| Object storage | Encrypted participant media with scoped access | Public stable URLs and retained EXIF |
| Analytics/event sink | Purpose-limited derived events | Raw identity, choices, messages, voice |

## Data category register

Retention periods are proposals requiring legal, safety, and operational review.

| Category | Purpose | Sensitivity | Source | Encryption | Retention proposal / deletion | Audit | Access | Store? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Account | Authentication/lifecycle | High | PostgreSQL | Transit/at rest | Account life + legal minimum; erase/anonymize | Lifecycle | Identity service | Yes |
| Age/identity verification | Eligibility evidence | Very high | Provider token + PostgreSQL result | Field + transport | Short evidence validity; delete raw artifacts | Verify/access | Restricted identity role | Result only |
| Face images | Consent-controlled reveal | Very high | Object storage | Object/key | Until withdrawn/account delete; safety hold exception | Read/grant/delete | Scoped disclosure service | Optional |
| Profile photos | Profile/reveal | Very high | Object storage | Object/key | Same as grant purpose | Read/grant/delete | Scoped service | Optional |
| Non-face game media | Session game | High | Object storage | Object/key | Session + short dispute window | Read/delete | Session members by stage | Only if used |
| Dating preferences | Compatibility | Very high | PostgreSQL | Field + at rest | While active; delete/anonymize | Policy change/access | Compatibility module | Yes |
| Orientation/compatibility | Cohort relevance | Very high | PostgreSQL | Field | Minimize; delete with account | Access/result | Restricted policy module | Yes |
| Location/activity area | Broad-area eligibility | High | PostgreSQL | Field | Current value only | Change/access | Compatibility/booking | Broad only |
| Reservation | Seat ownership | Medium | PostgreSQL | At rest | Operational/legal window | Full lifecycle | Booking/support scoped | Yes |
| Attendance | Recovery/no-show | Medium-high | PostgreSQL | At rest | Defined validation window | Changes | Booking/safety | Yes |
| Room/session state | Authoritative progression | High | PostgreSQL + Redis projection | At rest/in transit | Durable checkpoints; TTL ephemeral state | Transitions | Orchestrator | Yes/minimal |
| Game responses | Facilitate conversation | High | Memory/TTL; selective PostgreSQL | Transit/at rest | Prefer session TTL; retain only consented need | Access if stored | Session scope | Usually no |
| Voice metadata | Quality/participation | High | Provider -> metrics | Transit/at rest | Short aggregated window | Export/access | Operations only | Aggregate only |
| Interest selections | Private progression | Very high | PostgreSQL | Field | Product/safety window then erase/anonymize | Submit/read | Progression service; no operator default | Yes |
| Mutual matches | Permission basis | Very high | PostgreSQL | Field | Until revoke/account delete + limited audit | Create/revoke | Parties + progression service | Yes |
| Webcam consent | Future scoped grant | Very high | PostgreSQL | Field | Deferred; live grant + short audit | Every change | Media authorization | Deferred |
| Messages | Mutual follow-up | High | PostgreSQL if approved | Field/at rest | Short stated period; participant deletion/safety hold | Access/moderation | Parties and case-scoped safety | Limited |
| Reports | Safety investigation | Very high | PostgreSQL/object evidence | Field/object | Policy/legal window; case deletion rules | Immutable actions | Safety role only | Yes |
| Moderation actions | Sanctions/appeals | Very high | PostgreSQL | Field | Sanction/appeal + legal window | Tamper-evident | Separated safety/admin | Yes |
| Payment/refund | Future financial accuracy | Very high | PG + ledger | Tokenized/at rest | Statutory period | Full ledger | Finance role | Deferred |
| Offline coordination | Future mutual meeting | Very high | PostgreSQL | Field | Until event + short safety window | Grant/change | Parties/coordination | Deferred |
| Analytics/experiments | Validation | Medium-high | Derived event store | At rest | Short purpose-based; aggregate | Schema/access | Analytics role | Minimized |

## Consistency and replay

Critical commands use idempotency keys, expected versions, unique constraints, and transactional audit/outbox records. Webhooks are signature-checked and deduplicated. Out-of-order events reconcile against authoritative version. Analytics failure never blocks a critical transition.

## Deletion and consent withdrawal

Withdrawal immediately ends future disclosure authorization and revokes derived access URLs/tokens. Storage deletion follows the stated retention process; safety/legal holds must be narrow, auditable, and disclosed. Cache, CDN, backup, vendor, and analytics deletion capabilities require verification.

## Redis adoption gate

Begin without Redis if one application instance and database load suffice. Add it only for multi-instance presence/timers, reconnect coordination, or measured contention. Loss must degrade to reconstruction, not authorization bypass.

## Approval gate

Database, cache, storage vendor, schema, retention, encryption keys, analytics, and identity evidence require explicit approval. Legal conclusions require qualified review.

## Access-boundary proposal

| Access path | Allowed purpose | Prohibited default access |
| --- | --- | --- |
| Participant | Own data, current authorized disclosures | Other participants’ private choices/reports |
| Session service | Current membership, stage, grants | Raw identity artifacts and unrelated history |
| Safety reviewer | Case-scoped evidence | Bulk profile/interest browsing |
| Support | Booking/device/session recovery | Report narrative and private selection |
| Analytics | Minimized derived events | Direct identifiers and raw sensitive content |
| Administrator | Role/configuration under audit | Silent impersonation or unrestricted export |

## Backup and export

Backups inherit data classification, encryption, access, residency, and deletion limitations. Restore tests must verify that expired grants and sanctions do not regress. Vendor exit exports preserve stable IDs and audit relationships without exporting unnecessary raw telemetry.

## Data validation gates

Create a data-flow inventory before implementation; verify every write has purpose and owner; test disclosure authorization under concurrent withdrawal; test account deletion through database, cache, object, CDN, vendor, backup schedule, and analytics; and confirm sensitive values never appear in URLs, notifications, logs, or generic events.
