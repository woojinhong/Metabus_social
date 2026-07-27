---
title: Korean User Expectations Research Boundary
document_type: UX research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../research/technology/identity-verification-options.md
decision_authority: docs/discovery/decisions.md only
---

# Korean User Expectations Research Boundary

## Purpose

Research finding: Korea-specific payment, identity, messaging, and privacy expectations should be researched from primary provider and regulator sources rather than inferred from global dating products. This document intentionally avoids treating cultural generalizations as facts.

## Research inputs

| Area | Current research finding | Project implication | Status |
| --- | --- | --- | --- |
| Privacy | PIPC is the primary Korean privacy guidance source | Consent, minimization, retention, and processor review need explicit handling | Research finding |
| Identity | Local carrier/identity categories exist | Phone possession and adult eligibility must not be conflated | Research finding |
| Transactional messaging | Kakao business messaging exists | Channel approval and templates are vendor/process issues | Research finding |
| Local activity area | Seoul is a candidate, not evidence of liquidity | Test geographically broad cohorts before narrow area constraints | Open question |
| Voice and appearance disclosure | No representative evidence collected | Test consent comprehension, comfort, and disappointment | Assumption |

## Proposal - unapproved research approach

- Recruit research participants across intended age, accessibility, relationship-intent, and Korean-language comfort segments.
- Test plain-language consent, information visibility, session tone, access needs, and recovery after technical failure.
- Treat foreign-resident, MVNO, and identity-access constraints as inclusion and safety questions, not edge cases.
- Keep Korean trend content editorially reviewed; do not generate unreviewed live questions from search trends.

## Qualitative signals

Qualitative signal: app-store reviews and community posts can identify wording, accessibility, and support hypotheses. They must be labeled non-representative and never used alone to set cohort or safety policy.

## Evidence gaps

- No primary evidence yet establishes an appropriate cohort size, binary-gender balance, local-area radius, identity method, or deposit mechanism.
- Legal conclusions about PIPA, CI/DI, biometrics, and payment require qualified Korean legal/privacy review.
- Local trust norms, language tone, and voice comfort require moderated research rather than model inference.

## Source ledger

- Title: Personal Information Protection Commission
  - Publisher: PIPC, Republic of Korea
  - URL: https://www.pipc.go.kr/eng/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: PIPC is a primary privacy guidance source.
  - Limitations: Not legal advice or a UX-representativeness survey.

- Title: Kakao Business AlimTalk
  - Publisher: Kakao
  - URL: https://business.kakao.com/info/alimtalk/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Korean transactional business messaging is a research option.
  - Limitations: Does not establish user preference or approval.

- Title: NICE Identity overview
  - Publisher: NICE Information Service
  - URL: https://www.niceid.co.kr/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Local identity-verification categories exist.
  - Limitations: Does not determine eligibility, conversion, or data policy.


## Research protocol proposal - unapproved

| Topic | Method | Decision risk reduced |
| --- | --- | --- |
| Consent comprehension | Moderated prototype/interview with plain-language disclosures | Misunderstanding photo/video reveal |
| Voice comfort | Optional voice and text-alternative session research | Excluding anxious, hearing, or speech-impaired participants |
| Cohort geography | Reservation-intent survey and pilot waitlist analysis | Empty or over-fragmented sessions |
| Identity access | Provider-assisted usability review, no production data | Unfair eligibility exclusion |
| Notification tone | Comprehension and privacy-preview tests | Unwanted disclosure on shared devices |
| Safety response | Scenario walkthrough with support policy | Retaliation and report handling gaps |

## Non-generalization guardrails

- Do not use a national, gender, age, or relationship-orientation stereotype as product evidence.
- Language, local area, disability, device access, and prior dating-app experience can materially change results.
- A small research group can surface risks but cannot validate market size, legal policy, or causal retention.
- Translate and test safety/disclosure language with qualified Korean reviewers before any external trial.
