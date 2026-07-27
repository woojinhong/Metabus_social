---
title: Vendor Operations
document_type: operations proposal
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../architecture/system-context.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Vendor Operations

## Purpose

**Proposal — unapproved.** Govern vendor selection, launch, monitoring, incident response, and exit. This document does not authorize procurement, credentials, resources, or data transfer.

## Pre-contract checklist

- Document need, data flow, alternatives, build-versus-buy reasoning, owner, and approval.
- Verify official SDK status, supported clients, Korea/nearby region, quotas, rate limits, and current pricing date.
- Review security architecture, incident history/process, certifications, subprocessors, residency, retention, deletion, export, and termination.
- Review accessibility, false acceptance/rejection where relevant, support response, roadmap, and deprecation policy.
- Define minimum contract, overage, taxes/currency, SLA/credits, liability, audit rights, and exit assistance.
- Complete legal/privacy review for identity, biometric, dating/orientation, media, moderation, and cross-border data.

## Integration readiness

Use dedicated least-privileged credentials, secret manager, environment separation, signed callbacks, allowlisted redirect/webhook destinations, timeouts, bounded retry, idempotency, rate limits, circuit breakers, quotas, test tenant, redacted telemetry, and deletion/export tests.

## Operational register

| Control | Required evidence |
| --- | --- |
| Owner/on-call | Named service and business owners; escalation route |
| Health | Synthetic check, API/SDK errors, quota, latency, callback lag |
| Security | Credential age, signature failures, anomalous use, vendor advisories |
| Privacy | Data categories, region, retention, deletion result, subprocessors |
| Cost | Usage units, committed tier, overage, forecast, anomaly alert |
| Reliability | Known limits, outage playbook, recovery objective, participant message |
| Exit | Export format, alternate adapter, credential revoke, deletion certificate |

## Service-specific posture

- Media: regional/device load tests, TURN measurements, token-grant tests, outage cancellation; no mid-session provider switch.
- Identity: minimize returned evidence; test false outcomes/accessibility; no manual/biometric fallback without approval.
- Notifications: account inbox remains truth; messages contain no reusable credential or sensitive result.
- Storage/moderation: private access, metadata stripping, quarantine, deletion propagation.
- Observability/analytics: redaction and event allowlist before export.
- Payments: excluded initially; no provider account/product or refund flow.

## Incident response

Confirm vendor scope and participant impact; revoke or rotate credentials; fail closed for admission/consent/reveal; pause/cancel media sessions if necessary; preserve minimized evidence; communicate approved status; reconcile missed callbacks/commands idempotently; document root cause and corrective action.

## Change management

Track SDK/API/version notices, pricing, terms, region, subprocessor, quota, and deprecation changes. Re-run compatibility/security tests before upgrades. Avoid automatic major upgrades. Emergency changes still require audit and retrospective review.

## Exit exercise

At least proportionate to risk, verify data export, adapter substitution, DNS/endpoint change if relevant, credential revocation, webhook shutdown, participant continuity or cancellation, data deletion, and monitoring cleanup. Self-hosted LiveKit tests operational independence but not full protocol/SDK independence.

## Approval gate

Contracts, spend, accounts, credentials, data transfer, regions, tiers, fallbacks, and production enablement require explicit approval.

## Vendor review cadence

High-risk media, identity, storage, moderation, and future payment vendors receive a scheduled review of access, subprocessors, incident notices, SDK/API lifecycle, pricing/quota, deletion, and fallback evidence. Lower-risk vendors are reviewed proportionately and on material change.

## Decommission checklist

1. Stop new data and credential issuance.
2. Drain or cancel in-flight work under the approved participant policy.
3. Export only required portable state and verify integrity.
4. Reconcile callbacks, invoices, and open incidents.
5. Revoke keys, tokens, webhooks, domains, and administrator access.
6. Request and verify contractual deletion, including backups where supported.
7. Remove monitors, allowlists, secrets references, and support routes.
8. Record residual retention, participant impact, and lessons.

## Evidence gaps

Public documentation rarely resolves negotiated price, Korea-specific support, deletion certification, termination assistance, incident response time, or subprocessor change control. These remain procurement questions rather than estimated facts.

## Stop condition

Do not launch a dependency if no accountable owner, tested fallback/cancellation path, privacy data flow, quota alert, or incident contact exists.
