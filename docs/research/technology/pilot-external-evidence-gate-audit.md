---
title: Pilot External Evidence Gate Audit
document_type: technology research
classification: research finding
status: Audit snapshot; live Pilot blocked
last_verified: 2026-07-29
related_documents:
  - ../../discovery/decisions.md
  - ../../architecture/external-services-selected.md
  - ../../operations/vendor-operations.md
  - pilot-device-operations-evidence-gates.md
decision_authority: none; decisions and live-Pilot approval remain with the project owner
---

# Pilot External Evidence Gate Audit

## Scope, method and verdict

This audit checks public evidence for NICE, LiveKit, NAVER Cloud Platform (NCP)
and Grafana before a real-participant Pilot. Official vendor material and
Korean primary law were retrieved on 2026-07-29. Public documentation is not
an executed contract, account configuration, legal opinion, test result or
permission to procure. No vendor contact, account, credential, quote request,
provisioning or spend occurred.

**Overall status: `blocked`.** The approved services remain selected by
[D-010, D-013, D-014 and D-017](../../discovery/decisions.md), but every live
Pilot gate below still lacks required evidence.

Allowed item states are `confirmed`, `partially confirmed`,
`vendor confirmation required`, `legal/privacy review required`,
`procurement required`, `real-device test required`,
`operations rehearsal required` and `blocked`.

## Evidence gate summary

| Gate | Current known state | Confirmed evidence | Missing evidence and blocking risk | Required owner/vendor action | Exit criteria | Can run in parallel |
| --- | --- | --- | --- | --- | --- | --- |
| NICE | `vendor confirmation required` | Mobile identity product, PASS/QR and SMS/LMS paths, selectable result-field categories | Exact SKU/API, minimum fields, CI/DI exclusion, coverage, callback, retention, price/SLA; wrong assumption could admit ineligible users or over-collect identity data | Owner selects minimum result; vendor supplies contract/spec; privacy counsel reviews purpose/notices | Signed terms and field matrix; test proves 19th-birthday outcome, fail-closed errors, masking and deletion without CI/DI persistence | Yes: vendor, privacy and accessibility review |
| LiveKit | `legal/privacy review required` | Build has 5,000 WebRTC minutes, 100 connections; Asia pinning lists Japan/Singapore; DPA/subprocessors are public | Build cannot use Scale-only pinning; actual route, transfers, metadata retention, support and Korea quality unproved | Vendor confirms enabled features/data path; counsel reviews transfer; owner approves account/plan only later | Executed DPA/order terms, feature/data map, recording off, quota alarms and Korean device/reconnect tests pass | Yes: contract review and device plan; account tests later |
| NCP | `procurement required` | Korea VPC services, Cloud DB HA, daily backup/PITR up to 30 days, supported extensions, quota service and audit products are documented | Actual account eligibility/quota, G3/version/extensions, VAT quote, restore/failover/RPO/RTO and support unproved | Procurement records quote/SLA/quota; approved account later runs recovery and audit drills | Account configuration record plus successful restore, failover, least-privilege, quota and audit evidence | Yes: quote/support review; drills after account approval |
| Grafana | `legal/privacy review required` | Cloud is managed; Japan/Singapore regions, DPA/subprocessors, access policies, deletion tools and 14-day Free retention are public | No Korea region; actual stack region, transfer basis, enabled integrations, deletion/export and support unproved | Owner chooses Cloud boundary already selected by D-017; counsel/procurement verifies stack and terms | Approved region/transfer notice, executed terms, allowlist/redaction tests, least privilege, retention/delete and alerts pass | Yes: legal and telemetry review; account evidence later |
| Real devices | `real-device test required` | Browser APIs require HTTPS/permission and mobile pages may suspend or discard | No Korean physical-device result exists | Run the matrix in [device/operations gates](pilot-device-operations-evidence-gates.md) | Approved Web/Mobile numeric gates and zero unresolved P0/P1 or task-blocking accessibility defects | After testable authorized build exists |
| Operations | `operations rehearsal required` | O01-O07 authority and separation are approved | No named roster, hours, training record, handoff or tabletop evidence | Staff roles, train, rehearse and approve stop/escalation paths | Coverage and independence proven; all required tabletops pass with audited evidence | Yes: staffing design/training; final rehearsal after tools exist |

## NICE audit

| Check | Evidence and classification | Open gate / exit evidence |
| --- | --- | --- |
| Product and adult result | [NICE mobile identity](https://www.niceid.co.kr/prod_mobile.nc) confirms subscriber-plus-device verification and markets adult verification. `partially confirmed`: the exact integration SKU and a boolean adult-only result are not public. | Contracted specification must show how the 19th-birthday rule is derived transiently and which minimum result is returned. |
| Public result fields | NICE lists name, sex, DOB, domestic/foreign flag, carrier, phone, CI and DI as selectable categories. | D-006 prohibits CI/DI storage and D-014 permits only a minimized outcome. Contract and test must prove CI/DI are not requested, logged or retained by the application. |
| CI/DI boundary | NICE describes CI as a unique encrypted identity value and DI as service-specific. Korean law separately limits linkage-information use. | Privacy/security review must document purpose, roles and masking even if the project requests neither value; no analytics or duplicate signal may silently add them. |
| PASS/SMS | Public flow documents PASS/QR, PASS app push and six-digit SMS/LMS. | Vendor spec must confirm chosen routes, timeout, resend/retry/rate limit, cancellation, error codes, idempotent callback and supported browser/device behavior. |
| Foreign/MVNO/name mismatch | [PASS FAQ](https://www.passauth.co.kr/question) says eligible foreign users and major-carrier MVNOs may use PASS, with caveats; this is only supporting coverage evidence, not the NICE contract. | Written matrix must cover each carrier/MVNO, foreign-resident status, corporate/family/employer phones, legal-name and Korean/Latin mismatch. |
| Failure and support | NICE publishes weekday contact hours and a post-application integration process. There is no public manual adult-verification commitment. | Outage/unverifiable users stay blocked; no document or informal manual bypass. Confirm accessible retry/status/support and escalation SLA. |
| Retention and logs | [NICE privacy policy](https://www.niceid.co.kr/terms.nc?terms_type=IDPAGE002) describes NICE-controlled histories and deletion. Those periods do not authorize project retention. | Contract must state processor roles, locations, subprocessor/access logs, masking, retention, deletion/backup treatment, incident notice and exit evidence. |
| Commercial | Public integration material follows application/contract and does not publish the Pilot price or limits. | `procurement required`: setup/test fees, unit price, VAT, minimum, production activation, SLA, maintenance, refund and termination terms. |

## LiveKit audit

| Check | Evidence and classification | Open gate / exit evidence |
| --- | --- | --- |
| Plan/quota | [Pricing](https://livekit.com/pricing) lists Build at USD 0, 5,000 WebRTC minutes, 100 concurrent connections and 50 GB downstream; [quota docs](https://docs.livekit.io/deploy/admin/quotas-and-limits/) say new operations fail at limits. | Recheck dashboard-wide usage, hard-stop behavior and alarms at the approved 3,500/4,000 thresholds; no account was inspected. |
| Region and quality | [Region pinning](https://docs.livekit.io/deploy/admin/regions/region-pinning/) lists Asia as Japan/Singapore, not Korea; pinning is Scale+ and disables nearest-region failover. | Build does not prove Asia-only processing. Vendor must map routing/failover/support access; Korean device latency, loss, relay and reconnect must be measured. |
| Transfer/DPA | [DPA](https://livekit.com/legal/data-processing-addendum) dated 2026-07-22 covers customer content including communications and session metadata; [subprocessors](https://livekit.com/legal/sub-processors) were updated 2026-06-26. | Counsel must review the actual enabled-feature transfer map and PIPA basis/notice. Obtain applicable executed terms and change-notification path. |
| Recording | [Egress](https://docs.livekit.io/transport/media/ingress-egress/egress/) records only through configured requests, but Cloud exposes Egress and separate agent observability may collect audio/transcripts when enabled. | Prove no auto-Egress, no `roomRecord` grant, no agent observability/recording, no external destination and no voice retention. Local participant capture remains unavoidable. |
| Metadata/retention | Public agent-observability retention is 30 days, but that does not settle all room, operational, account, support or backup data. | Vendor must identify every intended metadata class, region, retention, deletion/export and backup expiry; application keeps only approved pseudonymous quality data. |
| Reliability/support | SDK reconnect and public status history exist; Build has community rather than direct email support. | Test reconnect, removal, token refresh, webhook replay and quota failure. Approve support/escalation and cancellation messaging; no mid-session failover. |

## NCP audit

| Check | Evidence and classification | Open gate / exit evidence |
| --- | --- | --- |
| Korea services | [Cloud DB prerequisites](https://guide.ncloud-docs.com/docs/en/clouddbforpostgresql-spec) confirm Korea, VPC-only operation and optional HA. | Account must prove exact Korea service/SKU availability, VPC/zone choices and private connectivity. |
| Version/extensions | Current [Korean release notes](https://guide.ncloud-docs.com/docs/clouddbforpostgresql-releasenote) list PostgreSQL 16.14 and earlier 14/15 updates; English material may lag. Extensions are console-limited and some restart DB. | Record the actual selectable engine/minor, OS/generation and every required extension in the approved account; run compatibility tests. |
| Backup/restore | [Backup docs](https://guide.ncloud-docs.com/docs/en/clouddbforpostgresql-backup) confirm daily backup, up to 30-day retention and PITR into a new service; restore takes unspecified minutes. | Controlled restore must prove data integrity, isolation, elapsed time and application recovery. Object Storage export cannot currently restore directly into Cloud DB. |
| HA/failover | NCP documents primary/secondary automatic failover through DNS and warns it may take minutes. | Controlled failover must capture connection loss, retry, transaction effects, replication state and observed time; do not invent RPO/RTO. |
| Quota/quote | [Service Quota](https://guide.ncloud-docs.com/docs/en/servicequota-status) exposes account limits; only business members can request increases and some requests require review. Public prices are pay-as-you-go and exclude full account-specific cost. | `procurement required`: business account, applied quota, VAT-inclusive low/base/high quote, backup/network/NAT/observability cost, SLA/support and approval time. |
| Network/audit/logs | ACG, Sub Account and [Cloud Activity Tracer](https://guide.ncloud-docs.com/release-20260423/docs/en/cat-overview) are public; CAT keeps 90 days and exports to Object Storage. [CLA](https://guide.ncloud-docs.com/docs/en/cla-spec) retains up to 30 days and may delete old data at capacity. | Prove least privilege, ACG flows, representative CAT events/export, PostgreSQL log selection, redaction, CLA capacity/retention and access audit. CAT is control-plane, not query audit. |

## Grafana and telemetry audit

| Check | Evidence and classification | Open gate / exit evidence |
| --- | --- | --- |
| Cloud/self-hosted | D-017 selects managed Grafana Cloud Free and rejects a self-managed Pilot stack. [Cloud docs](https://grafana.com/docs/grafana-cloud/introduction/) confirm the managed boundary. | No account or self-hosting is authorized. Revisit only through a new approved vendor/ADR decision if Cloud transfer terms fail. |
| Region/transfer | [Regional availability](https://grafana.com/docs/grafana-cloud/security-and-account-management/regional-availability/) lists Japan and Singapore, not Korea; stack region cannot be changed. | Portal must prove the chosen stack/provider. Counsel must approve the PIPA transfer basis, notice and processors before any telemetry leaves Korea. |
| DPA/subprocessors | Grafana publishes a [DPA](https://grafana.com/legal/data-processing-agreement/) and [subprocessor list](https://grafana.com/legal/list-of-subprocessors/). | Procurement must verify the applicable DPA version/execution, selected-region processing, optional AI/alerting/IRM routes, incident terms and change notices. |
| Data boundary | Only scoped pseudonymous metrics/traces and sanitized frontend errors may leave the app. No phone, identity/DOB/CI/DI, preferences, answers, interests, grants/tokens, voice, photos, messages, report evidence or raw IP labels. | An explicit allowlist and negative redaction tests must run before export; free-form log bodies and session replay remain off. |
| Retention/delete/access | [Pricing](https://grafana.com/pricing/) confirms 14-day Free retention, 10k metric series and 50 GB each for logs/traces; access policies support scoped tokens and IP/label limits. | Prove actual retention, targeted delete, token expiry, least-privilege RBAC, access review, export/exit and backup handling in the chosen stack. |
| Alerting/incident | Alerts, usage alerts, on-call and incidents are product capabilities, not configured operations or an SLA. Free has community support. | Test quota/cardinality/ingest-drop and critical service alerts end to end; assign owners, notification fallback and response evidence. |

## Korean privacy boundary

[PIPA Article 16](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029335669)
requires minimum necessary collection; [Article 21](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?ancYnChk=&chrClsCd=010202&lsJoLnkSeq=1020398651)
requires destruction after purpose or period ends unless a specific legal basis
applies; [Article 28-8](https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029334953)
governs overseas provision, entrusted processing and storage. These rules do
not determine this Pilot's lawful basis, notices, retention or processor
allocation. Qualified Korean legal/privacy review remains a blocking exit
criterion, and no legal suitability conclusion is made here.

## Stop conditions

Do not start live participation if any Gate lacks a named owner, dated evidence,
approved contract/privacy review, tested failure/cancellation path, quota alert,
deletion proof or incident contact. An outage or uncertain eligibility fails
closed; it never enables manual documents, recording, broader telemetry,
mid-session vendor migration or silent access widening.
