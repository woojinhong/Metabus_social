---
title: Draft Safety and Reporting Wireflow
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../trust-safety-moderation.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved Safety and Reporting Wireflow

## Participant contexts

| Context | Safety need | Approved actions | Required states |
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

## Approved participant behavior

- Text-labelled safety access remains discoverable throughout core flows.
- Immediate leave, block, report, emergency help and support are independent.
  Immediate leave is not delayed by repeated confirmation; none requires a report.
- Block uses a short consequence confirmation, then ends reveal/progression access.
  It does not identify the blocker and leaving never automatically blocks.
- Initial reporting asks only subject/context and optional short description.
  Later evidence is optional and does not promise a production upload.
- Participant case status is limited to receipt, review and closure-level wording.
  Reporter identity, evidence detail and another person’s sanction stay private.
- Sanction notice explains rule category, effect, duration and independent appeal
  without reporter identity. Emergency help is distinct from product support.

## Approved operator behavior

`O01`–`O07` are role-filtered work areas, not separate applications. `O03` may
cover held media and versioned content review; `O01` may cover approved schedule
notices; `O07` may cover separated operational metrics, only within existing
approved capabilities. This mapping creates no new authority.

Mute, remove, pause and cancel are the only live controls. Remove/cancel and
other destructive live actions confirm target, scope and effect. Neutral turn
assistance is verbal guidance, not a new stage command. Case review, sanction,
appeal and audit remain least-privilege separated; private interest, consent
refusal and unrelated sensitive evidence are unavailable.

Automation may hold and signal, but the UI never implies an LLM made an
irreversible decision. Exact forms, filters, bulk actions, routes, endpoints and
case states remain future contract work.

