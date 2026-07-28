---
title: Initial GitHub Backlog Status
document_type: operations
classification: confirmed fact
status: Reconciled
last_verified: 2026-07-28
related_documents:
  - github-workflow.md
  - ../discovery/decisions.md
  - ../spec/ux/README.md
  - ../spec/traceability-implementation.md
decision_authority: decisions.md and explicit repository-owner workflow delegation
---

# Initial GitHub Backlog Status

## Purpose

This file preserves the initial candidate backlog and its current disposition.
It is not a substitute for remote Issues and does not reopen completed gates.
New work follows the approved [GitHub documentation workflow](github-workflow.md).

## Reconciled candidates

| Initial candidate | Current status | Remaining boundary |
| --- | --- | --- |
| IA and screen inventory | D-024 UX baseline approved | implementation contracts remain blocked |
| reservation-to-session journey | D-024 UX baseline approved | production routes/contracts remain blocked |
| session-stage wireflow | D-024 UX baseline approved | final state/event contracts remain blocked |
| disclosure, interest and no-match | D-024 UX baseline approved | API/schema contracts remain blocked |
| reporting, blocking and moderator flow | D-024 UX baseline approved | console implementation and operations readiness remain blocked |
| responsive and accessible interaction | D-024 UX baseline approved | real-device and assistive-technology evidence remains open |
| close D-024 | completed 2026-07-28 | no Implementation Contract or source-code approval |
| documentation workflow Harness | approved policy | remote settings and hooks are not added by this work |

## Open candidate gates

These non-authoritative proposals are candidate outcomes, not proof that a
remote Issue exists:

1. Validate LiveKit on the approved Korean device/network matrix.
2. Close NICE contract, returned-field, foreign-resident and MVNO gates.
3. Complete qualified retention and cross-border privacy review.
4. Validate NCP account, quote, quota, restore/failover and recovery gates.

Each candidate requires duplicate search and the Issue test in the approved
workflow before remote creation. Vendor accounts, procurement, provisioning,
credentials and spend require their separate approvals.

## Dependency boundary

```text
approved D-024 UX baseline
  -> separately approved Implementation Contract phase
  -> separately approved source-code phase

legal + procurement + vendor + real-device + operations gates
  -> separately approved live Pilot
```

No candidate in this backlog authorizes production implementation, automatic
merge, ready-for-review transition, ADR acceptance or owner Decision changes.
