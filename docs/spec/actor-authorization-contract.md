---
title: Actor and Authorization Contract Proposal
document_type: implementation contract proposal
classification: proposal
status: Draft proposal pending owner review for Issue #13
implementation_ready: false
authoritativeness: non-authoritative
production_authority: absent
last_verified: 2026-07-29
related_documents: ["traceability-ux-implementation.md","traceability-implementation.md","ux/README.md","../discovery/implementation-contract-promotion-proposal.md","https://github.com/woojinhong/Metabus_social/issues/13","https://github.com/woojinhong/Metabus_social/pull/10"]
decision_authority: "D-024 governs UX; Issue #7 authorizes the proposal-only phase; Issue #13 scopes this task and creates no decision authority"
---

# Actor and Authorization Contract Proposal

## 1. Purpose and authority boundary

This proposal maps the approved `P01`–`P21` and `O01`–`O07` UX units to actors, contextual roles, assignment scopes and authorization boundaries. It does not approve implementation, production access control or source code. PR #10 supplies the traceability baseline; Issue #13 scopes this draft only.

## 2. Terminology

| Term | Proposal meaning |
| --- | --- |
| Actor | Person or subject that acts or holds a right |
| Role | Contextual responsibility an actor performs |
| Assignment scope | Exact subject, resource, session, item, case or purpose to which responsibility is limited |
| Authorization boundary | Contract-level allowed and forbidden behavior within a current assignment |

Catalog keys below are document references, not production RBAC roles, permissions, grants, enums, routes or security identifiers. Multiple refs in one row are conditional pairings for that specific actor and action, never a permission union: authorization requires the matching actor, role, assignment scope and boundary, and no actor inherits every listed ref.

## 3. Actor catalog
| Ref | Actor boundary |
| --- | --- |
| ACT-PUBLIC | Unauthenticated visitor |
| ACT-CLAIMANT | Unverified account-recovery claimant limited to proof, neutral progress and safe cancellation |
| ACT-SUBJECT | Verified account owner, participant or resource subject acting for self |
| ACT-VIEWER | Named participant eligible to view an independently granted resource |
| ACT-REPORTER | Person reporting a subject or context |
| ACT-RESPONDENT | Person reported or reviewed without presumed wrongdoing |
| ACT-SANCTIONED | Person subject to a sanction and protected notice |
| ACT-APPELLANT | Affected person exercising an appeal right |
| ACT-OPERATOR | Assigned workforce member acting within an operational assignment |
| ACT-REVIEWER | Assigned content, safety, sanction or appeal reviewer |
| ACT-SENIOR | Human senior reviewer for permanent or severe decisions |
| ACT-AUDITOR | Authorized security, privacy or audit reviewer |
## 4. Role catalog
| Ref | Contextual responsibility |
| --- | --- |
| ROL-PUBLIC | Read public product, safety and accessibility information |
| ROL-RECOVERY | Present recovery proof, inspect neutral progress or cancel safely before ownership proof |
| ROL-SELF | Manage own account, eligibility, profile, media, reservation or privacy request |
| ROL-ADMISSION | Mark own readiness, await a current admission decision or leave before admission |
| ROL-SESSION | Exercise current admitted participant capabilities |
| ROL-SAFETY-SELF | Exercise own immediate safety exit, block or safety-support entry |
| ROL-CHOICE | Create or withdraw own private interest or final choice |
| ROL-CAPABILITY | Read and exercise only an issued next-step capability |
| ROL-FEEDBACK | Skip, submit or retry own optional post-session feedback |
| ROL-CONSENT | Grant, decline or withdraw an exact disclosure resource |
| ROL-VIEW | View only an exact currently granted resource |
| ROL-REPORT | Report a subject or context and submit minimum evidence with reporter protection |
| ROL-CASE-SUBJECT | View own coarse case status, add limited evidence or receive protected notice |
| ROL-APPEAL-PARTY | Submit own appeal/evidence and view protected appeal status or outcome |
| ROL-SCHEDULE-OPS | Review assigned schedule/cohort health and neutral notices |
| ROL-LIVE-OPS | Control only an assigned live room |
| ROL-CONTENT-REVIEW | Review an assigned held content or media item |
| ROL-CASE-REVIEW | Review minimum evidence for an assigned safety case |
| ROL-SANCTION | Decide a proportionate sanction with required human authority |
| ROL-APPEAL | Independently review an assigned appeal |
| ROL-AUDIT | Review scoped access or audit evidence for an approved purpose |
## 5. Assignment scope catalog
| Ref | Scope boundary |
| --- | --- |
| SCP-PUBLIC | Publicly available information only |
| SCP-RECOVERY-PROOF | Current recovery proof attempt without presumed account ownership |
| SCP-OWN-ACCOUNT | Actor's own account, eligibility, device or privacy request |
| SCP-OWN-RESOURCE | Actor's own profile, preference, media or feedback resource |
| SCP-OWN-RESERVATION | Actor's own reservation, readiness and admission attempt |
| SCP-ASSIGNED-SESSION | Assigned cohort or room; no unrelated session |
| SCP-CURRENT-STAGE | Current stage, audience and allowed participant action |
| SCP-OWN-CHOICE | Actor's own private draft and confirmed choice |
| SCP-OWN-CAPABILITY | Actor's own derived result and issued next-step capability; no peer intent |
| SCP-OWN-FEEDBACK | Actor's own closing context and optional feedback only |
| SCP-GRANT | Exact subject, viewer, resource, purpose, stage and expiry |
| SCP-NAMED-PAIR | Current named pair and microphone-only capability |
| SCP-SAFETY-CONTEXT | Exact block/report subject and incident context |
| SCP-AFFECTED-CASE | Case status, notice or appeal belonging to the affected account |
| SCP-OPS-ASSIGNMENT | Assigned schedule, room, held item or case |
| SCP-INDEPENDENT-APPEAL | Appeal assignment with conflict exclusion |
| SCP-AUDIT-PURPOSE | Approved review purpose, scope and time window |
## 6. Authorization principles
| Ref | Allowed boundary | Forbidden boundary |
| --- | --- | --- |
| AUT-PUBLIC | Read public guidance | Private data or action |
| AUT-RECOVERY | Submit recovery proof, view neutral progress or cancel | Account data or self action before ownership proof |
| AUT-SELF | Act on own scoped data or request | Peer data, impersonation or hidden support action |
| AUT-ADMISSION | Mark readiness, await admission or leave | Exact-six decision, override or admitted-session capability |
| AUT-SESSION | Use current participant capability | Stale stage action or peer-private information |
| AUT-CHOICE | Manage own private choice | Peer choice, count, reason or inference |
| AUT-CAPABILITY | Read or enter an issued next capability | Private-choice access, change, withdrawal or peer intent |
| AUT-FEEDBACK | Skip, submit or retry own optional feedback | Peer feedback, safety-case handling or unrelated support data |
| AUT-CONSENT | Grant, decline or withdraw exact resource access | Bundled, presumed or coerced consent |
| AUT-VIEW | View exact current grant | Other resource, viewer, purpose or expired access |
| AUT-SAFETY-SELF | Leave, block or enter safety support for self | Report disposition, case/appeal authority or peer action |
| AUT-REPORT | Submit own report and minimum evidence | Reporter identity disclosure, unrelated evidence, internal notes or case control |
| AUT-CASE | View own coarse status, add limited evidence or receive protected notice | Reporter identity, unrelated evidence, internal notes or case assignment control |
| AUT-APPEAL | Submit own appeal/evidence and view protected status or outcome | Reporter identity, unrelated case evidence, original-reviewer authority or another appeal |
| AUT-OPS | Use only assigned schedule, room, item or case capability | Routine private choices, unrelated evidence or participant impersonation |
| AUT-DECISION | Human, reasoned and scoped sanction or appeal review | LLM-only irreversible action or conflicted appeal review |
| AUT-AUDIT | Time-limited approved access review | Standing break-glass, bulk export or unreviewed access |

All authorization is least privilege, backend-rechecked where authority is required, and fail-closed when scope, assignment, consent or expiry is unclear.
## 7. Ownership and subject rights

- Account owners control their own account, export, deletion and recovery requests.
- Resource subjects grant, decline and withdraw each disclosure independently.
- Interest and final-choice actors control only their own private intent.
- Immediate leave, block and report are independent; none requires another.
- Reporters retain identity protection; respondents are not presumed culpable; sanctioned people receive limited notice; appellants receive independent review without reporter identity or unrelated evidence.
## 8. Operator authority boundaries
`O01`–`O07` remain distinct work areas. Schedule operators cannot read private preferences; live operators cannot read private choices or consent refusals; content reviewers see assigned held items only; case reviewers see minimum case evidence; sanction, appeal and audit authority use separate assignments. No operator gains authority merely by sharing an application or console.
## 9. Separation of duty and reviewer independence
- Content/media review does not grant safety-case, identity-review or sanction authority.
- Live containment does not itself grant case disposition or sanction authority.
- Permanent sanctions require human senior review.
- Appeal reviewers are independent of the original decision and recuse conflicts.
- LLMs may assist triage but never solely decide an irreversible sanction.
- Privileged-access review is separate from the access being reviewed.
## 10. Break-glass boundary
Break-glass requires an approved purpose, named scope, justification, short expiry, immediate alert and retrospective review by the next business day. Missing reason, expired scope or review failure denies or revokes access. Bulk export remains prohibited outside a separately approved legal/privacy process.
## 11. Durable authorization evidence categories

| Ref | Purpose-only evidence category |
| --- | --- |
| E-NONE | No durable authorization evidence proposed |
| E-ACCOUNT | Account proof, eligibility/recovery outcome or revocation reason |
| E-ASSIGNMENT | Actor, role, assignment purpose, scope and validity window |
| E-ACTION | Consequential actor action, outcome and policy version |
| E-CONSENT | Subject, viewer, resource, purpose, decision and expiry |
| E-ACCESS | Scoped access decision, reason and outcome |
| E-SAFETY | Containment, report/case assignment and minimum evidence reference |
| E-DECISION | Human decision authority, reason, concurrence and notice outcome |
| E-APPEAL | Independence check, conflict handling and appeal outcome |
| E-PRIVILEGED | Break-glass reason, scope, expiry, alert and review outcome |

These categories define evidence purpose only, not storage, schema, fields, event names, payloads, retention implementation or logging format.
## 12. Revocation and expiry constraints

- Logout, recovery, account closure and device replacement revoke relevant future access.
- Block overrides reveal and progression access without exposing the blocker.
- Consent withdrawal stops future access but cannot undo prior viewing or capture.
- Stage close, session end and grant expiry deny stale actions and refresh.
- Assignment removal, handoff, recusal and case closure end the related operator access.
- Reconnect rechecks current authority and never restores expired access or microphone publication.

## 13. Canonical UX crosswalk

| UX unit | Actor catalog ref | Role catalog ref | Assignment scope ref | Authorization boundary ref | Subject or owner right | Separation-of-duty or independence constraint | Durable authorization evidence category | Revocation or expiry constraint | UX evidence | Open contract question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | ACT-PUBLIC | ROL-PUBLIC | SCP-PUBLIC | AUT-PUBLIC | Read boundaries or exit | Not applicable | E-NONE | Not applicable | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Public content acknowledgement ownership |
| P02 | ACT-CLAIMANT; ACT-SUBJECT | ROL-RECOVERY; ROL-SELF | SCP-RECOVERY-PROOF; SCP-OWN-ACCOUNT | AUT-RECOVERY; AUT-SELF | Claimant may prove, view neutral progress or cancel; subject rights follow ownership proof only | Support cannot impersonate or presume ownership | E-ACCOUNT | Recovery proof or session expiry fails closed | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Recovery proof, successful ownership boundary and session grant |
| P03 | ACT-SUBJECT | ROL-SELF | SCP-OWN-ACCOUNT | AUT-SELF | Own eligibility attempt and outcome | No manual document bypass | E-ACCOUNT; E-ACTION | Unverifiable or expired proof blocks access | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Provider return and replay authority |
| P04 | ACT-SUBJECT | ROL-SELF | SCP-OWN-RESOURCE | AUT-SELF | Manage own private inputs | Routine operators cannot view preferences | E-ACTION | Edit-window expiry denies stale edit | [Workflow](ux/end-to-end-workflow.md#참가자-주-흐름) | Draft lock and correction authority |
| P05 | ACT-SUBJECT | ROL-SELF | SCP-OWN-RESOURCE | AUT-SELF | Upload, replace or delete own media | Assigned content reviewer is separate | E-ACTION; E-ASSIGNMENT | Delete or assignment expiry ends access | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Review assignment and appeal boundary |
| P06 | ACT-SUBJECT | ROL-SELF | SCP-OWN-RESERVATION | AUT-SELF | Request an eligible slot for self | Schedule operator cannot read preferences | E-ACTION | Slot or eligibility expiry denies request | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Eligibility query and request authority |
| P07 | ACT-SUBJECT | ROL-SELF | SCP-OWN-RESERVATION | AUT-SELF | View or cancel own reservation | Peer attendance remains hidden | E-ACTION | Cancellation ends future admission | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Cancellation and notification race |
| P08 | ACT-SUBJECT | ROL-SELF | SCP-OWN-ACCOUNT | AUT-SELF | Control own device permission and readiness | Raw audio is unavailable to operators | E-ACTION | Readiness expires when recheck is required | [Accessibility](ux/accessibility-requirements.md#task-level-requirements) | Minimum transmitted diagnostics |
| P09 | ACT-SUBJECT | ROL-ADMISSION | SCP-OWN-RESERVATION | AUT-ADMISSION | Mark own readiness, await admission or leave | Participant cannot decide or override exact-six | E-ASSIGNMENT; E-ACTION | Admission authority is short-lived and rechecked | [Session](ux/session-wireflow.md#readiness-late-entry-and-participant-loss) | Exact-six authoritative owner, presence and admission replay boundary |
| P10 | ACT-SUBJECT | ROL-SESSION | SCP-ASSIGNED-SESSION; SCP-CURRENT-STAGE | AUT-SESSION | Use only current participant capabilities | Assigned live operator controls separately | E-ASSIGNMENT; E-ACTION | Reconnect rechecks; microphone stays off | [State model](ux/screen-state-model.md#승인된-전환-표현) | Command ownership and clock authority |
| P11 | ACT-SUBJECT | ROL-SESSION | SCP-CURRENT-STAGE | AUT-SESSION | Submit, pass or use approved alternative | Private input and audience sharing stay separate | E-ACTION | Stage close denies duplicate or stale share | [Session](ux/session-wireflow.md#approved-sequence) | Private input and share authority |
| P12 | ACT-SUBJECT; ACT-REPORTER | ROL-SESSION; ROL-SAFETY-SELF; ROL-REPORT | SCP-ASSIGNED-SESSION; SCP-CURRENT-STAGE; SCP-SAFETY-CONTEXT | AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Session actions use session authority; safety exit/support and reporting use their matching P20 authority | Operator assistance adds no private scoring | E-ACTION; E-SAFETY | Session loss ends voice; each safety authority is separately rechecked | [Session](ux/session-wireflow.md#approved-sequence) | Neutral intervention and safety-routing authority |
| P13 | ACT-SUBJECT | ROL-CHOICE | SCP-OWN-CHOICE | AUT-CHOICE | Keep, submit or withdraw own private interest | Operators and peers cannot inspect choices | E-ACTION | Close, block or withdrawal ends authority | [Disclosure](ux/progressive-disclosure-wireflow.md#initial-interest-behavior) | Close ordering and acknowledgement |
| P14 | ACT-SUBJECT | ROL-CONSENT | SCP-GRANT | AUT-CONSENT | Grant, decline or withdraw exact resource | Consent grantor remains separate from viewer | E-CONSENT | Withdrawal or expiry fails closed | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Grant granularity and clock authority |
| P15 | ACT-VIEWER; ACT-SUBJECT | ROL-VIEW; ROL-CONSENT | SCP-GRANT | AUT-VIEW; AUT-CONSENT | Viewer sees exact grant; subject may revoke | Viewer cannot extend or substitute grant | E-CONSENT; E-ACCESS | Revoke, block or expiry closes future access | [Disclosure](ux/progressive-disclosure-wireflow.md#resource-specific-live-consent-and-view) | Access audit and cache boundary |
| P16 | ACT-SUBJECT | ROL-CHOICE | SCP-OWN-CHOICE | AUT-CHOICE | Manage own final choice or none | Operators and peers cannot inspect choices | E-ACTION | Close, block or withdrawal ends authority | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Mutuality and revocation ordering |
| P17 | ACT-SUBJECT | ROL-CAPABILITY | SCP-OWN-CAPABILITY | AUT-CAPABILITY | View or enter only own issued next capability | Derived result grants no private-choice or peer-intent authority | E-ACTION; E-ASSIGNMENT | Capability expiry denies entry | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Equal timing and peer-absence boundary |
| P18 | ACT-SUBJECT; ACT-REPORTER | ROL-SESSION; ROL-SAFETY-SELF; ROL-REPORT | SCP-NAMED-PAIR; SCP-SAFETY-CONTEXT | AUT-SESSION; AUT-SAFETY-SELF; AUT-REPORT | Pair actions use session authority; safety exit/block/support and reporting use their matching P20 authority | Pair scope grants no contact, text or safety-case authority | E-ASSIGNMENT; E-ACTION; E-SAFETY | Pair expiry ends voice; each safety authority is separately rechecked; no auto-unmute | [Closing](ux/no-match-and-safe-closing.md#최종-선택과-쌍-음성) | Pair admission, safety routing and reconnect budget |
| P19 | ACT-SUBJECT | ROL-FEEDBACK | SCP-OWN-FEEDBACK | AUT-FEEDBACK | Skip, submit or retry own optional feedback after session/pair end | Safety or support content routes to separate case/support authority | E-ACTION | Session authority ends separately; feedback authority ends only at its still-open expiry or withdrawal | [Closing](ux/no-match-and-safe-closing.md#공통-종료-순서) | Feedback authority expiry, duplicate handling and local-draft lifecycle remain open |
| P20 | ACT-SUBJECT; ACT-REPORTER; ACT-RESPONDENT; ACT-SANCTIONED; ACT-APPELLANT | ROL-SAFETY-SELF; ROL-REPORT; ROL-CASE-SUBJECT; ROL-APPEAL-PARTY | SCP-SAFETY-CONTEXT; SCP-AFFECTED-CASE | AUT-SAFETY-SELF; AUT-REPORT; AUT-CASE; AUT-APPEAL | Subject may exit/block/support; reporter may report/evidence; case subject may view/add evidence/notice; appellant may appeal/evidence/status | Each actor receives only its matching conditional refs; reviewer assignment remains O04 | E-SAFETY; E-DECISION; E-APPEAL | Each self-safety, report, case or appeal authority fails closed when its matching scope ends | [Safety](ux/safety-and-reporting-wireflow.md#approved-participant-behavior) | Case lifecycle, visibility and appeal authority remain open |
| P21 | ACT-SUBJECT | ROL-SELF | SCP-OWN-ACCOUNT | AUT-SELF | Export, delete and revoke own access | Legal/privacy hold authority is separately restricted | E-ACCOUNT; E-ACTION | Closure revokes sessions and future admission | [Inventory](ux/screen-inventory.md#participant-review-surfaces) | Hold notice and deletion proof |
| O01 | ACT-OPERATOR | ROL-SCHEDULE-OPS | SCP-OPS-ASSIGNMENT | AUT-OPS | Participants retain neutral status and hidden peer cause | No content, case or private-preference access | E-ASSIGNMENT; E-ACTION | Handoff or schedule expiry ends access | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Assignment authority and replacement race |
| O02 | ACT-OPERATOR | ROL-LIVE-OPS | SCP-ASSIGNED-SESSION | AUT-OPS | Participants retain private choices and safe exit | Live containment grants no case disposition | E-ASSIGNMENT; E-ACTION | Room end, handoff or removal ends access | [Safety](ux/safety-and-reporting-wireflow.md#approved-operator-behavior) | Control confirmation and operator absence |
| O03 | ACT-REVIEWER | ROL-CONTENT-REVIEW | SCP-OPS-ASSIGNMENT | AUT-OPS | Subject retains media deletion and appeal rights | No identity review, case review or sanction authority | E-ASSIGNMENT; E-ACCESS | Item version or assignment expiry denies access | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Version lock and reviewer assignment |
| O04 | ACT-REVIEWER | ROL-CASE-REVIEW | SCP-OPS-ASSIGNMENT | AUT-OPS | Reporter identity and affected-person rights stay protected | Minimum evidence; sanction and appeal are separate | E-SAFETY; E-ASSIGNMENT | Reassignment or case closure ends access | [Safety](ux/safety-and-reporting-wireflow.md#operator-contexts) | Evidence access and handoff authority |
| O05 | ACT-REVIEWER; ACT-SENIOR | ROL-SANCTION | SCP-OPS-ASSIGNMENT | AUT-DECISION | Affected person receives protected notice and appeal | Permanent action needs senior review; no LLM-only decision | E-DECISION | Reversal or lost assignment ends authority | [Safety](ux/safety-and-reporting-wireflow.md#approved-operator-behavior) | Concurrence and reversal authority |
| O06 | ACT-REVIEWER | ROL-APPEAL | SCP-INDEPENDENT-APPEAL | AUT-DECISION | Appellant receives independent review | Recuse conflict; original decider cannot review | E-APPEAL; E-ASSIGNMENT | Recusal, reassignment or close ends access | [Moderation](../operations/moderation-sanctions-and-appeals.md#approved-workflow) | Independence test and restoration authority |
| O07 | ACT-AUDITOR | ROL-AUDIT | SCP-AUDIT-PURPOSE | AUT-AUDIT | Subjects retain purpose-limited access protection | Reviewer cannot approve own unreviewed privilege | E-PRIVILEGED; E-ACCESS | Expiry or missing reason revokes access | [Operator inventory](ux/screen-inventory.md#operator-review-capabilities) | Approver, alert recipient and tamper evidence |

## 14. Open contract questions

- Which actors may hold multiple roles, and which combinations are prohibited?
- Who creates, approves, hands off and expires each operator assignment?
- What concurrence is required for permanent sanctions and severe restoration?
- How is appeal conflict detected, documented and reassigned?
- Who approves break-glass, receives alerts and performs retrospective review?
- What minimum evidence proves authorization without exposing protected content?
- Which clock and acknowledgement establish grant and assignment expiry?

## 15. Explicitly excluded implementation detail

This proposal defines no production role, permission, grant, enum, route, endpoint, HTTP method, DTO, request or response field, OpenAPI, AsyncAPI, table, column, index, DBML, schema, migration, lifecycle state or transition, real-time command, event, state, payload, vendor integration or Pilot operation.
