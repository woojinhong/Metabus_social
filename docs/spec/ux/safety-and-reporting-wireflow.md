---
title: Draft Safety and Reporting Wireflow
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../trust-safety-moderation.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft Safety and Reporting Wireflow

## Participant contexts

| Context | Safety need | Candidate actions | Required states/questions |
| --- | --- | --- | --- |
| Profile/media | reject unsafe/soliciting upload without exposing reviewers | edit/delete/appeal/help | held, reason detail, accessibility |
| Waiting/live | immediate containment without confrontation | mute self, leave, block, report, emergency help | whether block precedes leave, discreet entry point |
| Interest/reveal | prevent retaliation and unwanted access | block, revoke, report, close | grant race, peer outcome privacy |
| Pair voice | stop contact and preserve minimum evidence | leave, block, report | peer absent, operator response |
| Post-session | report later and see status | choose subject/context, add evidence, submit | memory-only incident, evidence upload failure |
| Sanction notice | understand high-level reason and appeal | acknowledge/appeal/support | duration, reporter protection, accessibility |
| Appeal | independent review | state grounds, attach evidence, submit | deadline, status, success restoration |

## Operator contexts

Session control needs room/stage/connection and mute/remove/pause/cancel, not private choices. Case review needs minimum evidence and audited grants. Sanction and appeal review need separation of duties. Break-glass needs reason, expiry, alert and retrospective review.

## Decisions requiring approval

Global versus contextual safety entry; one-tap block semantics; emergency wording; whether leaving automatically blocks; evidence capture prompts; report subject selection; anonymous/hidden reporter language; status visibility; sanction notice detail; appeal form length; moderator queue/filter hierarchy; confirmation for removal/cancel; and accessibility alternatives remain unresolved.

Automation may hold and signal, but the UI must not imply an LLM made an irreversible decision. Exact case states, endpoints and moderator console remain pending.

