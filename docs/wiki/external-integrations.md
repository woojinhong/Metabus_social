---
title: External Integrations Summary
document_type: wiki
classification: confirmed fact
status: Non-authoritative summary
last_verified: 2026-07-27
related_documents: ["../architecture/external-services-selected.md","../research/technology/korean-mvp-vendor-verification.md"]
decision_authority: none
---

# External Integrations Summary

| Need | Selected boundary | Gate |
| --- | --- | --- |
| Hosting/DB/media | NCP Korea VPC, Cloud DB PostgreSQL, private Object Storage | account, quote, restore, DPA |
| RTC | LiveKit Cloud Build | Japan/Singapore path, Korea device and cross-border review |
| Adult eligibility | NICE PASS/SMS minimal outcome | contract, fields, MVNO/foreign coverage, legal review |
| Notifications | NCP SENS SMS/AlimTalk and NCP email transition rule | business account, sender/template, 2026-09-17 check |
| Observability | OTel + Cloud Insight/CLA/CAT + Grafana Cloud | redaction, region/DPA, quotas |

Provider adapters use bounded retry, idempotency, circuit breaking, quota alarms, verified webhooks, data minimization and export/delete plans. Details: [selected services](../architecture/external-services-selected.md).

