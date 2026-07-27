---
title: Safety and Data Traceability
document_type: specification traceability
classification: user decision and open question
status: Approved principles; UX and legal gates remain
last_verified: 2026-07-27
related_documents:
  - traceability.md
  - security/identity-admission-and-invitations.md
  - data/retention-matrix.md
  - ../operations/moderation-sanctions-and-appeals.md
decision_authority: D-006 and D-014 through D-019 and D-023 through D-024
---

# Safety and Data Traceability

## Approved control boundary

| Risk | Approved principle | Remaining gate |
| --- | --- | --- |
| shared link/token | authenticated account, eligible reservation, one-time exchange, short-lived scoped credential, replay protection | exact journey/token contract after UX |
| underage access | NICE adult identity; reached 19th birthday; fail closed | contract, privacy/legal, foreign/MVNO recovery UX |
| unauthorized reveal | subject consent plus eligible viewer, resource scope and expiry; revoke future access | screen behavior and exact schema |
| harassment/sexual misconduct | report, human review, removal, sanctions, appeal and audit | entry points/moderator workflow UX |
| contact promotion | deterministic hold and human review for handles, links, phone, email, QR and solicitation | evasion testing and explanation UX |
| local recording | no product recording and honest warning; local capture cannot be prevented | participant comprehension |
| moderator abuse | least privilege, role separation, audit, break-glass reason and conflict handling | console and access implementation |

## Data minimization

- Persist only the approved adult-eligibility result, time, provider, policy version and minimal opaque transaction reference.
- Do not retain raw NICE responses, DOB, name, carrier result, CI, DI, identity documents, liveness, face templates or voice content.
- Store participant media privately; remove EXIF; validate MIME/signature; scan malware, QR and contact/promotion signals before eligibility.
- Private interest values and rejection counts are restricted and never enter general telemetry.
- Product retention ceilings are authoritative in [retention matrix](data/retention-matrix.md); provider/legal exceptions remain separately reviewed.

## Human enforcement

Deterministic controls and classifiers may hold or triage. Human reviewers decide material sanctions; permanent bans require senior review; a different reviewer handles appeals. LLMs cannot be the sole irreversible authority. The approved operational principles are in [moderation operations](../operations/moderation-sanctions-and-appeals.md).

## UX and legal gates

D-024 blocks exact report/block entry points, evidence consent, rejection messaging, moderator screens, admission recovery and accessibility behavior. Qualified Korean privacy/legal review is still required for identity contracts, sensitive compatibility data, cross-border processing, provider retention and production notices. These gates do not reopen the approved no-biometric/no-CI-DI/no-raw-document boundary.
