---
title: Product Concept
type: discovery
status: draft
owner:
last_verified: 2026-07-24
related:
  - docs/INDEX.md
  - docs/discovery/product-brief.md
  - docs/discovery/assumptions.md
  - docs/discovery/open-questions.md
  - docs/discovery/decisions.md
---

# Product Concept

## 1. Document purpose

This is the single working document for early product discovery. Nothing in this document is automatically approved.

- Approved decisions must be recorded in [decisions.md](decisions.md).
- Sufficiently validated product conclusions may later be summarized in [product-brief.md](product-brief.md).
- Approved user-facing functionality may later be promoted into [docs/spec/](../spec/README.md).
- Approved technical decisions may later be promoted into [docs/adr/](../adr/README.md).

Every substantive entry must carry both a project classification and, when useful, an origin/type qualifier. Allowed project classifications are confirmed fact, user decision, assumption, research finding, proposal, and open question. User statements are not automatically decisions. Model inferences and solution hypotheses remain assumptions or proposals until explicitly approved.

## 2. Current product idea

### Initial description

- **Working statement:** A scheduled, facilitator-led social-connection service where 6–10 verified adult strangers participate in shared activities in a lower-pressure environment. Participants are open to friendship and romance, and only mutually desired relationships deepen.
- **Classification:** proposal
- **Origin:** user statement refined through deep interview
- **Status:** Unapproved

### Motivation

- **Working statement:** Some users can begin conversations after encountering another person but see them end after only a few exchanges because shared topics are unclear, rejection and awkwardness feel costly, and they do not know how to continue.
- **Classification:** assumption
- **Origin:** user experience; initially male/self perspective
- **Status:** Requires direct user research

### Desired experience

- **Working statement:** Strangers gain conversational momentum through shared action and facilitation rather than immediate photo-first evaluation or unstructured one-to-one text chat.
- **Classification:** proposal
- **Origin:** user statement and model synthesis
- **Status:** Unapproved

### Proposed differentiator

- **Working statement:** The product sells a safe, hosted social experience rather than profile access, appearance ranking, or guaranteed romantic outcomes.
- **Classification:** proposal
- **Origin:** model inference grounded in user selections and external research
- **Status:** Unapproved

### Current confidence

- **Working statement:** The problem and product-model hypotheses are interview-crystallized but not market-validated. The delivery medium, quantitative demand, operating feasibility, and unit economics remain unresolved.
- **Classification:** assumption
- **Status:** Medium confidence in problem framing; low confidence in solution-market fit

### Source classification

- User statements and preferences from a 17-round deep interview completed on 2026-07-24.
- External research findings verified on 2026-07-24.
- Model synthesis is labeled as assumption or proposal.
- No product or MVP decision has been approved.

## 3. Problem hypothesis

| Element | Working statement | Classification | Evidence | Status |
| --- | --- | --- | --- | --- |
| Observed problem | Early conversations begin but die after a few exchanges. | assumption | User's prior dating-app experience | Requires user research |
| Affected user | An adult open to friendship and romance who struggles to sustain unstructured early conversation. | proposal | User-selected behavioral segment | Unapproved |
| Triggering situation | A new interaction starts without sufficient shared context or a comfortable way to continue. | assumption | User experience; conversation research | Partially supported |
| Current user behavior | Uses photo/profile matching and text chat, or considers offline singles events. | assumption | User statement | Market prevalence unverified |
| Current workaround | Attempts text conversation, attends or considers facilitated offline social events, or does nothing. | assumption | User statement and market observation | Unverified |
| Functional pain | No shared activity or conversational scaffold; difficult transition from profile evaluation to reciprocal interaction. | assumption | User experience; research finding | Requires validation |
| Emotional pain | Rejection, awkwardness, authenticity uncertainty, appearance pressure, and safety concern. | assumption | User experience; external research context | Requires segment-specific validation |
| Cost of leaving unresolved | Conversations repeatedly end, social energy declines, and potential friendships or romantic relationships never develop. | assumption | Model inference | Unverified |

## 4. Target-user hypotheses

| ID | User hypothesis | Situation | Need | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| TU-001 | Verified adult open to friendship and romance whose conversations start but end quickly. | Meeting a stranger outside the user's normal social graph. | Shared context, lower-pressure participation, and mutual control over relationship progression. | User-selected target; research shows context and gender differences. | Primary hypothesis; unapproved |
| TU-002 | Safety-sensitive participant who may face message overload, unwanted contact, or trust concerns. | Considering interaction with unknown people. | Strong verification, facilitation, privacy, and control. | Research finding; not selected as primary initial pain. | Required safety stakeholder |

The first geographic market, age band, relationship orientation, accessibility needs, and cohort-composition rules remain open questions.

## 5. User-needs framework

### Functional needs

- Shared activity or context that makes conversation easier to start and sustain.
- A scheduled group with enough participants to create social energy.
- Facilitation when conversation stalls or conduct becomes unsafe.
- Mutual selection before one-to-one access.

**Classification:** proposal based on user statements; unapproved.

### Emotional needs

- Lower rejection and awkwardness pressure.
- Confidence that participation does not require immediate one-to-one performance.
- A sense that a completed interaction has value even without romantic continuation.

**Classification:** assumption; requires user research.

### Social needs

- Meet people outside the normal social graph.
- Gain belonging and social vitality.
- Form friendships or romantic relationships without promising either outcome.

**Classification:** user-origin outcome hypothesis.

### Trust and safety needs

The user selected all of the following as minimum requirements:

1. Adult eligibility and identity verification.
2. Photo/video-to-person consistency verification.
3. Live facilitator with immediate removal authority.
4. No one-to-one access before mutual selection.
5. Blocking, reporting, and sanctions.
6. Restrictions on recording, capture, and personal-information sharing.

**Classification:** proposal / user requirement candidate; not an approved policy, legal conclusion, or MVP.

### Identity and self-expression needs

Avatars, profile information, voice, video, and activity-based expression may reveal personality beyond static photos. Whether any of these mechanisms reduce appearance bias or increase trust is unproven.

**Classification:** solution hypothesis.

### Relationship or connection needs

Participants are open to friendship and romance. Consensual casual or sexual relationships may later develop, but the service does not display or match sexual intent.

**Classification:** proposal based on user-stated boundary; unapproved.

### Reasons to return

The primary retention hypothesis is meeting new people in each session. New themes, games, activities, avatar status, and existing-relationship progression are secondary or unselected retention mechanisms.

**Classification:** user-selected assumption.

## 6. Current alternatives

| Alternative | Why users choose it | Benefit | Friction | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| Photo/profile dating apps | Efficient discovery and broad user supply | Fast filtering and asynchronous access | Conversations may lack shared context; authenticity, safety, appearance pressure, and monetization concerns | User experience; external research context | Requires market-specific validation |
| Verified or status-filtered dating apps | Stronger trust or socioeconomic filtering | Clear positioning and eligibility signals | Can reinforce exclusion, ranking, or narrow selection | User market observation | Unverified market claim |
| Offline singles parties | Real-time interaction and visible presence | Immediate social information | Appearance-first evaluation and direct conversational performance may feel burdensome | User observation | Demand and participant mix unverified |
| General activity communities | Shared interests and low romantic pressure | Natural conversation context | Relationship intent may be unclear or incompatible | Model inference | Requires comparison research |
| Doing nothing | Avoid rejection, cost, and safety risk | No exposure to platform harms | No new social connection | Model inference | Unverified |

## 7. Solution hypotheses

| ID | Solution hypothesis | User problem addressed | Expected benefit | Major risk | Evidence needed | Status |
| --- | --- | --- | --- | --- | --- | --- |
| SH-001 | Scheduled facilitator-led sessions for 6–10 strangers | Low initial liquidity; conversational awkwardness | Concentrates users and provides live support | Operational cost, facilitator bottleneck, no-shows | Hosted pilot evidence | Proposed |
| SH-002 | Shared themes, games, or activities | Lack of common topics | Creates conversational context | May feel artificial or distract from compatibility | Comparative session tests | Proposed |
| SH-003 | Mutual opt-in before one-to-one access | Unwanted contact and rejection pressure | Preserves agency and consent | Intent mismatch may appear late | Safety and usability research | Proposed |
| SH-004 | Adult identity plus photo/video consistency verification | Authenticity and impersonation concern | Increases confidence in participants | Sensitive-data and onboarding burden | Legal, privacy, security, and conversion evidence | Proposed |
| SH-005 | Live voice, video, avatar, or virtual space | Text friction and appearance-first evaluation | Richer self-expression and presence | Voice/video can increase performance or appearance pressure | Modality experiments | Open solution hypothesis |
| SH-006 | Transparent per-session ticket | Funds high-touch operations | Aligns payment with a delivered experience | Price may suppress liquidity | Willingness-to-pay and unit-economics tests | Research-informed proposal |

## 8. Product-model alternatives

| Comparison dimension | Facilitated social-connection sessions | Metaverse dating app | Evidence needed | Status |
| --- | --- | --- | --- | --- |
| User value | Safe shared experience and new social contact | Immersive identity and romantic discovery | Direct user preference and behavior | Facilitated model preferred as proposal |
| Interaction model | Scheduled 6–10-person hosted activity | Always-on virtual exploration and interaction | Prototype comparison | Open |
| Network-effect dependency | High by time slot and cohort | Very high for always-on world liquidity | Fill-rate and retention data | Open |
| Cold-start risk | Managed through scheduled cohorts | Empty-world risk | Pilot operations | Open |
| Trust and safety burden | High and operationally explicit | High at larger scale and across persistent spaces | Safety review | Open |
| Operational burden | Facilitator and cohort management | Content, world, moderation, and infrastructure | Cost modeling | Open |
| Repeat-use potential | New participants each session | New people plus progression/content | Retention experiments | Open |
| Monetization compatibility | Per-session ticket; later optional bundles | Subscription, virtual goods, or premium access | Trust and willingness-to-pay tests | Open |
| Technical complexity | Undecided; potentially lower | Potentially high | Product validation before planning | Open |
| Validation cost | Manually hostable | Requires a convincing virtual prototype | Pilot design | Open |

**Working proposal:** Validate facilitated shared action before committing to a metaverse delivery model.

## 9. Core experience hypotheses

### First-use experience

A verified adult books a scheduled session, understands the relationship and conduct boundaries, and receives clear attendance, cancellation, privacy, and safety information.

**Classification:** proposal.

### Discovery experience

The service places 6–10 people into a new cohort. The participant expects friendship and romantic possibility but no guaranteed match or date.

**Classification:** proposal.

### Interaction experience

A facilitator and shared activity create common ground. Participation should feel voluntary, balanced, and safe rather than forced to fill a time target.

**Classification:** proposal.

### Progression or relationship-building experience

After the group experience, one-to-one access requires mutual selection. Friendship and romance may deepen; sexual intent is not displayed or matched.

**Classification:** proposal.

### Return experience

The user returns primarily to meet new people. Fresh participant supply and avoidance of unwanted repeat encounters are more important than avatar progression.

**Classification:** user-selected assumption.

### Exit or transition experience

Leaving after finding a friend, partner, or stable social group may represent successful user value rather than product failure.

**Classification:** model inference.

### Online-to-offline transition, if relevant

An offline meeting is optional and is not required for a session to count as successful. The service's reporting and responsibility boundary for offline incidents remains unresolved.

**Classification:** user-defined outcome boundary plus open question.

## 10. Trust, safety, and misuse risks

| Category | Risk hypothesis | Evidence needed | Status |
| --- | --- | --- | --- |
| Identity and impersonation | False identity or outdated/misleading visual presentation undermines participation. | Verification efficacy, privacy cost, false-positive data | Critical open risk |
| Harassment and sexual misconduct | Friendship/romance ambiguity can be exploited for unwanted sexual pressure. | Incident research and policy tests | Critical open risk |
| Consent and unwanted contact | Rejection may lead to persistence, retaliation, or cross-channel contact. | Mutual-opt-in and enforcement tests | Critical open risk |
| Minors and age gating | Adult eligibility is required but the reliable process is undecided. | Legal and verification review | Critical open risk |
| Fraud and monetization abuse | Romantic hope, fake interest, hidden renewal, or opaque refunds can be exploited. | Consumer-protection and payment review | Critical open risk |
| Privacy and personal information | Identity, photos, video, voice, and relationship data are sensitive. | Privacy impact and security review | Critical open risk |
| Offline meeting safety | Harm may occur after an optional relationship transition. | Responsibility and reporting policy | Critical open risk |
| Moderation and reporting | Live facilitators and sanctions can be inconsistent or biased. | Training, audit, appeal, and quality metrics | Critical open risk |
| Exclusion, discrimination, and unfair ranking | Cohort composition or pricing can produce unequal access. | Subgroup outcome audits | Critical open risk |
| Psychological harm or addictive design | Validation, rejection, and endless novelty can drive unhealthy use. | Well-being research and guardrails | Open risk |

## 11. Business-model hypotheses

No monetization model is approved.

| Model | Who pays | Value exchanged | Risk to user trust | Validation needed | Status |
| --- | --- | --- | --- | --- | --- |
| Transparent per-session ticket | Participant | Hosted, screened, moderated session | Price may reduce liquidity; poor refund handling harms trust | Real payment, attendance, refund, and unit-economics data | Preferred early proposal |
| Prepaid session bundle | Frequent participant | Convenience and predictable access | Breakage or expiry may feel unfair | Repeat-use evidence and terms testing | Later-stage proposal |
| Optional membership | Frequent participant | Booking convenience or included sessions | Auto-renewal and cancellation friction | Explicit-consent and cancellation tests | Scale-stage proposal |
| Organizer tools or ticket take-rate | Third-party facilitator/community | Scheduling, trust, and event operations | Quality control and incentive misalignment | Only after operator-owned model validation | Later open proposal |
| Venue or brand support | Venue/partner | Qualified attendance or community value | Influence over access, data, or participant selection | Independence and disclosure tests | Open proposal |

Permanent monetization guardrails proposed from research:

- Do not sell visibility, ranking, or preferential access to people.
- Do not charge for identity verification, reporting, blocking, privacy, or safety.
- Do not paywall genuine mutual interest or messages.
- Do not use sensitive relationship or identity data for targeted advertising.
- Avoid hidden renewal, deceptive guarantees, expiring credits, and difficult cancellation.

**Classification:** research-informed proposal; approved for inclusion, not approved as a business decision.

## 12. Critical assumptions

| ID | Assumption | Category | Impact if false | Evidence needed | Status |
| --- | --- | --- | --- | --- | --- |
| A-001 | Shared action helps the primary user sustain early conversation. | desirability | Product mechanism fails | Comparative facilitated-session research | Open |
| A-002 | Users experience hosted group interaction as lower pressure than photo/chat or offline singles events. | desirability | Differentiator fails | Segment-specific interviews and pilots | Open |
| A-003 | Friendship and romance can coexist without destructive expectation mismatch. | safety/product | Trust and retention fail | Intent and consent research | Open |
| A-004 | Six to ten participants can be filled reliably by scheduled slot. | feasibility | Sessions fail to launch | Acquisition and fill-rate data | Open |
| A-005 | Live facilitation can scale with consistent quality and fair enforcement. | operations | Cost and safety become unmanageable | Staffing and QA pilots | Open |
| A-006 | Verification improves trust enough to justify friction and sensitive-data risk. | trust | Onboarding conversion declines without safety benefit | Verification experiment and privacy review | Open |
| A-007 | New people remain available often enough to drive repeat use. | retention | Local novelty pool exhausts | Cohort-liquidity modeling | Open |
| A-008 | Users will pay a transparent session fee without perceiving payment as buying romantic access. | business | Unit economics fail | Real willingness-to-pay tests | Open |
| A-009 | Metaverse or avatars are not necessary for the core value. | solution | Lower-cost validation medium may misrepresent the desired experience | Modality comparison | Open |

## 13. Explicit non-goals

| Boundary | Working non-goal | Classification | Status |
| --- | --- | --- | --- |
| Not solving | Guaranteeing romance, a repeat interaction, contact exchange, or an offline date | proposal derived from success definition | Unapproved |
| Not building | Appearance scoring or appearance-based ranking | proposal based on explicit user exclusion | Explicit working non-goal |
| Not targeting | Users who want only an activity and are not open to friendship or romance | proposal based on participation boundary | Unapproved |
| Not monetizing | Sexual-intent display/matching; paid ranking; paid safety; pay-to-see-interest | proposal based on user exclusion and research | Explicit working non-goal for sexual matching; other guardrails unapproved |
| Not automating | Fully automated safety or facilitation without accountable human operations | model inference from live-facilitator requirement | Unapproved |

Photos, swiping in general, 3D space, avatars, post-opt-in one-to-one interaction, optional offline transition, and payment are not excluded by the interview. They remain open.

## 14. Open questions

### Problem

- How frequently and severely does early conversation failure occur in the first target market?
- When is a short conversation a healthy compatibility filter rather than a problem?

### User

- What first geography, age band, relationship orientation, and accessibility segment should be researched?
- How do barriers and safety needs differ by gender and user context?

### Experience

- What duration and behavioral signals define natural conversation?
- Which activity and facilitation patterns reduce pressure rather than increase it?
- How should relationship-type mismatch and consent withdrawal work?

### Product model

- Are voice, video, avatar, 2D space, 3D space, or games necessary?
- Should the product remain operator-hosted or later support third-party facilitators?

### Trust and safety

- How should identity and visual consistency be verified and retained?
- What recording restrictions are technically and operationally credible?
- What conduct, appeal, evidence, retention, and offline-reporting policies are required?

### Business model

- What session price, refund, rebooking, operator-cancellation, and no-show terms preserve trust?
- What fill rate and facilitator utilization make the service viable?

### Data

- Which identity, face, voice, relationship, and safety data are necessary and lawful?

### Technology

- Deliberately deferred until product scope and validation needs are approved.

### Operations

- How are facilitators recruited, trained, audited, scheduled, and supported?
- How are cohorts balanced and replacement participants handled?

## 15. Decision boundaries

All major product and technical decisions require explicit user approval.

| Boundary | Decisions | Default status |
| --- | --- | --- |
| Decisions Codex may make autonomously | Bounded research, classification, reversible documentation mechanics, and explicitly labeled proposals | Allowed within approved task scope |
| Decisions requiring user approval | Product scope, MVP, functionality, target segment, monetization, trust/safety/privacy policy, architecture, stack, database, API, authentication, payment, and implementation | User approval required |
| Decisions requiring research first | User demand, segment differences, modality need, safety controls, pricing, unit economics, and legal obligations | Research required before proposal or approval |
| Decisions requiring legal, privacy, or security review | Adult and identity verification, biometric/face data, recording restrictions, moderation evidence, offline reporting, payment, and sensitive-data use | Specialist review required before approval |

## 16. Research findings and candidates

### Completed bounded research

1. **Research finding:** Progressing online-dating conversations commonly create shared context and use reciprocal disclosure, but this does not prove prompts cause continuation. Source: https://journals.sagepub.com/doi/10.1177/0265407518822780. Verified 2026-07-24.
2. **Research finding:** Message burden, unwanted behavior, and perceived safety differ by gender and context in U.S. representative evidence. Source: https://www.pewresearch.org/internet/2023/02/02/from-looking-for-love-to-swiping-the-field-online-dating-in-the-u-s/. Verified 2026-07-24.
3. **Research finding:** A South Korean platform experiment found gender-differentiated selection and chat outcomes but did not measure sustained conversation or offline dates. Source: https://pubsonline.informs.org/doi/10.1287/isre.2021.1028. Verified 2026-07-24.
4. **Research finding:** A survey of 309 Korean women linked attitudes, norms, perceived risk, and prior use with future dating-app intention; it is not nationally representative. Source: https://doi.org/10.1080/10447318.2024.2348226. Verified 2026-07-24.
5. **Research finding:** Current voice-dating evidence shows different interaction affordances but does not prove improved continuation, trust, or relationships. Source: https://arxiv.org/abs/2402.19328. Verified 2026-07-24.
6. **Research finding:** Deceptive guarantees, billing, and cancellation are concrete sector trust risks. Source: https://www.ftc.gov/news-events/news/press-releases/2025/08/match-group-agrees-pay-14-million-permanently-stop-deceptive-advertising-cancellation-billing. Verified 2026-07-24.
7. **Research finding:** Comparable hosted social/event services use subscriptions, tickets, organizer fees, or transaction fees; this is market evidence, not proof of trust or fit. Sources: https://help.timeleft.com/hc/en-150/articles/28532667896988-What-types-of-events-does-Timeleft-offer and https://help.meetup.com/hc/en-us/articles/39489419634189-Why-does-Meetup-charge-a-service-fee-for-ticketed-events. Verified 2026-07-24.
8. **Research gap:** No reliable representative evidence for South Korean solo-party participation, motivations, or durability was found.

### Priority research candidates

| Research question | Why it matters | Preferred evidence | Decision supported | Priority | Status |
| --- | --- | --- | --- | --- | --- |
| Which users experience early conversation failure most severely? | Defines first target | Interviews plus behavioral diary/sample | Target segment | Critical | Open |
| Does facilitated shared activity outperform unstructured chat? | Tests core mechanism | Controlled pilot comparison | Product model | Critical | Open |
| Which modality produces lower pressure and sufficient authenticity? | Avoids premature metaverse investment | Voice/video/avatar/2D/3D prototype tests | Delivery medium | High | Open |
| Can required safety controls be lawful, credible, and usable? | Determines launch feasibility | Legal/privacy/security review plus user testing | Safety scope | Critical | Open |
| Can each scheduled slot maintain new-person liquidity? | Determines retention and cold start | Local cohort simulation and pilot | Operating model | Critical | Open |
| Will users pay per session for the experience rather than romantic access? | Determines unit economics and trust | Real-price pilot | Monetization | High | Open |

## 17. Promotion map

Future documentation flow:

- Evolving product exploration: docs/discovery/product-concept.md
- Approved product summary: docs/discovery/product-brief.md
- Tracked assumptions: docs/discovery/assumptions.md
- Approved decisions: docs/discovery/decisions.md
- Approved user-facing functionality: docs/spec/
- Approved architecture and technical decisions: docs/adr/
- Current implemented behavior: future docs/wiki/
- Reusable operational process: docs/operations/

Promotion means that content has met the destination document's evidence and approval rules. Copying or summarizing content does not itself approve it.

## 18. Change log

| Date | Change | Classification | Approved by |
| --- | --- | --- | --- |
| 2026-07-24 | Added classified findings, hypotheses, proposals, research, risks, non-goals, and open questions from the approved deep-interview summary. | proposal / assumption / research finding / open question | User approved documentation update; no product decision approved |
