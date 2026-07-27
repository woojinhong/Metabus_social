---
title: Moderation, Sanctions, and Appeals
document_type: operations policy
classification: user decision
status: Approved principles; console interaction pending UX approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["../spec/trust-safety-moderation.md","../spec/data/retention-matrix.md","../spec/ux/safety-and-reporting-wireflow.md"]
decision_authority: D-019 and D-024
---

# Moderation, Sanctions, and Appeals

## Authority layers

Automation may hold, rate-limit and signal. Session operators may mute, pause, remove and cancel an assigned room. Safety reviewers decide warnings and temporary restrictions. Senior reviewers decide permanent bans and severe restoration. Appeal reviewers must be independent and recuse conflicts. LLMs/classifiers may triage but cannot solely decide irreversible sanctions.

## Severity matrix

| Level | Examples | Immediate containment | Human outcome |
| --- | --- | --- | --- |
| S0 | false positive, safe context | release hold | close with reason |
| S1 | first contact handle/URL/QR/phone/email/account number, mild solicitation | hold, explain, safe edit | warning |
| S2 | repeated promotion/spam, targeted harassment, report misuse | rate limit/remove | 7-day suspension; repeated S2 within 180 days becomes 30 days |
| S3 | sexual misconduct, hate/discriminatory abuse, impersonation, stalking, doxxing, retaliation, recording threat, credible threat | immediate mute/remove and reporter protection | 30-day suspension pending senior review; repeated S3 normally permanent |
| S4 | imminent violence, severe stalking/doxxing, coordinated fraud, repeated severe abuse, moderator abuse | revoke access and break-glass escalation | senior-reviewed permanent ban and lawful emergency path if applicable |

Two confirmed S1 events in 30 days escalate to S2. A successful appeal removes the overturned strike. Unsubstantiated reports alone are never punished.

## Approved workflow

1. Deterministic contact/QR/promotion rules hold content before display and explain safe correction.
2. Participants can leave, block and report without confrontation or a long legal narrative.
3. Operators contain live risk, record reason and open a case; voice is not recorded by default.
4. Reviewer receives only case-scoped evidence and necessary audited history.
5. Decision records policy version, findings, evidence references, sanction, duration and reviewer.
6. Notice states rule, high-level reason, duration and appeal route without reporter identity.
7. Appeal is available for 14 calendar days; acknowledge within 2 business days and target decision within 7 business days.
8. Independent reviewer may uphold, reduce, reverse or request narrowly necessary evidence.
9. Successful appeal restores eligible access, revokes the sanction, corrects derived signals and preserves reversal audit.

## Evidence and access

Evidence may include participant submissions, held text/media, stage/audit facts and operator notes. Reporter identity is restricted. Sensitive access requires case, purpose, role, short expiry and audit. Break-glass requires justification, immediate alert and next-business-day review. Bulk export is prohibited except an approved legal/privacy process.

Reports, evidence, sanctions and appeals are retained one year after case closure unless deletion or documented legal hold applies. S1-only held content not used in a case is deleted within 30 days. Moderator misuse triggers privilege removal and independent investigation.

Exact report entry points, forms, evidence UI, moderator console and appeal screens remain Draft pending D-024.

