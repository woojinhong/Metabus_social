---
title: Frontend and Mobile Strategy
document_type: architecture analysis
classification: user decision and proposal
status: Approved delivery boundary; UX layouts pending
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Frontend and Mobile Strategy

## Recommendation proposal

**User decision:** use responsive React + Vite Web/PWA first. Evaluate Expo/React Native only when the approved numeric device gates fail. **Proposal — pending D-024:** later approved contracts, vocabulary, design tokens and analytics taxonomy should remain portable; maximum UI sharing is not a goal.

## Decision matrix

| Option | MVP speed | Media reliability | Push/background | Reuse | Operations | Migration risk | Finding |
| --- | --- | --- | --- | --- | --- | --- | --- |
| React/Vite PWA | High | Browser/device dependent | Limited | Web logic/tokens | One surface | Medium | Recommended time-box |
| Next.js web | Medium-high | Same browser limits | Same | React ecosystem | Server/runtime added | Medium | Reject unless SSR matters |
| React web + Expo | Medium | Native escape hatches | Strong | Logic/tokens, some UI | Web plus stores | Medium | Fallback |
| React web + Flutter | Medium-low | Vendor support varies | Strong | Little code | Two ecosystems | High | Reject for skill fit |
| Separate native apps | Low | Best platform control | Strongest | Contracts/tokens | Three surfaces | High | Future escape hatch |

## Actual-device gates

Test iOS Safari and Android Chrome across representative devices for:

- microphone permission, selection, mute, Bluetooth routing, echo;
- calls, alarms, app switching, screen lock, background transitions;
- network handoff, reconnect, duplicate join, token refresh;
- reminders and authenticated deep-link return;
- screen reader, keyboard, zoom, text alternatives, pass, reduced motion;
- optional future camera only as a separate gate.

Failure to meet agreed join, reconnect, or accessibility thresholds triggers Expo. Persistent gaps may justify a narrow native module or separate native client after approval.

## Experience parity

Both web and mobile proposals expose the same server-authoritative stage, visible-information notice, consent status, progress/time, reporting, and recovery. Mobile prioritizes one action and interruption recovery; web handles multiple windows, tab suspension, and device selection.

## Client boundaries

Client-local state may hold drafts, device preferences, view state, and optimistic presentation. It must not own eligibility, admission, stage, disclosure grant, interest, progression, or sanction. Sensitive data is excluded from URLs, logs, crash reports, and notifications.

## Repository proposal

**Proposal — pending UX and implementation planning:** a monorepo may hold clients, backend, later approved schema contracts, design tokens and docs while deployment units remain separate. Repository layout, generated clients and shared schemas are not approved by D-008.

## Migration path

1. Approve D-024 UX behavior, then define contracts and event names.
2. Complete PWA device gates.
3. If gates fail, reuse contracts, state-machine tests, tokens, and logic in Expo.
4. Add native modules only for measured media, identity, notification, or accessibility gaps.
5. Consider native apps only when product evidence justifies maintenance.

## Approval gate

React/Vite PWA-first delivery is approved by D-008. Repository strategy, app-store path, native implementation and UI/layout behavior remain unapproved; actual-device gates control Expo evaluation.

## Accessibility and failure UX gates

The client proposal must support a visible pass action, text alternative where the activity permits it, thinking time before speaking, keyboard and screen-reader operation, focus recovery after stage change, scalable text, high-contrast states, and non-color-only status. Captioning feasibility requires separate media/privacy research.

When permission or device setup fails, explain what was denied, what the service can and cannot detect, how to retry, and whether an accessible alternative or reschedule is available. Do not pressure a participant to enable camera or expose private device details.

## Release and observability criteria

Track client/version, supported device class, permission outcome, media-ready time, reconnect outcome, stage-version mismatch, crash/error, and accessibility path without collecting raw voice or private selections. Release gates include actual-device regression, deep-link authorization, background behavior, and vendor SDK compatibility.

## Store-policy boundary

If Expo/native delivery is triggered, re-evaluate app-store account deletion, privacy labels, identity SDK review, notification permissions, external payment rules, and age-rating requirements. A native fallback is not approval for store distribution or in-app payments.

## Decision evidence gap

The numeric fallback thresholds are approved in [web-mobile experience](../spec/web-mobile-experience.md). Device evidence, developer capacity, store-review lead time and participant willingness to install remain Pilot evidence gaps; Expo evaluation is not implementation approval.
