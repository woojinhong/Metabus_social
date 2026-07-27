---
title: Web and Mobile Delivery Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/frontend-mobile-strategy.md
decision_authority: docs/discovery/decisions.md only
---

# Web and Mobile Delivery Options

## Decision question

Proposal - unapproved: choose a delivery path that proves microphone, interruption, reconnect, notification, and accessibility behavior before a native commitment.

## Candidate comparison

| Candidate | Delivery velocity | Media and device reliability | Native capabilities | Migration and lock-in | Research interpretation |
| --- | --- | --- | --- | --- | --- |
| Responsive React + Vite PWA | High for a pilot | Must be device-tested, especially iOS Safari | Limited background and push behavior | Low framework lock-in; later native is separate work | Recommended time-boxed path |
| React web + Expo / React Native | Medium | Stronger device integration after native work | Push, deep links, native modules | Shared concepts, not automatic UI parity | Fallback after gate failure |
| React web + Flutter | Medium | Native mobile surface | Separate Dart skill path | Lower reuse with React web | Rejected unless team fit changes |
| Separate iOS and Android | Low initially | Highest platform control | Strongest escape hatches | Two delivery teams | Rejected for pilot cost |

## Proposal - unapproved recommendation

- Recommended: responsive React with Vite as a time-boxed web/PWA pilot.
- Fallback: Expo / React Native if device gates fail; native applications remain a later escalation.
- Rejected now: Flutter and separate native apps add a second or third UI surface before evidence of demand.
- Approval gate: technology and delivery selection require a decision recorded in decisions.md.

## Required evidence gates

| Gate | Pass evidence | Failure response |
| --- | --- | --- |
| Microphone | iOS Safari and Android Chrome join, mute, reconnect, Bluetooth route test | Evaluate Expo / React Native |
| Interruption | Call, lock, route change, and background recovery | Evaluate Expo / React Native or native |
| Session safety | Room token cannot be reused or shared between accounts | Block pilot release |
| Notifications | Reminder and account-bound deep link work on representative devices | Add channel fallback |
| Accessibility | Keyboard, text alternatives, screen-reader, and reduced-motion review | Remediate before wider testing |

## Security, cost, and scale

Research finding: web delivery does not remove browser permission, notification, or background constraints. Proposal - unapproved: re-authorize reconnects, retain only support-needed device diagnostics, and use actual device tests before a delivery decision. Evidence gap: hosting and native-store costs depend on vendors not yet selected.

## Source ledger

- Title: React 19.2 release
  - Publisher: React
  - URL: https://react.dev/blog/2025/10/01/react-19-2
  - Publication/update date: 2025-10-01
  - Verification date: 2026-07-27
  - Supported claim: React 19.2 is a current documented release baseline.
  - Limitations: A release does not prove product fit.

- Title: Vite 8 announcement
  - Publisher: Vite
  - URL: https://vite.dev/blog/announcing-vite8
  - Publication/update date: 2026-03-12
  - Verification date: 2026-07-27
  - Supported claim: Vite 8 is an official current web-build option.
  - Limitations: Compatibility must be rechecked at adoption.

- Title: Expo SDK 55
  - Publisher: Expo
  - URL: https://expo.dev/changelog/sdk-55
  - Publication/update date: 2026-04-15
  - Verification date: 2026-07-27
  - Supported claim: Expo SDK 55 is current evaluation context for native delivery.
  - Limitations: It does not guarantee RTC vendor compatibility.

- Title: Flutter releases
  - Publisher: Flutter
  - URL: https://docs.flutter.dev/release/release-notes
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Flutter 3.44.7 is an official release context.
  - Limitations: Version currency is not a reason to select Flutter.


## Evaluation notes

- Developer skill fit: the proposed web-first route uses existing React concepts; native work is a separate capability and schedule risk.
- Media reliability: microphone permission, route changes, Bluetooth, backgrounding, and reconnect behavior are acceptance evidence, not framework promises.
- Accessibility: responsive web must preserve keyboard and screen-reader semantics; native fallback must reproduce equivalent disclosure and reporting paths.
- Release velocity: web avoids store-review dependency for a pilot but does not remove browser compatibility verification.
- Vendor compatibility: select media and notification SDKs only after actual target-device tests.
- Exit rationale: components and contracts may be reused conceptually, but there is no claim of one-codebase delivery across web and native.
- Cost evidence gap: app-store fees and operational device-testing time are not modeled because distribution is unapproved.
