---
title: Real-Time Media Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Real-Time Media Architecture

## Recommendation proposal

**Proposal — unapproved:** evaluate LiveKit Cloud as primary managed SFU. Daily is fallback if compatibility and Korean-region tests pass; Agora is a procurement/latency comparator. Self-hosted LiveKit is an operational exit, not a full technology exit.

## Provider comparison

| Option | Clients | Permission model | Korea validation | Operations | Lock-in/exit | Finding |
| --- | --- | --- | --- | --- | --- | --- |
| LiveKit Cloud | Web, iOS, Android, RN, Flutter | Token grants/server controls | Must measure | Managed | Open server path | Primary proposal |
| Daily | Web/mobile; Flutter gap to verify | Tokens/room config | Must measure | Managed | Adapter/export | Fallback proposal |
| Agora | Broad SDK coverage | Token/channel roles | Must measure | Managed | Adapter migration | Comparator |
| Twilio Video | Broad, mature | Access tokens/rooms | Must measure | Managed | Migration/cost risk | Reject initial shortlist |
| Zoom Video SDK | Broad | SDK auth/roles | Browser E2EE limits | Managed | Product semantics | Reject initially |
| Amazon Chime SDK | Broad AWS integration | Meeting/attendee auth | Must test | Managed | AWS coupling | Reject initially |
| mediasoup | Custom clients/signaling | Fully custom | Operator-owned | Highest | Maximum control | Reject MVP |

## Authority and token model

The backend authorizes every join. It issues session-, room-, participant-bound short-lived tokens after current reservation, attendance, sanction, and stage checks. Grants are minimum publish/subscribe. Reconnect refreshes authorization; a reusable URL never grants entry.

## Media states

| State | Proposed permission | Recovery |
| --- | --- | --- |
| Device check | Local test only | Change device or text/pass route |
| Waiting room | No participant media | Retry auth/device; operator help |
| Main session | Audio subscribe; publish per stage | Reconnect to same stage |
| Structured turn | Selected participant publishes | Moderator/system can revoke |
| Free conversation | Authorized group audio | Behavior moderation |
| Interest selection | No peer chat; audio may pause | Durable private submission |
| Mutual 1:1 voice | Separate scoped room/grant | Revoke on consent withdrawal |
| Future webcam | Deferred; independent mutual live grant | Fail closed and expire |

Temporary small groups are analysis-only and deferred. If approved later, the server creates scoped child membership and deterministic return to the main room.

## Consent and transitions

The subject’s media grant is separate from each viewer’s eligibility. Optional webcam would require current subject grant and compatible viewer progression, checked atomically. Withdrawal revokes server authority and provider grants; races fail closed. Participants cannot self-promote permissions.

## Reliability

Use device preflight, quality events, bounded token renewal, reconnect with jitter, duplicate-session policy, late-join snapshot, moderator mute/remove, and webhook reconciliation. Do not attempt cross-provider failover mid-session. On outage, pause/retry within a bounded window or cancel under operator policy.

## Recording and privacy

Provider recording/egress is disabled by default and not requested. This does not prevent OS, second-device, screenshot, or local audio recording. Store audit and quality metadata without voice content; minimize IP/device metadata and retention.

## Exit strategy

Keep room, participant, stage, and permission vocabulary provider-neutral; isolate token/webhook APIs; retain no required product state only in provider metadata. Test Daily periodically. Self-hosting requires TURN, regional networking, upgrades, abuse defense, capacity, and on-call evidence.

## Approval gate

Provider, region, E2EE posture, recording settings, retention, and webcam processing require approval and legal/privacy review where applicable.

## Media validation plan

Run controlled tests in Seoul and nearby provider regions across supported browsers/devices. Measure join success, time to first audio, packet loss, jitter, round-trip time, audio gaps, relay rate, reconnect time, Bluetooth changes, app interruption, and moderator action propagation.

## Permission verification

Automated scenarios attempt token reuse, cross-room join, publish outside the current stage, subscribe to an unauthorized future 1:1 room, reconnect after removal, stale-token refresh, and provider-webhook replay. Every unauthorized attempt must fail without exposing participant metadata.

## Operational readiness

Before a pilot, confirm provider quota, rate limits, support escalation, regional routing, incident status source, deletion/retention configuration, egress/recording disablement, credential rotation, webhook signing, and participant-facing outage messaging.

## Quality degradation policy

Prefer audio continuity over optional reactions or metadata. Quality problems may reduce nonessential updates, suggest device/network recovery, or pause the stage. They must never silently change participants, disclose media, or advance interest.
