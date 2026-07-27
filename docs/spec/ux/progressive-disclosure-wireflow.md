---
title: Draft Progressive Disclosure Wireflow
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["../progressive-disclosure.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved Progressive Disclosure Wireflow

## Product constraints

One private face photo is required before reservation confirmation. It is never browsable or automatically revealed. Initial interest is zero-to-two. Limited reveal occurs only for mutual initial interest and independent subject consent. Exact reveal is one face photo, exact age and occupation category. Final choice is zero-or-one romantic progression. Screenshots/local capture cannot be prevented.

## Approved decision points

| Point | Must communicate | Approved action | Required review states |
| --- | --- | --- | --- |
| Media collection | private purpose, moderation, retention, no biometric match | upload/replace/delete/help | upload, scan, held, reject, approved |
| Initial display | visible nickname/age band/area/clue and hidden fields | continue/report | missing clue, accessibility alternative |
| Initial interest | zero-to-two, private, edit-until-close, none is valid | select/edit/none/submit | loading, stale participant, retry, timeout |
| Reveal eligibility | mutual initial interest does not itself disclose | continue/decline | no eligible pair, blocked/removed |
| Grant preview | exact subject resource, named viewer, purpose, expiry, capture warning | grant/decline | media unavailable, consent wording version |
| Reveal view | visible-now/audience/expiry, revoke limit | view/revoke/report | expired, revoked, fetch failure, shoulder surfing |
| Final selection | zero-to-one, no automatic contact, private outcome | choose/none/submit | no-reveal path, block, timeout |
| Result | own capability only, no peer choice/count/reason | join voice/finish/block/report | no-match, peer absent, expiry |

## Initial-interest behavior

- Choose zero to two or explicitly choose nobody. Drafts remain editable until
  submit; submitted named choices cannot be swapped, but all may be withdrawn to
  none before close.
- An unsubmitted timeout closes without a choice and never submits a visible draft.
- Removed targets require review before submit. Block wins and ends related access.
- Reconnect restores only confirmed current state. Background return conceals the
  list until the user explicitly returns; peer submission state and counts stay hidden.

## Resource-specific live consent and view

- Consent occurs live after mutual-initial eligibility, per named viewer and
  separately for face photo, exact age and occupation category. Nothing is prechecked.
- `P14` shows resource, audience, purpose, expiry, withdrawal boundary and capture
  limit before equally prominent grant/decline actions. No refusal reason is required.
- `P15` is separate and shows only granted resources for the remaining reveal
  stage, at most five minutes. A short technical fetch lifetime is not added viewing time.
- Withdrawal stops new access and closes current viewing where possible, but cannot
  erase prior viewing or capture.
- Decline, timeout, unavailable media and absent grant use one viewer-facing message:
  “이 정보는 이번 공개에서 제공되지 않아요.” Final choice remains available.

This approved UX defines no endpoint, schema, state enum, event payload or media
authorization implementation.

