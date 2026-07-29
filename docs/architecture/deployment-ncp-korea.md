---
title: NCP Korea Deployment Boundary
document_type: architecture SOT
classification: user decision
status: Approved platform boundary
last_verified: 2026-07-29
related_documents: ["../discovery/decisions.md","../adr/ADR-008-ncp-korea-hosting.md","application-architecture.md","data-architecture.md","security-privacy.md","scalability-reliability.md","external-services-selected.md"]
decision_authority: D-010 and D-011
---

# NCP Korea Deployment Boundary

## Scope and approval boundary

- [CONFIRMED] ADR-008 selects an NCP Korea VPC, a public load-balancer entry, one private Pilot application server, private managed PostgreSQL, controlled outbound access, Secret Manager, Sub Accounts, private Object Storage, and NCP observability.
- [CONFIRMED] This is a platform boundary, not authorization to provision, deploy, spend, create credentials, select exact products/options, or operate a live Pilot.
- [RECOMMENDED] The Pilot keeps one modular-monolith deployable and one authoritative PostgreSQL database. Redis, a broker, a search cluster, Kubernetes, and multiple business databases are not implicit platform components.
- [OPEN] Exact resource size, image/runtime packaging, product tier, quota, price, backup/restore/failover, availability, SLA, DPA, residency/transfer, subprocessor, and managed-container capability require verified B-session evidence.

## Deployment option comparison

| Candidate | What it solves | Advantages for this Pilot | Costs or gaps | Decision |
| --- | --- | --- | --- | --- |
| Direct JAR process | Runs Spring application on an OS | Few packaging layers and simple diagnosis | Host/runtime drift, service supervision, rollback discipline | [OPEN] Viable VM packaging candidate |
| Virtual machine | Private application compute and OS boundary | Matches ADR-008, transparent networking, bounded operations | OS patching, one-instance availability, manual capacity | [CONFIRMED] Pilot compute boundary |
| Docker image | Reproducible application/runtime package | Environment consistency, artifact identity, later platform portability | Image build/scan/registry/patch lifecycle | [OPEN] Decide in implementation plan |
| Docker Compose | Coordinates several containers on one host | Convenient local or bounded multi-process setup | Weak production scheduling/HA; unnecessary if one app process | [NOT-RECOMMENDED] Production default |
| Managed container | Managed scheduling/deployment | Less host operation and potential rollout/scale features | NCP support, pricing, networking, identity, logging unverified | [OPEN] B-session evidence missing |
| Kubernetes | Multi-service scheduling, rollout, autoscaling | Strong control for many independently operated services | Cluster security, upgrades, networking, observability, on-call cost | [NOT-RECOMMENDED] Initial topology |
| Serverless | Event/burst execution | Scale-to-zero for suitable stateless jobs | Cold starts, runtime limits, connection/media mismatch, fragmented authority | [NOT-RECOMMENDED] Core business server |
| PaaS | Managed application runtime | Potential operational reduction | NCP fit, private network, runtime, logs, pricing, exit unverified | [OPEN] Not selected |

[REVISIT-WHEN] Kubernetes requires several independent services, sustained multi-instance rollout/autoscaling needs, and a staffed platform/on-call function. A managed container or PaaS requires verified NCP product capability and a lower total operational burden than the approved VM boundary.

## Proposed Pilot network topology

```text
Participant/workforce browser
  -> Public DNS/TLS and application load-balancer entry
  -> Private application subnet: one modular-monolith VM
       -> Private managed PostgreSQL
       -> Private object storage through scoped access
       -> Controlled outbound/NAT to approved identity, media, notification, and observability providers
Provider webhook -> public application entry -> signature/replay/deduplication -> reconciliation
```

| Boundary | Allowed responsibility | Prohibited default |
| --- | --- | --- |
| Public entry | TLS termination, request filtering/routing, health-target selection | Database/object-store exposure or authorization decisions |
| Private application | REST/SSE, current authorization, business transactions, provider adapters/workers | Public management port or embedded secret |
| Private database | Authoritative business facts, audit, jobs/Outbox | Public endpoint or direct browser/provider access |
| Private object storage | Encrypted binary object access through scoped application flow | Public bucket or permanent public URL |
| Controlled outbound | Minimum approved provider endpoints and purposes | Unrestricted vendor/data egress |
| Operations access | Named least-privilege workforce, strong authentication, time-bound break-glass | Shared administrator identity or silent production browsing |

Application security groups/firewall rules allow only required flows. Exact NCP ACG, subnet, route, endpoint, certificate, and DNS configuration remain [OPEN] and are not specified as provisioning commands here.

## Secrets, identity, and access

- [RECOMMENDED] Store runtime secrets in the approved secret-management boundary, reference them at runtime, exclude values from source/artifacts/logs, and rotate after schedule/incident.
- [RECOMMENDED] Separate runtime, deployment, audit, database, storage, and human administration privileges using named identities and least privilege.
- [RECOMMENDED] Break-glass access is time-limited, reason-bound, alerted, durably audited, and retrospectively reviewed; routine support cannot impersonate participants or browse unrelated sensitive data.
- [OPEN] Exact deploy identity, workforce MFA, secret rotation period, database administrative path, bastion/zero-trust choice, and emergency approval process require implementation/security review.

## Artifact, health, rollout, and rollback

| Control | Minimum boundary | Open detail |
| --- | --- | --- |
| Artifact identity | Immutable version tied to reviewed source and dependency/config evidence | JAR versus image, registry, signing technology |
| Health check | Separate liveness from dependency/readiness; unhealthy app receives no new traffic | Paths, intervals, grace and failure thresholds |
| Deployment gate | Validate artifact/config, required secret references, database compatibility, and health before promotion | Pipeline product and workflow |
| Rollback | Retain known-good artifact/config and record operator reason/outcome | Automation and retention count |
| Database change | Forward/backward compatibility and explicit recovery plan before rollout | Final migration tooling and schema |
| Logs/metrics/traces | Central redacted telemetry with artifact/environment correlation | Exact NCP/managed product configuration |

[RECOMMENDED] A failed deployment stops or rolls back the application artifact without guessing at a database reversal. A database or authorization dependency failure remains fail closed. No rollout event is business completion evidence.

## Backup, restore, and data protection

- [RECOMMENDED] Managed PostgreSQL and object storage backups/versions inherit encryption, private access, residency, retention, deletion, and audit requirements.
- [RECOMMENDED] Restore into an isolated controlled environment and verify integrity plus non-revival of revoked sessions/grants, expired assignments, sanctions, completed deletion, and already-delivered Outbox work.
- [RECOMMENDED] Keep export/exit ability at the logical business-data and object-metadata level without copying unnecessary telemetry or sensitive provider payloads.
- [OPEN] Actual backup frequency, retention, PITR, restore sequence/time, cross-zone/failover behavior, export portability, object version/deletion behavior, and numeric RPO/RTO require verified service terms and drills.

## Failure and operations defaults

| Failure | Default response |
| --- | --- |
| Application/VM loss | Health failure stops traffic; restart/replace if verified; otherwise pause service and reconcile durable work |
| Database loss | Reject authoritative requests; invoke verified recovery/restore; never accept unpersisted completion |
| Public entry/network loss | Show outage/retry guidance; keep business state unchanged |
| Provider/NAT failure | Timeout/pause/circuit, bounded retry, and manual reconciliation; never bypass authorization |
| Object storage failure | Deny object access/upload completion and keep retryable workflow metadata |
| Secret compromise | Revoke/rotate, stop affected admission/provider flow, inspect access/audit, and reconcile |
| Deployment failure | Stop promotion or restore known artifact/config; record version and decision |

The approved one-app Pilot boundary accepts an application availability risk; it does not accept access widening or incorrect state. Multi-zone application/database behavior is [OPEN] until load, failover, budget, and product evidence are approved.

## B-session evidence and implementation gates

- [OPEN] VAT-inclusive quote, service quotas/limits, backup, restore, PITR, failover, SLA/support escalation, residency and any international transfer, DPA, subprocessors, managed-container/PaaS availability, logging retention, and exact IAM/network behavior.
- [OPEN] Legal/privacy review, business account, provider contracts, certificates/domains, credentials, security review, recovery drill, cost alarms, and live-operation approval remain prerequisites.
- [NOT-RECOMMENDED] This document contains no Terraform, Kubernetes manifest, provisioning command, concrete resource identifier, credential, deployment execution, or live-user authorization.
