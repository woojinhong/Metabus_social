---
title: Korean MVP Vendor Verification
document_type: technology research
classification: research finding
status: Verified snapshot
last_verified: 2026-07-27
related_documents: ["../../architecture/external-services-selected.md","../../adr/README.md"]
decision_authority: none; decisions remain in discovery/decisions.md
---

# Korean MVP Vendor Verification

## Method and limitations

Official vendor, government and platform sources were checked on 2026-07-27. Prices exclude VAT unless stated. Public pages do not replace quotes, contracts, DPAs, support terms or legal advice. Volatile facts must be rechecked before account creation or live participants.

## NCP infrastructure

| Finding | Official source | Supported claim | Limitation |
| --- | --- | --- | --- |
| NCP VPC | [VPC prerequisites](https://guide.ncloud-docs.com/docs/en/vpc-spec-vpc) | Korea VPC support, limits, free base VPC/subnet/NACL | network dependencies are paid |
| Server | [Server prerequisites](https://guide.ncloud-docs.com/docs/en/server-spec-vpc), [pricing](https://www.ncloud.com/charge/price/ko) | Standard-g2 2 vCPU/8 GB: 119 KRW/h with 50 GB; Micro is trial-only, no performance/availability assurance | exact chosen image/storage quote required |
| Load Balancer | [LB prerequisites](https://guide.ncloud-docs.com/docs/en/networking-loadbalancer-spec), [pricing](https://www.ncloud.com/charge/price/ko) | Korea VPC; ALB Small starts 26 KRW/h, public LB IP and traffic extra | topology cost depends on traffic/rules |
| Cloud DB for PostgreSQL | [prerequisites](https://guide.ncloud-docs.com/docs/en/clouddbforpostgresql-spec), [backup](https://guide.ncloud-docs.com/docs/en/clouddbforpostgresql-backup), [releases](https://guide.ncloud-docs.com/docs/en/clouddbforpostgresql-releasenote) | Korea VPC; daily backup/PITR/HA options; public Standard 2 vCPU/8 GB 250 KRW/h per node; backup up to 30 days | G3 quote, extensions and restore drill required |
| Object Storage | [spec](https://guide.ncloud-docs.com/release-20260423/docs/en/objectstorage-spec), [API](https://api.ncloud-docs.com/docs/en/storage-objectstorage), [pricing](https://www.ncloud.com/charge/price/ko) | Korea endpoint; S3-compatible API; 28 KRW/GB-month; request/egress charged | ListObjectsV2 unsupported; deletion irreversible |
| Secret Manager | [spec](https://guide.ncloud-docs.com/docs/en/secretmanager-spec), [deletion](https://guide.ncloud-docs.com/docs/en/secretmanager-info) | Korea VPC; KMS-backed; 7-day normal deletion | numeric public rates unavailable; rotation test required |
| Sub Account | [guide](https://guide.ncloud-docs.com/docs/en/subaccount-use) | free least-privilege identities | Object Storage source-control restriction needs bucket controls |

## RTC

| Finding | Official source | Supported claim | Limitation |
| --- | --- | --- | --- |
| LiveKit Build | [pricing](https://livekit.com/pricing), [quotas](https://docs.livekit.io/deploy/admin/quotas-and-limits/) | 5,000 participant-min/month, 100 concurrent, 50 GB downstream, no card; hard cap and no rollover | shared across free projects; recheck before Pilot |
| LiveKit regions | [regions](https://docs.livekit.io/deploy/admin/regions/), [pinning](https://docs.livekit.io/deploy/admin/regions/region-pinning/) | APAC pinned geography is Japan/Singapore; pinning requires Scale | no Seoul/Korea residency claim |
| LiveKit security | [tokens](https://docs.livekit.io/home/server/generating-tokens), [participants](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants/) | room/identity/permission/expiry grants and participant controls | local recording/screenshot cannot be prevented |
| Daily fallback | [pricing](https://www.daily.co/pricing/video-sdk/), [room API](https://docs.daily.co/reference/rest-api/rooms/create-room) | 10,000 free participant-minutes; Seoul ap-northeast-2 SFU option | pay-as-you-go does not hard stop automatically |
| Agora fallback | [pricing](https://www.agora.io/en/pricing/) | 10,000 free minutes; published voice rates | no retrieved official Seoul region or free concurrency proof |

## Identity and privacy

| Finding | Official source | Supported claim | Limitation |
| --- | --- | --- | --- |
| NICE mobile verification | [NICE product](https://www.niceid.co.kr/prod_mobile.nc) | PASS/SMS flows; selectable DOB, phone, CI and DI result fields | contract/API must confirm exact fields and deletion |
| PASS coverage | [PASS FAQ](https://www.passauth.co.kr/question) | some foreigners can use; corporate-name/some MVNO restrictions exist | no universal foreign/MVNO guarantee |
| PIPA minimality | [PIPA Article 16](https://law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1020398625) | minimum necessary collection principle | lawful basis/application needs counsel |
| PIPA deletion | [PIPA Article 21](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1006183947) | destroy without delay after period/purpose unless other law requires retention | no specific verification retention period established |

## Notifications

| Finding | Official source | Supported claim | Limitation |
| --- | --- | --- | --- |
| SENS SMS/AlimTalk | [overview](https://guide.ncloud-docs.com/docs/en/sens-overview), [SMS](https://guide.ncloud-docs.com/docs/en/sens-smsmessage), [AlimTalk](https://guide.ncloud-docs.com/docs/en/sens-atmessage), [pricing](https://www.ncloud.com/charge/price/ko) | Korea service; SMS 50/month free then 9 KRW; AlimTalk 7.5 KRW/send; VAT excluded; quotas/history documented | business account, sender and template approval required; history docs conflict 30 vs 90 days |
| AlimTalk templates | [template guide](https://guide.ncloud-docs.com/docs/en/sens-attemplate) | Kakao review averages 2-3 business days | approval not guaranteed |
| Email | [Cloud Outbound Mailer](https://guide.ncloud-docs.com/docs/en/email-email-1-1), [integration guide](https://guide.ncloud-docs.com/docs/sens-integrationguide) | current COM; first 1,000 emails/month free; SENS integration scheduled 2026-09-17 | final SENS Mail API/rates/IAM require recheck |

## Observability

| Finding | Official source | Supported claim | Limitation |
| --- | --- | --- | --- |
| Cloud Insight | [spec](https://guide.ncloud-docs.com/docs/cloudinsight-spec) | Korea; currently free; 1-minute metrics with retention tiers and events up to two years | temporary pricing may change |
| Cloud Log Analytics | [spec](https://guide.ncloud-docs.com/docs/en/cla-spec), [overview](https://guide.ncloud-docs.com/docs/en/cla-overview) | Korea; Standard 20 GB/day, 100 GB storage, max 30-day retention; 1 GB average storage free | at capacity old data may be deleted; paid rates need quote |
| Cloud Activity Tracer | [overview](https://guide.ncloud-docs.com/release-20260423/docs/en/cat-overview), [tracers](https://guide.ncloud-docs.com/docs/en/cat-tracers) | free cloud API/console audit; 90-day console history and Object Storage export | export storage charged |
| Grafana Cloud Free | [pricing](https://grafana.com/pricing/), [limits](https://grafana.com/docs/grafana-cloud/cost-management-and-billing/manage-invoices/understand-your-invoice/usage-limits/) | OTel-native managed metrics/traces/frontend; 14-day retention, 10k metric series, 50 GB trace ingest; free hard limits | region, DPA and subprocessor review required |

## Platform evidence

- [Spring Boot 4.1 requirements](https://docs.spring.io/spring-boot/system-requirements.html): Java 17-26 compatible; verified 2026-07-27.
- [Oracle Java roadmap](https://www.oracle.com/java/technologies/java-se-support-roadmap.html): Java 25 is an LTS release. Use a supported OpenJDK distribution and verify license/support separately.
- [WebKit WebRTC](https://webkit.org/blog/7726/announcing-webrtc-and-media-capture/): Safari media capture requires HTTPS and permission.
- [Chrome page lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api): mobile pages may freeze/discard; background execution is not guaranteed.
- [PWA OS integration](https://web.dev/learn/pwa/os-integration): iOS installed PWA cannot capture Safari URLs like native app links.

## Required procurement and legal gates

Business accounts, VAT-inclusive quotes, exact quotas, DPAs/subprocessors/data locations, NICE fields/coverage/deletion, SENS Mail after 2026-09-17, Kakao templates, Cloud DB version/extensions/restore, Object Storage lifecycle/export, Grafana cross-border processing and LiveKit Korea device tests remain gates. No contract, account, credential or paid service was created.

