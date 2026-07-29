---
title: Data Contract Proposal
document_type: implementation contract proposal
classification: proposal
status: Draft proposal pending owner review for Issue #21
implementation_ready: false
authoritativeness: non-authoritative
production_authority: absent
last_verified: 2026-07-29
related_documents:
  - traceability-ux-implementation.md
  - actor-authorization-contract.md
  - lifecycle-contract.md
  - realtime-contract.md
  - api-contract.md
  - data/README.md
  - data/domain-data-model.md
  - data/retention-matrix.md
  - ux/README.md
  - ../research/technology/pilot-external-evidence-gate-audit.md
  - ../research/technology/pilot-device-operations-evidence-gates.md
  - ../../scripts/docs/semantic-gates.test.mjs
  - https://github.com/woojinhong/Metabus_social/issues/21
  - https://github.com/woojinhong/Metabus_social/pull/10
  - https://github.com/woojinhong/Metabus_social/pull/14
  - https://github.com/woojinhong/Metabus_social/pull/16
  - https://github.com/woojinhong/Metabus_social/pull/18
  - https://github.com/woojinhong/Metabus_social/pull/20
decision_authority: "D-011, D-018 and D-022 govern durable authority, retention and conceptual data; D-024 governs UX; Issue #21 scopes this proposal and creates no decision authority"
---

# Data Contract Proposal

## 1. Purpose and authority boundary

This proposal maps approved `P01`–`P21` and `O01`–`O07` UX units to candidate
data responsibilities. It preserves earlier contract proposals and defines no
physical store, table, field, type, key, index, enum, schema, migration, entity,
repository, executable retention process, source code or production authority.

## 2. Data terminology

| Term | Proposal meaning |
| --- | --- |
| Authoritative fact candidate | A consequential business fact used to decide an outcome; its physical store is not selected here |
| Durable record candidate | A purpose-limited record that may remain after a connection or session ends |
| Ephemeral information | Connection, presence, timer, microphone, device or local-draft information that is not durable business authority |
| Projection | A display or summary derived from current facts; it grants no authority and is not a mutation input |
| Evidence record candidate | Purpose-scoped authorization, safety, decision or audit evidence separated from ordinary business information |
| Explicit non-storage | Information the application must not collect or persist, or must not unnecessarily duplicate |

`Required`, `Conditional` and `Not required` classify candidate Data
responsibility only. Candidate domains and catalog language are not final
aggregates, storage objects or implementation identifiers.

## 3. Responsibility categories

- Authoritative facts answer consequential business questions; projections only
  present current permitted views and must be rebuilt from current authority.
- Durable candidates need a documented purpose, minimum access and deletion
  boundary. Ephemeral observations do not become durable merely because seen.
- Evidence records have their own purpose, access and lifetime. They neither
  authorize unrelated reuse nor inherit the lifetime of a case or account.
- Explicit non-storage applies across application data, logs, analytics,
  support views, exports and unauthorized vendor-return copies.

## 4. Authoritative fact and projection separation

PostgreSQL remains the approved durable authority under D-011, without selecting
physical structures. API receipt, Realtime delivery, RTC membership, local
state and cached projections never prove a durable outcome. Uncertain writes
are resolved against current authority. Duplicate intent must not create a
second fact, and an older mutation cannot replace a newer authoritative fact.

## 5. Candidate information domains

Account/eligibility, profile/preferences, media/review,
reservation/admission, session/stage, consent/disclosure,
private choice/derived capability, feedback, block/report, case/evidence,
sanction/appeal, operator assignment, audit/privileged access and
privacy export/deletion are distinct candidate domains. They may relate, but
this list is neither a final aggregate map nor a physical data design.

## 6. Ownership and mutation responsibility

- A subject owns exercise of their account, profile, consent, choice, feedback
  and privacy rights; ownership does not allow access to another person's facts.
- Backend authorities confirm consequential reservation, admission, session,
  capability, block, case, sanction, appeal and access facts.
- Operators may mutate only assigned, least-privilege work under the applicable
  separation-of-duty boundary; assignment data is separate from the work.
- Multiple actor/auth refs below are conditional intersections for the stated
  actor and action, never a permission union.

## 7. Relationship and integrity constraints

- One account may have at most one active reservation for a scheduled session
  and may not occupy the same cohort twice.
- Admission requires current account, eligibility, reservation and policy
  authority; readiness or presence alone creates no admission fact.
- Consent grant, disclosure access and protected resource are distinct.
- Confirmed private choice and derived capability are distinct; neither exposes
  peer intent, count or reason.
- Pair authority depends on current derived capability and ends on applicable
  block, removal or sanction without deleting separate evidence.
- Block, report, case, sanction, appeal and their assignments remain distinct.
- Sanction reversal corrects affected derived access while retaining purpose-
  limited reversal evidence; reviewer independence remains enforceable.

## 8. Privacy, evidence and deletion boundaries

- Never store raw audio, recording, transcript, screenshot, raw NICE response,
  DOB, name, carrier, CI, DI, identity document, liveness, face comparison,
  biometric template, vector data or unauthorized vendor raw response.
- Do not expose or unnecessarily duplicate peer private choice, choice count or
  reason, consent-refusal reason, reporter identity or unrelated case evidence.
- Consent/access audit, safety evidence and privileged-access evidence use
  separate purposes and minimum audiences from ordinary participant data.
- Authorization end, deletion request, active deletion, backup expiry and
  deletion evidence are distinct. Delete at the earlier of purpose completion
  or D-018's approved retention limit, except within a documented scoped legal
  hold; when it ends, the ordinary rule resumes. No indefinite hold is created.

## 9. Participant canonical crosswalk

API evidence points to proposal responsibilities, not an endpoint or field.

| UX | Actor/auth refs | Need | Domain | Authoritative fact candidate | Durable candidate | Ephemeral information / Projection | Explicit non-storage | Candidate owner | Mutation responsibility | Relationship/integrity | Privacy boundary | Retention/deletion | B Gate | API evidence | UX evidence | Open question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | ACT-PUBLIC; AUT-PUBLIC | Not required | Public guidance | Current published version | Content version only if required by publisher | Ephemeral: loaded cache; Projection: public content | Participant tracking not required for display | Content owner | Publisher process outside this UX unit | Cache cannot outrank current publication | Public information only | Content governance remains separate | Not applicable | [API P01](api-contract.md#9-participant-canonical-crosswalk) | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Acknowledgement ownership |
| P02 | ACT-CLAIMANT; ACT-SUBJECT; AUT-RECOVERY; AUT-SELF | Required | Account/recovery | Minimized recovery outcome; verified account fact only after proof | Account and reason-coded recovery evidence | Ephemeral: claimant form; Projection: neutral progress | Secrets and unverified account detail | Claimant evidence owner; verified subject separately | Claimant submits proof; account authority confirms outcome | Claimant authority cannot mutate subject facts before proof | Enumeration-safe; own account only after verification | Recovery authority end is not account deletion | Provider/recovery proof open | [API P02](api-contract.md#9-participant-canonical-crosswalk) | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Minimum proof and session boundary |
| P03 | ACT-SUBJECT; AUT-SELF | Required | Eligibility | Minimized adult-eligible outcome, time, provider, policy version and opaque reference | Minimized outcome and necessary audit | Ephemeral: provider handoff; Projection: checking/result status | Raw response, DOB, name, carrier, CI, DI, liveness and biometrics | Subject; eligibility authority confirms | Subject requests; backend minimizes and confirms | Vendor return is input, not authority | No routine operator or analytics exposure | D-018 identity outcome limit applies | NICE fields, callback and deletion unproved | [API P03](api-contract.md#9-participant-canonical-crosswalk) | [Identity](security/identity-admission-and-invitations.md#adult-eligibility-recovery) | Exact minimum provider evidence |
| P04 | ACT-SUBJECT; AUT-SELF | Required | Profile/preferences | Confirmed own profile and private preferences | Confirmed purpose-limited values | Ephemeral: local draft; Projection: validation/confirmed view | Peer/routine-operator preference copies | Subject | Subject submits allowed correction; backend confirms | Stale draft cannot overwrite newer confirmation | Preferences are private compatibility inputs | Purpose end/approved limit; draft policy open | Not applicable | [API P04](api-contract.md#9-participant-canonical-crosswalk) | [Workflow](ux/end-to-end-workflow.md) | Draft disposal and correction lock |
| P05 | ACT-SUBJECT; AUT-SELF | Required | Media/review | Current media resource and separate review disposition | Protected media, version and minimum review evidence | Ephemeral: transfer/scan progress; Projection: review status | EXIF, biometric comparison and unauthorized scan output | Subject owns media rights; assigned reviewer owns disposition action | Subject submits/replaces/deletes; O03 reviews assigned version | Disposition references exact version; stale review cannot release | Minimum audience; media absent from general logs/notices | D-018 media limit; deletion/cache proof open | Storage, scan and deletion unproved | [API P05](api-contract.md#9-participant-canonical-crosswalk) | [Disclosure](ux/progressive-disclosure-wireflow.md#product-constraints) | Version, appeal and deletion evidence |
| P06 | ACT-SUBJECT; AUT-SELF | Required | Reservation/admission | Own accepted request or confirmed reservation | Request outcome and reservation where created | Ephemeral: Not applicable; Projection: capacity/eligibility | Peer attendance detail in participant views, preferences and compatibility inputs | Subject for request; reservation authority confirms | Subject requests; backend evaluates current capacity | Projection cannot book; duplicate intent creates no second reservation | Own status only | Cancellation ends access, not required audit | Not applicable | [API P06](api-contract.md#9-participant-canonical-crosswalk) | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Capacity owner and deduplication |
| P07 | ACT-SUBJECT; AUT-SELF | Required | Reservation/admission | Current own reservation, cancellation, rebooking and purpose-limited attendance/no-show outcome | Reservation, reason-minimized attendance/no-show and change audit | Ephemeral: Not applicable; Projection: status/notification | Peer-facing attendance copies and personal absence cause | Subject; schedule authority confirms | Subject or scoped O01 action changes reservation; authority records attendance | Cancel/rebook races use current authority; no cohort duplicate | Participant sees neutral own effect; operations fact stays restricted | D-018 attendance/no-show limit under earlier-of rule | Notification behavior open | [API P07](api-contract.md#9-participant-canonical-crosswalk) | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Cancellation race and standby semantics |
| P08 | ACT-SUBJECT; AUT-SELF | Conditional | Admission/readiness | Minimized readiness outcome only if admission requires it | Minimum receipt only where purpose requires | Ephemeral: device/permission/route/quality/mic; Projection: readiness view | Raw audio and unnecessary device fingerprint | Subject/device; admission authority evaluates minimum evidence | Local test; optional minimized submission | Stale diagnostics cannot prove current readiness | No raw voice or broad device telemetry | Ephemeral data expires with recovery purpose | Real-device behavior unproved | [API P08](api-contract.md#9-participant-canonical-crosswalk) | [Accessibility](ux/accessibility-requirements.md#task-level-requirements) | Minimum transmitted evidence |
| P09 | ACT-SUBJECT; AUT-ADMISSION | Required | Reservation/admission | Readiness receipt and separate authoritative admission outcome | Minimum admission/cancellation audit | Ephemeral: presence/countdown; Projection: neutral cohort/admission status | Peer count, identity, readiness or absence reason | Subject; admission decision owner remains open | Subject readies; authority admits, delays or cancels | Presence is not admission; exact-six owner unresolved | Neutral own outcome only | Pre-admission authority expiry is not reservation deletion | Presence/device/operations evidence open | [API P09](api-contract.md#9-participant-canonical-crosswalk) | [Session](ux/session-wireflow.md#readiness-late-entry-and-participant-loss) | Exact-six authoritative owner |
| P10 | ACT-SUBJECT; AUT-SESSION | Conditional | Session/stage | Consequential current stage and participant action facts | Reason-coded stage/action audit where required | Ephemeral: presence/connection/quality/mic; Projection: stage/timer | Raw audio and hidden scores | Session authority; participant owns own action | Backend confirms consequential effects | Current stage wins; projection never mutates authority | Exact current audience and scope | Session end is separate from audit deletion | RTC recovery evidence open | [API P10](api-contract.md#9-participant-canonical-crosswalk) | [State model](ux/screen-state-model.md#승인된-전환-표현) | Which actions require durable confirmation |
| P11 | ACT-SUBJECT; AUT-SESSION | Required | Session/content | Assigned content version and confirmed own action where purpose requires | Content reference and minimum confirmed-response evidence | Ephemeral: draft/timer; Projection: turn/share/content view | Unsubmitted draft and unnecessary raw response | Participant; content/session authority confirms | Participant submits/passes/shares within current scope | Stage close wins; duplicate action cannot repeat | Private input is not general audience content | Raw-response purpose and lifetime open | Device interruption evidence open | [API P11](api-contract.md#9-participant-canonical-crosswalk) | [Session](ux/session-wireflow.md#approved-sequence) | Minimum response and share evidence |
| P12 | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Required | Session; block/report | Session effect and separate leave, block or report facts | Consequential session audit and separately scoped safety evidence | Ephemeral: RTC voice/presence; Projection: neutral prompt/status | Raw audio, blocker/reporter identity copies | Participant or reporter under matching scope | Session and safety mutations remain independent | RTC end does not delete safety evidence; one action implies no other | Safety identities and evidence minimum-scope | Each purpose follows its own D-018 limit | RTC/operations evidence open | [API P12](api-contract.md#9-participant-canonical-crosswalk) | [Session](ux/session-wireflow.md#approved-sequence) | Minimum session and safety evidence |
| P13 | ACT-SUBJECT; AUT-CHOICE | Required | Private choice | Own confirmed initial choice or confirmed none | Purpose-limited confirmed private choice | Ephemeral: editable local draft; Projection: choice window | Peer choice, count, reason and timed-out draft | Subject | Subject submits/withdraws own choice; backend confirms | Timeout creates no choice; block/close outrank stale submit | No peer/routine-operator access | Draft and confirmed-choice lifetimes are separate | Not applicable | [API P13](api-contract.md#9-participant-canonical-crosswalk) | [Disclosure](ux/progressive-disclosure-wireflow.md#initial-interest-behavior) | Close ordering and draft disposal |
| P14 | ACT-SUBJECT; AUT-CONSENT | Required | Consent/disclosure | Exact resource-specific grant, decline or withdrawal decision | Consent decision, wording/policy version and minimum evidence | Ephemeral: local decision input; Projection: consent/expiry view | Refusal reason and unauthorized peer inference | Resource subject | Subject decides exact scope; backend confirms | Grant does not create access by itself; withdrawal outranks stale grant | Viewer receives no refusal cause | Consent record and access lifetime separate | Wording/clock evidence open | [API P14](api-contract.md#9-participant-canonical-crosswalk) | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Grant granularity and revoke race |
| P15 | ACT-VIEWER; ACT-SUBJECT; AUT-VIEW; AUT-CONSENT | Required | Consent/disclosure | Current exact disclosure-access decision; resource remains separate | Minimum access audit and protected resource under its own purpose | Ephemeral: local presentation/cache; Projection: protected view/access | Unauthorized copy, capture telemetry and refusal cause | Subject owns resource; named viewer gets scoped access | Authority evaluates access; subject withdraws through P14 | Subject, viewer, resource, purpose, stage and expiry must match | Only granted resource; prior capture cannot be recalled | Revoke stops future access, not automatic audit deletion | Cache/delivery/deletion unproved | [API P15](api-contract.md#9-participant-canonical-crosswalk) | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Access audit and cache boundary |
| P16 | ACT-SUBJECT; AUT-CHOICE | Required | Private choice | Own confirmed final choice or confirmed none | Purpose-limited confirmed private choice | Ephemeral: editable local draft; Projection: final window | Peer choice, count, reason and timed-out draft | Subject | Subject submits/withdraws own choice; backend confirms | Timeout creates no choice; mutuality is not inferred locally | No peer/routine-operator access | Draft and confirmed-choice lifetimes are separate | Not applicable | [API P16](api-contract.md#9-participant-canonical-crosswalk) | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Close ordering and withdrawal effect |
| P17 | ACT-SUBJECT; AUT-CAPABILITY | Required | Derived capability | Own minimal next-step capability derived from authoritative mutuality | Capability issuance/withdrawal evidence without peer intent | Ephemeral: Not applicable; Projection: private result/availability | Peer intent, choice, count and reason | Subject receives own result; backend derives | Backend creates/withdraws capability from current facts | Capability grants no private-choice access | Equal-timing, neutral no-result treatment | Capability and source-choice lifetimes separate | Notification/device evidence open | [API P17](api-contract.md#9-participant-canonical-crosswalk) | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Issuance and peer-absence boundary |
| P18 | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Required | Pair session; block/report | Pair authority and separate end, block or report facts | Pair start/end/revoke audit and separate safety evidence | Ephemeral: RTC voice/connection/mic; Projection: pair timer/status | Raw audio, contact data and peer-private reason | Participant/reporter under matching scope | Backend confirms pair/safety effects; RTC only carries voice | Capability required; pair admission creates no contact/text right | Named pair only; safety identities protected | Pair end does not delete safety evidence | LiveKit/device evidence open | [API P18](api-contract.md#9-participant-canonical-crosswalk) | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Pair evidence and reconnect boundary |
| P19 | ACT-SUBJECT; AUT-FEEDBACK | Required | Feedback | Confirmed own feedback receipt and optional submitted content | Feedback only after confirmed submission | Ephemeral: local draft; Projection: uncertain-result/receipt view | Unsubmitted draft and inferred peer-choice reason | Subject | Subject submits/skips/retries; backend confirms receipt | Duplicate retry creates no second feedback; safety content routes separately | Feedback audience purpose-limited | Feedback expiry and draft disposal open | Device/local-draft evidence open | [API P19](api-contract.md#9-participant-canonical-crosswalk) | [Closing](ux/no-match-and-safe-closing.md#공통-종료-순서) | Authority expiry and draft disposal |
| P20 | ACT-SUBJECT; ACT-REPORTER; ACT-RESPONDENT; ACT-SANCTIONED; ACT-APPELLANT; AUT-SAFETY-SELF; AUT-REPORT; AUT-CASE; AUT-APPEAL | Required | Block/report; case/evidence; sanction/appeal | Separate block, report receipt, case effect, sanction notice and appeal outcome | Separate optional evidence, case, decision, notice, appeal evidence and outcome | Ephemeral: upload/containment progress; Projection: coarse protected status | Reporter identity duplication, unrelated evidence and internal notes to parties | Each actor under matching scope; assigned authorities decide | Each actor mutates only its action; reviewers act through O04-O06 | Block/report independent; assignment, case close and evidence deletion distinct | Minimum protected actor-specific view | D-018 and approved operations limits; case close is not deletion | Actual stages/staffing/vendor evidence open | [API P20](api-contract.md#9-participant-canonical-crosswalk) | [Safety](ux/safety-and-reporting-wireflow.md#approved-participant-behavior) | Actual stages, evidence scope and handoff |
| P21 | ACT-SUBJECT; AUT-SELF | Required | Privacy/account | Separate export/deletion request, processing outcome, revocation and completion evidence | Minimum request/status/completion and authorized hold evidence | Ephemeral: reauthentication input; Projection: processing status | Hidden processor data, secrets and other-account information | Subject exercises rights; privacy/account authority processes | Subject requests; authority records distinct receipt and completion | Request is not completion; closure, revocation, active deletion and backup expiry differ | Own status; hold detail limited by lawful scope | Earlier-of rule; scoped legal hold only; processor/backup proof open | Vendor/backup completion unproved | [API P21](api-contract.md#9-participant-canonical-crosswalk) | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Export scope and deletion proof |

## 10. Operator canonical crosswalk

| UX | Actor/auth refs | Need | Domain | Authoritative fact candidate | Durable candidate | Ephemeral information / Projection | Explicit non-storage | Candidate owner | Mutation responsibility | Relationship/integrity | Privacy boundary | Retention/deletion | B Gate | API evidence | UX evidence | Open question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O01 | ACT-OPERATOR; AUT-OPS | Required | Reservation/assignment | Current assigned schedule, purpose-limited attendance/no-show and confirmed scoped change | Assignment, restricted attendance/no-show, replacement/cancellation reason and audit | Ephemeral: Not applicable; Projection: cohort-health/capacity | Participant-facing absence cause, preferences and compatibility inputs | Schedule authority; assigned operator acts | Operator changes only assigned schedule scope; authority records attendance | Assignment end is not record deletion; capacity projection not authority | Attendance is operations-restricted; participant effect stays neutral | D-018 attendance/no-show limit under earlier-of rule | Staffing/handoff evidence open | [API O01](api-contract.md#10-operator-canonical-crosswalk) | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Exact-six owner and handoff |
| O02 | ACT-OPERATOR; AUT-OPS | Required | Session/assignment | Current assigned room and confirmed consequential control | Assignment and reason-coded mute/remove/pause/cancel/handoff audit | Ephemeral: connection/RTC quality; Projection: room/stage/control | Voice, private choice and consent-refusal data | Session authority; assigned operator acts | Operator submits exact room/target/effect | Assignment and target must match; projection cannot cause control | Minimum room scope only | Assignment end and session record lifetime differ | RTC/staffing evidence open | [API O02](api-contract.md#10-operator-canonical-crosswalk) | [Safety](ux/safety-and-reporting-wireflow.md#approved-operator-behavior) | Control confirmation and absence cover |
| O03 | ACT-REVIEWER; AUT-OPS | Required | Media/review/assignment | Current assigned item/version and reasoned disposition | Held media, assignment, disposition and minimum reason | Ephemeral: transfer progress; Projection: queue/preview | Biometric/manual identity findings and unrelated media | Subject owns media rights; assigned reviewer decides disposition | Reviewer acts on assigned current version | Stale assignment/version cannot release or reject | Protected item only; subject sees minimum outcome | Item and review evidence follow separate purposes | Scan/staffing/deletion evidence open | [API O03](api-contract.md#10-operator-canonical-crosswalk) | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Version lock, appeal and handoff |
| O04 | ACT-REVIEWER; AUT-OPS | Required | Case/evidence/assignment | Current case assignment and reasoned triage/handoff | Assignment, minimum evidence references and triage audit | Ephemeral: attachment progress; Projection: queue/coarse status | Reporter identity copies, unrelated evidence and raw bulk export | Case authority; assigned safety reviewer acts | Reviewer accesses/mutates assigned minimum case scope | Reassignment ends access, not case or evidence | Case/purpose/role-limited | Case close, assignment end and deletion differ | Stages/staffing/handoff evidence open | [API O04](api-contract.md#10-operator-canonical-crosswalk) | [Safety](ux/safety-and-reporting-wireflow.md#operator-contexts) | Assignment owner and evidence scope |
| O05 | ACT-REVIEWER; ACT-SENIOR; AUT-DECISION | Required | Sanction/case | Human sanction, reversal and notice decisions | Findings, evidence references, duration, concurrence and notice evidence | Ephemeral: decision input; Projection: confirmation/notice delivery | Reporter identity and LLM-only irreversible conclusion | Authorized human; senior for permanent/severe decision | Matching reviewer records reasoned decision | Current case and required concurrence; reversal corrects derived access | Affected person gets high-level notice only | Decision/appeal evidence follows approved purpose | Staffing/notice stages open | [API O05](api-contract.md#10-operator-canonical-crosswalk) | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Concurrence and restoration evidence |
| O06 | ACT-REVIEWER; AUT-DECISION | Required | Appeal/case/assignment | Independent appeal outcome and required correction | Assignment, narrow evidence request, reasoned outcome and restoration audit | Ephemeral: review input; Projection: queue/status/deadline | Reporter identity, unrelated evidence and original-reviewer authority | Independent assigned appeal reviewer | Reviewer recuses or decides within assigned scope | Conflict check required; outcome may reverse sanction without deleting audit | Appellant gets protected own outcome | Appeal close and evidence deletion differ | Staffing/timing/restoration evidence open | [API O06](api-contract.md#10-operator-canonical-crosswalk) | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Independence proof and correction ordering |
| O07 | ACT-AUDITOR; AUT-AUDIT | Required | Audit/privileged access | Scoped request, grant, expiry, revocation and review outcome | Reason, scope, authority, alert and retrospective-review evidence | Ephemeral: privileged session; Projection: alert/access view | Secrets, bulk protected export and alert content copies | Security/privacy authority; separated reviewer | Matching authorized actors request, approve, revoke and review | Request is not grant; expiry/revocation ends access, not audit evidence | Case/purpose/time-limited; alert contains no protected content | D-018 audit limit; no indefinite access or hold | Owner/rehearsal evidence open | [API O07](api-contract.md#10-operator-canonical-crosswalk) | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Approver, alert owner and tamper evidence |

## 11. B Evidence Gate dependencies

- NICE fields, masking, callback, provider retention and deletion require
  executed terms, account evidence and qualified privacy review.
- LiveKit metadata, routing and deletion are not durable application facts;
  recording remains off and Korean device behavior remains unproved.
- NCP backup/restore, processor deletion completion and observed recovery need
  approved account drills; no completion time is promised here.
- Case staffing, handoff, privileged-access ownership and operational stages
  remain evidence/rehearsal Gates rather than Data facts.

## 12. Open contract questions

- Which candidates need a durable record, and what minimum relationship proves
  their purpose without selecting physical structures?
- Which confirmed actions need separate evidence from the business fact?
- How are duplicate intent and concurrent mutation represented later without
  exposing private state or making a projection authoritative?
- What qualified legal/vendor evidence changes retention, processor, backup,
  export, deletion-completion and scoped-legal-hold responsibilities?
- Which operational facts require tamper evidence, concurrence or correction
  lineage while preserving deletion and subject-right boundaries?

## 13. Explicitly excluded implementation detail

This proposal defines no final table, column, SQL type, primary/foreign key,
index, enum, entity, repository, DBML, DDL, migration, ERD, physical schema,
partitioning, sharding, retention job, endpoint, DTO, GraphQL schema, realtime
payload, vendor behavior, exact timer, source code, deployment or Pilot action.
