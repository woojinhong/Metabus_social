---
title: Domain Boundaries and Context Map
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Domain Boundaries and Context Map

## Boundary proposal

**Proposal — unapproved.** Bounded contexts organize language, invariants, ownership, and future extraction; they do not require separate services or ceremonial layers.

## Context map


auth/eligibility --> compatibility --> cohort --> session orchestration
profile/disclosure ------------------^            |--> media transport
scheduling --> booking/attendance ---'            |--> interest/progression
content -----------------------------'            |--> notifications
trust/safety -------- policy and restrictions ----'
feedback/experiments <---- minimized derived events
admin/operations ---- controlled commands and audit
payments and offline coordination ---- deferred

## Relationship rules

- Session Orchestration consumes eligibility, reservation, cohort membership, content version, and sanctions; it never redefines them.
- Real-Time Media translates authorized stages into transport grants and reports presence/quality back.
- Profile and Progressive Disclosure owns subject grants; Interest and Progression supplies viewer eligibility. Reveal requires both.
- Trust, Safety, and Moderation can restrict access across contexts through audited policy outcomes.
- Notifications consume events and cannot confer admission.
- Feedback and Experimentation receives minimized, purpose-bound events; it is never a source of truth.

## Boundary criteria

A true boundary has distinct invariants, sensitive-data access, lifecycle, policy, or vendor volatility. A support module remains simple CRUD when it only maintains reference data without independent rules. Deployment remains a modular monolith unless measured scaling or ownership requires extraction.

## Detailed context catalog

- [Core contexts](domain-contexts-core.md)
- [Supporting contexts](domain-contexts-support.md)

## Consistency model

Strong consistency is proposed for eligibility/admission, reservation ownership, attendance, consent, interest submission, mutual progression, reveal authorization, reports, sanctions, and future payment records. Eventual consistency is acceptable for notifications, analytics, search projections, quality dashboards, and expiring presence.

## External dependencies

All identity, media, payment, notification, moderation, storage, analytics, and venue dependencies enter through adapters with documented purpose, timeout, failure, fallback, retention, and exit. See [external services](external-services.md).

## Approval gate

The context map is a planning proposal. It does not approve service boundaries, APIs, schema, implementation, or vendors.

## Cross-context invariant examples

| Invariant | Owning context | Required collaborators |
| --- | --- | --- |
| Only eligible reserved participant enters | Identity, Booking, Session | Cohort, Safety, Media |
| Only compatible cohort is confirmed | Cohort Composition | Preferences, Booking |
| Only current subject grant can reveal media | Profile/Disclosure | Interest/Progression, Session |
| Only compatible mutual choice creates private progression | Interest/Progression | Session, Notifications, Media |
| Sanction revokes current and future access | Trust/Safety | Identity, Session, Media |
| Published session uses one immutable content version | Game/Content | Session, Administration |

## Integration-event discipline

Events crossing boundaries carry a stable event ID, source version, occurred time, subject/reference IDs, classification, and minimum payload. Consumers deduplicate and tolerate replay. Sensitive preferences, selections, report narratives, and media URLs are not broadcast as general integration events.

## Context validation questions

- Does the boundary protect a distinct invariant or sensitive-data policy?
- Can it be tested independently without duplicating product authority?
- Does extraction improve measured scaling, availability, or ownership?
- Is synchronous consistency required, or can a minimized event suffice?
- Can an operator understand which context owns recovery?

If these answers are weak, keep the capability as a module or CRUD support inside the nearest context.
