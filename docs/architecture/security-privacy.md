---
title: Security and Privacy Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-29
related: [../discovery/decisions.md, ../spec/actor-authorization-contract.md, ../spec/lifecycle-contract.md, ../spec/data-contract.md, ../spec/security/README.md, application-architecture.md, data-architecture.md, ../adr/ADR-001-modular-monolith-managed-rtc.md, ../adr/ADR-009-adult-eligibility.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md and Accepted ADRs
---

# Security and Privacy Architecture

## Purpose and security posture

- [RECOMMENDED] Use server-authoritative authentication and authorization, least privilege, data minimization, purpose-specific grants, and dedicated audit/privacy-access records.
- [CONFIRMED] Every consequential request rechecks current actor, role, scope, lifetime, assignment, resource, consent, sanction, and relevant business state. UI visibility, cached claims, realtime delivery, and provider state never authorize work.
- [CONFIRMED] Authorization end, login-session revocation, privacy request, active deletion, backup expiry, and deletion completion are separate lifecycles.
- [OPEN] OWASP guidance and Korean privacy materials are engineering/research inputs, not certification or legal conclusions. Exact account policy, MFA vendor, IdP, lawful basis, retention, cross-border processing, and incident notification require approval and evidence.

## Authentication options

| Candidate | Solves | Project advantages | Costs or gaps | Decision |
| --- | --- | --- | --- | --- |
| Server session | Browser login, immediate revocation, force logout | Current DB authorization can be rechecked; account suspension, assignment end, and sanction apply without waiting for token expiry | Server-side lifecycle/store and CSRF controls | [RECOMMENDED] Participant and workforce browser baseline |
| JWT access token | Stateless API authentication | Portable to native/external clients | Revocation lists, stale authorization, theft until expiry, claim drift | [NOT-RECOMMENDED] Browser business authority |
| Access + refresh tokens | Longer client continuity | Native-client rotation model | Two-token theft/revocation/storage complexity | [REVISIT-WHEN] Approved native or external API |
| OAuth 2.0 | Delegated authorization | Standards-based third-party delegation | Does not itself define user identity or project row scope | [OPEN] No delegation requirement |
| OpenID Connect | Federated authentication | Standard identity claims/session integration | IdP contract, claim mapping, outage and workforce policy | [OPEN] Evaluate with IdP decision |
| External IdP | Managed identity/MFA/workforce controls | Independent account security operations | Vendor dependency, privacy, lifecycle synchronization, cost | [REVISIT-WHEN] Verified workforce/scale need |
| Self-managed account | Application-owned participant lifecycle | Direct control of suspension, recovery, and data minimization | Credential/recovery/security operations | [OPEN] Exact account mechanism |
| Participant/workforce hybrid | Separate assurance and access routes | Workforce can require stronger controls without exposing participant flows | Two lifecycle/policy paths and support burden | [RECOMMENDED] Same server authority, separated policies |

[RECOMMENDED] Use browser server sessions because immediate permission withdrawal, forced logout, account suspension, assignment termination, sanction changes, and resource checks are primary risks. JWT remains appropriate only for short-lived, room-scoped LiveKit connection tokens and, after separate approval, native/external API clients; no JWT claim alone grants current business permission.

## Session storage and browser controls

- [RECOMMENDED] Use a high-entropy opaque session identifier in a `Secure`, `HttpOnly`, appropriately scoped `SameSite` cookie; do not expose credentials to JavaScript or browser storage.
- [RECOMMENDED] Apply CSRF protection to state-changing browser requests, rotate the session identifier after authentication or privilege change, and record server-side issued/expiry/revoked state.
- [RECOMMENDED] A revocation timestamp or equivalent current server fact must invalidate older sessions; exact field and storage design remain [OPEN].
- [RECOMMENDED] Start with a PostgreSQL-backed session candidate while one application/database can meet load and availability needs.
- [REVISIT-WHEN] Evaluate a Redis-compatible session store only for verified multi-instance sharing, session throughput, or database contention; cache/store failure must not authenticate by default.
- [OPEN] Session duration, inactivity timeout, concurrent-device policy, recovery flow, participant/workforce MFA, and exact Spring Security configuration await implementation and policy approval.

## Authorization model comparison

| Model | Useful capability | Project limitation | Decision |
| --- | --- | --- | --- |
| RBAC | Broad participant/operator/reviewer separation | Cannot express assignment, case, session, consent, expiry alone | [RECOMMENDED] Coarse role layer |
| ABAC | Actor/resource/stage/consent/sanction/lifetime rules | Policies become hard to trace if scattered | [RECOMMENDED] Application preconditions |
| Relationship-based | Assignee, case reviewer, session member, reveal recipient | Requires current graph facts and careful query scoping | [RECOMMENDED] Resource relationship checks |
| External policy engine | Central policy across services | New runtime, policy deployment, stale data and debugging boundary | [NOT-RECOMMENDED] No independent services/policy team |
| Hybrid | RBAC plus attributes and relationships | Requires one documented decision path | [RECOMMENDED] Best match for current contracts |

| Enforcement layer | Responsible for | Must not assume |
| --- | --- | --- |
| Spring Security | Authenticated Principal, coarse role, CSRF, session lifecycle, endpoint baseline | Role alone permits a resource mutation |
| Application Service | Current assignment, resource, stage, consent, capability, sanction, expiry, and scope; transaction orchestration | Controller or token already checked current scope |
| Domain logic | Allowed transition and invariant | Caller identity without supplied authorization context |
| Repository/query | Row scope and conditional update constraints | Post-filtering unauthorized rows is safe |
| Frontend | Hide unavailable actions for usability | Hidden controls enforce authorization |

Authorization is denied unless the actor, role, current scope, lifetime, assignment, resource relationship, and transition preconditions all match. Assignment removal ends access, not the underlying case or work record. Break-glass never creates ordinary standing permission.

## Consent, choice, and capability boundaries

| Fact | Authority rule | Revocation or failure |
| --- | --- | --- |
| Collection/processing grant | Purpose, subject, scope, policy version, and lifetime are distinct | End future use; deletion follows separate workflow |
| Disclosure access | Viewer eligibility and subject grant both current | Revoke access/tokens immediately; retained bytes follow policy |
| User choice | Private input owned separately | Never expose as evidence of another user's result |
| Derived capability | Created only from compatible current choices and policy | Revoke independently when prerequisites end |
| Media participation | Current session authorization permits short-lived room token | Token/connection loss does not end official session |

## Privacy and observability boundaries

| Surface | Minimum allowed | Prohibited default |
| --- | --- | --- |
| General log | Correlation ID, opaque resource ID, error class, bounded operational context | Raw identity/DOB/CI/DI, phone, preferences, choices, report narrative, credentials, media URL/content |
| Metric | Counts, latency, status class, coarse service/provider dimension | User identifier, free text, sensitive attribute, high-cardinality personal label |
| Trace | Opaque correlation and operation name | Request/response bodies, tokens, cookies, provider payloads, report/choice content |
| Audit record | Actor, action, scoped resource, reason/policy, time, result, before/after reference as justified | Unbounded payload copy or debug stack |
| Privacy-access record | Viewer, data category, purpose, scope, result, time | Bulk content export by default |
| Realtime payload | Minimal resource/version/change hint | Private choice, report content/reporter identity, raw profile or credential |
| Provider request | Minimum approved fields, purpose, idempotency/reference | Convenience copies or unverified fields |
| Object storage | Private encrypted object, scoped metadata, short signed access | Public bucket, stable public URL, retained unnecessary EXIF |
| Operator/reviewer query | Assignment/case/role-scoped rows and fields | Bulk browsing, unrelated participant history, silent impersonation |

Break-glass access requires a named reason, narrow data/resource scope, time limit, strong workforce authentication, alerting, durable audit, and retrospective review; second-party approval and exact emergency policy remain [OPEN].

## Identity, eligibility, and media limits

- [CONFIRMED] ADR-009 selects minimized NICE adult-eligibility verification: retain the outcome, time, provider/policy, and minimal opaque reference; do not store raw DOB, CI, DI, documents, face comparison, liveness, or biometrics.
- [OPEN] Exact returned fields, foreign/MVNO coverage, fallback semantics, accessibility, deletion, contract, DPA, and outage behavior remain procurement/legal gates.
- [CONFIRMED] LiveKit recording is disabled for the bounded Pilot, but screenshots, OS recording, a second device, or local capture cannot be guaranteed preventable; participant notice and incident handling must not promise otherwise.

## Failure and operational defaults

- [RECOMMENDED] Database, current-authorization, or session-store uncertainty fails closed; never infer permission from a cache hit/miss, UI state, or old token.
- [RECOMMENDED] Provider outage cannot bypass admission, consent, eligibility, or sanction. Retry is bounded and any result reconciles against current state.
- [RECOMMENDED] Verify webhook signature, timestamp/freshness, replay, duplicate event identity, expected provider/account, and current owning state before applying.
- [RECOMMENDED] Store secrets outside source and logs, grant least privilege, rotate on schedule/incident, audit access, and test replacement without exposing values.
- [RECOMMENDED] Privileged operations record actor, scope, reason, case/policy context, and outcome; general logs do not substitute.
- [RECOMMENDED] Incident response can revoke sessions/grants, pause affected workflows, preserve only necessary evidence, and require manual reconciliation rather than silently widening access.

## Security verification and open gates

- [RECOMMENDED] Test authentication/session rotation and revocation, Spring Security coarse roles, assignment/resource row scope, every material transition, concurrent consent withdrawal, sanction/appeal separation, break-glass, webhook replay/duplicate handling, signed object access, and end-to-end deletion retry.
- [RECOMMENDED] Exercise unauthorized disclosure, provider outage, media abuse, insider bulk access, secret compromise, and restore of revoked/deleted state before live operation.
- [OPEN] Exact password/account recovery policy, MFA assurance, IdP/vendor, CSRF token mechanism, session store implementation, encryption key design, retention, legal holds, breach notices, cross-border transfer, subprocessor terms, and live-user controls require later approval.
