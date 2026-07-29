---
title: Identity, Admission, and Invitation Principles
document_type: security specification
classification: user decision
status: Approved principles and UX flow; implementation promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../../discovery/decisions.md","../invitations-and-attendance.md","../../adr/ADR-009-adult-eligibility.md","../ux/README.md"]
decision_authority: D-014, D-023 and D-024
---

# Identity, Admission, and Invitation Principles

## Approved boundaries

- Account authentication, NICE adult eligibility, reservation ownership and session admission are separate proofs.
- Account authentication uses verified email and a password hashed with
  Argon2id. D-024 approved the recovery UX baseline; exact request and
  authorization contracts remain pending separate promotion.
- Browser sessions use high-entropy opaque values, server-side hashed storage, rotation, Secure/HttpOnly/SameSite cookies, CSRF defense and revocation.
- NICE uses PASS with provider-supported SMS fallback. Eligibility means the participant has reached the 19th birthday on participation date.
- Persist only identity-verified/adult-eligible outcomes, verification time, provider, policy version and minimal opaque transaction reference.
- Do not persist raw DOB/name/carrier/provider response, CI, DI, identity documents, liveness, face comparison or biometric templates.
- Invitation links navigate only. Admission is account/reservation/device bound, one-time, short-lived, replay protected and rechecked by the backend.
- RTC credentials are room/participant scoped, microphone-only, short-lived, non-recording and refreshed only after current stage/permission checks.

## Account security requirements

- Password parameters are benchmarked and pinned before implementation; neutral errors and rate limits resist enumeration and credential stuffing.
- Logout, account deletion, password recovery and high-risk events revoke relevant sessions and admission credentials.
- Device registration uses an app-generated random identifier, not fingerprinting. Device replacement revokes its admission credentials.
- Administrators require phishing-resistant MFA/passkeys and least-privilege sessions before live Pilot.
- Auth, invitation, RTC and provider secrets never enter URLs, notifications, analytics, support views or general logs.

## Adult eligibility recovery

Foreign residents, MVNO users, people without PASS and false-rejection users receive accessible provider/SMS retry and support status. There is no manual document bypass. Provider outage or unverifiable eligibility blocks reservation confirmation and live admission rather than weakening the rule.

## High-level admission sequence

1. Authenticated account opens its reservation and a non-authorizing invitation hint.
2. Backend rechecks active account, adult eligibility, reservation, attendance, sanction/block, session state and device.
3. One-time invitation proof is consumed atomically and cannot be replayed or transferred.
4. Backend grants short-lived admission, real-time and RTC capabilities appropriate to current stage.
5. Reconnect obtains fresh authority and never restores expired reveal, chat or media rights.
6. Cancellation, removal, block, sanction, logout or expiry revokes future refresh and removes RTC access.

D-024 approved the page-transition and reconnect UX baseline. Exact TTL values,
cookie names, endpoint paths, DTOs and authorization contracts remain pending
Implementation Contract promotion and security review.

## Audit and gates

Audit reason-coded outcomes and credential identifiers, never secret values. Before live participants: NICE contract and fields, lawful basis/notices, callback signature/replay, foreign/MVNO coverage, deletion, recovery, administrator access and incident tests must pass. This document is not legal advice.

