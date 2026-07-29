---
title: API Contract Proposal
document_type: implementation contract proposal
classification: proposal
status: Draft proposal pending owner review for Issue #19
implementation_ready: false
authoritativeness: non-authoritative
production_authority: absent
last_verified: 2026-07-29
related_documents:
  - traceability-ux-implementation.md
  - actor-authorization-contract.md
  - lifecycle-contract.md
  - realtime-contract.md
  - api/README.md
  - ux/failure-and-recovery-workflow.md
  - ../research/technology/pilot-external-evidence-gate-audit.md
  - ../research/technology/pilot-device-operations-evidence-gates.md
  - ../../scripts/docs/semantic-gates.test.mjs
  - https://github.com/woojinhong/Metabus_social/issues/19
  - https://github.com/woojinhong/Metabus_social/pull/10
  - https://github.com/woojinhong/Metabus_social/pull/14
  - https://github.com/woojinhong/Metabus_social/pull/16
  - https://github.com/woojinhong/Metabus_social/pull/18
decision_authority: "D-020 and D-023 govern API and identity principles; D-024 governs UX; Issue #19 scopes this proposal and creates no decision authority"
---

# API Contract Proposal

## 1. Purpose and authority boundary

This proposal maps approved `P01`–`P21` and `O01`–`O07` UX units to candidate
API responsibilities. It preserves the Actor/Authorization, Lifecycle and
Realtime proposals and defines no endpoint, method, operation identifier,
field, schema, error number, storage design, source code or production authority.

## 2. API terminology

| Term | Proposal meaning |
| --- | --- |
| Query responsibility | Read current authoritative facts or an allowed projection without changing authority or work |
| Change responsibility | Ask to create, change, withdraw or cancel a consequential fact after current authorization checks |
| Submission responsibility | Submit a user's intent or material; receipt and completed processing may differ |
| Processing-status responsibility | Read a permitted receipt, progress, completion or failure projection without defining a queue or storage state |
| Recovery responsibility | Resolve uncertainty by rereading authority, then safely retrying or cancelling where still allowed |
| Realtime separation | A notification may prompt a query but never proves API success or replaces the authoritative source |

These are documentation categories, not final operations, routes, interfaces,
service names or implementation identifiers.

## 3. Responsibility categories

`Required` means the approved UX needs an API responsibility candidate.
`Conditional` means an API responsibility is needed only for the stated
authoritative or recovery boundary. `Not required` means local or Realtime
behavior is sufficient for this UX unit. None selects a protocol or interface.

## 4. Query and change responsibility

- Queries return only current authorized facts or minimized projections; a read
  does not grant permission, acknowledge another person's intent or change work.
- Changes and submissions recheck the matching actor, contextual role,
  assignment scope, authorization boundary and lifetime at evaluation time.
- Receipt confirms only accepted responsibility. Long-running work requires a
  separately authorized status query before completion may be claimed.
- Public or cached projections never become the input authority for a change.

## 5. Authorization and assignment checks

- Revoked, expired, blocked, removed or unassigned actors fail closed for new
  changes; protected reads are reauthorized on every request.
- Operator work rechecks current assignment, exact subject/resource/session/case
  scope and separation of duty. A shared console creates no authority.
- Permanent sanctions require human senior review; appeal review is independent
  from the original decision; an LLM cannot solely confirm irreversible action.
- Multiple actor/auth refs in a row are conditional intersections for the stated
  actor and action, never a permission union.

## 6. Duplicate, retry and concurrency constraints

- Retrying the same intent must not create duplicate consequential work; the
  concrete idempotency representation remains open.
- An older request cannot overwrite newer authoritative facts. Later design must
  define version comparison or serialization without fixing a field here.
- When the result is uncertain, first query the authoritative result. Retry or
  cancel only if current authority and the operation's safety boundary allow it.
- Block, withdrawal, expiry, close and operator handoff take precedence over
  stale requests without revealing a protected cause.

## 7. Failure, recovery and cancellation

Neutral failures distinguish invalid, expired, conflicted, rate-limited,
temporarily unavailable and still-processing responsibilities without exposing
peer or account existence. Recovery reauthenticates where needed, requeries
current facts and offers only still-valid retry, correction, cancellation,
support or safe exit. API failure alone does not delete data, end a session or
reverse a completed authoritative action.

## 8. Realtime and local responsibility separation

Realtime delivery signals that a requery may be useful; delivery or loss never
proves completion, cancellation or deletion. RTC voice, presence, connection,
quality and local microphone observations remain Realtime/local responsibilities.
Private drafts remain local unless explicitly submitted and confirmed. Local
state never restores authority or substitutes for a protected query.

## 9. Participant canonical crosswalk

| UX | Actor/auth refs | Need | Responsibility | Initiator | Authority | Preconditions | Success | Failure/recovery | Duplicate/concurrency | Realtime/local separation | Privacy | B Gate | Evidence | Open question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | ACT-PUBLIC; AUT-PUBLIC | Not required | No API responsibility; load or reload current published guidance locally or as static content | Visitor | Published content authority | Service/content available | Current public projection displayed | Reload or safe exit | Cache cannot outrank current version | Local/static render; no realtime duty | Public data only | Not applicable | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Acknowledgement ownership |
| P02 | ACT-CLAIMANT; ACT-SUBJECT; AUT-RECOVERY; AUT-SELF | Required | Submit recovery proof; query neutral progress; verified subject may separately query or change own account only after proof | Matching claimant or verified subject | Account/recovery authority | Claimant proof or verified ownership, respectively | Proof receipt or own current account outcome, never presumed ownership | Neutral retry, reauthenticate, support or cancel | Duplicate proof cannot widen authority; newer revocation wins | Local form; transactional notice may prompt requery | No account detail before ownership proof | Recovery/vendor evidence open | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Proof, enumeration and session boundary |
| P03 | ACT-SUBJECT; AUT-SELF | Required | Submission verification request; query minimized result/status | Subject | Backend-minimized eligibility authority; vendor return is input | Authenticated account; current attempt allowed | Attempt receipt or current minimized outcome | Requery; accessible retry/support; fail closed | Provider replay cannot duplicate or widen outcome | Vendor handoff is separate; notification cannot prove eligibility | No raw response, DOB, CI, DI or biometrics | NICE fields/callback/deletion unproved | [Identity](security/identity-admission-and-invitations.md#adult-eligibility-recovery) | Callback, replay and minimum result |
| P04 | ACT-SUBJECT; AUT-SELF | Required | Query confirmed profile; submit own input; change only an allowed correction | Subject | Confirmed profile/preference authority | Current eligibility and edit authority | Own confirmed value returned after accepted submission or correction | Correct, requery or exit | Stale correction cannot overwrite newer confirmed input | Draft/validation local until confirmation | Preferences never exposed to peers/routine operators | Not applicable | [Workflow](ux/end-to-end-workflow.md) | Draft lock and correction authority |
| P05 | ACT-SUBJECT; AUT-SELF | Required | Submit own media; change replace/delete; query processing or review status | Subject; assigned reviewer acts under O03 | Media/review authority | Own resource; current version and permission | Submission receipt plus separately confirmed media/disposition state | Requery; retry/replace/delete/appeal/support | Duplicate transfer or stale review cannot release/replace twice | Progress may notify; protected media is separately fetched | Face/clue media minimum audience only | Storage, scan, cache and deletion proof open | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Version, review concurrency and appeal |
| P06 | ACT-SUBJECT; AUT-SELF | Required | Query eligible slots; submit own reservation request | Subject | Reservation/capacity authority | Profile/media gates and current eligibility | Current availability or confirmed own request outcome | Requery, choose later or support | Stale capacity cannot book; duplicate request creates no ambiguity | Realtime not required; projection is never capacity authority | No peer attendance or compatibility inputs | Not applicable | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Capacity owner and request deduplication |
| P07 | ACT-SUBJECT; AUT-SELF | Required | Query own reservation; change cancel/rebook where allowed | Subject | Reservation authority | Own current reservation and cancellation authority | Current own status or confirmed cancellation/rebooking | Requery; safely retry/cancel; support | Cancellation/rebook race serialized; duplicate cancel harmless | Notice may prompt query but cannot change booking | Peer status and absence cause hidden | Notification evidence open | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Cancellation race and standby semantics |
| P08 | ACT-SUBJECT; AUT-SELF | Conditional | Submit only minimum readiness evidence if admission needs it; no API authority for microphone state | Subject | Admission readiness authority where required | Own device test; current reservation | Minimized readiness receipt, not raw audio | Retest locally or seek support | Stale diagnostic cannot prove current readiness | Device, route, permission, mic and quality remain local/Realtime observations | Raw audio never sent or stored | Real-device behavior unproved | [Accessibility](ux/accessibility-requirements.md#task-level-requirements) | Minimum transmitted diagnostics |
| P09 | ACT-SUBJECT; AUT-ADMISSION | Required | Submit readiness; query admission/delay/cancel outcome | Subject | Reservation/admission authority; exact-six owner open | Current reservation, window, eligibility and readiness | Readiness receipt or authoritative own admission outcome | Requery/reconnect/support/rebook; fail closed | Admission/cancel serialize; duplicate readiness harmless | Presence is Realtime observation, never API admission proof | No peer count, identity or reason | Admission/vendor/device evidence open | [Session](ux/session-wireflow.md#readiness-late-entry-and-participant-loss) | Exact-six authoritative owner |
| P10 | ACT-SUBJECT; AUT-SESSION | Conditional | Query current stage/capabilities; submit consequential participant actions not carried solely by RTC | Participant | Backend session/stage authority | Current admission, stage and action scope | Confirmed own effect or current projection | Reauthorize, requery, safe exit | Current stage/version wins; duplicate action contained | Voice, presence, connection and mic stay Realtime/local | No private choices or hidden scores | RTC recovery evidence open | [State model](ux/screen-state-model.md) | Which live actions require API confirmation |
| P11 | ACT-SUBJECT; AUT-SESSION | Required | Query assigned content; submit/pass/confirm own response or share responsibility | Participant | Backend content/stage/confirmed-response authority | Current stage, item, turn and audience | Receipt plus current confirmed own action | Requery item/outcome; retry/pass/safe transition | Duplicate submit/share cannot repeat; stage close wins | Draft/timer local; live projection follows Realtime | Private input is not general audience content | Device interruption evidence open | [Session](ux/session-wireflow.md#approved-sequence) | Raw-response purpose and share confirmation |
| P12 | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Conditional | Submit independent leave/block/report facts or query current session; voice is not API work | Matching participant or reporter | Backend session/safety authority | Matching current session or safety scope | Confirmed own safety/session effect without implying another action | Immediate leave; requery/retry optional report evidence | Session and safety requests remain independent; duplicates contained | RTC voice/presence stay Realtime; API records consequential effects | Voice unrecorded; blocker/reporter identities protected | RTC/operator recovery unproved | [Session](ux/session-wireflow.md#approved-sequence) | Neutral intervention and safety routing |
| P13 | ACT-SUBJECT; AUT-CHOICE | Required | Query own confirmed choice/window; submit or withdraw own initial interest | Subject | Backend choice-window/confirmed-choice authority | Current window, eligible targets and no overriding block | Own confirmed choice or none; no peer result | Requery; retry before close; timeout submits nothing | Close/block/version wins; duplicate cannot disclose result | Window invalidation may notify; private draft stays local | No peer choice, count, reason or inference | Not applicable | [Disclosure](ux/progressive-disclosure-wireflow.md#initial-interest-behavior) | Close ordering and withdrawal acknowledgement |
| P14 | ACT-SUBJECT; AUT-CONSENT | Required | Query grant terms/current own grant; submit grant/decline/withdrawal | Resource subject | Backend consent authority | Exact subject, viewer, resource, purpose, stage and block checks | Subject decision confirmed; access remains separate | Requery exact scope; neutral no-reveal on failure | Withdrawal/expiry outrank stale grant; duplicates contained | Access-availability may notify but grant confirmation is authoritative | Refusal and reason hidden from viewer | Consent wording/clock evidence open | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Revocation race and grant granularity |
| P15 | ACT-VIEWER; ACT-SUBJECT; AUT-VIEW; AUT-CONSENT | Required | Query current exact access; fetch protected resource separately; subject withdrawal uses P14 responsibility | Matching viewer or subject | Backend disclosure-access authority; resource authority separate | Current exact grant, block, stage and viewer checks | Exact authorized resource or neutral denial | Reauthorize/refetch or close; never substitute content | Revoke/block/expiry wins; stale query cannot reopen | Notification only prompts reauthorization; presentation remains local | Only exact grant; capture cannot be recalled | Cache/delivery/deletion evidence open | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Access audit and cache boundary |
| P16 | ACT-SUBJECT; AUT-CHOICE | Required | Query own confirmed choice/window; submit or withdraw own final choice | Subject | Backend final-window/confirmed-choice authority | Current window, eligible targets and no overriding block | Own confirmed choice or none; mutuality not inferred | Requery; retry before close; timeout submits nothing | Close/block/version wins; duplicate cannot infer mutuality | Window invalidation may notify; private draft stays local | No peer choice, count, reason or hint | Not applicable | [Closing](ux/no-match-and-safe-closing.md) | Close ordering and withdrawal effect |
| P17 | ACT-SUBJECT; AUT-CAPABILITY | Required | Query own derived capability; submit pair-entry request separately from choice | Subject | Backend capability authority from authoritative mutuality | Final close and current own capability | Own current next-step capability or neutral no-next-step | Requery after notice/reconnect; safe close | Withdrawal/expiry wins; duplicate query grants nothing | Realtime may notify availability; API/source confirms it | No peer intent, choice, count or reason | Notification/device evidence open | [Closing](ux/no-match-and-safe-closing.md) | Issuance and equal-timing protection |
| P18 | ACT-SUBJECT; ACT-REPORTER; AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Conditional | Submit pair admission/end and independent block/report; query current pair authority | Matching participant or reporter | Backend pair/safety authority | Current capability and matching pair/safety scope | Confirmed own pair or safety effect | Reauthorize; safe close/support; mic stays off | Revoke/block/end outrank stale join; duplicates contained | Voice/connection/mic stay Realtime/local; no contact/text API | No peer-private reason or reporter/blocker identity | LiveKit/device evidence open | [Closing](ux/no-match-and-safe-closing.md) | Pair admission and end ordering |
| P19 | ACT-SUBJECT; AUT-FEEDBACK | Required | Submit optional own feedback; query uncertain submission result | Subject | Feedback submission authority | Own closing context and current feedback authority | Confirmed own receipt; skip requires no API change | Requery before retry; discard local draft or route safety separately | Duplicate retry cannot create duplicate feedback | Draft is local; no realtime responsibility | Safety content uses separate report/case flow | Feedback expiry/device behavior open | [Closing](ux/no-match-and-safe-closing.md) | Feedback authority expiry and draft disposal |
| P20 | ACT-SUBJECT; ACT-REPORTER; ACT-RESPONDENT; ACT-SANCTIONED; ACT-APPELLANT; AUT-SAFETY-SELF; AUT-REPORT; AUT-CASE; AUT-APPEAL | Required | Separate change/submission block, report, evidence, notice acknowledgement and appeal; query own coarse case/appeal status | Each actor under matching conditional refs | Backend safety/case/sanction/appeal authority | Current matching actor, protected scope and action authority | Only own containment, receipt, coarse status, notice or appeal outcome | Immediate containment; requery; retry optional evidence; support/appeal | Duplicate report/appeal/action contained; current case authority wins | Minimum notice may be Realtime; API/source confirms protected status | No reporter identity, unrelated evidence, internal notes or another person's status | Case stages/staffing/retention evidence open | [Safety](ux/safety-and-reporting-wireflow.md#approved-participant-behavior) | Deduplication, visibility and actual case stages |
| P21 | ACT-SUBJECT; AUT-SELF | Required | Query own privacy/account status; submit export/deletion/session-revocation/support requests | Subject | Account/privacy workflow authority | Protected account; reauthentication where risk requires | Request receipt distinct from completion; own status only | Reauthenticate/requery; retry/support; never infer deletion | Duplicate request contained; closure and completion remain distinct | Notification may prompt query; local state never proves deletion | No hidden hold detail, processor data or other account | Processor/backup completion unproved | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Export scope, hold notice and deletion proof |

## 10. Operator canonical crosswalk

| UX | Actor/auth refs | Need | Responsibility | Initiator | Authority | Preconditions | Success | Failure/recovery | Duplicate/concurrency | Realtime/local separation | Privacy | B Gate | Evidence | Open question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O01 | ACT-OPERATOR; AUT-OPS | Required | Query assigned schedule/cohort and confirmation projection; change only replacement cutoff or cancellation within assignment | Assigned schedule operator | Reservation/schedule authority | Current assignment and cohort window | Current projection or confirmed scoped replacement/cancellation with neutral participant effect | Requery/handoff/cancel safely | Current reservation/capacity wins; duplicate change contained | Projection may update live; API/source owns change | No preferences or participant-facing absence cause | Staffing/handoff evidence open | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Exact-six owner and replacement race |
| O02 | ACT-OPERATOR; AUT-OPS | Conditional | Query assigned room; submit reasoned mute/remove/pause/cancel/handoff; confirm consequential record | Assigned live operator | Backend room/session authority | Current assignment, exact room/target/effect | Authoritative accepted effect/record; delivery remains separate | Requery room/effect; handoff or safe cancel | Current assignment/target/version wins; duplicates contained | Control delivery follows Realtime contract, not API receipt | No private choices or consent refusals | RTC control/staffing evidence open | [Safety](ux/safety-and-reporting-wireflow.md#approved-operator-behavior) | Control confirmation and operator absence |
| O03 | ACT-REVIEWER; AUT-OPS | Required | Query assigned held item; submit release/reject/correction/escalation disposition | Assigned content/media reviewer | Content/media review authority | Current assignment, item and policy version | Current reasoned disposition and minimum subject outcome | Refetch/reassign/escalate; hold remains safe | Item version/assignment wins; duplicate disposition contained | Notice excludes media; protected fetch is API-authorized | No biometric/manual identity review or unrelated media | Review/vendor scan evidence open | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Version lock, appeal and handoff |
| O04 | ACT-REVIEWER; AUT-OPS | Required | Query assigned queue/minimum evidence; change assignment/triage/handoff | Assigned safety reviewer or authorized assignment owner | Case/assignment authority | Current assignment and evidence purpose | Scoped receipt, assignment or coarse case effect | Requery/reassign/escalate; containment preserved | Assignment/case version wins; duplicate handoff grants nothing | Minimum status may notify; API/source owns work | Reporter identity and unrelated evidence withheld | Case staffing/stages/handoff open | [Safety](ux/safety-and-reporting-wireflow.md#operator-contexts) | Assignment owner and actual case stages |
| O05 | ACT-REVIEWER; ACT-SENIOR; AUT-DECISION | Required | Query assigned case evidence; submit reasoned sanction/reversal/notice responsibility | Authorized human reviewer; senior where required | Sanction/case authority | Current assignment, case version, evidence and required concurrence | Human decision recorded; protected notice separately confirmed | Requery evidence/authority; escalate or correct notice | Missing concurrence/stale case fails closed; duplicate sanction contained | Realtime notice never substitutes authoritative decision | No reporter identity; no LLM-only irreversible action | Staffing/notice stages open | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Concurrence, reversal and notice completion |
| O06 | ACT-REVIEWER; AUT-DECISION | Required | Query independent appeal/evidence; submit evidence request and outcome/reversal responsibility | Independent assigned appeal reviewer | Appeal/case authority | Current independent assignment, no conflict and current case | Reasoned outcome and required correction/restoration responsibility | Recuse/reassign/request narrow evidence/requery | Conflict/assignment/case version wins; duplicate outcome contained | Notification prompts protected result query | No reporter identity, unrelated evidence or original-reviewer power | Staffing/timing/restoration open | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Independence test and restoration ordering |
| O07 | ACT-AUDITOR; AUT-AUDIT | Required | Submit privileged-access request/approval/revocation; query scoped access and review evidence | Authorized requester, approver or independent reviewer under matching scope | Access/audit authority | Approved purpose, reason, scope, expiry and separation | Scoped grant/effect or review outcome; request alone grants nothing | Deny/revoke/alert/reassign/requery | Expiry/revocation wins; duplicate approval grants nothing | Alert is not authority; protected access uses current API check | No bulk export or protected content in alert | Break-glass owner/rehearsal open | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Approver, alert owner and tamper evidence |

## 11. B Evidence Gate dependencies

- NICE callback, fields, replay, deletion and outage behavior require executed
  terms and account evidence; no vendor field is fixed here.
- LiveKit and device behavior remain Realtime/vendor evidence, not API facts.
- Storage/cache deletion, processor/backup completion and actual recovery timing
  remain unproved; this proposal creates no completion promise.
- Staffing, case stages, handoff, notice delivery and break-glass ownership
  require approved operations evidence and rehearsal.

## 12. Open contract questions

- Which candidate responsibilities become distinct operations, and which can be
  combined without mixing query, change, submission or status semantics?
- What representation proves duplicate intent, ordering and concurrent change?
- Which accepted submissions require asynchronous status rather than immediate
  completion, and which cancellation responsibilities remain safe?
- Which errors can be distinguished without enumeration or protected-cause leaks?
- Which operator decisions require concurrence and separate notice confirmation?
- What vendor, legal, device and operations evidence changes these candidates?

## 13. Explicitly excluded implementation detail

This proposal defines no URL, HTTP method, operation identifier, DTO, request
or response field, OpenAPI, GraphQL schema, error-code number, table, column,
index, enum, JPA entity, DBML, schema, migration, final realtime payload,
production state, concrete idempotency key, version field, vendor field,
source code, Data contract, deployment or Pilot action.
