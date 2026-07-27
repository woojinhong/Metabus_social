---
title: Hosting and Observability Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/scalability-reliability.md
decision_authority: docs/discovery/decisions.md only
---

# Hosting and Observability Options

## Candidate comparison

| Concern | Option | Proposal assessment | Evidence gap |
| --- | --- | --- | --- |
| Telemetry standard | OpenTelemetry | Recommended instrumentation baseline | SDK version at adoption |
| Metrics and dashboards | Prometheus + Grafana or cloud-native equivalent | Evaluate after host choice | Managed pricing and on-call cost |
| Errors and traces | Sentry or cloud-native equivalent | Evaluate for web/mobile errors | Sensitive-event filtering |
| Product analytics | PostHog, Amplitude, Mixpanel, or privacy-conscious alternative | Defer vendor selection | Korea location and consent |
| Hosting region | Managed services near intended users | Procurement criterion | Capacity, DPA, and support |

## Proposal - unapproved recommendation

- Instrument structured logs, traces, metrics, media-quality aggregates, security audit events, moderation outcomes, and privacy-safe product events through an OpenTelemetry-oriented boundary.
- Keep operational, product, safety, and sensitive classes distinct; do not put raw voice, unredacted identity data, or private selections in general logs or analytics.
- Fallback: cloud-native metrics/tracing when it better satisfies retention, export, and access-control requirements.
- Exit: export telemetry through standard protocols and retain independent audit evidence.
- Approval gate: host, region, observability, analytics, and error-monitoring vendors need explicit approval.

## Capacity and cost evidence

Research finding: load should be modeled in concurrent rooms, participant-minutes, reconnects, notification bursts, and media quality, not MAU alone. Evidence gap: free tiers/calculators do not establish Korea-region production cost; human moderation and support are separate operational costs.

## Source ledger

- Title: OpenTelemetry documentation
  - Publisher: Cloud Native Computing Foundation
  - URL: https://opentelemetry.io/docs/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: OpenTelemetry documents vendor-neutral signals and protocols.
  - Limitations: Instrumentation alone does not satisfy privacy governance.

- Title: Prometheus overview
  - Publisher: Prometheus Authors
  - URL: https://prometheus.io/docs/introduction/overview/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Prometheus documents a metrics-monitoring option.
  - Limitations: It does not provide hosted on-call operations by itself.

- Title: Grafana Cloud pricing
  - Publisher: Grafana Labs
  - URL: https://grafana.com/pricing/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Public page lists Grafana Cloud allowances and USD rates shown in the price snapshot.
  - Limitations: Usage, region, and enterprise cost vary.

- Title: PostHog pricing
  - Publisher: PostHog
  - URL: https://posthog.com/pricing
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Official page lists PostHog free allowances and USD usage tiers shown in the price snapshot.
  - Limitations: This is not a vendor decision or privacy assessment.


## Signal classification

| Signal class | Examples | Access and retention principle |
| --- | --- | --- |
| Operational | CPU, database latency, room joins, reconnect rate | Engineering/on-call, minimum useful retention |
| Product | Reservation completion, attendance, pass rate | Aggregated or pseudonymous analysis |
| Safety | Reports, blocks, sanction outcome | Restricted trust-and-safety access and audit |
| Sensitive | Identity outcome, private interest, uploaded media reference | Need-to-know access; exclude from general analytics |

## Decision criteria and exit

- Regional hosting needs latency, processor, support, incident-response, data-transfer, and disaster-recovery assessment; a nearby region is not equivalent to a legal residency decision.
- Alerts should target join failure, microphone readiness, reconnect, stage transition, reveal authorization, notification delivery, and payment accuracy only if payment is later approved.
- Exportable OpenTelemetry data reduces telemetry lock-in but does not remove hosted dashboard, retention, or query migration work.
- Proposed service objectives should be modest and evidence-driven; no five-nines claim is made for a pilot.
- Evidence gap: availability targets, on-call coverage, and provider support response are not yet approved.


## Public price snapshot - verified 2026-07-27

| Service | Current public allowance/rate | Currency and tax limitation |
| --- | --- | --- |
| Grafana Cloud Free | USD 0; metrics 10k active series/month, logs 50 GB/month, frontend 50k sessions/month, 14-day retention | Tax treatment not stated in reviewed page |
| Grafana Cloud Pro | USD 19/month platform fee; metrics from USD 6.50/1k series; logs USD 0.05/GB process, USD 0.40/GB write, USD 0.10/GB retain; frontend USD 0.75/1k sessions | Usage tiers and region can change; tax not stated |
| PostHog product analytics | First 1m events/month free; USD 0.0000500/event for 1m-2m tier, lower at higher tiers | Currency shown as USD; tax/region not stated |
| PostHog session replay | First 5k recordings free; USD 0.0050/recording for 5k-15k tier | Do not send sensitive session replay without separate privacy review |

Research finding: these are public list prices/allowances, not a Korea-region quote or a cost recommendation. Use current calculator/contract pricing before procurement.
