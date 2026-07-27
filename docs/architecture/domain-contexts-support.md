---
title: Domain Contexts: Supporting
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Domain Contexts: Supporting

**Proposal — unapproved.** These contexts may begin as modules; separate services require evidence.

| Context | Responsibility | Aggregate candidates | Important invariants | Events | External dependencies | Sensitive data | Consistency | MVP / boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Game and Content | Stable formats, reviewed packs, session delivery | GameFormat, ContentItem, ContentPack | Only approved version served; metadata required | PackPublished, ItemRetired | Editorial inputs, moderation | Submitted clues/media | Strong for published version | Yes; content-governance boundary |
| Real-Time Media | Translate stage authority to rooms/tokens/grants | MediaSession, ParticipantGrant | Short TTL; minimum privilege; provider not authority | MediaJoined, QualityChanged, MediaRemoved | Managed SFU/TURN | IP/device/quality metadata | Strong grants; eventual metrics | Yes; volatile vendor boundary |
| Trust, Safety, and Moderation | Policy, reports, cases, sanctions, appeals | Report, SafetyCase, Sanction, Appeal | Least privilege; reasoned audited action | ReportFiled, Restricted, AppealResolved | Moderation vendors/support | Reports/evidence/private content | Strong sanctions/audit | Yes; policy boundary |
| Payments and Deposits | Future money authorization, capture, refund | PaymentIntent, Refund, Deposit | Ledger accurate; no romantic outcome sold | PaymentAuthorized, Refunded | PG/app stores | Financial records | Strong | Deferred; future boundary |
| Notifications and Invitations | Purpose-bound reminders/admission prompts | NotificationPlan, DeliveryAttempt | No reusable admission URL; expiry honored | ReminderRequested, DeliveryFailed | Push, Kakao, SMS, email | Contact endpoints | Eventual; admission independent | Yes; support/vendor boundary |
| Offline Date Coordination | Future mutual availability/venue coordination | MeetingProposal, VenueChoice | Mutual; public venue; minimal location disclosure | MeetingProposed, Cancelled | Maps, venue, calendar | Location/availability | Strong consent | Deferred; future boundary |
| Feedback and Experimentation | Minimized outcomes and experiment assignment | Feedback, ExperimentAssignment | Purpose-limited; assignment stable | FeedbackSubmitted, ExperimentExposed | Analytics platform | Safety feedback/outcomes | Eventual | Limited MVP; support boundary |
| Administration and Operations | Content publish, recovery, support access | OperatorAction, RoleGrant, RunbookCase | Separation of duties; break-glass; no silent impersonation | OperatorActed, AccessGranted, BreakGlassUsed | Admin identity/audit | Cross-domain sensitive data | Strong audit | Yes; privileged boundary |

## CRUD versus domain boundary

Scheduling reference data, notification templates, and basic administration screens may remain CRUD inside their context. Consent, safety sanctions, session transition, money, and mutual progression require explicit domain rules. Vendor adapters do not define a domain merely because they are external.

## Future extraction signals

Consider extraction only for independent scaling, regulatory isolation, materially different availability, vendor churn, or separate team ownership. Analytics ingestion, notification delivery, content publishing, and media orchestration are likely first candidates; consent and interest should remain transactionally close.

