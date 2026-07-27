---
title: Draft Accessibility Interaction Requirements
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../web-mobile-experience.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft Accessibility Interaction Requirements

## Approved outcomes

Critical journeys must support keyboard, screen reader, 200% zoom/reflow, visible focus, non-color state, reduced motion, plain errors and immediate safety exit. Live interaction offers pass, repetition, thinking time and compatible text alternatives. Safety functions never require payment.

## Interaction requirements to design and test

| Area | Required outcome | Unresolved design choice |
| --- | --- | --- |
| Voice | participant can understand who may hear them and mute/leave reliably | audio focus, turn cue, speaker identification |
| Hearing | essential instruction/status is not audio-only | captions versus text summaries; privacy notice |
| Speech | pass/text alternative without public stigma | when text is allowed and how read aloud/displayed |
| Vision | screen-reader order, names, live-region restraint and protected-media description | participant representation and reveal announcement |
| Motor | keyboard/switch access, large targets, no precise gesture | mobile control placement and timeout extension |
| Cognition/neurodivergence | predictable stage, plain instructions, examples, extra time, low surprise | timer treatment, animation, prompt density |
| Social anxiety | private choice, pass, preparation and exit without explanation | pre-session preview and neutral prompts |
| Language/literacy | concise Korean, examples, error recovery, no forced cleverness | help depth and terminology |
| Device/network | safe recovery without blame or lost authority | offline/reconnect presentation |

## Acceptance preparation

The UX phase must define task-level criteria for registration, eligibility, reservation, device check, waiting, session, interest, reveal, result, report, appeal and account deletion. Test with target participants and assistive technology on the approved device matrix. Automated checks are necessary but insufficient.

No page-level accessibility acceptance criterion is approved until the corresponding wireflow and responsive behavior are approved.

