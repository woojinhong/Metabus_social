---
title: ADR-006: Private NCP Object Storage for Participant Media
document_type: architecture decision record
classification: user decision
status: Accepted
last_verified: 2026-07-28
related_documents: ["../discovery/decisions.md","../architecture/README.md"]
decision_authority: D-016
---

# ADR-006: Private NCP Object Storage for Participant Media

## Status

Accepted for the bounded Pilot by D-016. This does not authorize source code, provisioning, procurement, or public operation.

## Context

Required face photos and optional clue media need controlled upload, moderation, delivery, retention, deletion and export.

## Decision

Use private NCP Object Storage in Korea. Application authorization issues short-lived signed access after EXIF removal, signature/MIME, malware, QR/contact and policy checks.

## Considered and rejected alternatives

Database blobs and public/permanent object URLs are rejected.

## Consequences

- **Positive:** Private binary lifecycle, S3-compatible integration and Korean region.
- **Negative:** Deletion is irreversible; S3 compatibility has gaps such as no ListObjectsV2; egress and orphan cleanup matter.

## Security, privacy, cost, and exit

Provider/domain authority remains application-owned; least privilege, data minimization, measured cost and portable exports/adapters are required. A provider or platform outage leads to safe pause/cancellation, never silent access widening.

## Implementation and production gates

Test AWS SDK v2 operations, presign, listing, multipart, checksum, lifecycle,
cache/variant deletion, inventory, access logs and export. D-024 is satisfied;
upload/reveal DTO contracts await separate promotion.

## Evidence and SOT

[External services](../architecture/external-services-selected.md), [disclosure SOT](../spec/progressive-disclosure.md).

