---
title: System Context
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# System Context

## Status and scope

**Proposal — unapproved.** This context describes a reviewable MVP boundary; it does not approve implementation, vendors, or policy.

## Participant outcome

The proposed service coordinates a scheduled, private, voice-first dating session for an approximately six-person compatible cohort. It may progressively disclose participant-controlled information and permit private progression only after compatible mutual choices.

## External actors and systems

| Actor or system | Proposed responsibility | Boundary risk |
| --- | --- | --- |
| Participant | Reserve, verify eligibility, join, interact, consent, select, report | Coercion, impersonation, local recording |
| Session operator | Cohort recovery and safety intervention | Excess privilege and bias |
| Support/moderation | Review reports, sanctions, appeals | Sensitive-data and private-choice access |
| Identity provider | Return scoped phone/adult eligibility evidence | False results, biometric or CI/DI overcollection |
| Media provider | Transport room audio and optional future 1:1 media | Outage, metadata exposure, lock-in |
| Notification providers | Deliver reminders and account-bound admission prompts | Link leakage and delivery failure |
| Object storage/CDN | Hold approved participant media | Unauthorized reveal and metadata leakage |
| Analytics/monitoring | Receive minimized operational and product events | Sensitive inference and retention creep |
| Future payment provider | Not in the proposed initial boundary | Refund, chargeback, app-store complexity |

## Proposed system boundary


authenticated clients --> application backend --> PostgreSQL
                         |--> optional Redis TTL projections
                         |--> object storage
                         |--> media provider
                         |--> identity/notification/moderation adapters
                         '--> privacy-filtered telemetry

The application backend remains authoritative for reservation, admission, stage, consent, interests, reveal authorization, reports, and sanctions. The media room is transport, not product authority. Clients render authorized state and must not independently advance it.

## Initial boundary proposal

Included for evaluation: account-bound access, compatibility inputs, reservation, attendance, device check, waiting room, structured voice session, three stable game formats, free conversation, private interest, consent-controlled limited reveal, mutual 1:1 voice, feedback, block/report, and operator recovery.

Deferred: temporary subgroups, webcam, operational offline booking, payments or deposits, biometric face comparison, manual identity review, live facilitator staffing, and direct trend ingestion.

## Trust boundaries

1. Public network to authenticated application edge.
2. Application edge to server-authoritative use cases.
3. Application backend to sensitive stores and vendor adapters.
4. Application authorization to short-lived media tokens.
5. Moderator/admin access to separately audited support surfaces.
6. Subject disclosure grant to eligible viewer authorization.

## Failure posture

Admission, reveal, private messaging, and media escalation fail closed. A provider outage may pause or cancel a session; it must not relax eligibility or consent. No recording is requested by default, but the service cannot guarantee prevention of local capture.

## Evidence and approval gaps

Korean legal/privacy review, identity-provider terms, actual-device media tests, accessibility research, and vendor procurement remain open. See [security and privacy](security-privacy.md), [real-time media](realtime-media.md), and [external services](external-services.md).

## Context validation gates

Before any implementation approval, validate:

- whether a broad Seoul activity area can fill compatible cohorts without exposing detailed location;
- whether participants understand the difference between phone possession, adult evidence, and identity proof;
- whether the session remains usable with no camera and with text/pass accessibility paths;
- whether private choices and reveal authorization survive reconnect, duplicate submission, and operator recovery;
- whether the media vendor meets actual-device, Korea-latency, quota, deletion, and incident requirements;
- whether safety staffing can intervene during every scheduled session window.

## Explicit non-authority

This diagram does not define an API, production topology, database schema, authentication design, or payment flow. The proposed application/media split is a recommendation for review. Any implementation must trace to approved scope and accepted ADRs.
