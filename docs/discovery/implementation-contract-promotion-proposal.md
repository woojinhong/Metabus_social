---
title: Implementation Contract Phase Promotion Proposal
document_type: decision proposal
classification: proposal
status: Pending owner approval
implementation_ready: false
last_verified: 2026-07-28
related_documents:
  - decisions.md
  - open-questions.md
  - ../spec/traceability-implementation.md
  - ../spec/ux/README.md
decision_authority: D-024 and explicit owner approval required
---

# Implementation Contract Phase Promotion Proposal

## Current authority

D-024 was satisfied on 2026-07-28 for the approved UX baseline and isolated,
synthetic-data, local-state, low-fidelity prototype. Local prototype validation
is complete. It is not production, real-device, assistive-technology, legal,
vendor or operational evidence.

Implementation Contract promotion is not approved. This proposal does not
assign a decision ID, change D-001 through D-024, change an ADR, or authorize
implementation.

## Proposed approval effect

If the owner approves this phase, documentation work may map approved behavior
to implementation-facing proposals while keeping every artifact explicitly
non-authoritative and `implementation_ready: false`.

Allowed proposal outputs:

1. UX-to-Implementation traceability matrix.
2. Actor and role catalog.
3. Preconditions and authorization matrix.
4. Candidate state vocabulary, lifecycle ownership and transition constraints.
5. Candidate API operations without endpoint paths or DTO implementation.
6. Candidate real-time commands/events without final transport or payloads.
7. Data classification, retention, deletion and lifecycle constraints.
8. Error, retry, idempotency and recovery contracts.
9. Security, privacy, audit and operational controls.
10. Acceptance-test criteria linked to approved requirements and UX evidence.

These outputs may compare alternatives and identify open decisions. They may
not claim machine-readable or production authority.

## Excluded scope after approval

The proposed phase would still not authorize:

- production frontend/backend or prototype code changes;
- actual endpoint, route, page-authorization or DTO implementation;
- authoritative OpenAPI or AsyncAPI;
- DBML, tables, columns, enums, schema or migrations;
- a final real-time state machine, transport, event name or payload;
- vendor integration, cloud provisioning, accounts or credentials;
- procurement, spend, Pilot operation or production deployment.

Source-code creation and production contract promotion require later explicit
owner decisions. Legal/privacy, procurement, vendor, real-device, moderation
and operational gates remain independent and block live participants.

## Required artifact rules

Each future artifact must:

- name its approving decision and source requirements;
- use `classification: proposal`, an approval-pending status and
  `implementation_ready: false`;
- separate evidence, approved rules, inference, proposal and open question;
- preserve privacy minimization, backend authority and excluded capabilities;
- avoid treating an Accepted ADR as implementation permission;
- stop when an exact contract would require an unresolved owner, legal,
  procurement, vendor or security decision.

## Owner approval requested

The owner must explicitly decide whether to:

1. open the bounded documentation-only phase above;
2. accept or narrow the ten allowed output families;
3. preserve the exclusions and independent live-operation gates;
4. record any approval in the authoritative decision log.

Until that decision is recorded, no Implementation Contract artifact may be
created under this proposal.
