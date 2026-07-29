---
title: Pilot Real-Device and Operations Evidence Gates
document_type: technology and operations research
classification: research finding
status: Execution plan; no test or rehearsal result
last_verified: 2026-07-29
related_documents:
  - pilot-external-evidence-gate-audit.md
  - ../../spec/web-mobile-experience.md
  - ../../operations/session-operations.md
  - ../../operations/moderation-sanctions-and-appeals.md
decision_authority: none; this plan does not approve live operations
---

# Pilot Real-Device and Operations Evidence Gates

## Boundary and current status

This plan turns approved UX and operations boundaries into evidence required
before live participants. No physical-device test, staffing assignment,
training, incident tabletop, vendor account, production system or Pilot result
was created. Real-device status is `real-device test required`; operations
status is `operations rehearsal required`; live Pilot status is `blocked`.

Official browser references checked on 2026-07-29 establish only API
constraints: WebKit requires HTTPS and user permission for media capture
([WebRTC](https://webkit.org/blog/7763/a-closer-look-into-webrtc/)); mobile pages
may freeze/discard and background events are not reliable
([Chrome lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api));
`getUserMedia` requires a secure context and permission
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)).
They do not prove behavior on the target Korean devices.

## Minimum device and route matrix

| Matrix lane | Required configuration | Purpose | Exit evidence |
| --- | --- | --- | --- |
| Current iPhone | Current supported iOS + Safari on a recent iPhone | Primary iOS path | Full scenario pack; OS/browser/build recorded |
| Older iPhone | Oldest iPhone/iOS explicitly supported for Pilot + Safari | Performance and lifecycle floor | Full pack or documented unsupported decision |
| Current Android | Current supported Android + Chrome on a representative device | Primary Android path | Full scenario pack; OS/Chrome/build recorded |
| Samsung Galaxy | Recent Samsung Galaxy + current Chrome | Korean-market OEM/audio behavior | Full pack including Samsung permission/battery settings |
| Bluetooth | Each primary OS with representative Bluetooth earbuds | Route switch and recovery | Route success/recovery meets approved threshold |
| Wired | Each device that supports a wired headset or approved adapter | Alternate input/output | Join, route switch, unplug/replug and explicit recovery |
| Speaker | Built-in microphone and speaker/earpiece | No-accessory baseline | Echo/feedback, mute and audience state remain usable |
| Wi-Fi | Stable Korean residential/office Wi-Fi | Baseline and loss | Metrics plus safe failure evidence |
| LTE/5G | Korean carrier LTE/5G | Mobile path | Metrics plus data/network disclosure evidence |
| Network switch | Wi-Fi to LTE/5G and reverse during RTC | Handover/reconnect | No stale authority or automatic microphone resume |

In-app browsers are excluded until separately tested. Record device model,
OS/browser versions, carrier/network, route, build, timestamp, room region,
attempt ID and pseudonymous metrics; do not record voice or raw identifiers.

## Scenario matrix

| Scenario | Run coverage | Required observation | Pass / exit condition |
| --- | --- | --- | --- |
| First join | Every device × speaker; primary devices × every route/network | Authorized join, time to usable audio, permission state | Join and initial-audio gates in approved Web/Mobile SOT pass |
| Microphone grant | Every device; first-use and prior-allow states | Prompt, readiness, audience/mic label | Permission and readiness threshold passes; no camera request |
| Deny then recover | Every device | Deny, browser/OS instructions, re-allow, short retest | No false readiness; re-entry is accessible and explicit |
| Bluetooth change | Primary devices, connect/disconnect before and during room | `devicechange` where available, audible route, mute state | Route success at least 95%; recovery at most 10 seconds |
| Wired change | Supported devices | Plug/unplug, input/output and mic state | No unintended publish; explicit retest works |
| Wi-Fi loss | Primary devices | UI state, audio gap, server presence and recovery | Safe inline/reconnect behavior; no stale command |
| Wi-Fi ↔ LTE/5G | Primary devices both directions | ICE/reconnect, latency, stage and grant refresh | At least 90% recover within 20 seconds |
| Short disconnect | Every device | Reconnect events, current stage and confirmed action | At least 95% within 15 seconds; p95 at most 12 seconds |
| Browser/app switch | Every device | Protected preview, lifecycle, connection/mic on return | Reauthorize current state; protected data hidden; mic stays off until explicit action after interruption |
| Screen lock | Every device | Lock/unlock, preview, route and RTC state | At least 90% recover within 20 seconds; no automatic publish |
| Incoming call/audio focus | Real SIM/eSIM primary devices | Ring/answer/end/decline, route and track events | At least 90% recover within 20 seconds; explicit mic reactivation |
| Refresh/history | Every device | one-time admission, current stage, expired rights | No replay, auto-submit, auto-consent or expired reveal |
| Provider interruption | One controlled non-production drill per primary OS | pause, bounded retry, cancellation/rebook copy | No mid-session provider switch; socially neutral safe cancellation |
| Removal/sanction while offline | Primary devices | reconnect after permission revoked | Rejoin/publish denied without participant metadata leak |

## Measurement and evidence rules

- Apply the approved thresholds in
  [Web and Mobile Experience](../../spec/web-mobile-experience.md): authorized
  join at least 98%; microphone success at least 97% with readiness p95 at most
  20 seconds; initial audio p95 at most 5 seconds and p99 at most 10 seconds.
- Reconnect, network-switch, Bluetooth and interruption thresholds are the
  values stated in that SOT. Fatal-error-free device sessions must be at least
  98%; unresolved P0/P1 browser and task-blocking accessibility defects must be
  zero.
- Run enough attempts to support the SOT's native-evaluation trigger: two
  consecutive rounds of at least 30 device-runs per OS where that trigger is
  evaluated. Do not average away an OS/device-specific failure.
- Preserve sanitized timestamps, outcome codes and aggregate RTC quality only.
  Screenshots must use synthetic users and exclude tokens, interests, identity,
  report evidence and protected media.
- Any unauthorized reveal, stale grant, automatic microphone resume, hidden
  safety action or fabricated/missing result is an immediate stop condition.

## O01-O07 staffing gate

| Work area | Required staffed authority | Separation and training | Exit evidence |
| --- | --- | --- | --- |
| O01 schedule/cohort health | Named primary and backup for schedule, confirmation, cancel/rebook and private underfill handling | No compatibility relaxation or absence-reason disclosure | Coverage roster, shift handoff and cancellation drill |
| O02 live-session control | Named assigned-room operator able to admit/deny, pause, mute, remove and cancel | Cannot inspect private choices; trains on RTC/device failure and neutral communication | Timed control drill, least-privilege access and action audit |
| O03 content/media review | Named reviewer for held content/media and versioned packs | No biometric/manual identity review; author/publisher separation for high risk | Quarantine, safe fallback, rollback and deletion drill |
| O04 report/case queue | Named safety triage and urgent on-call | Case-scoped evidence, reporter protection, minimized notes | Intake/containment/handoff drill within approved service target |
| O05 sanction decision | Named trained safety reviewer and senior escalation | Human reasoned decision; permanent/severe decisions use senior authority | S0-S4 calibration, notice and audit sample |
| O06 appeal review | Named reviewer independent of O05 decision and conflicts | Recusal, accessible appeal and restoration/correction training | Independent assignment and successful-reversal drill |
| O07 audit/access review | Named security/privacy reviewer for access, break-glass and anomaly review | Cannot be routine support; reviews export and unusual access | Break-glass alert/expiry/next-business-day review and access-log sample |

No numeric operator-to-session ratio is approved. The owner must approve the
roster, coverage hours, maximum simultaneous rooms, backup/absence rule,
handoff window, wellbeing rotation and escalation contacts from measured drill
handling times. If any required role or independent reviewer is unavailable,
affected sessions do not start.

## Training and handoff evidence

Every assigned person must complete role-specific training on least privilege,
approved Korean participant messaging, report/sanction/appeal rules, evidence
minimization, identity/manual-review prohibition, no recording, local-capture
limits, vendor outage, device recovery, cancellation, privacy requests and
credential/incident escalation. Training records include curriculum/version,
trainer, trainee, date, scenario score, remediation and expiry/retraining date.

Shift handoff records active sessions, vendor/quality status, quota, unresolved
cases, temporary restrictions, access expiry and next owner without copying
private choices or raw evidence. Handoff failure, unknown owner or overdue
urgent case blocks new sessions.

## Required incident tabletops

| Tabletop | Participants | Minimum success evidence |
| --- | --- | --- |
| NICE outage/false outcome | O01, identity owner, support, privacy | Participation blocks; no manual document bypass; retry/status and deletion path |
| LiveKit outage/reconnect storm | O02, engineering/on-call, vendor owner, support | Pause, quota/status check, bounded retry, cancel/rebook; no live migration |
| Unauthorized reveal/token replay | O02, O04, security/privacy | Revoke, contain, preserve minimum audit, participant communication and review |
| Harassment or underage report | O02, O04, O05, legal escalation owner | Immediate safety control, case separation, proportionate decision and appeal route |
| Insider/break-glass misuse | O07, security/privacy, independent reviewer | Alert, expiry, privilege removal, evidence preservation and retrospective review |
| NCP DB failure/restore | engineering/on-call, O01/O02, vendor owner | Stop critical mutations, restore/reconcile, set observed RPO/RTO only from drill |
| Telemetry sensitive-field leak | engineering, O07, privacy, vendor owner | Stop export, rotate/revoke if needed, targeted delete, impact assessment and redaction regression |

Each tabletop records scenario/version, attendees and roles, timestamps,
decisions, communications, evidence accessed, policy gaps, corrective owner and
deadline. Required controls and role separation must pass on rerun; an
unresolved critical action remains `blocked`.

## Final exit criteria

The real-device Gate exits only when every supported lane has dated evidence,
all applicable numeric thresholds pass and no critical authorization,
privacy, safety or accessibility defect remains. The operations Gate exits
only when named coverage, least-privilege access, training, handoff,
independent appeal, break-glass review, audit records and all seven tabletops
pass. Neither Gate changes D-001 through D-024, ADR status, implementation
authority or live-Pilot approval.
