---
title: Selected External Services for the Korean Pilot
document_type: architecture SOT
classification: user decision
status: Approved platform boundary
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../research/technology/korean-mvp-vendor-verification.md","deployment-ncp-korea.md"]
decision_authority: D-010, D-013 through D-017
---

# Selected External Services

## Selection register

| Need | Selected Pilot service | Region/data | Cost/limit basis | Failure/fallback/exit |
| --- | --- | --- | --- | --- |
| Compute/network | NCP VPC + Standard-g2 Server + ALB | Korea | Server 119 KRW/h example; ALB starts 26 KRW/h; VAT/network extra | cancel/rebook on single app failure; portable Spring deployable |
| Database | NCP Cloud DB for PostgreSQL | Korea VPC | 250 KRW/h per 2vCPU/8GB node public generation; storage/backup extra | logical pg_dump export; restore to non-NCP PostgreSQL |
| RTC | LiveKit Cloud Build | Japan/Singapore APAC path, not Korea-resident | 5,000 participant-min, 100 concurrent, hard cap | Daily Seoul first fallback, Agora second, self-hosted LiveKit exit; no live failover |
| Adult eligibility | NICE mobile identity verification | contract-controlled | public price unavailable | block participation on outage; no manual document fallback |
| SMS | NCP SENS SMS | Korea | 50/month free then 9 KRW/send; VAT excluded | max two attempts; in-product state remains authority |
| AlimTalk | NCP SENS AlimTalk | Korea | 7.5 KRW/send; no free allowance | SMS urgent fallback after approved template/retry policy |
| Email | Cloud Outbound Mailer until 2026-09-17 integration check, then verified SENS Mail | NCP supported region | 1,000/month current COM free; future rates pending | adapter, SPF/DKIM/DMARC, support/in-product fallback |
| Media | NCP Object Storage | Korea | 28 KRW/GB-month plus request/egress | inventory/export/delete jobs; portable object keys |
| Infra metrics | NCP Cloud Insight | Korea | currently free, limits apply | export dashboards/alerts; replace with OTel-compatible metrics backend |
| Logs | NCP Cloud Log Analytics Standard | Korea | 20GB/day, 100GB, 30d; current partial free allowance | redacted JSON export to Object Storage |
| Cloud audit | NCP Cloud Activity Tracer | NCP control plane | free, 90d console history | daily Object Storage export |
| App metrics/traces/errors | Grafana Cloud Free via OTel | region pending procurement verification | 10k series, 50GB traces, 14d hard-limited retention | OTLP export permits backend replacement; no replay |
| Secrets | NCP Secret Manager + Sub Accounts | Korea VPC | quote required | export names/rotation plan; never export secret values to docs |

All numbers were verified on 2026-07-27 and exclude VAT unless stated. Quotes and service terms override public examples.

## Common adapter contract

Each vendor adapter must define purpose, timeout, bounded exponential retry with jitter, circuit breaker, idempotency key, provider reference, rate/quota check, webhook signature/replay validation, data sent/returned, redacted audit, deletion/export, health state and operator-visible safe failure. Provider-specific credentials and tokens never enter domain models or general client responses.

## Privacy boundary

- NICE: send provider-required identity request; persist only approved outcome metadata, never DOB/CI/DI/raw response.
- LiveKit: send pseudonymous participant/room identity and least-privilege grants; no product profile, interest or report data; recording disabled.
- Grafana: pseudonymous scoped IDs and sanitized telemetry only; no phone, identity, preferences, answers, interests, grants, tokens, voice, photos or message content.
- Notifications: minimum destination and approved transactional template data; no reusable admission authority or sensitive preview.
- Object Storage: private objects and moderation metadata; signed access is short-lived and subject to app authorization.

## Reliability and cost controls

- LiveKit: warn at 3,500 projected participant-minutes; fail closed for new reservations above 4,000; account-wide free quota is monitored.
- SENS/email: per-intent idempotency, max retry count, daily/monthly cost cap and no uncontrolled fallback loop.
- CLA/Grafana: sampling, cardinality limits, daily ingest alarms and drop rules for forbidden fields.
- NCP: Cost Explorer/Cloud Insight alarms, business account permissions and least-privilege Sub Accounts.

## Production gates

No service is provisioned by this decision. Before live Pilot:
contract/DPA/subprocessor/data-location review, business account and quote,
quota tests, webhook security, export/deletion test, incident escalation,
support/SLA review and privacy notices. D-024 is satisfied; UI-dependent
request/response and error contracts remain pending separate promotion.

