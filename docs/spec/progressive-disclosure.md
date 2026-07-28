---
title: Approved Progressive Disclosure and Consent
document_type: specification
classification: user decision
status: Approved consent and UX interaction baseline; implementation promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["mvp-scope.md","matching-and-progression.md","data/retention-matrix.md"]
decision_authority: D-004
---

# Approved Progressive Disclosure and Consent

## Information stages

| Stage | Information | Audience and authority |
| --- | --- | --- |
| Private matching | exact age, accepted range, gender/orientation compatibility, area, hard constraints | compatibility service and restricted operators only |
| Initial group | temporary nickname, five-year age band, Seoul activity area, one interest clue | assigned admitted group for current session |
| Games | voice, answer, story, approved clue/non-face media | current stage audience under item and subject grant |
| Limited reveal | one face photo, exact age, occupation category | named mutual-initial viewer after independent subject consent |
| Mutual pair voice | microphone publication/subscription | named final-mutual pair with pair-scoped grant |

A face photo is required before reservation confirmation for this Pilot, but no participant is required to reveal it in a session. Moderation review checks content and policy only; it does not perform biometric face comparison or identity matching.

## Consent requirements

| ID | Approved behavior |
| --- | --- |
| FR-DIS-001 | Separate collection, storage, game display, limited reveal, pair voice and future capabilities into distinct grants |
| FR-DIS-002 | Before grant, show exact resource, named audience, purpose, stage, expiry and revocation limit |
| FR-DIS-003 | Reveal only after mutual initial interest, current subject grant, eligible viewer and current reveal stage |
| FR-DIS-004 | Allow decline/no-reveal without exposing reason, score or coercive message |
| FR-DIS-005 | Recheck grant, block, sanction, stage, viewer and resource moderation at every fetch |
| FR-DIS-006 | Audit result and policy version without copying photo, choice or exact private field into telemetry |
| SR-DIS-001 | Missing, stale, ambiguous, revoked or conflicting consent fails closed |
| SR-DIS-002 | Block, removal, revocation and session closure override queued or cached access |
| SR-DIS-003 | Protected media uses authenticated short-lived access and never permanent public URLs |
| SR-DIS-004 | UI never frames a person's photo as prize, reward, entitlement or paid benefit |
| SR-DIS-005 | Final mutual interest grants pair voice only; text, webcam and offline contact remain unapproved |
| UX-DIS-001 | Every stage states what is visible now, to whom, why and until when |
| UX-DIS-002 | Explain that memory, screenshots and local capture cannot be completely prevented or reversed |

## Reveal lifetime and revocation

The access grant is scoped to subject, viewer, exact resource version, session and reveal stage. A signed fetch expires within 60 seconds; the logical grant expires at session end or after 15 minutes, whichever is earlier. Revocation blocks new fetches and cached server/CDN delivery but cannot erase already viewed or locally captured information. Cache-control is private/no-store.

## Deferred

Webcam, private messaging, offline coordination, biometric matching, liveness, manual identity review and public profile browsing remain excluded by D-006 and D-007.

