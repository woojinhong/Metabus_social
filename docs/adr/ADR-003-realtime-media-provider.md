---
title: ADR-003: LiveKit Cloud for the Controlled Pilot
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-013
---

# ADR-003: LiveKit Cloud for the Controlled Pilot

## Status

Accepted for the bounded Pilot by D-013. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Six-person voice needs managed SFU/TURN, reconnect, active-speaker observations and room permissions.

## Decision

Integrate LiveKit Cloud Build for the controlled Pilot, with recording/Egress off, short room-scoped tokens and microphone-only publish. Daily is first fallback, Agora second, and self-hosted LiveKit is an exit; no mid-session failover.

## Considered and rejected alternatives

Self-hosted SFU, mediasoup, Twilio, Zoom and Chime are rejected for initial operations; Daily/Agora are fallbacks rather than simultaneous integrations.

## Consequences

- **Positive:** Broad web/mobile SDKs, granular grants and open-source exit.
- **Negative:** No Seoul LiveKit region is documented; Build has a 5,000 participant-minute hard cap.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Block live participants until Korea device latency/reconnect tests,
cross-border transfer/DPA/subprocessor/retention review and quota alarms pass.
Warn at 3,500 projected minutes and block new reservations above 4,000. D-024
is satisfied; real-time payload/state-machine contracts await separate
promotion.

## Evidence and SOT

[RTC research](../research/technology/korean-mvp-vendor-verification.md), [RTC architecture](../architecture/realtime-media.md).

