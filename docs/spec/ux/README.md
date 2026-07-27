---
title: Approved UX Baseline
classification: user decision
status: approved UX baseline
implementation_ready: false
decision_authority: D-024
document_type: UX prerequisite
last_verified: 2026-07-28
related_documents: ["../mvp-scope.md","../../discovery/decisions.md","../../../DESIGN.md"]
---

# Approved UX Baseline

## Purpose

This directory contains the owner-approved D-024 UX baseline. It authorizes
only the isolated low-fidelity React Mock Prototype. It contains no final
visual design and does not authorize production contracts or implementation.

## Required approval areas

1. Information architecture and navigation.
2. Participant and operator screen inventory with empty/loading/error/expiry states.
3. End-to-end journey, session stages and three reusable game interactions.
4. Private initial interest, progressive disclosure, final choice and no-match closing.
5. Reconnect, refresh, background, participant-loss, provider-failure and cancellation recovery.
6. Report, block, immediate exit, operator control, sanction and appeal interaction.
7. Mobile-first live-session shell and responsive behavior.
8. Keyboard, screen-reader, reflow, non-color, reduced-motion and voice alternatives.
9. Korean critical-state microcopy and emotional-safety treatment.
10. Low-fi wireflows, a tool-neutral visual brief for a future React Mock Prototype, usability evidence and acceptance criteria.

## UX gate closure matrix

| Required area | Decision coverage | Primary UX document |
| --- | --- | --- |
| Information architecture | 001 | [Information architecture](information-architecture.md) |
| Screen inventory | 002 | [Screen inventory](screen-inventory.md) |
| Primary journeys/session | 003–005 | [Session wireflow](session-wireflow.md) |
| Disclosure/interest/no-match | 006–008 | [Disclosure](progressive-disclosure-wireflow.md) |
| Reconnect/failure | 009 | [Failure/recovery](failure-and-recovery-workflow.md) |
| Report/block/moderator | 010 | [Safety/reporting](safety-and-reporting-wireflow.md) |
| Responsive/mobile | 011 | [Mobile rules](mobile-interaction-rules.md) |
| Accessibility | 012 | [Accessibility](accessibility-requirements.md) |
| Visual language/Korean copy | 013 | [Frontend visual brief](frontend-visual-brief.md) |
| Prototype scope/evidence | 003–013 | [Acceptance criteria](ux-acceptance-criteria.md) |

All areas are approved in the [decision register](open-ux-decisions.md) and
[decision log](../../discovery/decisions.md). The gate is satisfied for a
low-fidelity prototype only. API, DB, real-time, production frontend/backend,
vendor and infrastructure work require a new explicit phase.

## Source-of-truth layers

| Layer | Document | Responsibility |
| --- | --- | --- |
| Approved product | [MVP scope](../mvp-scope.md) | cohort, features, exclusions, failure rules |
| Approved session | [Session experience](../session-experience.md) | timing, three games, allowed/prohibited behavior |
| Approved disclosure | [Progressive disclosure](../progressive-disclosure.md) | resources, consent, audience, revocation boundary |
| Approved progression | [Matching/progression](../matching-and-progression.md) | private choices, mutuality, 10-minute voice |
| Approved safety | [Trust/safety](../trust-safety-moderation.md) | admission, block, report, moderation principles |
| Durable design proposal | [Root DESIGN.md](../../../DESIGN.md) | design principles, content voice and review boundary |
| UX decision register | [Approved UX decisions](open-ux-decisions.md) | approved UX-OQ-001–013 and residual limits |

## Core approved UX documents

| Document | Responsibility |
| --- | --- |
| [Information architecture](information-architecture.md) | approved service areas and navigation |
| [Screen inventory](screen-inventory.md) | participant/operator review boundaries |
| [User-flow decisions](user-flow-decisions.md) | approved interaction behavior and deferred contracts |
| [Session wireflow](session-wireflow.md) | session entry, stages and recovery |
| [Progressive disclosure wireflow](progressive-disclosure-wireflow.md) | consent, reveal, interest and no-match |
| [Safety/reporting wireflow](safety-and-reporting-wireflow.md) | block, report, operator and appeal |
| [Accessibility requirements](accessibility-requirements.md) | interaction alternatives and evidence obligations |

## Supporting approved UX documents

| Document | Responsibility |
| --- | --- |
| [Design principles](design-principles.md) | user-centered principles and competitor adoption/rejection |
| [Emotional journey](emotional-journey.md) | pressure, uncertainty, disappointment and safe support |
| [End-to-end workflow](end-to-end-workflow.md) | complete participant lifecycle and critical branches |
| [Screen/state model](screen-state-model.md) | review-only screen keys and cross-cutting states |
| [Low-fi wireflows](low-fi-wireflows.md) | text wireflows for preparation, live, disclosure, safety, recovery |
| [Frontend visual brief](frontend-visual-brief.md) | tool-neutral visual, layout, state, responsive and accessibility brief for a future React Mock Prototype |
| [Game interaction pattern](game-interaction-pattern.md) | reusable shell for the three approved games |
| [No-match and safe closing](no-match-and-safe-closing.md) | rejection-safe results and Korean critical copy |
| [Failure/recovery workflow](failure-and-recovery-workflow.md) | reconnect, interruption, loss and cancellation UX |
| [Mobile interaction rules](mobile-interaction-rules.md) | mobile-first live shell and device behavior |
| [Usability test plan](usability-test-plan.md) | prototype scenarios, safety and accessibility research |
| [UX acceptance criteria](ux-acceptance-criteria.md) | unique review criteria and evidence expectations |

## Competitive evidence boundary

- [Competitive pattern proposal](../../research/ux/competitive-patterns.md) maps previously collected mechanisms to proposed adoption/rejection.
- [Friction and antipattern proposal](../../research/ux/competitor-friction-and-antipatterns.md) converts evidence limits into testable risks.
- Research does not prove value, safety, retention, market fit, legal compliance or D-024 approval.

## Non-authority

These drafts do not approve routes, components, visual styling, token values, microcopy, API paths, DTOs, database columns/enums, event names/payloads, page authorization, implementation issues or source code. Approved ADRs, vendors, region and technical baseline remain unchanged.

## Review and prototype entry point

Use the [Korean MVP UX review package](../../reviews/mvp-ux-review-package-ko.md)
for approval history, residual risks and prototype evidence.
