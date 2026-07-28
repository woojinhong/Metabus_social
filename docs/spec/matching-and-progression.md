---
title: Approved Compatibility, Interest, and Progression
document_type: specification
classification: user decision
status: Approved product and UX interaction baseline; implementation promotion pending
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["mvp-scope.md","progressive-disclosure.md"]
decision_authority: D-002 and D-004
---

# Approved Compatibility, Interest, and Progression

## Compatibility

| Input | Rule | Visibility |
| --- | --- | --- |
| Adult eligibility | verified true on participation date | outcome only to authorized process |
| Age | 25-39 recruitment and reciprocal accepted range | five-year band initially; exact age on consented reveal |
| Gender/orientation | reciprocal heterosexual Pilot compatibility | exact preference remains private |
| Intent | dating | session purpose may be shown |
| Area | broad Seoul activity area | broad area only |
| Hard lifestyle constraint | every participant-marked hard constraint must pass | private unless separately disclosed |
| Availability | exact fixed slot | broader calendar private |

No constraint is relaxed to fill a cohort. Compatibility is not a safety guarantee or prediction of relationship success.

## Requirements

| ID | Approved behavior |
| --- | --- |
| FR-MAT-001 | Evaluate reciprocal compatibility at assignment, confirmation and admission |
| FR-MAT-002 | Record policy version and result without exposing another person's preferences |
| FR-MAT-003 | Initial interest accepts zero, one or two eligible participants privately |
| FR-MAT-004 | Drafts may change until close; submission is idempotent and then immutable except withdrawal to none |
| FR-MAT-005 | Limited reveal eligibility requires mutual initial interest without exposing counts or reasons |
| FR-MAT-006 | Final romantic choice accepts zero or one after reveal/no-reveal path |
| FR-MAT-007 | Mutual progression exists only when both final selections name each other and neither is blocked/removed/sanctioned |
| FR-MAT-008 | No match, no reveal, timeout, block, withdrawal, removal and cancellation are ordinary private outcomes |
| FR-MAT-009 | Pair voice requires a new ten-minute pair-scoped grant and current mutual eligibility |
| UX-MAT-001 | Explain limits, close time, no-choice option, and that interest is not consent to other capabilities |
| UX-MAT-002 | Never reveal who selected whom, counts, rejection reason or incompatible next-action detail |
| SR-MAT-001 | Encrypt private selections with restricted service/role access; exclude them from general logs and analytics |
| SR-MAT-002 | Serialize selection close, block, removal and consent withdrawal against authoritative version |
| SR-MAT-003 | A block immediately revokes reveal and future progression in both directions |

## Persistence

Store submitted selections, stage, policy version, idempotency key and encrypted selected account reference for 30 days after session. If mutual progression exists, retain only the minimal mutual record until either participant withdraws or deletes the account; do not retain peer-inferable counts.

