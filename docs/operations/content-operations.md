---
title: Content Operations
document_type: operations proposal
classification: proposal
status: Approved game boundary; operating procedure draft
last_verified: 2026-07-27
related: [../architecture/system-context.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Content Operations

## Purpose

**User decision:** the Pilot uses three stable game formats plus free conversation. **Proposal:** operate them with reviewed, versioned content packs. Do not generate unreviewed live-session questions directly from trend feeds.

## Proposed workflow

1. Collect candidate Korean seasonal, cultural, and behavioral topics from documented sources.
2. Automatically exclude politics, crime, death, hate, explicit sexual material, financial solicitation, active controversy, and disallowed segments.
3. Conduct human editorial and safety review with Korean context.
4. Convert short-lived trends into evergreen behavioral scenarios where possible.
5. Test comprehension, accessibility, privacy, discrimination, and expected duration.
6. Publish an immutable versioned pack with approvals and retirement date.
7. Monitor pass rate, response delay, follow-up conversation, discomfort reports, safety reports, and session outcomes.
8. Pause or retire risky/low-quality content and record the reason.

## Required metadata

Content ID, stable game format, stage, theme, disclosure level, intimacy, thinking difficulty, speaking difficulty, duration, answer mode, relationship signal, safety sensitivity, Korean relevance, season, trend-validity window, prohibited segments, accessibility notes, moderation status, version, and experiment ID.

## Initial game proposal

| Format | Intended signal | Primary risk | Operational control |
| --- | --- | --- | --- |
| Anonymous choice and guess | Values and curiosity | Popularity inference | Hide counts; balanced turns; pass/text option |
| Clue-owner matching | Personal context | Media privacy/identification | Non-face media review; EXIF/QR removal |
| Cooperative scenario | Behavior and collaboration | Dominant speakers | Timed roles, silent planning, pass option |
| Free conversation from prior material | Natural continuation | Harassment/contact sharing | Stage rules, moderation, report/mute |

This three-game-plus-conversation set is approved by D-003. Exact pack content and presentation remain review/UX work. Social deduction, twenty questions, dilemmas, and temporary small-group missions are deferred.

## Editorial roles

Author proposes; editor checks clarity/culture; safety reviewer checks protected classes, sexual content, coercion, trauma, privacy, and misuse; accessibility reviewer checks modes and cognitive/sensory load; publisher releases. High-risk content requires separation between author and approver.

## Participant media

Specify allowed type, purpose, audience, stage, retention, deletion, and consent before upload. Strip EXIF, scan malware/QR/barcodes, restrict face/contact/advertising content, and quarantine uncertain media. Never treat photo disclosure as a game reward.

## Quality gates

A content item must be understandable quickly, create participant-specific curiosity, permit shy participation, avoid forced cleverness, support a pass or text alternative, create follow-up conversation, and fit the stage time. Dominance, privacy, discriminatory/sexual risk, repeatability, implementation, and moderation complexity are recorded.

## Incident and rollback

Operators can pause an item or pack, replace it with a previously approved safe fallback, preserve version/audit evidence, notify safety/content owners, and review affected sessions. Do not hot-edit published content without a new version.

## Approval gate

Individual content packs, prohibited-segment details, editorial roles, experiments and participant-media operations require review under the approved game/safety/retention boundaries.

## Content validation checklist

- Instruction understood without facilitator explanation in a short comprehension test.
- Participant can pass or use the approved alternative without public penalty.
- Expected disclosure and audience are explicit before response.
- No answer implies a protected-class judgment, diagnosis, financial status, or sexual consent.
- Dominant speakers do not receive more scoring, reveal, or selection visibility.
- Follow-up conversation can occur without exposing a correct/popular answer.
- Timing includes thinking, accessibility, technical recovery, and natural discussion.
- Content remains safe if quoted, screenshotted, or misunderstood.

## Experiment boundaries

Experiments may vary reviewed content order or pack within the same approved safety/disclosure envelope. Do not experiment on identity verification, consent, reveal authorization, sanctions, or safety access without separate approval. Assignment and analysis use minimized identifiers and predefined stop conditions.

## Content evidence gaps

Korean participant comprehension, shy/neurodivergent response, hearing/speech alternatives, dominance effects, cultural exclusion, repeat-session fatigue, clue-media willingness, and discomfort thresholds require moderated research and pilot evidence.
