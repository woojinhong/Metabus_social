---
title: Security and Privacy Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Security and Privacy Architecture

## Security posture

**Proposal — unapproved.** Use server-authoritative authorization, data minimization, consent-specific grants, least privilege, and auditable safety operations. OWASP ASVS/MASVS, WebRTC guidance, and Korean PIPA/PIPC materials are research inputs, not certifications or legal conclusions.

## Identity and eligibility

Phone possession verification supports account recovery and abuse friction but does not prove adulthood. A Korean carrier/adult eligibility attestation may be evaluated if it returns a minimized result and legal/vendor review passes. Raw identity documents, CI/DI persistence, liveness, face comparison, biometric processing, and manual identity review are deferred and require separate approval.

## Consent grant model

| Grant | Subject action | Viewer/system eligibility | Revocation |
| --- | --- | --- | --- |
| Collection | Submit a specific field/media for a stated purpose | Service purpose and retention shown | Stop future processing; deletion workflow |
| Storage/processing | Explicit purpose and policy version | Least-privileged services | Revoke where not legally held |
| Group disclosure | Choose item/audience/stage | Current session membership and stage | Immediate auth/token revoke |
| Post-interest reveal | Independent current subject grant | Viewer has compatible submitted interest | Fail closed on race |
| 1:1 voice | Mutual compatible progression | Both current and unsanctioned | Either party ends grant |
| Future webcam | Deferred separate live opt-in | Both current grants and scoped room | Immediate revoke/expiry |
| Messaging/offline | Deferred or limited separate grant | Mutual progression and policy | Block/revoke without reason exposure |

Consent is not bundled. The subject’s grant and viewer eligibility are checked atomically. Stale versions, missing evidence, or vendor uncertainty fail closed.

## Core controls

- Account-bound reservation; verified device session; one-time, short-TTL, room-scoped media grant.
- Server-authoritative stages and permission matrix; deny by default; replay/idempotency protection.
- Rate limits, duplicate-account signals, session/device limits, signed webhooks, secret rotation.
- TLS in transit; managed encryption at rest; field/object encryption for highest-risk categories.
- Private object storage, short signed access, EXIF removal, malware and QR/barcode checks.
- Deterministic handle/URL/phone filters plus image/text signals and human escalation; no LLM-only enforcement.
- Block/report, rapid moderator mute/remove, sanctions, appeals, re-registration controls.
- Privacy-filtered logs, minimized telemetry, purpose-bound retention, deletion propagation.

## Privileged access

Roles separate support, safety review, appeals, content publishing, finance if later approved, and infrastructure. Private interest selections are inaccessible by default and revealed only through a narrowly justified break-glass workflow. Support cannot silently impersonate participants. Break-glass requires reason, second-party review where feasible, time limit, tamper-evident audit, anomaly alert, and retrospective review.

Moderator actions record actor, case, policy version, evidence reference, before/after scope, and appeal path. Insider export, bulk lookup, repeated case access, and unusual reveal access generate alerts. Production access uses strong MFA, short-lived credentials, least privilege, and periodic review.

## Media limitations

Provider recording is disabled by default, but screenshots, OS recording, second devices, and local capture cannot be completely prevented. Product copy and incident policy must state this. Do not promise watermarking or capture prevention without evidence.

## Privacy lifecycle

Each category needs purpose, lawful basis/consent, minimization, access, retention, deletion, vendor/subprocessor, residency, breach handling, and data-subject request review. Sensitive dating, orientation, identity, media, selection, and report data receive stricter separation. Legal conclusions remain subject to Korean counsel/privacy review.

## Incident readiness

Classify authentication, admission, unauthorized reveal, media abuse, data exposure, vendor outage, and insider misuse incidents. Preserve necessary evidence without expanding routine retention; revoke tokens and grants; notify affected operations; document decision and recovery; test runbooks.

## Approval gate

Identity level, biometric processing, retention, moderator evidence access, monitoring, E2EE posture, cross-border processing, and sanctions policy require explicit approval.

## Security verification gates

- Threat-model review before pilot and after any webcam, payment, biometric, or offline-coordination proposal.
- Automated authorization tests for every stage transition and disclosure route.
- Secret, dependency, and configuration review without introducing unapproved tooling.
- Vendor callback signature/replay tests and token-scope inspection.
- Admin-role, break-glass, export, and audit-anomaly exercises.
- Deletion and consent-withdrawal tests across storage, cache, CDN, vendor, and analytics.
- Incident tabletop for unauthorized reveal, underage report, harassment, insider misuse, and media outage.

## Privacy notices and participant comprehension

At each stage, explain what is visible now, what may become visible, to whom, for what purpose, and how to withdraw. Verification copy must state what the check proves and does not prove. Safety notices must avoid implying that identity checks or moderation guarantee safe conduct.

## Open evidence gaps

Korean lawful-basis and sensitive-information analysis, age-verification semantics, foreign resident and MVNO support, accessibility of identity checks, cross-border media/analytics processing, retention periods, breach notices, and data-subject request operations need qualified review.
