---
title: Scheduled Session Model Proposal
document_type: discovery
classification: proposal
status: Exploration around approved session boundary
last_verified: 2026-07-28
related_documents:
  - product-concept.md
  - product-risks-and-boundaries.md
  - ../spec/session-experience.md
decision_authority: decisions.md only
---

# Core Experience and Session-Flow Hypotheses

The bounded nine-stage product flow is approved at product level by D-003 and
D-004. D-024 later approved the UX baseline. Expected effects, future
alternatives and implementation contracts remain assumptions or proposals.

## Stage 1: Reservation and compatibility filtering

A participant reserves a fixed time. Private inputs may include accepted age range, relationship-orientation compatibility, broad activity area, dating intent, smoking, marriage intent, lifestyle constraints, and availability. Exact answers need not be shown to the cohort. Constraints must not be silently relaxed.

## Stage 2: Private session entry

Exactly six eligible participants enter an account-bound room. Initial representation may show a temporary nickname, session identity, broad age range, broad activity area, and one optional clue. Admission requires server authorization; a reusable room URL is insufficient.

## Stage 3: Voice and curiosity games

Participants hear real voices and use reviewed formats: anonymous choice-and-guess, clue-owner matching with text or non-media alternatives, and a cooperative behavioral scenario. Candidate future formats include dating twenty questions, behavior dilemmas, light social deduction, and temporary-group missions.

**User decision — Deferred:** temporary smaller groups are outside the approved Pilot under D-007.

## Stage 4: Progressive profile discovery

Hidden pieces may include interests, hobbies, pet information, lifestyle, favorite places, work style, occupation category, values, voice responses, stories, selected non-face media, and a face photo. Disclosure is voluntary, resource-specific, audience-specific, stage-specific, and revocable for future access.

## Stage 5: Free conversation

Games create material but do not control the whole session. The main room reserves time for natural continuation. **Assumption:** excessive structure can feel like a workshop, interview, or performance test.

## Stage 6: Initial interest selection

Participants privately choose zero to two people for romantic curiosity or choose none. Friendship mixing is rejected for this Pilot. Counts and rejection details remain hidden.

## Stage 7: Controlled profile reveal

**User decision:** group interaction → initial private interest → subject-authorized limited reveal to eligible viewers → final private selection → compatible mutual progression. A viewer's selection never unilaterally unlocks another person's photo.

The separation may help test how interaction and later visual disclosure affect interest; it may also intensify delayed-rejection harm.

## Stage 8: One-to-one progression

Compatible mutual participants may enter optional short one-to-one voice. Messaging, webcam publishing, webcam viewing, and offline coordination require separate consent. Declining any step must not expose a reason.

**Proposal — Deferred:** webcam. Any future implementation requires independent, current consent by both participants and must state that screenshots or local recording cannot be completely prevented.

## Stage 9: Optional offline progression

**Proposal — Deferred:** future availability collection, public-venue suggestions, coordination, attendance, cancellation, deposits, safety checks, and feedback. [Timeleft research](../research/dating-products/timeleft-analysis.md) is a comparator, not validation.

## Candidate Information-Disclosure Model

**Historical product-level decision; presentation was later approved by D-024:**

| Stage | Candidate information |
| --- | --- |
| Private matching input | exact age, accepted range, location, compatibility, lifestyle constraints |
| Initial group display | temporary name, broad age range and area, optional interest clue |
| Voluntary game disclosure | voice, hobbies, pets, stories, selected personal media, preferences |
| Post-interest disclosure | subject-authorized face photo, exact age, occupation category |
| Mutual one-to-one | approved ten-minute pair voice after compatible final mutual selection |
| Deferred future channels | messaging and webcam only after separate product, consent, UX and safety approval |
| Deferred offline stage | availability and only data necessary for separately approved safe coordination |

## Intended Product Value

**Proposal:** delay appearance-first filtering; create curiosity before complete profile disclosure; provide shared conversational context; let personality emerge through voice and behavior; reduce immediate one-to-one pressure; make progression gradual; require mutual consent before private contact; and enable a credible optional offline path later.

**Evidence gap:** none of these outcomes is established.

## Session-model boundaries

- No mandatory group webcam or public popularity score.
- No automatic private access or unconsented photo access.
- No exact-location display in the group.
- No open participant chat before its permitted stage.
- No payment for genuine mutual interest or safety features.
- Hiding photos does not eliminate appearance-based evaluation.
