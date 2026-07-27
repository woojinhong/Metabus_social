---
title: Pilot Data Retention Matrix
document_type: privacy policy
classification: user decision
status: Approved Pilot policy; legal review required
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../../discovery/decisions.md","domain-data-model.md","../security/identity-admission-and-invitations.md"]
decision_authority: D-018
---

# Pilot Data Retention Matrix

## Rules

Periods below are approved product limits, not claims of statutory duty. Delete when purpose ends or the period expires, whichever is earlier, except a documented, scoped legal hold. Active deletion target is 24 hours for media and 30 days for account-domain data; encrypted backups expire within 35 days. Export files expire in 7 days. Processors require contractually verified deletion/retention.

| Data class | Need/source of truth | Approved retention and deletion | Access/encryption/export |
| --- | --- | --- | --- |
| Account | authentication/PostgreSQL | active account; delete within 30d of closure | account/auth admins; encrypted; user export |
| Email | login/recovery/PostgreSQL | active + 30d | auth only; encrypted |
| Phone | transactional contact/PostgreSQL | active + 30d; keyed duplicate HMAC follows same rule unless sanction hold | identity/notification roles; encrypted |
| Adult outcome | admission/PostgreSQL | active + 30d | identity/admission only; encrypted |
| Provider reference | dispute/retry/PostgreSQL | active + 30d unless contract requires shorter | identity reviewers only |
| Raw NICE response/DOB/name/carrier | not required | transient callback processing only; never persisted | no export/log |
| CI/DI/document/liveness/biometric | prohibited | not collected | none |
| Profile/preferences | cohort relevance/PostgreSQL | active + 30d | profile/compatibility restricted; export |
| Face photo | required Pilot media/Object Storage | until user deletion/closure; active delete within 24h | subject, moderation, granted viewer; encrypted/private |
| Game clue media | session content/Object Storage | delete 30d after session or earlier user deletion | content/moderation/current audience |
| Reservation/cohort | delivery/PostgreSQL | 180d after session/cancel | operations restricted; export summary |
| Attendance/no-show | operations/PostgreSQL | 180d | operations/safety restricted |
| Consequential stage transition | recovery/audit/PostgreSQL | 180d | orchestration/audit restricted |
| Presence/timer/mic state | live operation/ephemeral | session end + 24h maximum | operations only; no user-content export |
| RTC quality metadata | reliability/PostgreSQL/telemetry | event detail 30d; aggregate 90d | operations; pseudonymous |
| Microphone diagnostics | device support | 30d; no raw audio | support/operations; pseudonymous |
| Initial/final interest | progression/PostgreSQL | 30d after session | progression service/safety break-glass; field encryption |
| Mutual progression | ongoing pair state/PostgreSQL | until withdrawal/closure + 30d | pair service; export own outcome only |
| Disclosure grant/access | consent/audit/PostgreSQL | 180d | privacy/safety restricted; encrypted identifiers |
| Webcam consent | excluded | not collected | none |
| Participant messages | excluded in MVP | not collected | none |
| Block | safety/PostgreSQL | active account + 30d | safety service; peer never sees |
| Report/evidence/case | safety/PostgreSQL/Object Storage | 1y after case closure | case roles; encrypted/private; controlled export |
| Sanction/appeal | enforcement/PostgreSQL | 1y after final closure | safety/appeal roles; audited |
| Support ticket | recovery/PostgreSQL | 90d after closure | support; sensitive attachments case-scoped |
| Notification intent/delivery | reliability/PostgreSQL | 90d | notification/operations; no message body in logs |
| Audit event | security/accountability/PostgreSQL/Object Storage | 1y; higher-impact legal hold only when documented | security/privacy; tamper-evident |
| Operational logs | diagnosis/CLA | 30d | operations/security; redacted |
| Metrics | reliability/Cloud Insight/Grafana | Grafana 14d; NCP tiered service retention; project aggregate max 90d | operations; no sensitive labels |
| Traces/frontend errors | diagnosis/Grafana | 14d | engineering/security; sampled/redacted; no replay |
| Analytics/experiments | validation/PostgreSQL/analytics | 180d pseudonymous aggregate/event | product research; no private values |
| Database backups | recovery/NCP/Object Storage | rolling maximum 35d where supported; Cloud DB setting may be 30d | backup admins; encrypted; restore-tested |
| Exported files | portability/support | 7d then verified delete | named requester/operator; encrypted |

## Provider and legal categories

Provider-controlled retention is recorded in contracts and [vendor research](../../research/technology/korean-mvp-vendor-verification.md); SENS public pages currently conflict on 30/90-day history, so the application keeps its own 90-day delivery evidence and seeks written confirmation. No additional legally required retention was established by this task. Qualified Korean privacy review may shorten periods or identify a specific statutory hold before live Pilot.

## User-visible deletion

Closure immediately blocks login, admission, reveal and progression; active records enter deletion workflow. Already disclosed information and local capture cannot be recalled. Case/legal hold data is hidden from normal product use, access-limited and deleted when the hold ends. Deletion completion and backup expiry are auditable.

