---
title: API Capability Inventory
document_type: API specification
classification: proposal
status: capability boundary retained; contract promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../ux/README.md","../security/identity-admission-and-invitations.md","../data/README.md"]
decision_authority: D-020, D-023 and D-024
---

# API Capability Inventory

## Boundary

This is not OpenAPI and defines no endpoint path, DTO, final status, page
authorization or implementation contract. D-024 is satisfied; this inventory
only identifies capabilities that a separately approved Implementation Contract
phase may map.

## Capability groups

| Group | High-level commands/queries | Security and privacy boundary |
| --- | --- | --- |
| Account | register, verify email, login/logout, recover, current account, close account, device list/revoke | secure session, CSRF, enumeration resistance, audit |
| Adult eligibility | initiate, provider callback, read result, retry/recovery status | NICE state/signature/replay; no raw DOB/CI/DI persistence |
| Profile/media | edit allowed profile/preference, request upload, complete scan, delete, get safe projection | subject ownership, moderation, short-lived media access |
| Sessions | list available slots, reserve/cancel, confirm attendance, waiting eligibility | eligibility/compatibility, idempotency, no peer exposure |
| Admission | device result, exchange invitation, obtain current capability, reconnect | account-bound, one-time, short-lived, fail closed |
| Orchestration | readiness, stage projection, participant action, operator pause/remove/cancel | backend authority, optimistic version, audit |
| Games | get assigned version, submit/pass response, acknowledge prompt | stage/audience constraints; raw answer excluded from general telemetry |
| Disclosure | preview grant terms, grant/revoke, request authorized resource | subject-viewer-resource-purpose-expiry scope |
| Progression | submit initial/final interest, withdraw to none, read own outcome, obtain pair eligibility | encrypted private choices; no counts/reasons |
| Safety | block, report, attach evidence, read own case/appeal status, appeal | reporter protection, case access, audit |
| Feedback | session, device quality and safety perception feedback | voluntary, purpose-limited, pseudonymous analytics |
| Operations | schedule/cohort actions, admission control, content, moderation, sanctions, appeal | strong admin auth, least privilege, break-glass |

## Cross-cutting requirements

Future contract must define role/security scheme, CSRF, idempotency, optimistic versioning, pagination, rate limits, RFC 9457 Problem Details, Retry-After, stable error codes, privacy classification, audit requirement, retry safety, webhook signature/replay and explicit authorization. Provider tokens may reach clients only when short-lived, scoped and intended for that client.

## Contract promotion gate

All D-024 UX areas are approved. Endpoint grouping, path names,
request/response fields, error presentation, async progress, page-specific
authorization and implementation acceptance contracts remain blocked pending
the separate Implementation Contract phase and security review. No
`openapi.yaml` is authorized.

