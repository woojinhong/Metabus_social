---
title: Scalability and Reliability
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Scalability and Reliability

## Capacity basis

**Proposal — unapproved.** Capacity is session-based. One initial room has six participants; temporary subgroups are excluded. Concurrent rooms equal ceiling(concurrent participants / 6).

| Tier | Participants | Main rooms | Illustrative application posture |
| --- | ---: | ---: | --- |
| Prototype | 6-30 | 1-5 | Single region, small app/database, managed media |
| Early | 100 | 17 | Horizontal app readiness; cache optional |
| Growth | 1,000 | 167 | Multiple app instances; Redis likely; burst controls |
| Large | 10,000 | 1,667 | Regional/cell evaluation; vendor quota and operations program |

## Workload formulas

- Participant-minutes = concurrent participants × session minutes.
- Room-minutes = concurrent rooms × session minutes.
- Audio egress depends on SFU subscription topology, codec bitrate, silence behavior, and TURN rate; measure provider reports.
- TURN traffic = participant-minutes × measured relay proportion × measured bitrate.
- Stage writes = rooms × stage transitions plus participant commands and recovery events.
- Notification burst = seats in sessions starting within reminder window × channel attempts.
- Moderation load = sessions × observed incident/report rate × handling time.
- Human operations = failed cohorts + late/no-show interventions + safety cases + vendor incidents.

## Component scaling

| Component | Primary load | Proposed scale/recovery |
| --- | --- | --- |
| Application API | Auth, commands, reads | Stateless horizontal scale; idempotent commands |
| Session orchestrator | Timers/stages/reconnect | Partition by session; durable checkpoints; lease ownership |
| WebSocket/control channel | Presence/state updates | Reconnect jitter; snapshot then ordered deltas |
| PostgreSQL | Bookings, grants, selections, audit | Index/connection discipline; replicas for noncritical reads later |
| Optional Redis | Presence/timers/rate limits | TTL, bounded keys, rebuild from durable state |
| Object storage/CDN | Media submit/reveal | Private origin, short signed access, resize limits |
| Media provider | SFU rooms/TURN | Quota reservation, regional tests, outage policy |
| Notifications | Reminder bursts | Queue, rate limit, channel fallback, deduplication |
| Analytics | High-volume derived events | Async batch/queue; drop/degrade safely |

## Candidate service objectives

Targets are validation proposals, not contractual SLOs.

| Journey | Candidate objective | Measurement |
| --- | --- | --- |
| Successful authorized join | At least 99% excluding unsupported device/user denial | Admission-to-media-ready event |
| Microphone readiness | At least 95% before scheduled start among attendees | Preflight completion |
| Reconnect after brief loss | 95% within 15 seconds | Disconnect/rejoin correlation |
| Stage transition | 99% acknowledged within 2 seconds | Command to version receipt |
| Interest persistence | No acknowledged loss; reconciliation alert on mismatch | Idempotency/audit check |
| Authorized reveal | 99% within 3 seconds; zero known unauthorized reveal | Grant-to-view event/security alert |
| Reminder delivery | Channel-specific measured, not guaranteed | Provider acceptance/delivery |
| Payment/refund accuracy | N/A: payment excluded | Future separate objective |

## Failure scenarios

- Reconnect storm: jitter, per-session snapshot, rate controls, capacity reserve.
- Media outage: bounded wait, operator communication, cancellation; no cross-provider mid-session switch.
- Database degradation: stop new critical mutations before accepting unpersisted interests/consent.
- Redis loss: rebuild projections; never bypass authorization.
- Notification outage: alternate channel where consented; account inbox remains source.
- Partial cohort failure: explicit threshold and cancellation/recovery policy; no hidden replacements.
- Regional failure: prototype may cancel safely; multi-region state requires later evidence.

## Growth gates

Do not prebuild 10,000-participant architecture. Reassess at measured room creation rate, provider quota pressure, database latency, reconnect bursts, human safety capacity, and vendor spend. Extraction follows [application architecture](application-architecture.md).

## Approval gate

SLOs, regions, quotas, capacity purchases, failover, and staffing require approval and load/device testing.

