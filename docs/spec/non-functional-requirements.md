---
title: Approved Non-Functional Requirements
document_type: specification
classification: user decision
status: Approved non-functional boundary
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["mvp-scope.md","web-mobile-experience.md","../architecture/scalability-reliability.md"]
decision_authority: D-008 through D-023
---

# Approved Non-Functional Requirements

## Reliability

| ID | Requirement |
| --- | --- |
| NFR-REL-001 | Session join and microphone gates meet WM-GATE-01/02 by device/network class |
| NFR-REL-002 | Initial audio, reconnect, network switch and interruption meet WM-GATE-03 through 07 |
| NFR-REL-003 | Consequential stage commands are ordered, versioned, idempotent and recoverable |
| NFR-REL-004 | Interest writes survive retry/restart without duplication, peer leakage or partial commit |
| NFR-REL-005 | Reveal authorization tests have zero unauthorized/stale successful fetches |
| NFR-REL-006 | Notifications are measured by intent/channel and never treated as guaranteed delivery |
| NFR-REL-007 | Vendor/partial-cohort failure reaches pause, safe cancellation or rebooking without widening access |
| NFR-REL-008 | LiveKit reservation fails closed above the approved projected quota threshold |
| NFR-REL-009 | No payment accuracy target exists because payment is excluded |

## Capacity and quota

| ID | Requirement |
| --- | --- |
| NFR-CAP-001 | Model six participants x 90 minutes plus pair voice, reconnect and safety margin as participant-minutes |
| NFR-CAP-002 | Pilot maximum is six sessions/month: 660 participant-min/session, 3,960 projected; warn at 3,500 and block new reservations above 4,000 against LiveKit Build 5,000 hard cap |
| NFR-CAP-003 | Model reservation/join bursts, notifications, RTC connections, database writes, objects, moderation and telemetry |
| NFR-CAP-004 | Record pricing date, currency, VAT, units, free allowance, hard cap and unpublished quote gap |
| NFR-CAP-005 | Re-model at 100/1,000/10,000 concurrent participants; do not extrapolate Pilot unit cost blindly |

The 660 calculation is (6 x 90 group + 3 pairs x 2 x 10 pair voice) x 1.10 reconnect = 660 participant-minutes. Build's 100-concurrent limit is above the six-person Pilot, but quota and account-wide use remain monitored.

## Security, privacy and accessibility

| ID | Requirement |
| --- | --- |
| NFR-SEC-001 | Least privilege, secure defaults, rate limits, secret management and dependency review |
| NFR-SEC-002 | TLS plus encryption at rest; narrower encryption for private selections and eligibility evidence |
| NFR-SEC-003 | Tamper-evident, time-synchronized, role-limited security/consent/moderation/audit records |
| NFR-SEC-004 | General telemetry excludes raw identity/DOB/CI/DI, phone, exact preferences, answers, interests, grants, tokens, voice, photos and message content |
| NFR-SEC-005 | Apply [retention SOT](data/retention-matrix.md), backup expiry, legal hold and deletion verification |
| NFR-SEC-006 | Never claim prevention of screenshots, local recording, camera capture or memory |
| NFR-ACC-001 | Critical paths pass keyboard, screen-reader, 200% zoom, non-color, reduced-motion and focus checks |
| NFR-ACC-002 | Live stages provide pass, repetition, thinking time, compatible text and immediate safe exit |
| NFR-ACC-003 | Moderated tests include hearing, speech, vision, motor, neurodivergence, anxiety and device constraints |
| NFR-ACC-004 | Web and future native clients must preserve equivalent safety/consent/recovery outcomes |

## Observability and recovery

| ID | Requirement |
| --- | --- |
| NFR-OBS-001 | Correlate scoped pseudonymous IDs across reservation, admission, session, RTC, notification and safety signals |
| NFR-OBS-002 | Separate operational, product, safety and sensitive data by purpose, access and retention |
| NFR-OBS-003 | Collect RTC join/reconnect/quality and quota metadata without voice content |
| NFR-OBS-004 | Alerts cover join below 98%, reconnect below 95%, authorization failures, quota warning/block, delivery degradation and audit gaps |
| NFR-OPS-001 | Recovery tests cover reconnect, duplicate selection, consent race, unauthorized reveal, remove/report, vendor outage and operator misuse |
| NFR-OPS-002 | Restore proves reservations, stages, interests, grants, cases and audits without Redis or RTC authority |

