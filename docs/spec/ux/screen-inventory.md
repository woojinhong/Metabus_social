---
title: Draft Screen Inventory
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved Screen Inventory

## UX-OQ-002 owner-approved scope

Status: owner approved on 2026-07-27. D-024 was satisfied on 2026-07-28. This inventory
preserves the owner-approved UX-OQ-001 navigation model. Keys remain review
units, not routes, components, backend states or authorization contracts.

## Participant review surfaces

| Key | Label and purpose | Entry → exit | Proposed surface | Key and merge/split stance | Privacy/safety and deferred detail |
| --- | --- | --- | --- | --- | --- |
| P01 | Product introduction; explain boundaries | public → account entry | independent review surface | keep distinct; shared preparation layout allowed | public-only; content depth later |
| P02 | Account authentication/recovery | public/expired → authenticated/recovery | independent review surface | keep distinct from eligibility | neutral auth errors; recovery detail later |
| P03 | Adult eligibility | authenticated → eligible/blocked | independent review surface | keep distinct from account | identity minimization; failure treatment later |
| P04 | Private profile/preferences | eligible → prepared/resumable exit | independent review surface | keep distinct from media | private compatibility inputs; edit rules later |
| P05 | Media preparation | profile → moderated/replace/delete | independent review surface | keep distinct from profile | private face/clue review; appeal detail later |
| P06 | Reservation browse/detail | prepared → requested/later | dashboard destination | keep distinct from status | no participant discovery; list/detail split later |
| P07 | Reservation status | reserved → confirmed/cancelled | dashboard destination | keep distinct from browse | individual attendance hidden; wording later |
| P08 | Device check | confirmed → ready/support/block | independent review surface | keep distinct from waiting | device/audio boundary; unsupported outcome |
| P09 | Waiting room | ready/window → admitted/cancelled | independent review surface | keep distinct from device check | peer attendance hidden; explicit readiness |
| P10 | Persistent live-session shell | admitted → ended/removed | persistent shell, not standalone route decision | keep distinct shell key | holds audience/audio/safety context; controls later |
| P11 | Game stage content | rules/game start → next game | stage content inside P10 | one reusable review key for three games | private input/public share; mechanics later |
| P12 | Free conversation | games complete → interest | stage content inside P10 | keep distinct from games | group voice only; moderation behavior later |
| P13 | Initial interest | window open → submit/timeout | protected step associated with P10 | keep separate from P14/P16/P17 | private choice; edit/timeout later |
| P14 | Reveal consent | eligible/no-target → grant/decline/expire | protected step associated with P10 | keep separate from P15 | consent is not viewing; grant details later |
| P15 | Limited reveal view | valid grant → close/revoke/expire | protected view associated with P10 | keep separate from P14 | protected resource/audience; viewing treatment later |
| P16 | Final choice | final window → submit/timeout | protected step associated with P10 | keep separate from P13/P17 | private intent; submission detail later |
| P17 | Private result | final close → pair/close/expiry | protected result associated with P10 | keep separate from P16 | own capability only; result copy later |
| P18 | Paired voice | valid mutual grant → end/revoke | stage content associated with P10 | keep distinct stage key | named pair audio only; absence/reconnect later |
| P19 | Common closing | session/pair end → home/feedback | common closing screen or closing stage | keep distinct from P20 | same safe close structure; result timing later |
| P20 | Safety/support/case | any context → containment/follow-up | contextual entry plus post-session destination | one review key with two presentations; do not force one page | reporter/case protection; exact actions later |
| P21 | Privacy/account management | dashboard account → completed request | account-level dashboard destination | keep distinct; contextual notices may link back | reauthentication/holds; confirmation later |

P13–P17 remain separate because each changes user intent, audience, authority or
privacy exposure. This does not decide their page, modal, sheet or component
implementation.

## Operator review capabilities

O01–O07 remain distinct review capabilities inside a proposed role-filtered
operator console. They do not imply seven applications or routes.

| Key | Work area | Entry → exit | Proposed boundary | Least-privilege constraint |
| --- | --- | --- | --- | --- |
| O01 | Schedule/cohort health | assigned schedule → confirmed/cancelled | distinct console work area | no participant-facing absence reason |
| O02 | Live-session control | assigned live room → end/handoff | distinct console work area | no private interest or decline reason |
| O03 | Content/media review | held item → release/reject/escalate | distinct console work area | no biometric or informal identity review |
| O04 | Report/case queue | assigned case → review/handoff | distinct console work area | minimum case-scoped evidence |
| O05 | Sanction decision | reviewed case → decision/notice | distinct restricted work area | human authority and audited reason |
| O06 | Appeal review | independent assignment → outcome | distinct restricted work area | separated from original decision |
| O07 | Audit/access review | authorized review → close/expire | distinct restricted work area | break-glass reason, expiry and review |

## Approved state presentation classification

| Classification | Candidate use | Boundary |
| --- | --- | --- |
| Inline state | validation, empty data, minor recoverable issue | preserve current task and safety access |
| Overlay or contextual panel | temporary reconnect, submission verification, short operating pause | restrict stale actions without implying a new route |
| Dedicated blocking screen | eligibility failure, cancellation, no-continuation expiry, unsupported device | explain allowed recovery or safe exit |
| Contextual sheet/dialog | destructive confirmation, exit, block, report entry | does not combine or force the underlying actions |
| Post-session destination | case follow-up, appeal, privacy/account request | protected account context, not live history |

These are approved review classifications only. Entry/exit annotations are
non-exhaustive journey descriptions, not state transitions. Exact routes,
components, permissions, timers and contracts remain undefined.

