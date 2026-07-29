---
title: Real-Time Media Architecture
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-29
related: [../discovery/decisions.md, ../spec/realtime-contract.md, ../spec/lifecycle-contract.md, ../spec/actor-authorization-contract.md, application-architecture.md, security-privacy.md, ../adr/ADR-001-modular-monolith-managed-rtc.md, ../adr/ADR-003-realtime-media-provider.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md and Accepted ADRs
---

# Real-Time Media Architecture

## Purpose and authority boundary

- [CONFIRMED] PostgreSQL-committed business state is authoritative for admission, permissions, session stage, official start/end, consent, choice-derived capability, removal, and sanctions.
- [CONFIRMED] Realtime messages and LiveKit room, participant, track, connection, and webhook observations do not prove business completion.
- [CONFIRMED] A connection loss is not an official session end. It can trigger a recovery or end request, but only an authorized Application Service transition and database commit change official state.
- [RECOMMENDED] Keep business commands and snapshots on REST; use realtime and media channels only for the delivery problems they actually solve.

## Transport and service comparison

| Option | Solves | Does not solve | Initial decision | Revisit condition |
| --- | --- | --- | --- | --- |
| HTTP polling | Periodic snapshot refresh and recovery | Low-latency push or media | [RECOMMENDED] SSE fallback | Tune after measured recovery load |
| Long polling | Server-delayed HTTP response | Efficient durable authority or media | [NOT-RECOMMENDED] Adds connection complexity without SSE advantage | Environment blocks SSE but permits long polling |
| SSE | One-way server-to-browser minimal change hints | Client commands, bidirectional signaling, media, completion evidence | [RECOMMENDED] Post-commit hints | Connection/fan-out metrics exceed app boundary |
| WebSocket | Bidirectional low-latency application signaling | Audio/video transport or durable completion | [NOT-RECOMMENDED] No approved bidirectional need | Client-to-server realtime cannot use REST |
| WebRTC | Browser/device audio/media transport | Business commands, workflow authority, durable state | [CONFIRMED] Voice/media | Media requirements or device evidence changes |
| External realtime service | Managed connection/fan-out signaling | Internal permission and state transitions | [NOT-RECOMMENDED] No separate need | Measured signaling scale/operation gap |
| External media service | SFU, TURN, room/track transport | Official session lifecycle or business access | [CONFIRMED] LiveKit | Procurement/privacy/latency/reliability gate fails |
| Separate realtime gateway | Independent connection scaling and failure isolation | Database authority or automatic auth consistency | [NOT-RECOMMENDED] Keep in business app | Sustained connection load harms business API |

WebSocket and WebRTC are not substitutes: WebSocket carries application messages; WebRTC carries media. Neither replaces REST commands or PostgreSQL transactions.

## Initial topology and flow

```text
Browser --REST command/query--> Spring MVC business application --> PostgreSQL commit
Browser <--minimal SSE hint---- business application after commit
Browser --REST snapshot-------> business application after hint/reconnect
Browser <--WebRTC media-------> LiveKit SFU/TURN
LiveKit --observed webhook----> provider Adapter --> dedupe/recheck --> reconciliation commit
```

- [RECOMMENDED] Send SSE only after commit. Delivery failure does not roll back the business transaction and does not create another completion path.
- [RECOMMENDED] SSE payloads contain a minimal opaque resource/change/version hint, not private choices, report data, credentials, or a full sensitive snapshot.
- [RECOMMENDED] After loss or reconnect, reload current authorization and snapshot through REST; do not replay frontend memory as authority.
- [RECOMMENDED] Poll with bounded backoff when SSE is unavailable. Exact interval, SSE event name, payload, resume identifier, and retention are [OPEN].

## Official session and media boundaries

| Event or fact | Observation | Authoritative action |
| --- | --- | --- |
| Join request | Browser wants entry | Server rechecks account, reservation/admission, sanction, assignment/scope as applicable, and session state |
| Media token | Short-lived room/participant/publish-subscribe grant | Issued only after current server authorization |
| LiveKit participant connected | Transport presence | Does not start, admit, or advance the official session |
| Track published/subscribed | Media path observation | Does not grant business capability |
| LiveKit webhook | Signed provider observation | Deduplicate and recheck current state before optional reconciliation |
| Disconnect | Lost transport/presence | Start reconnect policy or submit end request; never auto-complete end |
| Official start | UI/RTC may display the result | Application Service transition plus PostgreSQL commit |
| Official end | UI/RTC may observe closure | Application Service transition plus PostgreSQL commit and audit |

[CONFIRMED] User choice and derived capability remain separate; a media permission can be issued only from the current derived capability, not inferred from a participant connection or private choice.

## Authorization, token, and privacy rules

- [RECOMMENDED] Bind each media token to one participant, room/session purpose, minimum publish/subscribe grant, and short lifetime; token contents and exact TTL remain [OPEN].
- [RECOMMENDED] Reconnect performs current authorization again. Reusable URLs, a previous token, or provider membership never grants entry.
- [RECOMMENDED] Removal, sanction, consent withdrawal, assignment/scope change, or capability expiry revokes future server authority and provider grants without rewriting official history.
- [CONFIRMED] Provider recording/egress is disabled for the bounded Pilot. This cannot prevent OS recording, screenshots, or second-device capture and must not be presented as such.
- [RECOMMENDED] Logs, metrics, traces, SSE, and webhooks retain no voice content, private choices, report narratives, credentials, or unnecessary IP/device identifiers.

## Failure and reconciliation

| Failure | User treatment | Business-state treatment | Recovery |
| --- | --- | --- | --- |
| SSE loss | Show reconnecting/stale indicator | No state change | Reconnect then REST snapshot; polling fallback |
| Browser/network loss | Preserve uncertainty | No automatic official end | Bounded reconnect, then authorized recovery/end request |
| LiveKit join/media failure | Device/network guidance or operator pause | Admission/session state remains server-owned | Bounded retry, pause, cancel, or reconcile by approved policy |
| Provider API timeout | Do not claim success | Intent remains pending/unknown | Query/retry idempotently; manual state after limit |
| Duplicate/replayed webhook | No duplicate user outcome | No second transition | Signature/freshness/event-ID verification |
| Business app or DB failure | Realtime may disconnect | Authoritative mutation fails closed | Restart/reload snapshot; reconcile durable intents |

- [RECOMMENDED] Do not perform automatic cross-provider failover in the middle of a session: participant identity, room membership, tracks, ordering, and consent could diverge.
- [OPEN] Whether any approved mid-session provider transition is permissible, plus pause/cancel deadlines and operator policy, requires product, vendor, device, and incident evidence.

## Gateway extraction gate

| Signal | Why it matters | Entry evidence |
| --- | --- | --- |
| Concurrent SSE/WebSocket connections | File descriptor/thread/connection pressure | Sustained measured saturation; threshold [OPEN] |
| Fan-out latency and drop/reconnect rate | Delivery quality | Approved SLO repeatedly missed; SLO [OPEN] |
| JVM heap and GC pause | Realtime allocation harms business requests | Correlated degradation under representative load |
| Thread/connection occupancy | Blocking business server capacity | Pool/queue exhaustion attributable to realtime |
| REST latency/error rate | Shared failure/resource boundary | Realtime load causes material business SLO breach |
| Independent deployment frequency | Change coupling | Gateway changes repeatedly require unrelated app releases |
| Operations ownership | Real isolation needs an owner | Named team/on-call and runbook exist |

[REVISIT-WHEN] Extract only when several signals show that independent scaling or failure isolation outweighs authentication propagation, routing, cross-process tracing, deployment, and on-call cost. Exact numeric thresholds remain [OPEN].

## Verification and evidence gates

- [RECOMMENDED] Test late join, reconnect, stale token, token reuse, cross-room join, publish/subscribe outside scope, removal then reconnect, webhook signature/replay/duplicate, SSE loss with snapshot recovery, and provider outage without false completion.
- [RECOMMENDED] Controlled device tests measure join success, first-audio time, packet loss, jitter, RTT, audio gaps, relay rate, reconnect, Bluetooth change, call/interruption, lock/background, and Wi-Fi/mobile transitions.
- [OPEN] Provider quota, rate limit, Korean routing, support escalation, SLA, DPA, retention/deletion, subprocessor, exact webhook semantics, and verified device thresholds remain B-session evidence gates.
