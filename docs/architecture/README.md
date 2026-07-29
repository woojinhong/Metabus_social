---
title: Architecture Index
document_type: navigation
classification: confirmed fact
status: Approved Pilot boundary with analysis references
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../adr/README.md","../spec/ux/README.md"]
decision_authority: decisions.md and Accepted ADRs
---

# Architecture Index

## Approved Pilot baseline

- Java 25 LTS and Spring Boot 4.1 modular monolith with managed RTC adapter.
- React/Vite Web/PWA first with numeric Expo/React Native evaluation gates.
- NCP Korea VPC hosting and NCP Cloud DB for PostgreSQL durable authority.
- No Redis for Pilot; conditional TTL store only after measured need.
- LiveKit Cloud Build Pilot, Daily then Agora fallback, self-hosted LiveKit exit; no mid-session failover.
- NICE minimal-result adult eligibility, NCP notifications/Object Storage, OTel with NCP/Grafana backends.

See [domain capability map](domain-capability-map.md), [Accepted ADRs](../adr/README.md), [selected external services](external-services-selected.md) and [NCP deployment](deployment-ncp-korea.md).

## Authority boundary

Architecture approves platform and security boundaries, not implementation
contracts. [D-024](../discovery/decisions.md#d-024-required-ux-approval-gate)
is satisfied for the UX baseline. Endpoint paths/DTOs, database schema/enums,
session state machine, real-time event payloads, page authorization and
component contracts remain blocked pending separate promotion.

## Supporting analysis

Existing application, domain, data, frontend, RTC, scalability, security, cost and external-service analysis files remain useful evidence. Where they still say Unapproved or propose alternatives, the Accepted ADR and current SOT control only the exact approved scope; the remaining analysis is non-decisional.

## Live and production gates

No provisioning or production claim is made. Legal/privacy, vendor
contracts/DPAs, quotes/quotas, NCP account, NICE coverage, LiveKit Korea tests,
Grafana processing, restore/failover and moderator readiness remain required
before live operation; Implementation Contract and source-code approvals remain
separate gates.

