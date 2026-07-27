---
title: "Journey: Follow-up, Safety, and Recovery"
document_type: specification
classification: proposal
status: "Proposal — Unapproved"
last_verified: 2026-07-27
related_documents: ["user-journeys.md","matching-and-progression.md","trust-safety-moderation.md","admin-and-operations.md"]
decision_authority: "Only explicit approvals in ../discovery/decisions.md"
---

> **Proposal — Unapproved.** This document defines reviewable candidate behavior. It does not authorize implementation.

# Journey: Follow-up, Safety, and Recovery

| ID / stage | Goal | Anxiety | Required information | Hidden information | Consent point | Primary action | Failure states | Recovery | Accessibility | Web | Mobile | Measurable event | Security boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UX-JRN-401 / Stage 20 — One-to-one voice | Continue a mutual conversation | Unwanted access; abrupt end | Participants, duration, controls, exit | Contact details and other choices | Independent compatible mutual voice grant | Join, mute, leave, report | One absent; revoke; reconnect; misconduct | Close room; return/exit; support | Text fallback hypothesis; visible speaking state | User-gesture audio; reconnect | Call interruption and lock handling | one_to_one_joined/left/report | New short-TTL scoped room grant; no inherited group permission |
| UX-JRN-402 / Stage 21 — Optional webcam | Understand future branch | Face/background capture; coercion | Capture limits and independent controls | Video until live consent | Separate publish and subscribe grants for both parties | No initial action | Coercion; stale consent; local recording | Decline without reason; revoke; block | Non-video parity required | Device checks would be separate | OS camera indicator and permission | webcam_not_available | Proposal — Deferred; mutual interest does not imply video consent |
| UX-JRN-403 / Stage 22 — Offline-date coordination | Understand future branch | Stalking; location exposure; obligation | Safety and responsibility boundaries | Exact location/contact until separately granted | Separate scheduling/location/contact grants | No initial action | Pressure; cancellation; venue incident | Decline; withdraw future use; support | Remote/nonvisual alternatives require study | No automatic booking | No background location | offline_coordination_not_available | Proposal — Deferred; no location/vendor/payment integration |
| UX-JRN-404 / Stage 23 — Post-session feedback | Reflect privately | Retaliation; re-identification | Purpose, audience, optionality | Individual feedback from peers | Separate research/safety uses | Submit, skip, or request deletion where applicable | Survey fatigue; sensitive disclosure | Save/skip; support for safety issue | Short forms; text alternatives | Responsive and resumable | Push link must reauthenticate | feedback_started/submitted/skipped | Safety report separated from product analytics; minimum retention |
| UX-JRN-405 / Stage 24 — Blocking, reporting, appeals, and support | Stop contact and seek review | Retaliation; disbelief; exposure | Immediate effects, evidence use, SLA proposal | Reporter identity and sanctions where lawful | Evidence submission and support-contact purposes | Block/report; respondent may appeal sanction | Duplicate/false report; insider misuse; evidence loss | Immediate containment; case review; appeal; escalation | Trauma-informed plain language; channel alternatives | Authenticated case view | Secure upload and notification privacy | block_created/report_opened/contained/appealed/closed | Separation of duties; tamper-evident audit; least privilege; no support impersonation |
| UX-JRN-406 / Stage 25 — Cancellation, no-show, technical failure, and operator cancellation | Exit or recover fairly | Blame; lost time; charge fear | Reason category, deadline, rebook/support | Other participants' reasons | Notification preferences only; no financial consent | Cancel, mark issue, accept rebook | Late cancel; no-show; vendor outage; partial cohort | Rebook, close safely, incident handling | Multi-channel notice; no color-only status | Authenticated cancellation | Push/deep-link reauthentication | cancelled/no_show/technical_failure/operator_cancel/rebooked | Distinct reason access; anti-fraud signals; no fees/refunds in initial boundary |

## Follow-up invariants

| ID | Proposal — unapproved |
| --- | --- |
| SR-JRN-401 | Mutual progression grants only the named next action; it never grants webcam, messaging, offline contact, or external identifiers |
| SR-JRN-402 | A block immediately prevents new service-mediated progression and wins over queued mutual results |
| SR-JRN-403 | Support staff cannot view private choices, reveal resources, or sensitive evidence without case-based authorization and audited purpose |
| UX-JRN-407 | Declining, leaving, no selection, or withdrawing consent must not expose a reason to another participant |

**Proposal:** Payment/refund recovery is intentionally absent because payment and deposits are excluded from the initial boundary.
