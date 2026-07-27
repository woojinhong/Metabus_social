---
title: Approved Game and Content System
document_type: specification
classification: user decision
status: Approved content rules; interaction pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["session-experience.md","../operations/content-operations.md"]
decision_authority: D-003
---

# Approved Game and Content System

## First-session set

| ID | Format | Core rule | Guardrails |
| --- | --- | --- | --- |
| FR-GAM-001 | Anonymous choice and participant guessing | private answer, group guesses owner | pass/text, no score, no humiliation |
| FR-GAM-002 | Clue-owner matching | match one approved clue or non-face image to owner | non-media alternative, EXIF/QR/contact review, owner consent |
| FR-GAM-003 | Cooperative behavioral scenario | plan one bounded scenario with timed turns | no winner, no amateur diagnosis, dominance support |
| FR-GAM-004 | Free conversation handoff | carry forward safe topics from games | neutral prompts only when needed |

Dating twenty questions and behavior dilemmas may enter later reviewed packs. Social deduction, temporary subgroups and live trend questions are deferred.

## Content model

| ID | Required metadata |
| --- | --- |
| FR-GAM-101 | content ID, format, stage, theme, disclosure and intimacy levels |
| FR-GAM-102 | thinking/speaking difficulty, duration, answer mode, accessibility alternative |
| FR-GAM-103 | editorial relationship signal, safety sensitivity, Korean relevance, season |
| FR-GAM-104 | trend validity, prohibited segments, accessibility notes and rights/source note |
| FR-GAM-105 | moderation status, version, experiment ID, author and independent reviewer |

Relationship signal is an editorial hypothesis, never a compatibility or personality score. A content pack is immutable during a session and versioned before assignment.

## Editorial pipeline

1. Collect candidate Korean cultural or seasonal topics with source/date/rights note.
2. Deterministically exclude politics, active controversy, crime, death, hate, explicit sex, financial solicitation and illegal conduct.
3. Human review for safety, inclusion, accessibility, culture and rights.
4. Convert approved topics into original evergreen behavioral scenarios.
5. Publish a versioned pack to eligible cohorts.
6. Measure pass, delay, follow-up, participation balance, discomfort and safe completion without raw answers in routine analytics.
7. Pause or retire unsafe, stale, inaccessible or low-quality content.

## Safety requirements

| ID | Approved behavior |
| --- | --- |
| SR-GAM-001 | Deterministic checks precede publication; an LLM cannot be sole reviewer or enforcer |
| SR-GAM-002 | Media stays private, loses EXIF, and passes MIME/signature, malware, QR/contact and safety review |
| SR-GAM-003 | Review sexual pressure, discrimination, trauma, solicitation, appearance ranking and coercive disclosure |
| SR-GAM-004 | Operators can pause a content item or pack immediately with audit |
| UX-GAM-001 | Instructions fit one screen and state duration, answer modes, pass and an example |
| UX-GAM-002 | Timed turns, private input, repetition and text alternatives reduce dominance barriers |

