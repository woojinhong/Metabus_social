---
title: Trust and Safety Operations
document_type: operations proposal
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../architecture/system-context.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Trust and Safety Operations

## Purpose

**Proposal — unapproved.** Provide rapid intervention, evidence-minimized review, proportionate sanctions, and appeal without promising a risk-free service.

## Operating model

| Stage | Participant control | Automated control | Human control |
| --- | --- | --- | --- |
| Before session | Block/cancel/support | Identity/account/device/reputation checks | Escalate eligibility anomaly |
| Waiting/session | Mute self, pass, report, leave | Stage permission, rate/contact filters | Operator mute/remove/pause |
| Media submission | Withdraw/delete | EXIF, malware, QR/barcode, safety signals | Quarantine review |
| After session | Block/report/appeal | Correlate scoped events | Case review, sanction, appeal |

An LLM may assist triage or summarization but is never the sole enforcement, evidence, or appeal decision-maker.

## Case lifecycle

1. Receive report with category, time/session context, optional evidence, and immediate safety need.
2. Acknowledge and protect the reporter from unnecessary disclosure.
3. Apply urgent temporary restriction where policy threshold is met.
4. Assign a least-privileged reviewer; retrieve only case-relevant evidence.
5. Document policy version, facts, uncertainty, action, duration, and rationale.
6. Notify parties without exposing private choices or unsafe detail.
7. Offer an accessible appeal reviewed separately where practical.
8. Apply/revoke sanction and re-registration controls; close and retain only as justified.

## Abuse categories

Harassment, sexual misconduct, hate/discrimination, stalking/retaliation, threats, recording/privacy violation, impersonation/underage concern, scams/phishing, external-contact pressure, advertising/follower solicitation, spam/bots, no-show abuse, report abuse, and moderator/insider abuse.

## Sanction ladder

Content block or warning, stage restriction, session removal, temporary account restriction, permanent ban, and external escalation where legally required and reviewed. Severity, repetition, credibility, vulnerability, and imminent risk inform action. Counts alone do not prove misconduct.

## Privileged access controls

Support and safety roles are separate. Private interest and reveal state are hidden by default. Break-glass access requires case/reason, shortest scope, time limit, strong authentication, immutable audit, anomaly alert, and retrospective review. Silent participant impersonation is prohibited. Bulk exports and repeated unusual lookups are alerted.

## Evidence handling

Prefer event/time/stage/grant/operator evidence over voice recording. Provider recording is disabled by default. Participant-submitted screenshots/audio may be accepted only under a defined policy, quarantined, access-controlled, and deleted after purpose/legal need. Local recording cannot be fully prevented.

## Safety service levels

Candidate priorities: immediate in-session danger intervention; urgent account restriction; standard report review; appeal review; deletion/access request. Exact targets and staffing require approval. Coverage gaps must be explicit before sessions run.

## Quality and accountability

Measure intervention time, case backlog, repeat reports, overturned sanctions, false-positive themes, re-registration, reporter safety, accessibility, and reviewer consistency. Audit policy changes and sample decisions for bias without exposing more sensitive data.

## Legal boundary

Mandatory reporting, evidence retention, biometric/identity handling, cross-border transfer, and data-subject rights require qualified Korean legal/privacy review.

## Approval gate

Rules, evidence policy, staffing, sanctions, appeal, external escalation, re-registration detection, retention, and privileged access require approval.

## Pilot readiness checklist

- Published rules distinguish unwanted contact, solicitation, harassment, sexual misconduct, discrimination, recording, and scams.
- Participant block/report/leave works from every live stage and after the session.
- Operators can mute/remove quickly without seeing private selections.
- Reviewers have case-scoped access, approved retention, secure evidence handling, and appeal routing.
- Break-glass and export events trigger alerts and independent review.
- Re-registration controls have a false-positive and accessibility process.
- Coverage hours, urgent escalation, vendor contacts, and incident communications are staffed.

## Failure and recovery

If safety staffing or critical controls are unavailable, do not start affected sessions. If evidence storage fails, preserve only the minimum event references and restrict action to what policy supports. If automated moderation fails, tighten stage permissions or pause affected features rather than silently relying on an LLM or accepting unsafe content.

## Evidence gaps

Expected case volume, in-session intervention time, reviewer consistency, appeal overturn rate, moderator wellbeing, Korean escalation duties, and accessible reporting need research and pilot measurement.
