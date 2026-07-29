---
title: Pilot Evidence Owner Action Checklist
document_type: research checklist
classification: proposal
status: Proposed owner actions; live Pilot blocked
last_verified: 2026-07-29
related_documents:
  - pilot-external-evidence-gate-audit.md
  - pilot-device-operations-evidence-gates.md
  - ../../spec/web-mobile-experience.md
decision_authority: none; owner approval and external evidence are required
---

# Pilot Evidence Owner Action Checklist

## Use and authority

This checklist converts the open Gates in the related audits into actions for
human owners. It does not record any vendor contact, contract, account,
credential, provisioning, spend, device test, recovery drill, training,
tabletop or legal review result. Live participation remains `blocked`.

Current state is limited to `vendor confirmation required`,
`legal/privacy review required`, `procurement required`,
`account evidence required`, `real-device test required`,
`operations rehearsal required`, `blocked` and `confirmed`. No row is
`confirmed` because no new external evidence was supplied.

Device acceptance uses only the approved WM-GATE thresholds and native
evaluation trigger in
[Web and Mobile Experience](../../spec/web-mobile-experience.md). Staffing,
training and tabletop entries are proposed exit criteria; owner approval is
required before they become mandatory operations policy.

`Dependency` identifies evidence needed to close an Action. `Can run in
parallel` may permit preliminary drafting or issue mapping before that
dependency closes, but never a final disposition. Every `Exit condition` is
prospective and does not report current completion.

## 1. NICE Vendor

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-NICE-01 | Identity vendor owner | Obtain the exact NICE product, SKU, API/callback, minimum result-field and user coverage/recovery specification | Dated vendor specification covering the 19th-birthday outcome, callback/errors, timeout, retry, rate limit, idempotence, field selection, foreign/MVNO/name-mismatch support and outage escalation | Public product pages do not establish the integration contract, adult-result semantics or coverage | Vendor-issued specification resolves the minimum schema, fail-closed flow and no-document-bypass recovery boundary | Owner selects the minimum acceptable outcome | Yes, with preliminary legal/privacy review | `vendor confirmation required` |
| PGE-NICE-02 | Identity test owner | In an approved vendor sandbox or non-production integration, run boundary, failure, coverage, masking, log and deletion checks | Dated synthetic test records covering the 19th-birthday boundary, eligible/ineligible outcomes, carrier/MVNO/foreign/name-mismatch cases, callback errors/retry/idempotence, CI/DI non-request, masking and deletion | Vendor materials do not prove integration behavior or minimized data handling | Account/test evidence covers the adult boundary, fail-closed errors, supported coverage and no CI/DI request, log or retention | PGE-NICE-01, PGE-NICE-03 and authorized vendor test access | No, vendor specification and test access first | `account evidence required` |
| PGE-NICE-03 | Procurement owner | Obtain pricing, activation, test-to-production, SLA, retention, deletion, support-access and incident-notice terms | Dated commercial/security schedule including VAT, minimums, limits, termination and deletion/backup treatment | Pilot cost, support and provider-side lifecycle are unpublished | Owner and reviewers have an applicable commercial/security package with no unresolved Pilot blocker | PGE-NICE-01 | Yes, with legal/privacy review; PGE-NICE-02 waits for completed procurement and test-access terms | `procurement required` |

## 2. LiveKit Vendor

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-LK-01 | RTC vendor owner | Obtain the applicable plan, routing/failover, processing-region, support-access, DPA and subprocessor data map | Dated plan and feature matrix identifying Japan/Singapore paths, non-pinned data and change notices | Public Region and DPA pages do not establish the enabled project path | Vendor-issued data map and applicable terms are ready for Korean privacy review | Intended LiveKit features listed | Yes, with preliminary PGE-LGL-02 issue mapping; final disposition waits for vendor evidence | `vendor confirmation required` |
| PGE-LK-02 | RTC account owner | In an approved non-production account, capture settings for Egress, `roomRecord`, agent observability, grants, destinations and retention | Sanitized settings export/screenshots plus negative checks showing recording and agent observability remain off | Public feature descriptions do not prove project configuration or voice-data exclusion | Account evidence covers every recording/observability control and no unresolved retention path remains | Account/procurement approval and PGE-LK-01 | No, account approval first | `account evidence required` |
| PGE-LK-03 | RTC vendor owner | Obtain quota behavior, dashboard alarm, incident escalation, support and cancellation information | Limit/error behavior, support channel/hours and incident communications package | Build limits and community support do not prove the Pilot response path | Owner has a documented quota/support path and an approved failure/cancellation decision | PGE-LK-01 | Yes, with device planning | `vendor confirmation required` |

## 3. NCP Procurement and Account

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-NCP-01 | NCP procurement owner | Establish business-account eligibility and obtain the applied quota, VAT-inclusive quote, SLA and support package | Dated low/base/high quote covering DB, backup, network/NAT, logs and support; quota-increase lead time | Public list prices and service limits are not account-specific | Owner has an approved procurement package and sufficient Pilot quota | Owner procurement authority | Yes, with PGE-LGL-03 | `procurement required` |
| PGE-NCP-02 | NCP account/security owner | Capture the actual Korea Region, SKU, generation, engine/minor, extensions, VPC/zone, ACG and Sub Account choices | Sanitized console configuration and least-privilege review record | Public capabilities do not prove selectable or applied account settings | Account evidence matches the selected architecture with no unresolved compatibility or access gap | PGE-NCP-01 and account approval | No, procurement first | `account evidence required` |
| PGE-NCP-03 | Recovery owner | Authorize and run controlled non-production backup/PITR, failover, CAT/CLA and access-audit drills | Dated integrity, isolation, elapsed-time, client-recovery, transaction, observed RPO/RTO and audit-event records | Restore, failover and logging behavior have no environment evidence | Owner reviews measured recovery/audit evidence and resolves every Pilot-blocking gap | PGE-NCP-02 and an authorized test environment | No, account configuration first | `account evidence required` |

## 4. Grafana Contract and Stack

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-GRF-01 | Observability vendor owner | Obtain the applicable plan, DPA, subprocessors, selected provider/Region, optional integration routes and incident terms | Dated contract/data-flow package including transfer and change-notice paths | Japan/Singapore public availability does not identify the future stack or legal basis | Contract/data-flow evidence is ready for Korean privacy review with no unknown processor route | Intended integrations listed | Yes, with preliminary PGE-LGL-02 issue mapping; final disposition waits for vendor evidence | `legal/privacy review required` |
| PGE-GRF-02 | Observability account owner | In an approved stack, capture Region, retention, deletion/export, token, RBAC and access-review settings | Sanitized portal settings, scoped-token inventory, access review and deletion/export evidence | Product capabilities do not prove the chosen stack behavior | Account evidence covers Region, lifecycle and least privilege for every enabled signal | PGE-GRF-01 and account approval | No, contract/Region review first | `account evidence required` |
| PGE-GRF-03 | Telemetry/privacy owner | Run allowlist, forbidden-field redaction, cardinality/quota, ingest-drop and alert-delivery checks | Negative-test results using synthetic data plus alert ownership and fallback record | Sensitive data or failed alerts could escape without configuration evidence | No forbidden field appears and each approved alert has an observed delivery/response record | PGE-GRF-02 and an authorized telemetry path | No, approved stack first | `account evidence required` |

## 5. Korean Legal and Privacy

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-LGL-01 | Korean privacy counsel | Review NICE purpose, minimum fields, CI/DI exclusion, roles, notices, retention, deletion and user recovery | Dated written issue list and disposition tied to the exact NICE specification | Public law and vendor pages do not determine this Pilot's lawful handling | No unresolved legal/privacy blocker remains for the selected minimum NICE outcome | PGE-NICE-01 and PGE-NICE-03 | Yes, preliminary review can start earlier | `legal/privacy review required` |
| PGE-LGL-02 | Korean privacy counsel | Review LiveKit and Grafana overseas processing, DPA, subprocessors, notices, data-subject handling and optional features | Dated transfer/processor map and required notice, contract and control changes | Foreign processing and controller/processor roles are not resolved by public documents | Each enabled data path has an accepted basis, notice, role and lifecycle disposition | PGE-LK-01 and PGE-GRF-01 | Yes, preliminary issue mapping across vendors; final disposition waits for both dependencies | `legal/privacy review required` |
| PGE-LGL-03 | Privacy operations owner | Review deletion, backup expiry, support access, incident notice, contract exit and evidence retention across vendors | Cross-vendor lifecycle matrix with responsible role, deadline and proof source | Fragmented vendor terms can leave deletion or incident gaps | Owner and counsel resolve every lifecycle row before live data is sent | PGE-LGL-01, PGE-LGL-02 and vendor terms | Yes, matrix drafting can start earlier | `legal/privacy review required` |

## 6. Real-device Test

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-DEV-01 | Device-test owner | Approve the supported device/OS/browser/network/audio-route inventory and non-production run protocol | Versioned matrix, synthetic-user rules, attempt schema and stop/escalation path | No authorized execution package identifies the exact supported lanes | Owner approves a protocol that references only WM-GATE values | Approved WM-GATE SOT | Yes, with vendor and account preparation | `real-device test required` |
| PGE-DEV-02 | Device-test owner | Execute the approved matrix for iPhone/Safari, Android/Chrome, Galaxy, audio routes, Wi-Fi/LTE/5G, interruption and notification/deep-link scenarios | Dated per-attempt outcomes, sanitized RTC metrics, notification/landing observations, device versions and defect records | Browser and notification capability documentation does not prove Korean physical-device behavior | Every supported lane and applicable WM-GATE scenario has complete evidence without voice or raw identifier capture | PGE-DEV-01 and authorized test environment | Yes, independent devices can run in parallel | `real-device test required` |
| PGE-DEV-03 | Product quality owner | Compare results gate-by-gate with WM-GATE and its native-evaluation trigger; do not create a new threshold | Gate calculation, OS-specific failures, P0/P1/accessibility defect list and disposition | Aggregate averages could hide an OS/device-specific Pilot blocker | All approved WM-GATE conditions have reviewable evidence and no unresolved stop condition | PGE-DEV-02 | No, evidence first | `real-device test required` |

## 7. Operations Staffing and Training

Status: proposed exit criteria; owner approval required.

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-OPS-01 | Operations owner | Review and approve or revise the proposed O01-O07 staffing, separation, coverage and training package | Dated owner disposition, role boundaries and scope of mandatory rehearsals | Research proposals are not operating policy | Owner identifies the approved package without changing D-001 through D-024 | Current operations proposals | Yes, with vendor work | `operations rehearsal required` |
| PGE-OPS-02 | Operations staffing owner | Assign primary/backup roles, hours, simultaneous-room limit, absence rule, independent appeal and break-glass review | Named roster, least-privilege map, coverage calendar, handoff template and dated sanitized handoff rehearsal record | Live incidents have no accountable coverage or handoff evidence | Owner reviews complete coverage, separation and handoff evidence with no unowned period | PGE-OPS-01 | Yes, after role boundaries are approved | `operations rehearsal required` |
| PGE-OPS-03 | Training owner | Deliver role-specific training and remediation for privacy, safety, vendor failure, cancellation, access and escalation | Curriculum/version, trainer, attendee, date, scenario score, remediation and retraining date | Assigned people have no demonstrated readiness evidence | Every assigned role has current evidence matching its approved authority | PGE-OPS-02 | Yes, by role cohort | `operations rehearsal required` |

## 8. Incident Tabletop

Status: proposed exit criteria; owner approval required.

| Action ID | Responsible owner role | Required external action | Evidence to collect | Blocking reason | Exit condition | Dependency | Can run in parallel | Current state |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PGE-IR-01 | Incident owner | Approve or revise the proposed NICE, LiveKit, authorization, safety, break-glass, NCP and telemetry scenarios | Versioned scenario pack, participants, objectives, stop conditions and evidence rules | The seven scenarios are research proposals, not mandatory policy | Owner identifies the approved scenario set and responsible participants | PGE-OPS-01 and vendor Gate map | Yes, scenario design can run in parallel | `operations rehearsal required` |
| PGE-IR-02 | Incident facilitator | Run each approved scenario with assigned responders and independent observers | Timeline, decisions, communications, evidence accessed, control gaps and corrective actions | No rehearsal record demonstrates coordinated response | Every approved scenario has a dated review record and no unresolved critical action | PGE-IR-01, PGE-OPS-02 and relevant tooling | Conditional, only independent scenarios overlap | `operations rehearsal required` |
| PGE-IR-03 | Incident owner | Assign corrective owners, verify remediation and rerun scenarios affected by critical gaps | Corrective-action register, deadlines, retest record and owner disposition | A documented scenario does not close unresolved response failures | Owner disposition shows every critical gap resolved before live participation | PGE-IR-02 | Yes, independent remediation can overlap | `operations rehearsal required` |

## Overall stop condition

The Pilot remains `blocked` until every applicable row has dated evidence, its
exit condition is reviewed by the responsible owner, and no legal/privacy,
vendor, procurement, account, device or operations blocker remains. This
checklist does not authorize external action, implementation or live operation.
