---
title: Realtime Contract Proposal
document_type: implementation contract proposal
classification: proposal
status: Draft proposal pending owner review for Issue #17
implementation_ready: false
authoritativeness: non-authoritative
production_authority: absent
last_verified: 2026-07-29
related_documents:
  - traceability-ux-implementation.md
  - actor-authorization-contract.md
  - lifecycle-contract.md
  - api/realtime-capabilities.md
  - ux/screen-state-model.md
  - ux/failure-and-recovery-workflow.md
  - ../research/technology/pilot-external-evidence-gate-audit.md
  - ../research/technology/pilot-device-operations-evidence-gates.md
  - ../operations/github-workflow.md
  - https://github.com/woojinhong/Metabus_social/issues/17
  - https://github.com/woojinhong/Metabus_social/pull/10
  - https://github.com/woojinhong/Metabus_social/pull/14
  - https://github.com/woojinhong/Metabus_social/pull/16
decision_authority: "D-021 governs realtime authority; D-024 governs UX; Issue #17 scopes this proposal and creates no decision authority"
---

# Realtime Contract Proposal

## 1. Purpose and authority boundary

This proposal maps approved `P01`–`P21` and `O01`–`O07` UX units to candidate
realtime responsibilities. It preserves the Actor/Authorization and Lifecycle
proposals and defines no final transport, route, command, event, payload,
protocol, state machine, timer, vendor behavior or production authority.

## 2. Realtime terminology

| Term | Proposal meaning |
| --- | --- |
| Action request candidate | A participant or operator asks the authoritative service to consider a currently authorized action; not a final command or payload |
| Change notification candidate | A scoped notice that authoritative state changed; the notice is never the source of truth |
| Ephemeral signal | Presence, connection, quality or local microphone observation with no durable business authority |
| Durable fact notification | A notice about a persisted consequential fact; recipients must still hold current access |
| Projection update | Derived display information that may be stale and cannot grant authority |
| Resynchronization | Requery current authoritative facts and permissions after interruption instead of replaying local messages |

## 3. Responsibility categories

Candidate responsibilities are `Not required`, `Conditional` or `Required`.
`Not required` means API/local recovery is sufficient. `Conditional` means a
notification or signal may improve timeliness but cannot replace authoritative
read or action handling. `Required` means the approved live UX needs a bounded
delivery responsibility, while its exact protocol remains unapproved.

## 4. Action-request and change-notification boundaries

- A sender is not automatically the authorized initiator. Every consequential
  request rechecks actor, role, assignment scope, authorization and lifetime.
- Acceptance is established only by the authoritative service. A client send,
  RTC observation, delivery acknowledgement or optimistic display proves none.
- Notifications contain the minimum recipient-specific effect. They do not
  carry private intent, refusal reason, reporter identity or unrelated evidence.
- Participant and operator requests remain distinct. Operator controls require
  a current assignment and exact room, target and effect scope.

## 5. Authoritative source and projection rules

The backend remains authoritative for admission, stage, timer policy,
permissions, windows, consent, disclosure access, derived capability, block,
removal and assignments.
RTC membership, active-speaker, quality and local microphone signals are
observations. A projection may summarize current facts but never create them.

## 6. Ordering, duplicate and stale-delivery constraints

- Duplicate delivery must not repeat a consequential action or disclosure.
- Stale requests and notices cannot overwrite a newer authoritative version.
- Per-context order matters for admission, stage, consent/access, capability,
  block/removal, session end and operator control; later contracts must state
  serialization or version comparison without fixing its representation here.
- Loss, delay or reordering fails closed for new action and new disclosure.
  Delivery failure alone does not delete data, cancel work or end a session.

## 7. Reconnect and resynchronization

Reconnect rechecks authentication, account, reservation, admission, room,
stage, assignment, block/sanction, consent, disclosure access, choice window,
derived capability and RTC authority as applicable. It reconstructs only the
current projection and confirmed own actions. It never restores expired access,
replays a private draft, auto-submits, auto-joins or auto-enables microphone.

## 8. Privacy and authorization propagation

- Receipt never grants permission; each protected fetch or action reauthorizes.
- Expiry, withdrawal, block, removal and assignment end stop new actions and
  new disclosures fail closed, while historical evidence follows its lifecycle.
- Private choice, peer intent/count/reason, consent refusal and reporter identity
  are never sent to unauthorized peers or routine operators.
- Case, sanction, appeal and privileged-access effects go only to the affected
  actor or currently assigned minimum-scope reviewer.
- Pair admission grants microphone-only pair scope, never contact or text.

## 9. Participant canonical crosswalk

Multiple actor/auth refs are conditional intersections for the stated action,
not a permission union. “API requery” names a responsibility, not an endpoint.

| UX | Actor/auth refs | Need | Candidate responsibility | Initiator candidate | Authoritative source candidate | Recipient scope candidate | Classification | Ordering/duplicate constraint | Reconnect/resync | Privacy boundary | B Gate dependency | UX evidence / open question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | ACT-PUBLIC; AUT-PUBLIC | Not required | Public content reload only | Visitor for own read | Current published guidance | Requesting visitor | Projection | Cache must not outrank current version | Reload current guidance | No private data | Not applicable | [Inventory](ux/screen-inventory.md#participant-review-surfaces); acknowledgement ownership |
| P02 | ACT-CLAIMANT; ACT-SUBJECT; AUT-RECOVERY; AUT-SELF | Not required | Neutral recovery progress by API requery | Matching claimant or verified subject | Account/recovery authority | Same claimant or subject | Projection update | Duplicate proof cannot widen authority | Reauthenticate and requery proof outcome | No account detail before ownership proof | Identity-provider callback evidence open | [Inventory](ux/screen-inventory.md#participant-review-surfaces); recovery progress channel |
| P03 | ACT-SUBJECT; AUT-SELF | Not required | Eligibility status by API requery; vendor return is internal input | Subject starts own verification | Backend-minimized eligibility outcome | Same subject | Projection update | Provider replay cannot duplicate outcome | Requery current eligibility | No raw provider response, DOB, CI or DI | NICE callback/replay behavior unproved | [Inventory](ux/screen-inventory.md#participant-review-surfaces); callback reconciliation |
| P04 | ACT-SUBJECT; AUT-SELF | Not required | Local draft and confirmed API save | Subject for own profile | Confirmed profile authority | Same subject | Local draft; durable fact after confirmation | Uncertain save requires authoritative read | Reload confirmed value, not draft authority | Preferences stay private | Not applicable | [Workflow](ux/end-to-end-workflow.md#참가자-주-흐름); draft concurrency |
| P05 | ACT-SUBJECT; AUT-SELF | Conditional | Own review-status change notice; media remains protected fetch | Subject action or assigned review outcome | Media/review authority | Subject only; assigned reviewer separately | Durable fact notification; projection | Version change rejects stale review/display | Refetch current media version/status | No media in notification | Storage/cache/vendor evidence open | [Inventory](ux/screen-inventory.md#participant-review-surfaces); review propagation |
| P06 | ACT-SUBJECT; AUT-SELF | Not required | Capacity and eligibility by API requery | Subject requests own slot | Reservation/capacity authority | Same subject | Projection | Stale availability cannot confirm booking | Requery current eligibility/capacity | No peer attendance detail | Not applicable | [Inventory](ux/screen-inventory.md#participant-review-surfaces); capacity authority |
| P07 | ACT-SUBJECT; AUT-SELF | Conditional | Own reservation/cancellation notice; transactional channels separate | Subject or authorized schedule action | Reservation authority | Affected subject | Durable fact notification | Duplicate notice cannot repeat cancellation | Requery current reservation | No peer absence cause | Notification delivery evidence open | [Inventory](ux/screen-inventory.md#participant-review-surfaces); cancellation race |
| P08 | ACT-SUBJECT; AUT-SELF | Not required | Local device/route diagnostics only | Subject device action | Current device/browser observation | Same device/user | Ephemeral local signal | Stale diagnostic cannot prove readiness | Retest device and permission | Raw audio never sent or stored | Real-device behavior unproved | [Accessibility](ux/accessibility-requirements.md#task-level-requirements); minimum diagnostics |
| P09 | ACT-SUBJECT; AUT-ADMISSION | Required | Readiness request; admission/delay/cancel notice; bounded presence signal | Subject readiness; authoritative admission owner remains open | Reservation/admission authority | Same subject; assigned operator gets neutral cohort projection | Action request candidate; durable fact notification; ephemeral signal; projection update | Admission and cancellation serialize; duplicate readiness is harmless | Recheck reservation, exact-six decision and admission | No peer count, identity or absence reason | Presence/reconnect/vendor behavior unproved | [Session](ux/session-wireflow.md#readiness-late-entry-and-participant-loss); exact-six owner |
| P10 | ACT-SUBJECT; AUT-SESSION | Required | Current action request; stage/permission/end notice; remaining-time projection; RTC observations | Participant for own action; assigned operator separately | Backend session/stage/timer-policy authority | Current session audience by exact scope | Action request; durable fact notice; ephemeral signal; projection | Consequential changes ordered per session; stale stage denied | Full room/stage/timer/capability resync; microphone off | No private choices or hidden scores | RTC order/reconnect/quality evidence open | [State model](ux/screen-state-model.md#승인된-전환-표현); clock and ordering |
| P11 | ACT-SUBJECT; AUT-SESSION | Required | Submit/pass/share request and confirmed stage/content update | Current participant within allowed turn/action | Backend stage and confirmed-response authority | Participant or approved current audience | Action request; change notification; projection | Duplicate submit/share cannot repeat; stage version wins | Requery item, confirmed own action and audience | Private draft never broadcast | Provider-independent; real-device interruption open | [Session](ux/session-wireflow.md#approved-sequence); share authorization |
| P12 | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Required | RTC signal; session notice; independent leave/block/report responsibilities | Participant under matching session or safety scope | Backend session/safety authority; RTC is observation | Session signal to current room; safety effect only to affected actor or authorized safety scope | Ephemeral signal; action request; durable fact notice | Session and safety actions do not imply each other; duplicates contained | Recheck session and each safety authority | Voice not stored; blocker and reporter identities protected | RTC loss/operator recovery unproved | [Session](ux/session-wireflow.md#approved-sequence); neutral intervention |
| P13 | ACT-SUBJECT; AUT-CHOICE | Conditional | Window/target invalidation notice only; private choice uses confirmed API responsibility | Subject for own choice | Backend choice-window and confirmed-choice authority | Same subject only | Durable fact notice; private local projection | Close/block order wins; duplicate submit does not disclose result | Requery own confirmed choice and window | Never send peer choice, count or reason | Not applicable | [Disclosure](ux/progressive-disclosure-wireflow.md#initial-interest-behavior); close ordering |
| P14 | ACT-SUBJECT; AUT-CONSENT | Required | Grant/decline/withdraw request; scoped access-availability notice | Resource subject only | Backend consent authority | Subject gets decision confirmation; named viewer gets only neutral access availability | Action request; durable fact notice | Withdrawal/expiry outrank stale grant; duplicates idempotent | Recheck subject, viewer, resource, purpose, stage and block | Refusal, timeout and unavailable cause remain indistinguishable to viewer | Clock/propagation evidence open | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view); revoke race |
| P15 | ACT-VIEWER; ACT-SUBJECT; AUT-VIEW; AUT-CONSENT | Required | Access-start/end projection; protected resource fetched separately | Subject withdrawal or authoritative access change | Backend disclosure-access authority | Exact subject/viewer/resource scope | Durable fact notice; projection | Revoke/block/expiry wins; stale notice cannot reopen | Reauthorize exact grant before every refetch | Resource bytes not carried in notice | Cache and propagation evidence open | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view); access closure |
| P16 | ACT-SUBJECT; AUT-CHOICE | Conditional | Window/target invalidation notice only; final choice stays private | Subject for own choice | Backend final-window and confirmed-choice authority | Same subject only | Durable fact notice; private local projection | Close/block order wins; duplicate submit cannot infer mutuality | Requery own confirmed choice and window | Never send target choice, count, reason or mutuality hint | Not applicable | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성); close ordering |
| P17 | ACT-SUBJECT; AUT-CAPABILITY | Conditional | Own derived-capability availability/withdrawal notice | Backend after authoritative mutuality calculation | Backend capability authority | Affected subject only, with equal-timing protection | Durable fact notification; projection | Newer withdrawal/expiry wins; duplicate notice adds no capability | Requery own current capability | No peer intent, choice, count or reason | Notification timing/device evidence open | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성); issuance timing |
| P18 | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Required | Pair entry/leave request; pair/end notice; RTC signal; independent block/report | Participant under matching pair or safety scope | Backend pair/safety authority; RTC is observation | Pair signal to named pair; safety effect only to affected actor or authorized safety scope | Action request; durable fact notice; ephemeral signal | Revoke/block/end outrank stale join; duplicate leave/report contained | Reauthorize pair and safety; microphone stays off | No contact/text, blocker identity or peer-private reason | LiveKit route/reconnect behavior unproved | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성); pair reconnect |
| P19 | ACT-SUBJECT; AUT-FEEDBACK | Not required | Local draft and API submit/retry; no realtime dependency | Subject for own feedback | Feedback submission authority | Same subject | Local draft; durable fact after confirmation | Uncertain submit rechecks result before retry | Requery submit result; never auto-submit | Safety content routes to separate case flow | Local-draft/device behavior open | [Closing](ux/no-match-and-safe-closing.md#공통-종료-순서); feedback expiry |
| P20 | ACT-SUBJECT; ACT-REPORTER; ACT-RESPONDENT; ACT-SANCTIONED; ACT-APPELLANT; AUT-SAFETY-SELF; AUT-REPORT; AUT-CASE; AUT-APPEAL | Conditional | Immediate leave/block effect; report receipt; minimum case/notice/appeal status notice | Each actor only under its matching action/scope | Backend safety/case/sanction/appeal authority | Each affected actor gets only own protected effect; assigned reviewer gets minimum scope | Action request; durable fact notification; projection | Containment wins; duplicates do not repeat report or sanction; case version wins | Requery only matching protected scope | No blocker/reporter identity, unrelated evidence, internal notes or another person's status | Case stages/staffing/handoff unapproved | [Safety](ux/safety-and-reporting-wireflow.md#approved-participant-behavior); status delivery |
| P21 | ACT-SUBJECT; AUT-SELF | Not required | Processing status by authenticated API requery | Subject for own privacy request | Account/privacy workflow authority | Same subject | Projection update | Message alone never proves deletion completion | Reauthenticate and requery request/hold visibility | No hidden hold detail or processor data | Processor/backup completion unproved | [Inventory](ux/screen-inventory.md#participant-review-surfaces); completion proof |

## 10. Operator canonical crosswalk

| UX | Actor/auth refs | Need | Candidate responsibility | Initiator candidate | Authoritative source candidate | Recipient scope candidate | Classification | Ordering/duplicate constraint | Reconnect/resync | Privacy boundary | B Gate dependency | UX evidence / open question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O01 | ACT-OPERATOR; AUT-OPS | Conditional | Schedule/cohort projection and authoritative reservation-change notice | Assigned schedule operator or backend policy action | Reservation/schedule authority | Assigned operator; affected participant receives neutral effect | Durable fact notice; projection | Reservation version wins; duplicate notice adds no action | Requery assignment and cohort authority | Operator sees approved fill health, never preferences; participant sees no peer cause | Staffing/handoff and notification evidence open | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities); exact-six authority |
| O02 | ACT-OPERATOR; AUT-OPS | Required | Scoped mute/remove/pause/cancel request and resulting room-effect notice | Assigned live-session operator | Backend room/session authority | Exact room/target; affected participants receive minimum effect | Action request; durable fact notice; projection | Target/scope/version rechecked; duplicate destructive action contained | Requery assignment, room, stage and effect | No private choice or consent-refusal data | RTC control propagation/operator coverage unproved | [Safety](ux/safety-and-reporting-wireflow.md#approved-operator-behavior); control confirmation |
| O03 | ACT-REVIEWER; AUT-OPS | Conditional | Assigned queue projection and disposition-effect notice | Assigned content/media reviewer | Content/media review authority | Assigned reviewer; subject gets minimum outcome | Action request; durable fact notice; projection | Item version and assignment win; duplicate disposition contained | Refetch assignment and current item version | Media excluded from general notice | Review staffing/vendor scan behavior open | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities); handoff/version lock |
| O04 | ACT-REVIEWER; AUT-OPS | Conditional | Case assignment/handoff and minimum status notice | Assigned safety reviewer or authorized assignment owner | Case/assignment authority | Assigned reviewer; affected actor gets coarse status only | Durable fact notice; projection | Assignment/case version wins; duplicate handoff grants nothing | Recheck assignment and evidence purpose | Reporter identity and unrelated evidence withheld | Case staffing/stages/handoff unapproved | [Safety](ux/safety-and-reporting-wireflow.md#operator-contexts); assignment owner |
| O05 | ACT-REVIEWER; ACT-SENIOR; AUT-DECISION | Conditional | Sanction decision request and protected effect/notice delivery | Currently authorized human reviewer | Sanction/case authority | Affected person and minimum assigned reviewers | Action request; durable fact notice | Required authority and case version rechecked; duplicate effect contained | Recheck assignment, concurrence and current decision | No reporter identity; no LLM-only irreversible action | Staffing, notice and actual stages unapproved | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow); concurrence |
| O06 | ACT-REVIEWER; AUT-DECISION | Conditional | Independent appeal assignment/outcome notice | Independent assigned appeal reviewer | Appeal/case authority | Appellant and currently assigned independent reviewer | Action request; durable fact notice; projection | Conflict/assignment/case version wins; duplicate outcome contained | Recheck independence and assignment | No reporter identity, unrelated case data or original-reviewer power | Staffing, timing and restoration evidence open | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow); restoration order |
| O07 | ACT-AUDITOR; AUT-AUDIT | Conditional | Privileged-access grant/expiry/revoke effect and alert notice | Authorized access owner or reviewer under approved purpose | Access/audit authority | Named grantee, alert recipients and independent reviewer | Durable fact notification; projection update | Expiry/revocation wins; duplicate alert grants nothing | Recheck purpose, scope, reason and expiry | No bulk export or protected content in alert | Break-glass owner/rehearsal unapproved | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities); approver and alert owner |

## 11. B Evidence Gate dependencies

- LiveKit routing, reconnect, webhook delivery/replay, quota and control
  propagation remain unproved until executed terms, account and device evidence.
- Mobile background, lock, audio-route and Wi-Fi/mobile switching behavior require
  the approved real-device matrix; public browser documentation is not evidence.
- Operator coverage, handoff, case stages, break-glass alerting and incident
  response remain operations-rehearsal gates, not realtime contract facts.
- Vendor outage never authorizes mid-session provider migration or optimistic
  restoration. Pause, resync, cancel and rebook remain policy-level outcomes.

## 12. Open contract questions

- Which transport, delivery acknowledgement and bounded replay responsibilities
  satisfy these candidates without making the transport authoritative?
- Which authoritative version and clock establish order per room, grant, choice
  window, capability, case and assignment?
- Who owns the exact-six decision and how is its neutral effect propagated?
- Which presence/quality observations are needed, for how long and for whom?
- Which case, sanction, appeal and privacy statuses need realtime notice rather
  than API requery or transactional notification?
- What measured device/vendor evidence defines reconnect and degradation policy?

## 13. Explicitly excluded implementation detail

This proposal defines no final command or event name, payload field, AsyncAPI,
WebSocket route, topic, channel, room name, endpoint, HTTP method, DTO, request
or response field, table, column, index, enum, DBML, schema, migration,
production state, exact timeout, retry count, sequence representation, SDK,
vendor implementation, source code, API contract, Data contract or Pilot action.
