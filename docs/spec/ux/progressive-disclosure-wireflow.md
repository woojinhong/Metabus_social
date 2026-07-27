---
title: Draft Progressive Disclosure Wireflow
document_type: UX prerequisite
classification: proposal
status: draft pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../progressive-disclosure.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Draft Progressive Disclosure Wireflow

## Product constraints

One private face photo is required before reservation confirmation. It is never browsable or automatically revealed. Initial interest is zero-to-two. Limited reveal occurs only for mutual initial interest and independent subject consent. Exact reveal is one face photo, exact age and occupation category. Final choice is zero-or-one romantic progression. Screenshots/local capture cannot be prevented.

## Candidate decision points

| Point | Must communicate | Candidate action | States to design |
| --- | --- | --- | --- |
| Media collection | private purpose, moderation, retention, no biometric match | upload/replace/delete/help | upload, scan, held, reject, approved |
| Initial display | visible nickname/age band/area/clue and hidden fields | continue/report | missing clue, accessibility alternative |
| Initial interest | zero-to-two, private, edit-until-close, none is valid | select/edit/none/submit | loading, stale participant, retry, timeout |
| Reveal eligibility | mutual initial interest does not itself disclose | continue/decline | no eligible pair, blocked/removed |
| Grant preview | exact subject resource, named viewer, purpose, expiry, capture warning | grant/decline | media unavailable, consent wording version |
| Reveal view | visible-now/audience/expiry, revoke limit | view/revoke/report | expired, revoked, fetch failure, shoulder surfing |
| Final selection | zero-to-one, no automatic contact, private outcome | choose/none/submit | no-reveal path, block, timeout |
| Result | own capability only, no peer choice/count/reason | join voice/finish/block/report | no-match, peer absent, expiry |

## Decisions requiring approval

Whether consent is set before the session or only live; whether photo/exact age/occupation are one bundled grant or separate; how a decline affects final selection; confirmation patterns; choice edit behavior; shoulder-surfing mode; no-match language; consent withdrawal entry; and whether users may hide exact occupation category remain unresolved.

No endpoint, schema, status enum or event payload may encode one variant until this wireflow is approved.

