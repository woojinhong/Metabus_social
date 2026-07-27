---
title: External Services Register: Platform
document_type: build-versus-buy register
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# External Services Register: Platform

**Proposal — unapproved.** Pricing is usage-based unless stated; exact current rates require dated procurement evidence.

| Service / need | Build option | Buy candidates | Pricing basis / evidence | Advantages / disadvantages | Privacy and integration | Failure / fallback | Lock-in / exit | Recommendation / approval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Real-time media | Operate SFU/TURN/signaling | LiveKit, Daily, Agora | Participant-minute; TURN/egress GB; recording/region/support add-ons; public list plus contract, reverify | Buy reduces media operations; provider dependency | Audio metadata, tokens, regional processing; high integration | Pause/cancel; fallback only future sessions | Adapter, neutral state; self-host operational exit | LiveKit evaluate; vendor approval |
| Push | Device polling/inbox only | FCM, APNs | Platform push commonly no direct per-message fee; integration/operations cost; official terms | Broad reach; OS delivery not guaranteed | Device tokens and message metadata; medium | Account inbox, email/Kakao/SMS | Token abstraction; re-register | Buy; channel approval |
| SMS | Direct carrier integration | Korean messaging provider | Delivered/attempted message, destination, sender type, volume; Korean contract-only/TBD | Reach; cost, spam filtering | Phone/content; medium | Kakao/email/account inbox | Provider adapter/number portability | Buy fallback; approval |
| Kakao AlimTalk | Not credible to build network | Authorized Kakao channel/provider | Template/message attempt or delivery, volume and fallback SMS; provider contract-only/TBD | Korean familiarity; template review/dependency | Phone/template/delivery metadata; medium | SMS/push/email | Export templates/provider switch | Buy after terms approval |
| Email | Operate MTA | Managed transactional email | Email sent/delivered, monthly volume, dedicated IP/domain add-ons; public list or contract | Simple content; deliverability/vendor | Address/content; low-medium | Account inbox/alternate provider | Domain ownership/export | Buy support role; approval |
| Object storage | Operate replicated blob store | Managed S3-compatible storage | GB-month, PUT/GET request, retrieval and egress GB; official regional list | Durable/security features; egress/region lock | Face/media; high; lifecycle/delete APIs | Upload block, alternate bucket/provider | Portable objects/manifests | Buy private storage; approval |
| CDN | Self-host edge/cache | Managed CDN | Egress GB, request count, region, invalidation/security add-ons; official regional list | Performance; cache invalidation/privacy | Access logs and media metadata; medium-high | Direct private origin | Standard URLs, purge/export | Use only if measured; approval |
| Analytics | Build warehouse/pipelines | PostHog, Amplitude, Mixpanel, cloud-native | Event/session/user/GB and seats or warehouse compute/storage; public tier plus contract | Faster analysis; sensitive inference risk | Minimized pseudonymous events; medium-high | Buffer/drop; internal aggregates | Open export/event taxonomy | Buy or self-host later; approval |
| Error monitoring | Build log triage | Sentry/cloud-native | Error/event/span/log volume, retention and seats; public tier plus contract | Fast diagnostics; accidental PII | Stack/device/session metadata; high controls | Redacted local logs | OTel/export and retention controls | Buy after redaction review |
| Maps/venue search | Curate public venue list | Korean/global map APIs | Map/place/geocode request, session or monthly quota; official list/contract | Coverage; location/vendor terms | Future location queries; high | Curated list/manual coordination | Adapter/cache allowed terms | Deferred with offline booking |
| Calendar | Generate ICS | Google/Apple/calendar APIs | ICS has mainly implementation/ops cost; API request/quota or workspace contract where applicable | ICS low integration; APIs add consent | Availability/event data; medium | Downloadable ICS | Open ICS; provider adapters | ICS proposal; API later approval |

## Pricing evidence

Current exact vendor rates and limitations belong in [real-time media research](../research/technology/realtime-media-options.md), [notification research](../research/technology/notification-options.md), and [hosting and observability research](../research/technology/hosting-observability-options.md). Reverify official pricing on the procurement date.

## General operating requirement

Each selected vendor needs quota alarms, credential rotation, signed callback verification, deletion test, outage contact, data-flow record, and annual exit rehearsal proportionate to risk.

