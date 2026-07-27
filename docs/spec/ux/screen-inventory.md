---
title: Draft Screen Inventory
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft Screen Inventory

## Participant screen candidates

| Screen candidate | Purpose | Entry/exit | Primary/secondary action | Required states |
| --- | --- | --- | --- | --- |
| Orientation | understand product/boundaries | public -> register/login | start / learn safety-accessibility | loading, unavailable |
| Register/login/recovery | establish account | public/session-expired -> account | continue / recover | neutral error, rate limit, email delay |
| Adult eligibility | NICE check and recovery | account -> eligible/blocked | verify / support | provider outage, foreign/MVNO, false rejection |
| Profile/preferences | reservation readiness | eligible -> complete | save / exit | missing, invalid, private-visibility help |
| Media submission | private face/clue upload | profile -> moderated | upload / replace/delete | scan pending, held, rejected, accessible alternative |
| Session list/detail | choose fixed slot | ready -> reserve | reserve / review rules | empty/full/cancelled/time-zone |
| Reservation status | confirm/cancel and see cohort status | reserved -> confirmed/cancelled | confirm / cancel/support | underfill, standby, operator cancellation |
| Device check | microphone/route readiness | confirmed -> ready/support | test / troubleshooting | denied, no input, Bluetooth, network |
| Waiting room | recheck admission and rules | ready -> admitted/cancelled | ready / leave/report | early, late, missing participant, reconnect |
| Live session shell | show current authorized stage | admitted -> ended/removed | stage action / pass, leave, report | pause, reconnect, stale stage, participant loss |
| Initial interest | zero-to-two private choice | interest window -> submitted | submit / choose none | timeout, retry, privacy shielding |
| Limited reveal consent/view | grant and view exact resources | mutual initial -> grant/decline/expired | grant/view / decline/revoke | no-reveal, expired, revoked, screenshot warning |
| Final interest/result | zero-or-one final choice and private outcome | final window -> no-match/mutual | submit / none | timeout, no-match, incompatible/blocked |
| Pair voice | ten-minute mutual voice | granted -> ended/revoked | join / leave/report | peer absent, reconnect, expiry |
| Feedback | voluntary session/device/safety feedback | ended -> submitted/skipped | submit / skip | offline/retry |
| Safety/support/case/appeal | contain and follow up | contextual/account -> resolution | block/report/appeal / support | emergency, evidence failure, status, successful appeal |
| Privacy/account | devices, export, delete | account -> complete | manage/delete / help | legal hold explanation, deletion pending |

## Operator screen candidates

Schedule/cohort health; live session control; held media/content; report queue; case detail; sanction decision; appeal review; content pack; audit/access review. Exact console grouping, bulk actions and moderator views remain unapproved.

