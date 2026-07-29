---
title: Lifecycle Contract Proposal
document_type: implementation contract proposal
classification: proposal
status: Draft proposal pending owner review for Issue #15
implementation_ready: false
authoritativeness: non-authoritative
production_authority: absent
last_verified: 2026-07-29
related_documents:
  - traceability-ux-implementation.md
  - actor-authorization-contract.md
  - traceability-implementation.md
  - data/retention-matrix.md
  - ux/README.md
  - ../discovery/implementation-contract-promotion-proposal.md
  - ../discovery/open-questions.md
  - ../research/technology/pilot-external-evidence-gate-audit.md
  - ../research/technology/pilot-device-operations-evidence-gates.md
  - https://github.com/woojinhong/Metabus_social/issues/15
  - https://github.com/woojinhong/Metabus_social/pull/10
  - https://github.com/woojinhong/Metabus_social/pull/11
  - https://github.com/woojinhong/Metabus_social/pull/12
  - https://github.com/woojinhong/Metabus_social/pull/14
decision_authority: "D-024 governs UX; Issue #7 authorizes proposal-only documentation; Issue #15 scopes this draft and creates no decision authority"
---

# Lifecycle Contract Proposal

## 1. Purpose and authority boundary

This proposal maps the approved `P01`–`P21` and `O01`–`O07` UX units to
lifetime responsibilities and constraints. It preserves the Actor/Authorization
contract and defines no production state, transition, timer, schema or code.
All terms below are descriptive contract categories, not implementation names.

## 2. Lifecycle concept boundaries

| Concept | Proposal meaning | Authority boundary |
| --- | --- | --- |
| Durable state | Purpose-limited fact or consequential outcome that survives a connection | Domain owner and backend authority; not a table, field or enum |
| Ephemeral state | Short-lived connection, device, timer, draft or presence condition | Reconstructable or discardable; never sole product authority |
| Projection | Current display calculated from authoritative facts and conditions | May become stale; display does not grant authority |
| Authorization lifetime | Period in which a matching actor, role, scope and boundary permits an action | Ends independently from resource deletion |
| Resource lifetime | Period in which an account, reservation, media or consent resource serves its purpose | Subject rights and retention policy apply independently |
| Assignment lifetime | Period in which an operator or reviewer is assigned a bounded responsibility | Handoff or removal ends access, not the underlying work |
| Session lifetime | Period of admission, current-stage participation or pair voice authority | Backend-owned; RTC and client observations are not authority |
| Evidence lifetime | Purpose and access period for audit, safety or authorization evidence | D-018 limits and scoped holds govern; case closure is not deletion |

The categories are orthogonal. A row may reference several categories only as
conditional relationships for its actor and action, never as a merged state or
permission union.

## 3. Lifecycle terms

| Term | Contract meaning |
| --- | --- |
| Create | Recognize a new purpose-limited resource or evidence item after current preconditions pass |
| Activate/use | Permit a current action while authorization and resource conditions both hold |
| Expire | End future use because a time, stage or assignment boundary passed; retry does not revive it |
| Revoke/withdraw | End future authority through an authorized subject or authority action |
| Cancel | Stop a planned reservation or session path without implying deletion or participant fault |
| Close/end | Finish an interaction, case or assignment context while required records may remain |
| Delete | Remove data at the earlier of purpose completion or the approved retention limit, except within a documented scoped legal hold authorized by D-018; when that hold ends, this rule resumes and no general or indefinite retention authority exists |
| Reproject | Recalculate a display from current authority without restoring stale intent or access |

These meanings constrain later contracts but do not define lifecycle states,
transition diagrams, production enums or exact time-to-live values.

## 4. Cross-cutting constraints

- Authorization expiry and data deletion are separate obligations.
- Session end closes session authority, not optional feedback authority.
- Consent records and current disclosure access are separate lifetimes.
- Private choices and derived next-step capabilities are separate resources.
- Block and report are independent; either can outlive the live session.
- Case closure, evidence deletion and sanction/appeal completion are distinct.
- Assignment handoff or removal ends operator access, not the case or session.
- Account closure revokes product access before active deletion and backup expiry.
- A reconnect screen is a projection; it cannot restore authority by itself.

## 5. Reconnect and revalidation

Reconnect, refresh, background return, device change and network change recheck
authentication, account, reservation, admission, sanction/block, current stage,
consent, choice window, capability and RTC authority as applicable. Only current
confirmed actions are reprojected. Drafts are never auto-submitted, expired
access is never revived, protected content is concealed until reauthorized and
the microphone remains off until an explicit participant action.

## 6. Canonical UX lifecycle crosswalk

Actor/authorization refs come from the
[Actor and Authorization proposal](actor-authorization-contract.md). Multiple
refs remain actor/action-specific intersections; they do not grant a union.

| UX unit | Lifecycle family | Actor/auth refs | Durable owner or source | Ephemeral or projection | Lifetime boundary | Revalidation boundary | UX evidence | Open contract question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | Account/resource; projection | ACT-PUBLIC; AUT-PUBLIC | Policy/content owner for current public guidance | Loaded copy and support availability | A version may be replaced without creating private authority | Reload current version after interruption | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Acknowledgement and localization ownership |
| P02 | Account/resource; authorization | ACT-CLAIMANT; ACT-SUBJECT; AUT-RECOVERY; AUT-SELF | Account authority and minimized recovery outcome | Form, neutral progress, delay and error | Claimant authority stays limited until ownership proof; closure/recovery revokes access separately from deletion | Reauthenticate and recheck ownership, revocation and expiry | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Proof boundary and session lifetime |
| P03 | Account/resource; evidence | ACT-SUBJECT; AUT-SELF | Minimized eligibility outcome; vendor return is input, not authority | Provider handoff, checking and retry view | Unverifiable or no-longer-current eligibility fails closed; provider data deletion is separate | Recheck current outcome and provider-return validity | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Vendor callback, retention and deletion proof |
| P04 | Account/resource | ACT-SUBJECT; AUT-SELF | Confirmed private profile/preferences | Local draft and validation | Edit authority may close independently from account/resource retention | Reload confirmed input; draft recovery policy remains open | [Workflow](ux/end-to-end-workflow.md#참가자-주-흐름) | Draft lifetime, lock and correction boundary |
| P05 | Account/resource; assignment; evidence | ACT-SUBJECT; AUT-SELF | Subject media and review disposition | Upload, scan and review progress | Replace/delete and reviewer assignment are separate; evidence follows its approved purpose | Refetch current media version and assignment | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Media deletion proof, cache and review concurrency |
| P06 | Admission/reservation | ACT-SUBJECT; AUT-SELF | Own reservation request and applicable policy version | Slot availability and expiry projection | Slot eligibility and request authority may expire before any reservation exists | Requery current eligibility and capacity | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Request idempotency and capacity authority |
| P07 | Admission/reservation | ACT-SUBJECT; AUT-SELF | Reservation, cancellation and rebooking audit | Own status and notification projection | Cancellation ends future admission but does not delete attendance evidence | Requery reservation authority before cancel or rebook | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Cancellation race and notification handoff |
| P08 | Admission/reservation; ephemeral | ACT-SUBJECT; AUT-SELF | Readiness outcome only where required for admission | Device, route, permission and quality diagnostics | Diagnostic freshness and admission use are distinct; raw audio is never retained | Retest current device/permission after interruption | [Accessibility](ux/accessibility-requirements.md#task-level-requirements) | Readiness freshness and minimum transmitted evidence |
| P09 | Admission/reservation; session | ACT-SUBJECT; AUT-ADMISSION | Readiness confirmation and admission attempt audit | Countdown, neutral cohort and presence view | Pre-admission authority is short-lived; admitted-session authority begins only after a separate decision | Recheck reservation, exact-six decision, window and replay protection | [Session](ux/session-wireflow.md#readiness-late-entry-and-participant-loss) | Exact-six owner, presence lifetime and admission cutoff |
| P10 | Live-session; projection | ACT-SUBJECT; AUT-SESSION | Consequential stage/participation audit under backend authority | Stage, timer, connection, microphone and audience view | Stage/session end denies stale actions; audit retention is separate | Resync current stage and capability; never auto-unmute | [State model](ux/screen-state-model.md#승인된-전환-표현) | Clock, ordering and audit threshold |
| P11 | Live-session; resource | ACT-SUBJECT; AUT-SESSION | Confirmed response/content version where purpose requires | Draft, item timer, turn and share view | Stage close ends submit/share authority without deciding raw-response retention | Recheck current item and confirmed action before retry | [Session](ux/session-wireflow.md#approved-sequence) | Raw-response purpose and interruption policy |
| P12 | Live-session; safety/case | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Stage completion and separately scoped safety evidence | RTC voice, connection and neutral prompt | Session voice ends with session authority; leave/report/block remain independent | Recheck session and each safety authority separately | [Session](ux/session-wireflow.md#approved-sequence) | Provider recovery and safety-routing authority |
| P13 | Choice/capability | ACT-SUBJECT; AUT-CHOICE | Confirmed private interest and policy evidence | Private editable draft and submit verification | Close, block or withdrawal ends choice authority; draft is not a confirmed choice | Restore only current confirmed choice, never peer state | [Disclosure](ux/progressive-disclosure-wireflow.md#initial-interest-behavior) | Close ordering, acknowledgement and draft disposal |
| P14 | Consent/disclosure | ACT-SUBJECT; AUT-CONSENT | Resource-specific consent decision and version evidence | Consent view and expiry countdown | Grant, decline, withdrawal and expiry affect future access; consent record may remain | Recheck subject, viewer, resource, purpose, stage and block | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Clock authority and revocation race |
| P15 | Consent/disclosure; projection | ACT-VIEWER; ACT-SUBJECT; AUT-VIEW; AUT-CONSENT | Minimum access decision/audit separate from media lifetime | Protected view and concealed local presentation | Revoke, block or expiry stops future access; prior viewing/capture cannot be recalled | Refetch only under a current exact grant | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Access audit, cache and propagation boundary |
| P16 | Choice/capability | ACT-SUBJECT; AUT-CHOICE | Confirmed final choice and policy evidence | Private draft and submit verification | Close, block or withdrawal ends choice authority; timeout never infers intent | Restore only own current confirmed choice | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Mutuality ordering and withdrawal effect |
| P17 | Choice/capability; projection | ACT-SUBJECT; AUT-CAPABILITY | Minimal derived result and issued capability evidence | Private result and capability-availability view | Capability expiry/withdrawal is independent from private-choice retention | Requery own capability without exposing peer intent | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Issuance, equal timing and peer-absence window |
| P18 | Live-session; choice/capability; safety | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Pair grant, start/end/revoke and separate safety audit | Pair RTC voice, timer and connection | Pair authority ends separately from safety/report records; no automatic contact follows | Reauthorize pair and safety scopes; microphone stays off | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Pair reconnect budget and provider evidence |
| P19 | Feedback/privacy-request; ephemeral | ACT-SUBJECT; AUT-FEEDBACK | Feedback exists durably only after confirmed submit | Optional local feedback draft and retry view | Session end ends session authority only; feedback expiry and local draft lifetime remain open | Recheck submit result before retry; never duplicate | [Closing](ux/no-match-and-safe-closing.md#공통-종료-순서) | Feedback authority expiry and local draft disposal |
| P20 | Safety/case/appeal; evidence | ACT-SUBJECT; ACT-REPORTER; ACT-RESPONDENT; ACT-SANCTIONED; ACT-APPELLANT; AUT-SAFETY-SELF; AUT-REPORT; AUT-CASE; AUT-APPEAL | Separate block, report, case, notice and appeal evidence purposes | Containment, upload and coarse status view | Block/report are independent; case closure, assignment end and evidence deletion are distinct | Recheck only the affected actor's case/appeal scope | [Safety](ux/safety-and-reporting-wireflow.md#approved-participant-behavior) | Actual case stages, handoff and legal retention Gate |
| P21 | Account/resource; feedback/privacy-request | ACT-SUBJECT; AUT-SELF | Account/export/deletion request, revocation and hold evidence | Reauthentication and processing-status view | Closure revokes access before active deletion and backup expiry; scoped holds stay separate | Reauthenticate and refresh current request/hold visibility | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Processor deletion, backup expiry and completion proof |
| O01 | Operator assignment; admission/reservation | ACT-OPERATOR; AUT-OPS | Schedule, replacement, cancellation and assignment audit | Cohort-health and neutral notice projection | Handoff/assignment expiry ends access, not schedule records | Requery assignment and authoritative cohort conditions | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Assignment owner, handoff window and exact-six authority |
| O02 | Operator assignment; live-session | ACT-OPERATOR; AUT-OPS | Reason-coded consequential control and assignment audit | Room/stage/connection/control projection | Room end, handoff or removal ends control; case work remains separate | Recheck room assignment, target and current effect | [Safety](ux/safety-and-reporting-wireflow.md#approved-operator-behavior) | Operator absence, handoff and control ordering |
| O03 | Operator assignment; account/resource | ACT-REVIEWER; AUT-OPS | Media/content disposition, version and assignment audit | Queue, preview and transfer projection | Assignment/version expiry ends review access, not subject media lifecycle | Refetch current item/version and assignment | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Review handoff, version lock and deletion evidence |
| O04 | Operator assignment; safety/case/appeal | ACT-REVIEWER; AUT-OPS | Case assignment and minimum evidence references | Queue, attachment and handoff projection | Reassignment ends reviewer access; it does not close case or delete evidence | Recheck assignment and minimum evidence purpose | [Safety](ux/safety-and-reporting-wireflow.md#operator-contexts) | Case stages, assignment timing and handoff SLA |
| O05 | Operator assignment; safety/case/appeal | ACT-REVIEWER; ACT-SENIOR; AUT-DECISION | Human decision, concurrence, notice and reversal evidence | Decision confirmation and notice-delivery projection | Lost assignment/reversal ends decision authority; sanction evidence follows separate purpose | Recheck current case version and required human authority | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Concurrence, notice and actual sanction stages |
| O06 | Operator assignment; safety/case/appeal | ACT-REVIEWER; AUT-DECISION | Independent appeal assignment, outcome and correction evidence | Appeal queue, deadline and request projection | Recusal/reassignment ends access; appeal close and evidence deletion remain distinct | Recheck independence, conflict and assignment | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Appeal stages, restoration ordering and deadline evidence |
| O07 | Operator assignment; evidence | ACT-AUDITOR; AUT-AUDIT | Access reason, scope, expiry, alert and retrospective review evidence | Short-lived privileged session and alert projection | Expiry/revocation ends access; audit evidence remains under its own policy | Recheck approved purpose, scope, reason and reviewer separation | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Approver, expiry, alert and review owner |

## 7. Evidence-dependent open questions

- Vendor-controlled deletion, backup expiry, routing and outage recovery need
  executed terms and account/real-device evidence; public research is not proof.
- Qualified Korean legal/privacy review may change retention or scoped-hold
  obligations; this proposal does not invent a statutory period.
- Case, sanction and appeal operational stages, staffing and handoff timings
  remain blocked on owner-approved operations evidence and rehearsals.
- Operator assignment creation, expiry, backup coverage and break-glass review
  ownership remain proposals until evidence and owner approval exist.
- Feedback authority expiry and local-draft disposal remain unresolved.

## 8. Explicitly excluded implementation detail

This proposal defines no production state name, enum, transition diagram,
endpoint, HTTP method, DTO, request or response field, OpenAPI, AsyncAPI, table,
column, index, DBML, schema, migration, real-time command, event, state,
payload, vendor behavior, retention implementation, source code or Pilot action.
