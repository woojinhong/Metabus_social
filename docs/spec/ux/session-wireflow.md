---
title: Draft Session Wireflow
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../session-experience.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved Session Wireflow

## Approved sequence

| Phase | Entry/exit | Required information | Approved participant actions | Failure/recovery |
| --- | --- | --- | --- | --- |
| Device check | confirmed reservation -> ready/support | browser/device, microphone/route/network, privacy note | allow/test/retry/help | permission denied, no input, Bluetooth, unsupported browser |
| Waiting room | device-ready and within window → admitted/cancelled | countdown, own readiness, neutral cohort status, rules, visibility | ready/help/leave | too early, late, underfill, outage, refresh |
| Rules/intro | six admitted -> Game 1 | stage/timer, voice visibility, pass/report | acknowledge, speak/pass, mute/leave/report | acknowledgement incomplete, reconnect |
| Three games | assigned content -> next stage | instruction, turn, answer modes, current audience | answer/pass/repeat/text/reaction | held clue, participant loss, timer disagreement |
| Free conversation | games complete -> interest | remaining time, safe topics, group state | speak/pass/reaction/report | silence, dominance, harassment, connection loss |
| Initial interest | window open -> submitted/timeout | zero-to-two rule, privacy, close time | select/edit/none/submit | stale list, retry, timeout |
| Reveal | eligible mutual-initial pair -> grant/decline/expire | exact resource/audience/purpose/capture warning | grant/view/decline/revoke | media unavailable, revoke race, no-reveal |
| Final selection | reveal/no-reveal -> result | zero-or-one rule and no automatic contact | choose/none/submit | retry, timeout, block |
| Result/pair voice | final close -> no-match/voice/end | only own outcome and capability | join pair/leave/report/feedback | peer absent, expiry, reconnect |

## Readiness, late entry and participant loss

- `P08` completion requires supported-device, microphone/input/output and network
  checks. `P09` readiness additionally requires an explicit participant action.
- The exact-six test is backend/operator-only. Participants see only their own
  readiness and neutral “checking,” “delayed,” “ready” or “cancelled” status.
- Too-early entry shows the eligible window. Late entry is rechecked and allowed
  only before rules/introduction closes; later entry uses a blocking explanation.
- Underfill never starts. Cancellation offers penalty-free rebooking without
  peer count, identity, readiness, eligibility, sanction or absence reason.
- A permanent departure pauses the session. The remaining five privately choose
  continue or stop; timeout or any refusal cancels without naming a cause.

## Interaction boundary

Participant order is stable and neutral. `P10` distinguishes operator pause from
local reconnect. Exact routes, commands, event payloads, timers and presence
contracts remain undefined.

