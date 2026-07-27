---
title: Approved Live Session Experience
document_type: specification
classification: user decision
status: Approved product rules; presentation pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["mvp-scope.md","game-content-system.md","progressive-disclosure.md","api/realtime-capabilities.md"]
decision_authority: D-003 and D-004
---

# Approved Live Session Experience

## Stage model

| Stage | Duration | Allowed | Prohibited/recovery |
| --- | ---: | --- | --- |
| Waiting | before start | device check, readiness, rules, support | no participant chat; refresh rechecks account/reservation |
| Rules/intro | 5m | moderated voice, pass, reaction | no text/contact/video; mute, leave, report |
| Game 1 | 15m | anonymous choice and guess | no score/public correctness; text/pass |
| Game 2 | 15m | clue-owner matching | only moderated clue; omit/replace clue |
| Game 3 | 15m | cooperative behavioral scenario | no winner/dominance score; timed turns |
| Free conversation | 20m | group voice and reactions | external contact/promotion blocked; neutral prompt if stalled |
| Initial interest | 5m | choose zero to two privately | no chat, counts, or peer notification |
| Limited reveal | 5m | mutual-initial pair may independently grant exact resources | no automatic or public reveal; decline/no-reveal path |
| Final/close | 5m | choose zero or one romantic next step, feedback prompt | no rejection reason or automatic contact |
| Recovery budget | 5m flexible | absorb verified technical or safety pauses | never remove consent/safety time to recover schedule |
| Pair voice | max 10m after close | pair-scoped voice when final choices are mutual | no webcam/text/contact exchange; revoke/report/leave |

The stage plan totals 90 minutes including a five-minute flexible recovery budget. Pair voice occurs after the group session and is separately capped.

## Requirements

| ID | Approved behavior |
| --- | --- |
| FR-SES-001 | Admit only authenticated, eligible, reserved, confirmed participants with current one-time admission authorization |
| FR-SES-002 | Continuously show stage, timer, audience, visible data, allowed actions, connection and safety controls |
| FR-SES-003 | Support speak, mute, pass, permitted text response, repeat, extra thinking time, leave and report |
| FR-SES-004 | Execute the three approved games then 20 minutes of free conversation |
| FR-SES-005 | Only authorized backend commands change stage; consequential transitions persist with version and audit |
| FR-SES-006 | Reconnect to current stage without restoring expired publish, reveal, chat or progression grants |
| FR-SES-007 | No late admission after Rules/intro closes; before then admission still rechecks all gates |
| FR-SES-008 | Assigned operator may mute, remove, pause or cancel with reason-coded audit |
| FR-SES-009 | Close RTC, reveal and interaction grants at end, cancellation, block or removal |
| UX-SES-001 | Short thinking time and plain instructions; cleverness or speed is never required |
| UX-SES-002 | Never expose popularity, selection counts, rejection details or pre-progression private chat |
| UX-SES-003 | Balance turns neutrally and privately; do not publicly shame dominant or quiet participants |
| UX-SES-004 | Explain voice identity/pressure and offer pass, text, repetition, exit and support |
| SR-SES-001 | RTC presence/active-speaker events are observations, never stage, consent or interest authority |
| SR-SES-002 | Block, removal, expiry and revocation take effect before queued actions complete |

## Concurrency and recovery

Duplicate commands return the committed result by idempotency key. Stale expected versions fail with current state. Provider-ahead state is restricted or removed. Restart reconstructs durable stage/grants from PostgreSQL. Reconnect storms are throttled. Partial cohort failure follows [MVP rules](mvp-scope.md), never silent substitution.

