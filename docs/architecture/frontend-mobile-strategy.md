---
title: Frontend and Mobile Strategy
document_type: architecture analysis
classification: user decision and proposal
status: Approved delivery and UX baseline; contract promotion pending
last_verified: 2026-07-29
related: [../discovery/decisions.md, ../spec/traceability-ux-implementation.md, ../spec/actor-authorization-contract.md, ../spec/realtime-contract.md, ../spec/web-mobile-experience.md, application-architecture.md, realtime-media.md, security-privacy.md, ../adr/ADR-002-web-first-delivery.md]
decision_authority: D-008 and D-024; implementation contracts remain unapproved
---

# Frontend and Mobile Strategy

## Scope and authority

- [CONFIRMED] D-008 and ADR-002 select responsive React + Vite Web/PWA for the bounded Pilot; D-024 approves the UX baseline, not source code or final API contracts.
- [CONFIRMED] The screen, URL, browser memory, local cache, realtime message, and media connection are never business authority. PostgreSQL-committed server state remains authoritative.
- [RECOMMENDED] The client collects input, presents scoped server state, shows uncertainty/errors, reconnects, and requeries. It never finalizes authorization, official session end, sanction, appeal, assignment work, or deletion completion.
- [OPEN] Exact repository layout, frontend project split, state library, routing, generated client, API schema, build/deploy configuration, and native fallback remain implementation decisions.

## Framework comparison

| Candidate | Useful strengths | Project costs or gaps | Current decision |
| --- | --- | --- | --- |
| React + Vite SPA/PWA | One responsive browser release, component ecosystem, direct client-state model, ADR alignment | Browser media/background limits; client routing and API state need discipline | [CONFIRMED] Pilot baseline |
| Next.js | React plus SSR, server components, file routing, server runtime | Adds rendering/runtime/caching boundaries without approved SEO/SSR need; can blur browser/backend authority | [NOT-RECOMMENDED] Initial Pilot |
| Vue + Vite | Concise templates and approachable reactivity | Stack migration from ADR-002 without project-specific benefit | [NOT-RECOMMENDED] No demonstrated advantage |
| Nuxt | Vue SSR/full-stack conventions | Same absent SEO/SSR need plus another server surface | [NOT-RECOMMENDED] Initial Pilot |
| Angular | Integrated framework, forms, DI, enterprise conventions | Higher framework/tooling cost for a bounded Pilot and ADR migration | [NOT-RECOMMENDED] No team/scale evidence |
| Server templates | Simple server-rendered forms and fewer client dependencies | Poor fit for device/media interaction, reconnecting session UI, and scoped realtime updates | [NOT-RECOMMENDED] Core experience |

[REVISIT-WHEN] Consider Next.js/Nuxt only if public indexable pages, measured first-render needs, or server-owned composition justify an extra runtime. SEO and SSR are not current product requirements.

## Participant and workforce surfaces

| Choice | Advantages | Risks | Decision |
| --- | --- | --- | --- |
| One technology base | Shared accessibility primitives, error model, API client conventions, security controls | Accidental component/data reuse can expose workforce fields | [RECOMMENDED] React/Vite for both |
| One codebase/build | Fast initial reuse and one release pipeline | Larger authorization blast radius and coupled deploys | [OPEN] Only if strict route/bundle/test boundaries suffice |
| Separate participant and workforce projects | Stronger deployment, data, and operational separation | Duplicate tooling and shared-component governance | [REVISIT-WHEN] Different teams, release cadence, threat boundary, or hosting access |

Regardless of project layout, participant, operator, and reviewer permissions remain server-enforced. Workforce searches send explicit scoped criteria and receive only authorized rows/fields; hiding a menu or route is not access control.

## Client state and server interaction

| Client concern | Allowed responsibility | Prohibited authority |
| --- | --- | --- |
| Form/input state | Drafts, validation hints, retry intent | Durable submission result |
| View state | Tabs, focus, disclosure expansion, device preference | Current grant, assignment, sanction, session stage |
| REST | Submit idempotent command and load scoped snapshot | Inferring commit from network success alone |
| SSE | Receive minimal post-commit change hint | Treating payload as final state or sensitive snapshot |
| Polling | Recover snapshot when SSE is unavailable | Creating a parallel state machine |
| WebRTC/LiveKit | Device/media transport and connection display | Official session start/end or capability |
| Error UI | Distinguish local/device, transport, authentication, authorization, conflict, validation, pending/unknown, and server failure | Reclassifying a server failure as completed work |

```text
UI action -> REST command -> explicit pending/unknown/success response
SSE hint or reconnect -> REST snapshot requery -> render current server state
uncertain network result -> same idempotency key -> retrieve recorded outcome
```

- [RECOMMENDED] Revalidate current session and resource scope on the server for every command; frontend guards only improve navigation.
- [RECOMMENDED] On SSE loss show stale/reconnecting state, retry with backoff, use polling fallback, and reload the snapshot after reconnection.
- [RECOMMENDED] Keep sensitive state in memory only as needed. Do not place session tokens, private choices, reports, identity data, signed URLs, or unnecessary personal data in local/session storage, URLs, analytics, crash reports, or notifications.
- [RECOMMENDED] Clear or replace stale participant/workforce data on logout, role/scope change, account suspension, assignment end, and navigation across resource boundaries.

## REST, GraphQL, and BFF boundary

| Pattern | Current fit | Cost | Decision |
| --- | --- | --- | --- |
| REST | Explicit commands, snapshots, error/idempotency semantics, backend authority | Endpoint/query evolution requires discipline | [RECOMMENDED] Baseline |
| GraphQL | Flexible composition for many clients/screens | Field-level authorization, caching, query cost, schema and sensitive overfetch controls | [NOT-RECOMMENDED] No demonstrated composition problem |
| BFF | Client-specific aggregation and policy facade | Another deployment/authorization boundary | [NOT-RECOMMENDED] No independent client needs |

[REVISIT-WHEN] Reconsider GraphQL or a BFF only when several independently released clients have measured over/under-fetching or composition problems that cannot be handled safely by scoped REST read models. Neither becomes a permission authority.

## Mobile Web, PWA, and native gate

- [CONFIRMED] Native applications and store distribution are outside the current Pilot baseline. PWA capability may improve install/return behavior but cannot be assumed to provide native background, push, Bluetooth, interruption, or deep-link behavior.
- [RECOMMENDED] Test iOS Safari and Android Chrome on actual representative devices for microphone permission/selection/mute, Bluetooth routing, calls/alarms, app switching, lock/background, tab suspension, Wi-Fi/mobile handoff, reconnect, duplicate join, and authenticated deep-link return.
- [RECOMMENDED] A failed device/media flow explains what failed, what the browser can detect, how to retry, and whether pass, text alternative, operator help, or reschedule is available. It never pressures camera/microphone consent.
- [REVISIT-WHEN] Evaluate Expo/React Native only when approved real-device join, reconnect, interruption, media, deep-link, accessibility, or notification gates fail and a native capability can remedy the measured gap.
- [OPEN] Device matrix, observed results, developer capacity, app-store lead time, notification/store policies, native SDK behavior, and participant install willingness remain evidence gates; native evaluation is not implementation approval.

## Accessibility and interaction requirements

- [CONFIRMED] Preserve the D-024 responsive/mobile/accessibility behavior baseline: visible pass/recovery, thinking time, text alternative where approved, scalable text, high contrast, non-color status, reduced motion, and clear current disclosure.
- [RECOMMENDED] Every interaction is keyboard operable with visible focus, logical order, focus recovery after route/stage changes, accessible error summary, and no hover-only or pointer-only operation.
- [RECOMMENDED] Screen readers receive meaningful headings, control names, state changes, time/progress alternatives, and non-duplicative live-region announcements; realtime hints do not repeatedly expose private data.
- [OPEN] Captioning and any media transcription require separate accuracy, privacy, retention, disclosure, and vendor approval.

## Testing and release gates

- [RECOMMENDED] Unit/component tests cover view states and error mapping; API integration tests cover auth expiry, forbidden scope, conflict, idempotent retry, and stale snapshot; browser E2E covers participant/operator/reviewer critical paths.
- [RECOMMENDED] Actual-device regression covers iOS Safari and Android Chrome media, interruption, network transitions, keyboard, screen reader, zoom, focus recovery, and SSE-to-polling recovery.
- [RECOMMENDED] Telemetry may record app/version, coarse supported device class, permission outcome, media-ready latency, reconnect outcome, stage-version mismatch, and error class without raw voice, identity, private choice, report content, or credentials.
- [OPEN] Browser support matrix, numeric release thresholds, analytics product/vendor, crash-report retention, and real-device results require approved evidence before a live Pilot.
