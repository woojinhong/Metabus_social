---
title: Approved Web and Mobile Experience
document_type: specification
classification: user decision
status: Approved non-functional boundary; UX layouts pending
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["mvp-scope.md","non-functional-requirements.md","../adr/ADR-002-web-first-delivery.md"]
decision_authority: D-008
---

# Approved Web and Mobile Experience

## Strategy

Deliver responsive React/Vite Web/PWA first. Expo/React Native is the first evaluated fallback, not automatically approved for implementation. Native becomes a capability requirement immediately if reliable background incoming-call handling or iOS app-link capture becomes mandatory.

## Cross-platform requirements

| ID | Approved behavior |
| --- | --- |
| UX-WM-001 | Consistent journey and vocabulary without forcing identical layouts |
| UX-WM-002 | Continuously show microphone, route, connection, stage, timer, visibility and allowed actions |
| UX-WM-003 | Require an explicit gesture before microphone or audible media |
| UX-WM-004 | Recover safe drafts/markers through refresh or interruption without restoring expired authority |
| UX-WM-005 | Deep links navigate only; every protected action reauthenticates and reauthorizes |
| UX-WM-006 | Keyboard, screen reader, 200% zoom/reflow, non-color status, reduced motion and plain errors |
| UX-WM-007 | Pass, text alternative, extra time, repetition, leave and report; voice comfort is never assumed |
| UX-WM-008 | Notifications exclude participant identity, reveal, interest and safety-case detail |
| SR-WM-001 | Browser history, cache, app switcher, lock screen and telemetry do not expose protected data |
| SR-WM-002 | MVP never requests camera permission; microphone is purpose-bound |

## Approved Pilot gates

| Gate | Threshold |
| --- | --- |
| WM-GATE-01 join | >=98% of eligible attempts reach usable authorized audio |
| WM-GATE-02 microphone | >=97% on supported devices after user allows; readiness p95 <=20s |
| WM-GATE-03 initial audio | p95 <=5s and p99 <=10s |
| WM-GATE-04 reconnect | >=95% within 15s; duration p95 <=12s |
| WM-GATE-05 network switch | Wi-Fi to LTE/5G recovery >=90% within 20s |
| WM-GATE-06 Bluetooth | route success >=95%; change recovery <=10s |
| WM-GATE-07 interruption | incoming-call end and screen-lock/background return recover >=90% within 20s |
| WM-GATE-08 fatal quality | fatal-error-free device sessions >=98%; unresolved P0/P1 browser defects = 0 |
| WM-GATE-09 accessibility | critical task-blocking accessibility defects = 0 |
| WM-GATE-10 notification | accepted/delivered where observable >=95% within 5m; correct authenticated deep-link landing >=98%; link-authorized admission = 0 |

## Native evaluation trigger

Start Expo/React Native evaluation when any security/authorization/accessibility P0 occurs; or two or more gates fail in two consecutive rounds of at least 30 device-runs per OS; or one gate misses by at least 5 percentage points; or interruption recovery is below 90%; or OS join/microphone remains below 95% after supported remediation.

## Device matrix

Current iOS Safari and Android Chrome; one recent and one older supported iPhone; one recent Samsung Galaxy; Bluetooth earbuds, speaker and wired headset where supported; Wi-Fi, LTE/5G and live network switching. In-app browsers are unsupported until separately tested.

