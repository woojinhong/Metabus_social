---
title: ADR-002: React and Vite Web/PWA First with Native Gate
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-27
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-008
---

# ADR-002: React and Vite Web/PWA First with Native Gate

## Status

Accepted for the bounded Pilot by D-008. This does not authorize source code, provisioning, procurement, or public operation.

## Context

The Pilot needs link-based web/mobile access, but browser media, interruption and deep-link behavior vary by device.

## Decision

Use React with Vite as a responsive Web/PWA Pilot. Evaluate Expo/React Native only when the approved numeric gates fail or native-only capability becomes required.

## Considered and rejected alternatives

Immediate Expo, Flutter and separate native apps are rejected before device evidence. Maximum code sharing is not a goal.

## Consequences

- **Positive:** Fast Pilot distribution and one web release path.
- **Negative:** Background, Bluetooth, interruption and iOS deep-link limits may force migration.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Run at least 30 device-runs per OS on the approved matrix. UX information architecture, wireflows, mobile layouts and accessibility interactions remain pending D-024.

## Evidence and SOT

[Web/mobile SOT](../spec/web-mobile-experience.md), [UX gate](../spec/ux/README.md).

