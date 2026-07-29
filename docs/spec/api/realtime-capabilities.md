---
title: Real-Time Delivery Contract
document_type: real-time specification
classification: proposal
status: capability boundary retained; contract promotion pending
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["../ux/session-wireflow.md","../../architecture/realtime-media.md","README.md","../realtime-contract.md"]
decision_authority: D-021 and D-024; Issue #25 scopes this proposal only
---

# Real-Time Delivery Contract

## Authority and transport

- [CONFIRMED] PostgreSQL-committed state is authoritative. SSE, WebSocket, browser memory, local timers, and LiveKit observations do not prove completion.
- [RECOMMENDED] REST carries Commands and Snapshot Queries. SSE carries a minimal post-commit hint; polling restores a Snapshot when SSE is unavailable.
- [CONFIRMED] WebRTC/LiveKit carry voice/media and observations only. A disconnect is not an official session end and a webhook is not a business transition.
- [NOT-RECOMMENDED] WebSocket and a separate realtime gateway are not Pilot defaults because no approved bidirectional signaling or measured connection-isolation need exists.

## Minimal SSE envelope candidate

| Item | Responsibility |
| --- | --- |
| `eventId` candidate | Delivery deduplication/resume reference; not a business identifier |
| `eventType` candidate | Coarse change-hint category; final name is [OPEN] |
| `resourceType`, `resourceId` candidates | Opaque target needed for an authorized requery |
| `occurredAt` candidate | Event creation time, not the business completion proof |
| `version` or `revision` candidate | Helps detect stale/out-of-order hints; authoritative version comes from Snapshot |
| `correlationId` candidate | Links sanitized delivery diagnostics to the originating flow |

The envelope contains no private choice, peer intent, report narrative, reporter identity, raw profile, consent reason, credential, provider token, media URL, or personal data. Final field names, encoding, and retention are [OPEN].

## Delivery flow

```text
PostgreSQL commit -> post-commit projection/outbox candidate -> SSE hint
 -> client deduplicates hint -> authorized REST Snapshot Query
 -> server rechecks session, role, assignment and resource scope -> UI refresh
```

- [RECOMMENDED] Send only after commit. SSE failure never rolls back the business transaction.
- [RECOMMENDED] A client that receives, misses, duplicates, or reorders a hint reaches the same result by reloading the current Snapshot.
- [RECOMMENDED] A network-uncertain Command result is resolved with its idempotency key and authoritative Query, not from an SSE event.

## Connection, recovery, and revocation

| Concern | Contract |
| --- | --- |
| Authentication | Establish the stream through the current browser session; reject or close on invalid session |
| Authorization | Filter hints by current permitted resource scope; each REST requery reauthorizes |
| Reconnect | Use bounded backoff and jitter; then reload relevant Snapshots |
| `Last-Event-ID` | [OPEN] optimization candidate only; the system remains correct without retained replay |
| Event loss | Snapshot recovery; no business rollback or synthetic completion |
| Out-of-order event | Compare hint revision, then reload current Snapshot |
| Duplicate event | Deduplicate by delivery event ID or harmlessly requery |
| Permission revocation | Stop eligible delivery and close/reject connection; old events grant no read |
| Multiple tabs | Each tab is non-authoritative; dedupe/requery independently or coordinate locally |
| Polling fallback | Bounded interval/backoff; return the same scope-filtered Snapshot |

## Media boundary

| Signal | Meaning | Required server action |
| --- | --- | --- |
| LiveKit participant joined/left | Connection observation | None automatically; optionally record minimal observation |
| Track or quality change | Media observation | Device guidance or operator projection only |
| LiveKit webhook | Signed provider observation | Deduplicate and reconcile against current internal state |
| Media token issuance | Short-lived transport grant | Recheck current admission/session/capability before issue |
| Disconnect | Recovery/end-request trigger candidate | Never mark official end without Application Service transition and commit |

[OPEN] Exact event names, heartbeat, connection limit, replay retention, polling interval, LiveKit webhook fields, and device thresholds require implementation, vendor, and real-device evidence. No AsyncAPI or final payload schema is authorized.
