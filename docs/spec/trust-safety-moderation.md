---
title: Trust, Safety, and Moderation Requirements
document_type: specification
classification: user decision
status: Approved principles and UX interaction baseline; implementation promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["security/identity-admission-and-invitations.md","../operations/moderation-sanctions-and-appeals.md","ux/safety-and-reporting-wireflow.md"]
decision_authority: D-006, D-019, D-023 and D-024
---

# Trust, Safety, and Moderation Requirements

| ID | Approved requirement |
| --- | --- |
| SR-TSM-001 | Only authenticated, adult-eligible, reserved and non-sanctioned accounts may enter |
| SR-TSM-002 | Invitation, admission, real-time and RTC authority is scoped, short-lived and replay protected |
| SR-TSM-003 | Backend owns stages, permissions, consent, interests and reveal decisions |
| SR-TSM-004 | Detect/hold phone, email, URLs, social handles, Kakao open chat, QR, account numbers and solicitation before display where possible |
| SR-TSM-005 | Deterministic rules and rate limits precede assisted classifiers; LLMs cannot be sole irreversible authority |
| SR-TSM-006 | Media loses EXIF and passes MIME/signature, malware, QR/contact and policy review |
| SR-TSM-007 | Blocking revokes reveal/progression and protects the blocker; reports protect the reporter |
| SR-TSM-008 | Operators can mute, remove, pause and cancel with reason-coded audit and least privilege |
| SR-TSM-009 | Harassment, sexual misconduct, hate, threats, stalking, doxxing, impersonation and retaliation follow the severity matrix |
| SR-TSM-010 | Sanctions are proportional, time-bounded where possible and independently appealable |
| SR-TSM-011 | Evidence and break-glass access are case-scoped, audited and reviewed |
| SR-TSM-012 | Product states that screenshots and local audio/screen recording cannot be completely prevented |
| SR-TSM-013 | Sensitive data is encrypted and excluded from clients, general logs and analytics |
| SR-TSM-014 | Retention, deletion, backup expiry, legal hold, access review and incident procedures pass before live Pilot |
| UX-TSM-001 | Reporting must not require confrontation, long narrative or a precise legal label |
| UX-TSM-002 | Warnings and sanctions must be plain, accessible and reporter-protective |
| UX-TSM-003 | Voice, accent, disability, neurotype, confidence and social fluency never become hidden safety/desirability scores |
| UX-TSM-004 | Blocking, reporting, evidence, support and appeal never require payment |

Waiting room has no participant chat. Intro/games use voice turns, structured responses and reactions. Free conversation is group voice only in MVP. Interest/reveal has no chat. Mutual pair is voice only. Webcam, private text and external contact exchange are not approved.

D-024 approved the screen-control, report-entry, state and moderator-behavior
baseline. Exact authorization and implementation contracts remain pending
Implementation Contract promotion. Legal duties and notices require qualified
Korean review.

