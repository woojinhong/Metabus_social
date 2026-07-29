---
title: Real-Time Capability Boundary
document_type: real-time specification
classification: proposal
status: capability boundary retained; contract promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../ux/session-wireflow.md","../../architecture/realtime-media.md","README.md"]
decision_authority: D-021 and D-024
---

# Real-Time Capability Boundary

## Approved principles

- The application backend is authoritative for stage, timer policy, permissions, interest windows, disclosure and removal.
- RTC provider joined/left, active-speaker and quality signals are observations only.
- Clients never infer authority from UI state, local timer, RTC membership or cached event.
- Consequential commands require authenticated participant/operator role, session scope, idempotency and expected authoritative version.
- Reconnect obtains a current projection and cannot restore expired or revoked capabilities.
- Ordering is per session for consequential transitions; duplicates and stale commands fail safely.
- Voice content is not recorded or transported through the application event channel.

## Capability families pending design

Connection/readiness; participant presence observations; microphone/route state; stage/timer synchronization; prompt/response/pass; disclosure grant/revocation; initial/final interest window; operator pause/resume/remove/cancel; reconnect and session end.

## Transport and persistence boundary

The exact WebSocket/SSE transport, handshake, event names, payloads, sequence/ack protocol, replay window and retry behavior remain Draft. Consequential facts will persist in PostgreSQL; presence, local mic state, active speaker and timer projections are ephemeral and expire within the retention policy. Redis is not a Pilot dependency.

## Contract promotion gate

The D-024 waiting room, stage, controls, late-join, reconnect, no-match, reveal,
report and moderator wireflows are approved. A state machine, transport,
event/command contract and payload remain blocked pending separate
Implementation Contract promotion. No AsyncAPI or final payload schema is
authorized.

