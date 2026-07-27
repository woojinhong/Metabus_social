---
title: Open Questions and Remaining Gates
document_type: discovery register
classification: open question
status: Mixed: product baseline resolved; UX/legal/procurement gates open
last_verified: 2026-07-27
related_documents: ["decisions.md","../spec/ux/open-ux-decisions.md","../spec/traceability-implementation.md"]
decision_authority: decisions.md only
---

# Open Questions and Remaining Gates

## Resolved by approved decisions

| Prior question IDs | Resolution |
| --- | --- |
| OQ-COH-001..005 | D-002 fixes Seoul, ages 25-39, exactly six, target 3:3 compatible heterosexual Pilot cohort; fairness/inclusion/legal review remains a live gate |
| OQ-ID-001..003 | D-014 selects NICE PASS with provider-supported SMS fallback and conservative 19th-birthday policy |
| OQ-ID-004..007 | D-006 excludes raw documents, liveness, face comparison, biometrics, CI/DI and manual document bypass; provider/accessibility details remain gates |
| OQ-SES-001..002 | D-003 fixes 90 minutes and three approved games plus free conversation |
| OQ-SES-003 | D-007 defers temporary subgroups |
| OQ-SES-004..007 | Product-level stage, pass/text alternatives and operator authority are fixed; exact interaction remains pending D-024 |
| OQ-PRG-001..006 | D-004 fixes zero-to-two initial interest, mutual-consent reveal, zero-to-one final choice, private no-match and ten-minute mutual voice |
| OQ-SAF-001..006 | D-006/D-019/D-023 fix core safety, identity, capture warning, sanctions and appeal principles; legal/UX details remain gates |
| OQ-OPS-001..004 | D-005 excludes payment/deposit; D-015 fixes notification strategy; D-018/D-019 fix retention and moderation principles |
| OQ-OPS-005..006 | Live facilitator and offline coordination are deferred by D-007 |
| OQ-TECH-001..005 | D-008..017 accept PWA, modular Spring, NCP Korea, PostgreSQL, conditional Redis, LiveKit, Object Storage and observability boundaries |

Decision does not validate the related assumptions. Evidence collection remains necessary.

## Required UX approval questions

The authoritative list is [open-ux-decisions.md](../spec/ux/open-ux-decisions.md). D-024 keeps information architecture, screens, navigation, waiting/session/game controls, disclosure/interest/no-match, reconnect/late join, report/block/moderator, responsive/mobile, design system and accessibility interaction unresolved.

## Legal and privacy gates

- Is the lawful basis, notice/consent language and processor allocation adequate for dating preferences, NICE verification and safety evidence?
- Are the 25-39 and 3:3 Pilot recruitment/compatibility rules lawful, fair, inclusive and explainable?
- What exact cross-border notices/contracts apply to LiveKit Japan/Singapore paths and Grafana Cloud telemetry?
- Does any specific Korean law require retention beyond the approved product periods? None was established by this task.
- What incident, breach notification, law-enforcement and information-subject request procedures are required?

## Procurement and operations gates

- NICE contract fields, callback/security, foreign/MVNO coverage, deletion and outage/SLA.
- LiveKit DPA/subprocessors/retention, Korea device latency/reconnect and Build quota dashboard behavior.
- NCP business account, VAT-inclusive budget, Cloud DB G3/version/extensions/restore, Secret Manager and support terms.
- SENS sender, Kakao template, rate/retention confirmation and SENS Mail verification after 2026-09-17.
- Grafana region/DPA/subprocessors/export/delete and hard-limit alerts.
- Moderator staffing/training/coverage, appeal independence, break-glass and incident tabletop.

## Implementation gate

No endpoint-level OpenAPI, database schema, real-time payload/state machine, frontend component contract or source-code implementation may become authoritative until D-024 is explicitly closed. See [traceability gate](../spec/traceability-implementation.md).

