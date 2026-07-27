---
title: Draft Accessibility Interaction Requirements
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../web-mobile-experience.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved Accessibility Interaction Requirements

## Approved outcomes

Critical journeys must support keyboard, screen reader, 200% zoom/reflow, visible focus, non-color state, reduced motion, plain errors and immediate safety exit. Live interaction offers pass, repetition, thinking time and compatible text alternatives. Safety functions never require payment.

## Task-level requirements

| Area | Required outcome | Approved boundary |
| --- | --- | --- |
| Voice | participant understands audience and can mute/leave reliably | stable neutral speaker/turn text; no recording |
| Hearing | essential instruction/status is textual | no automatic transcription inferred; live speech limitation documented |
| Speech | pass/structured text without public stigma | audience/effect stated before approved sharing |
| Vision | logical order, names, restrained live regions and protected scope | no automated facial-trait description |
| Motor | keyboard/switch access, large targets, no precise gesture | 44×44 review baseline; non-stigmatizing time option |
| Cognition/neurodivergence | predictable stage, plain instructions, examples, extra time | restrained timer and reduced motion |
| Social anxiety | private choice, pass, preparation and exit without explanation | neutral prompts and no public accommodation label |
| Language/literacy | concise Korean, examples, error recovery | consistent approved terms |
| Device/network | safe recovery without blame or lost authority | inline/overlay/blocking classification |

## Interaction behavior

- Visual and DOM/focus order is status → task → response → controls → safety.
- Stage changes update the heading and announce once without stealing focus from
  an active control. Timers announce start, meaningful urgency and close only.
- Dialogs and overlays define focus entry, containment where modal, Escape/cancel
  behavior and focus return; Escape never means leaving the session.
- Every protected/failure path includes keyboard and screen-reader recovery.
- Protected reveal announces resource, named audience and expiry only; it does
  not auto-open or generate appearance descriptions.
- Safety actions must be distinguishable and reachable within ten seconds.
- WCAG 2.2 AA is the review target. No certification or full voice equivalence
  is claimed; live speech without transcription remains a documented Pilot risk.

## Acceptance preparation

The UX phase must define task-level criteria for registration, eligibility, reservation, device check, waiting, session, interest, reveal, result, report, appeal and account deletion. Test with target participants and assistive technology on the approved device matrix. Automated checks are necessary but insufficient.

Manual keyboard, screen-reader, 200% reflow, reduced-motion, non-color and
target-device testing is required; automated checks alone cannot establish
production accessibility.

