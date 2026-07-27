---
title: Draft Session Wireflow
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../session-experience.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft Session Wireflow

## Candidate sequence and decision checklist

| Phase | Entry/exit | Required information | Candidate actions | Failure/recovery to decide |
| --- | --- | --- | --- | --- |
| Device check | confirmed reservation -> ready/support | browser/device, microphone/route/network, privacy note | allow/test/retry/help | permission denied, no input, Bluetooth, unsupported browser |
| Waiting room | ready and within window -> admitted/cancelled | countdown, current eligibility/attendance, rules, visible-data summary | mark ready, leave, support | six not present, late arrival, provider outage, refresh |
| Rules/intro | six admitted -> Game 1 | stage/timer, voice visibility, pass/report | acknowledge, speak/pass, mute/leave/report | acknowledgement incomplete, reconnect |
| Three games | assigned content -> next stage | instruction, turn, answer modes, current audience | answer/pass/repeat/text/reaction | held clue, participant loss, timer disagreement |
| Free conversation | games complete -> interest | remaining time, safe topics, group state | speak/pass/reaction/report | silence, dominance, harassment, connection loss |
| Initial interest | window open -> submitted/timeout | zero-to-two rule, privacy, close time | select/edit/none/submit | stale list, retry, timeout |
| Reveal | eligible mutual-initial pair -> grant/decline/expire | exact resource/audience/purpose/capture warning | grant/view/decline/revoke | media unavailable, revoke race, no-reveal |
| Final selection | reveal/no-reveal -> result | zero-or-one rule and no automatic contact | choose/none/submit | retry, timeout, block |
| Result/pair voice | final close -> no-match/voice/end | only own outcome and capability | join pair/leave/report/feedback | peer absent, expiry, reconnect |

## Open interaction questions

Visual participant representation; stage transition treatment; timer urgency; turn-taking controls; text alternative behavior; no-match message; pause/cancel ownership; late join before intro close; five-person continuation consent; reconnect overlay versus route; and mobile/background behavior remain unresolved.

The approved backend-authority principle constrains all variants, but no state machine or real-time payload is final until this wireflow is explicitly approved.

