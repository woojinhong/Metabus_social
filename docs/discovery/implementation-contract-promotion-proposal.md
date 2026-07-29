---
title: Implementation Contract Phase Promotion Proposal
document_type: decision proposal
classification: proposal
status: Approved documentation-only phase; outputs remain proposals
implementation_ready: false
last_verified: 2026-07-29
related_documents:
  - decisions.md
  - open-questions.md
  - ../spec/traceability-implementation.md
  - ../spec/traceability-ux-implementation.md
  - ../spec/ux/README.md
decision_authority: explicit owner approval in GitHub Issue #7; UX authority remains D-024
---

# Implementation Contract Phase Promotion Proposal

## Current authority

D-024 was satisfied on 2026-07-28 for the approved UX baseline and isolated,
synthetic-data, local-state, low-fidelity prototype. Local prototype validation
is complete. It is not production, real-device, assistive-technology, legal,
vendor or operational evidence.

The owner approved the bounded documentation-only phase on 2026-07-29 in
[Issue #7](https://github.com/woojinhong/Metabus_social/issues/7). This approval
does not assign a decision ID, change D-001 through D-024, change an ADR, or
authorize implementation or production contract authority.

## Approved documentation effect

Documentation work may map approved behavior to implementation-facing proposals
while keeping every artifact explicitly non-authoritative and
`implementation_ready: false`.

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

## Owner approval record

The owner explicitly approved:

1. the bounded documentation-only phase above;
2. the ten allowed proposal output families;
3. the exclusions and independent live-operation gates.

Per the same instruction, this work does not create D-025 or modify the
authoritative decision log. Issue #7 is the task approval record. Every artifact
remains a proposal; later promotion to authoritative contracts still requires
separate explicit owner approval.
