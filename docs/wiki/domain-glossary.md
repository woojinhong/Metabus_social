---
title: Domain Glossary
document_type: wiki navigation
classification: confirmed fact
status: Non-authoritative summary
last_verified: 2026-07-27
related_documents:
  - ../architecture/domain-boundaries.md
  - ../spec/session-experience.md
decision_authority: none; follow linked authoritative sources
---

# Domain Glossary

| Term | Working meaning | Canonical owner |
| --- | --- | --- |
| Cohort | compatible participants assigned to one scheduled session | [domain boundaries](../architecture/domain-boundaries.md) |
| Session | bounded scheduled experience in one main media room | [session spec](../spec/session-experience.md) |
| Stage | server-authoritative phase controlling actions and visibility | [state machine](../architecture/application-architecture.md) |
| Eligibility | private facts and policy outcomes required to participate | [identity research](../research/technology/identity-verification-options.md) |
| Progressive disclosure | consent-controlled change in who may access which profile resource | [disclosure spec](../spec/progressive-disclosure.md) |
| Consent grant | scoped, expiring, revocable authorization for a subject, audience, resource, purpose, session, and stage | [security architecture](../architecture/security-privacy.md) |
| Initial interest | private, non-public expression before limited reveal | [progression spec](../spec/matching-and-progression.md) |
| Mutual progression | compatible private choices that create eligibility for a next step, not consent to every next step | [progression spec](../spec/matching-and-progression.md) |
| Real-time media | audio/video transport; not session or consent authority | [media architecture](../architecture/realtime-media.md) |
| Durable state | application facts reconstructed from PostgreSQL | [data architecture](../architecture/data-architecture.md) |
| Ephemeral projection | TTL presence, timer, or room view reconstructable from durable state | [data architecture](../architecture/data-architecture.md) |
| Healthy exit | ability to choose no connection, leave, block, or withdraw without exposure or retaliation | [safety spec](../spec/trust-safety-moderation.md) |
| Evidence gap | claim not established by available primary evidence | [research index](../research/README.md) |

All terms are working definitions unless an explicit decision approves them.
