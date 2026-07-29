---
title: Product Concept Hub
document_type: discovery
classification: proposal
status: Exploration around approved Pilot
last_verified: 2026-07-28
related_documents:
  - decisions.md
  - assumptions.md
  - open-questions.md
  - session-model-proposal.md
  - ../spec/mvp-scope.md
decision_authority: decisions.md; this file remains exploratory
---

# Product Concept

> The bounded Pilot and [D-024 UX baseline](decisions.md#d-024-required-ux-approval-gate)
> are approved and summarized in [product-brief.md](product-brief.md). This
> document retains alternatives, hypotheses and future exploration; it does not
> override approved scope, close assumptions or authorize Implementation
> Contract promotion.

## 1. Purpose and authority

This is the discovery hub around the approved bounded Pilot. **Confirmed fact:** this file does not create authority; [decisions.md](decisions.md) approves the product/MVP boundary, while alternatives, expected effects and future features here remain proposals or assumptions.

## 2. Current product idea

**User decision:** exactly six eligible, compatible adults reserve a time and enter a private, account-bound online room for voice-first group interaction. They do not browse one another through ordinary dating profiles before the session. The Seoul, age and 3:3 Pilot constraints are recorded in [MVP scope](../spec/mvp-scope.md).

**User decision:** private matching inputs include dating intent, compatible age preferences, relationship-orientation compatibility, Seoul activity area, availability and approved hard lifestyle constraints. The target 3:3 Pilot composition is reversible and still requires fairness, inclusion and legal review.

**User decision:** face photo, exact age, occupation category and detailed profile remain hidden initially; the exact approved reveal boundary is in [progressive disclosure](../spec/progressive-disclosure.md). Company, detailed location, contact details and social accounts are not group-session disclosures.

## 3. Core hypothesis

**Proposal:** scheduled voice games, shared activity, progressive disclosure, and mutual progression gates may delay appearance-first evaluation and reduce the blank-page problem of ordinary one-to-one chat.

**Assumption:** these mechanisms create curiosity and useful conversation without causing unacceptable performance pressure, privacy harm, or delayed-rejection pain. Competitor use does not validate the effect.

## 4. Problem hypothesis

**Assumption:** some adults who want dating connections can start a conversation but struggle to continue when they lack shared context, perceive high rejection cost, or feel pressure to produce clever one-to-one messages.

**Evidence gap:** the problem has not been validated across target segments, genders, orientations, accessibility needs, or Korean local markets.

## 5. Target-user hypotheses

- **User decision:** Seoul-area adults aged 25–39 seeking heterosexual dating in a compatible six-person Pilot cohort.
- **Assumption:** the cohort can be filled and the voice-first format is acceptable to intended participants.
- **Open question:** who is excluded or harmed by voice-first, scheduled, identity-bound participation, and what later inclusive cohort models merit research?

See [user needs](user-needs.md) and [open questions](open-questions.md).

## 6. Current alternatives

**Research finding:** profile-based dating emphasizes asynchronous individual evaluation; facilitated services coordinate attendance and may provide shared prompts; voice/community products create synchronous interaction but usually pursue different intents. See [product-model comparison](../research/dating-products/product-model-comparison.md).

**Research interpretation:** no comparator proves progressive disclosure, a six-person cohort, or scheduled voice games will work for this project.

## 7. Solution hypotheses

- **User decision:** use three stable first-session formats with reviewed rotating content, then protect time for free conversation.
- **User decision:** keep profile disclosure consent-based and audience-specific.
- **User decision:** keep interest private and require compatible mutual progression before one-to-one voice.
- **User decision:** use system-guided timing plus assigned operator safety controls; a live facilitator is excluded from the Pilot.
- **Proposal — Deferred:** temporary small groups, webcam, offline booking, payments, deposits, biometric comparison, and manual identity-document review.

Detailed conditional behavior belongs in [specifications](../spec/README.md), not this hub.

## 8. Product-model alternatives

| Alternative | Primary value | Key dependency | Status |
| --- | --- | --- | --- |
| Profile-first matching | fast individual screening | large recommendation pool | research comparator |
| Scheduled facilitated group | shared experience and attendance | cohort fill and operations | approved bounded Pilot |
| Activity/community discovery | repeated interest-based contact | organizer/content supply | alternative hypothesis |
| Voice-first open room | spontaneous presence | synchronous liquidity and moderation | alternative hypothesis |
| Coordinated offline meeting | credible real-world progression | venues, attendance, safety support | deferred hypothesis |

## 9. Linked discovery detail

- [User-needs framework](user-needs.md)
- [Session-flow and disclosure proposal](session-model-proposal.md)
- [Product risks, business hypotheses, and boundaries](product-risks-and-boundaries.md)
- [Research interpretation and promotion map](research-interpretation.md)
- [Assumption register](assumptions.md)
- [Open-question register](open-questions.md)

## 10. Decision boundary

**Confirmed fact:** [decisions.md](decisions.md) approves the bounded
product/MVP, platform and D-024 UX baseline. Implementation Contract promotion,
application code and live operation remain unauthorized.

## 11. Change log

- 2026-07-27: split the discovery hub by responsibility; added architecture-planning links without approving the concept.
- 2026-07-27: recorded scheduled group dating, progressive disclosure, games, mutual progression, safety risks, and optional offline progression as exploratory proposals.
