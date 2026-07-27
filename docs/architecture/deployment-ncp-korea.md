---
title: NCP Korea Deployment Boundary
document_type: architecture SOT
classification: user decision
status: Approved platform boundary
last_verified: 2026-07-27
related_documents: ["../adr/ADR-008-ncp-korea-hosting.md","external-services-selected.md"]
decision_authority: D-010 and D-011
---

# NCP Korea Deployment Boundary

## Pilot topology

[Internet/PWA]
    |
[Global DNS + TLS]
    |
[Public ALB, Korea]
    |
[Private app subnet: one Standard-g2 Spring instance]
    |            [Private Cloud DB] [NAT-controlled outbound to LiveKit, NICE, Grafana]
    |
[Private NCP Object Storage access and backups]

NCP Cloud Insight, Cloud Log Analytics, Cloud Activity Tracer, Secret Manager and Sub Accounts surround the topology. No Redis, Kubernetes, public database or public participant-media bucket is used.

## Network and access

- One Korea VPC with separate public ALB and private application/database subnets; ACGs allow only required flows.
- ALB terminates public TLS using approved certificate and forwards only to application health targets.
- Database accepts only application and controlled administrative paths; no public endpoint or developer workstation allowlist by default.
- Application outbound uses NAT/egress rules restricted by need; vendor webhooks enter the public application boundary and require signature, timestamp, nonce and rate validation.
- NCP Secret Manager stores runtime secrets; Sub Accounts separate deploy, runtime, audit and human administration. Break-glass is time-limited and audited.

## Data and backup

Cloud DB performs daily backup/PITR under the selected maximum 30-day service window; the project retention target is 35 days only where supported by rolling application/object exports. Scheduled logical PostgreSQL exports are encrypted to a private backup bucket and restoration to non-NCP PostgreSQL is tested. Participant media uses separate private prefixes/buckets and lifecycle jobs. Backup/legal-hold access is not routine application access.

## Environment separation

Development uses synthetic data and separate credentials. Staging uses separate account/project boundaries where available and no real identity or face media by default. Production uses separate VPC/resources/secrets and two app instances across zones with HA Cloud DB after load, failover and budget review. Data is never copied from production into lower environments without approved de-identification.

## Availability and recovery

The single Pilot app instance is an accepted bounded availability risk: failure pauses/cancels and rebooks; it never widens access. Production target adds multi-zone instances behind ALB. Database RPO/RTO is set only after restore/failover drills. RTC outage cancels/rebooks; no mid-session provider migration. Credential compromise revokes secrets/tokens, blocks admission and follows incident response.

## Cost and quota controls

Use explicit monthly budgets and alarms for Server, ALB, Cloud DB, backup, Object Storage egress/API, NAT, SENS, CLA, Secret Manager, LiveKit and Grafana. NCP public prices exclude VAT. Resource provisioning requires owner-approved VAT-inclusive quote and service quota review.

## Deployment pipeline boundary

This document authorizes no pipeline or resource. A future pipeline must use short-lived deploy identity, reviewed artifacts, environment approvals, secret references, rollback and audit. Infrastructure code, release workflow, DNS, certificate and credentials remain pending a separate implementation task after D-024.

