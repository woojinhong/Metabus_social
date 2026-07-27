---
title: Session Operations
document_type: operations proposal
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../architecture/system-context.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Session Operations

## Purpose

**Proposal — unapproved.** Coordinate scheduled sessions safely while keeping product state server-authoritative. A live facilitator is deferred; operator recovery and safety escalation are still required.

## Session lifecycle

1. Publish a fixed slot and compatibility policy version.
2. Accept account-bound reservations; payment is not included.
3. Compose a viable cohort and send confirmation.
4. Reconfirm attendance; recover or cancel insufficient cohorts.
5. Send reminders without reusable admission credentials.
6. Run device/microphone check and authenticated waiting room.
7. Exchange one-time admission proof for a short room token.
8. Present rules, visible-information state, recording limitation, and consent.
9. Execute server-authoritative stages, three proposed games, and free conversation.
10. Persist private interest, controlled reveal grants, final mutual progression, and optional 1:1 voice.
11. Close media, collect feedback, expose block/report/support, and reconcile audit.

## Operator controls

Operators may view cohort viability, attendance, connectivity, stage, timer, media quality, and safety alerts. They may pause, advance under policy, mute, remove, cancel, and send approved notices. They may not inspect private choices or grant disclosure without a narrowly audited break-glass reason.

## Exception matrix

| Failure | Proposed response | Data/action |
| --- | --- | --- |
| Late participant | Admit only if policy/stage permits; show current rules | Record late join and snapshot version |
| Brief disconnect | Reauthorize and restore current stage | Jittered reconnect; no duplicate seat |
| Device failure | Retry/change device/text/pass; support | Store outcome, not raw diagnostics |
| Insufficient cohort | Attempt approved replacement cutoff or cancel | Notify all; no hidden incompatible fill |
| Media outage | Bounded pause/retry, then cancel | No mid-session provider switch |
| App/database failure | Stop critical transitions if not durable | Reconcile from checkpoints/audit |
| Operator cancellation | Clear reason and follow-up | No refund workflow initially |
| Safety incident | Immediate mute/remove/block and case escalation | Minimized evidence and audit |

## Stage controls

Waiting room has no participant chat. Introductions use controlled turns/reactions. Games accept structured answers. Free conversation may permit short text only if approved filters are active. Interest selection has no peer chat. Private messaging and 1:1 voice require compatible mutual progression. Webcam and temporary small groups are deferred.

## No-show and cancellation

Define cutoff, late threshold, viable minimum, replacement rules, participant cancellation, technical-failure classification, operator cancellation, and appeal. Attendance history may inform operations but must not become public reputation. Deposits and penalties are excluded initially.

## Runbook evidence

Record session ID, policy/content versions, stage transitions, operator actions/reasons, join/reconnect quality, removal, cancellation type, and notification outcome. Do not store voice content. Sensitive logs use short retention and restricted access.

## Readiness checks

Before a pilot: device matrix, vendor quota, cancellation templates, safety on-call, access roles, token replay tests, consent/reveal race tests, Redis-loss recovery if used, provider outage exercise, and accessible alternatives.

## Approval gate

Cohort thresholds, stage timings, operator authority, support hours, cancellation policy, facilitator model, and any fee/deposit require explicit approval.

## Pre-session operator checklist

- Confirm cohort compatibility result, minimum viable attendance, and no unresolved sanction.
- Confirm approved content pack/version and safe fallback pack.
- Confirm media/vendor status, quota, region, and operator controls.
- Confirm safety coverage, escalation route, cancellation message, and accessible recovery.
- Confirm no participant notification contains a reusable admission credential.

## Post-session reconciliation

Verify session closure, media token expiry, stage and interest persistence, reveal-grant state, participant removal/block effects, delivery of approved follow-up, unresolved safety cases, object-access expiry, and operator-action audit. Reconcile vendor presence/webhooks without treating them as product authority.

## Operational metrics

Separate operational join/reconnect/stage outcomes, product enjoyment/curiosity/progression, safety reports/interventions, accessibility-path use, and sensitive choice data. Operators should see actionable service health without private popularity or rejection views.

## Evidence gaps

Viable cohort threshold, replacement cutoff, late-entry fairness, session duration, operator-to-session ratio, cancellation tolerance, accessible alternatives, and human safety coverage require pilot evidence.
