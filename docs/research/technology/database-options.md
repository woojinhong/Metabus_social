---
title: Database and Session-State Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/data-architecture.md
decision_authority: docs/discovery/decisions.md only
---

# Database and Session-State Options

## Candidate comparison

| Concern | PostgreSQL | Redis | Object storage | NoSQL or vector database | Proposal assessment |
| --- | --- | --- | --- | --- | --- |
| Durable product truth | Strong transactions and constraints | Not primary truth | Media metadata remains relational | Adds another consistency surface | PostgreSQL recommended |
| Ephemeral presence and timers | Possible but poor at high churn | TTL and ephemeral primitives | Not applicable | Not required | Redis optional |
| Submitted media | Metadata only | Not suitable | Encryption and lifecycle controls | Not required | Object storage recommended |
| Semantic retrieval | Not required | Not required | Not required | No user need stated | Exclude initially |

## Proposal - unapproved recommendation

- Recommended: PostgreSQL for reservation, attendance, durable stage, disclosure consent, interests, mutual progression, reports, moderation outcomes, and audit references.
- Optional: Redis only when multi-instance presence, timers, reconnect leases, or database contention justify it; all Redis data expires and is reconstructable.
- Recommended: object storage for submitted media with EXIF removal, scoped delivery, deletion lifecycle, and relational metadata.
- Rejected now: separate NoSQL or vector store because no proposed user need requires either.
- Approval gate: database, cache, object-storage provider, and retention design require explicit approval.

## Consistency, privacy, cost, and scale

Proposal - unapproved: media-provider metadata and client state never authorize consent, stage, reveal, or interest selection. Use idempotency keys and audit events for irreversible progression. Do not persist audio/presence without a product or compliance reason. Evidence gap: managed database, cache, storage, IOPS, egress, and retention pricing depend on cloud and region.

## Source ledger

- Title: Versioning policy
  - Publisher: PostgreSQL Global Development Group
  - URL: https://www.postgresql.org/support/versioning/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Official policy lists supported PostgreSQL lines including 18.4 context.
  - Limitations: Managed-service availability varies.

- Title: Redis release notes
  - Publisher: Redis
  - URL: https://redis.io/docs/latest/operate/oss_and_stack/stack-with-enterprise/release-notes/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Official documentation provides Redis OSS 8.0.6 context.
  - Limitations: Licensing and managed offerings need separate review.

- Title: S3 security best practices
  - Publisher: Amazon Web Services
  - URL: https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Object stores support least-privilege and lifecycle security patterns.
  - Limitations: AWS-specific guidance is not a provider selection.


## State-placement criteria

| State class | Proposed location | Why | Recovery rule |
| --- | --- | --- | --- |
| Reservation and attendance | Relational database | Durable, auditable, transactional | Re-read after reconnect |
| Consent, interest, reveal authorization | Relational database plus audit record | Requires ordering and proof | Fail closed on uncertainty |
| Presence and countdown | Optional cache with TTL | High-churn, reconstructable | Rebuild from durable stage and room events |
| Media transport events | Provider plus derived audit | Provider owns transport | Do not make provider metadata authority |
| Client view state | Device-local only | Presentation convenience | Re-fetch authorized state |
| Analytics | Derived event store | Measurement only | Never authorize product action |

## Data safety notes

- Encryption-at-rest and in-transit are control objectives, not evidence that a chosen vendor meets every policy requirement.
- Object uploads should remove EXIF before broad delivery; visual clues can still reveal a place or employer.
- Deletion must cover original object, variants, cache/CDN lifecycle, relational references, and any lawful audit-retention exception.
- Search is not a current product requirement; introduce it only after a specific retrieval need and privacy review.


## Evidence limits

- Database documentation does not determine deletion periods, audit immutability, or lawful retention; those remain product, privacy, and legal review items.
- A storage proof must verify revoked access, cache expiry, metadata stripping, and reconstruction after cache loss.
