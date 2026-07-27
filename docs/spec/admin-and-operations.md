---
title: Administration and Operations Capabilities
document_type: specification
classification: user decision
status: Approved capabilities; console UX pending approval
implementation_ready: false
last_verified: 2026-07-27
related_documents: ["trust-safety-moderation.md","../operations/moderation-sanctions-and-appeals.md","ux/safety-and-reporting-wireflow.md"]
decision_authority: D-019 and D-024
---

# Administration and Operations Capabilities

| ID | Approved capability and boundary |
| --- | --- |
| FR-ADM-001 | View schedule, fill risk, confirmation and health without routine private preference access |
| FR-ADM-002 | Confirm, cancel or rebook with reason; never relax compatibility |
| FR-ADM-003 | Admit, deny, mute, remove, pause or cancel only assigned session with audit |
| FR-ADM-004 | View stage, connection and minimum RTC quality; no voice recording or private choices |
| FR-ADM-005 | Review held media/content only under a case and expiring access |
| FR-ADM-006 | Publish, pause, roll back or retire versioned content packs with separation of duties |
| FR-ADM-007 | Triage, contain, investigate, resolve and escalate reports with case-scoped evidence |
| FR-ADM-008 | Apply/reverse sanctions and process independent appeals under approved policy |
| FR-ADM-009 | Send approved notification templates; never reusable admission authority |
| FR-ADM-010 | View separated operational/product/safety metrics without sensitive routine dashboards |
| SR-ADM-001 | Strong admin authentication, least privilege, short sessions, access review and device/risk controls |
| SR-ADM-002 | No participant impersonation; support state changes are explicit and audited |
| SR-ADM-003 | Sensitive access requires case, purpose, role, time limit and reason |
| SR-ADM-004 | Break-glass requires justification, alert, expiry and retrospective review |
| SR-ADM-005 | Detect bulk access, unusual search, sanction anomalies and audit tampering |
| SR-ADM-006 | Private selections are unavailable to ordinary support, session, content, analytics and RTC roles |
| SR-ADM-007 | High-impact moderation, disclosure and admission audit is append-only or tamper-evident |

Underfill follows the approved cancellation rule. RTC degradation freezes risky transitions and cancels/rebooks; there is no live provider migration. Unauthorized reveal revokes delivery, preserves minimum audit and starts incident review. Payment/refund, biometric/manual identity review, venue booking and automatic live trend publishing are excluded.

Exact moderator console screens, navigation, filters, bulk actions, confirmations, failure states and accessibility interactions remain Draft pending D-024.

