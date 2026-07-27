---
title: Security Threat and Abuse Model
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Security Threat and Abuse Model

**Proposal — unapproved.** Controls reduce risk; they do not prove identity, safety, or recording prevention.

## Threat and control register

| Threat or misuse | Proposed prevention/detection | Response / residual risk |
| --- | --- | --- |
| Shared/leaked room link | URL is navigation only; account/reservation check; one-time short token | Revoke session/device; links can still leak context |
| Stolen session token | Short TTL, room/participant scope, secure storage, refresh authorization | Revoke device/session; residual endpoint compromise |
| Account sharing/impersonation | Phone/account signals, device limits, behavior checks | Step-up/restrict; phone does not prove person |
| Underage access | Adult eligibility evidence proposal; clear policy/reporting | Remove/report; false results remain possible |
| Outdated/misleading photos | Submission timestamp, consented checks, reports | Review/remove; no biometric assurance initially |
| Duplicate accounts/bots | Rate limits, phone/device/reputation signals, challenge | Sanction/re-registration control; false positives |
| Screen/audio recording, screenshots | Clear notice; disable provider recording; optional watermark study | Cannot fully prevent local capture |
| Harassment/sexual misconduct/hate | Rules, stage controls, mute/remove, report, human escalation | Sanctions/appeal; live harm cannot be eliminated |
| Stalking/retaliation after rejection | Private choices/counts/reasons; block; limited disclosure | Safety review; off-platform risk persists |
| Instagram/Kakao/follower solicitation | Handle/phrase/URL filters; rate/reputation; review | Remove/restrict; obfuscation possible |
| Advertising/commercial offers | Deterministic rules, repeated-content signals | Remove/sanction; contextual false positives |
| Phishing/romance scams | URL/contact/payment restriction, education, reputation | Case review and account restriction |
| QR/phone/email/account numbers | QR/barcode/OCR and text patterns; image review | Block/quarantine; encoding evasion remains |
| Spam/fake attendance/no-show | Reservation/device limits, reconfirmation, attendance history | Replacement/cancel policy; no payment initially |
| Payment/refund abuse | Deferred from MVP | Future PG risk, ledger, dispute controls required |
| Report abuse | Rate/context signals, evidence and appeal | Do not punish solely on count |
| Moderator/insider abuse | Separation, break-glass, anomaly alerts, tamper-evident audit | Independent review and sanctions |
| Media metadata/EXIF leak | Strip metadata, private objects, minimized logs | Vendor/client metadata still needs review |
| Sensitive-data exposure | Encryption, isolation, least privilege, DLP review | Incident response/deletion; residual insider risk |
| Session-stage bypass | Server state machine, expected version, scoped grants | Deny, alert, reconcile |
| Unauthorized profile reveal | Atomic subject grant + viewer eligibility; short signed URL | Revoke, audit, incident review |

## Required control families

| Family | Proposed controls |
| --- | --- |
| Identity | Phone verification, minimized adult evidence, duplicate signals; liveness/face matching deferred |
| Admission | Account-bound seat, one-time join exchange, short TTL, room scope, device-session limit |
| Session | Server authority, stage permissions, idempotency, rate limits, moderator mute/remove |
| Content | Text patterns, URL/handle detection, image moderation, EXIF strip, QR/OCR, human review |
| Safety | Block, report, rapid escalation, case evidence, sanctions, appeal, re-registration controls |
| Platform | Encryption, secrets management, signed webhooks, least privilege, admin MFA, patching |
| Audit | Security/session/grant/operator events without voice content; tamper evidence and access alerts |
| Privacy | Purpose limits, retention/deletion, vendor deletion, access review, incident response |

## Abuse-state invariants

- A blocked or removed participant cannot regain a room grant through refresh.
- Public popularity scores, selection counts, and rejection reasons are never exposed.
- Chat/contact sharing remains disabled until approved mutual stage.
- An LLM may assist triage but is never the sole enforcement or appeal authority.
- Safety features are not conditioned on payment.

## Verification scenarios

Test token replay, late join after removal, stale stage command, duplicate interest submission, consent withdrawal during reveal, unauthorized signed-URL reuse, reconnect after sanction, obfuscated contact data, malicious QR/EXIF, abusive reporting, break-glass access, and provider webhook replay.

## Evidence gaps

False acceptance/rejection for identity, Korean vendor terms, accessibility of step-up checks, moderation staffing, lawful retention, cross-border processing, and provider incident controls remain open.

## Trust-boundary test matrix

| Boundary | Hostile test | Expected result |
| --- | --- | --- |
| Invitation to admission | Reuse forwarded navigation link | Authentication and reservation still required |
| Backend to media | Modify room/participant/grant claims | Signature/scope rejection and alert |
| Stage transition | Replay or submit stale command | Idempotent prior result or version conflict |
| Disclosure | Withdraw while viewer requests media | Atomic check fails closed; access revoked |
| Moderator | Attempt bulk selection lookup | Denied and audited |
| Vendor webhook | Replay or alter callback | Deduplicated or signature rejected |
| Object access | Reuse expired URL outside audience | Denied; no stable public path |

## Residual-risk communication

Participants should be told that other people may misrepresent themselves, capture locally, behave abusively, or contact them off-platform after voluntary exchange. Product copy should describe available controls and response paths without turning controls into a safety guarantee.

## Review triggers

Re-run the threat model for new relationship orientations/cohort rules, webcam, private messaging, payments/deposits, offline coordination, biometric processing, recordings, live facilitators, new moderation evidence, or material vendor/region changes.
