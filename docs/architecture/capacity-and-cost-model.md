---
title: Capacity and Cost Model
document_type: architecture analysis
classification: user decision and proposal
status: Approved Pilot inputs; scale model remains analytical
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Capacity and Cost Model

## Model status

The Pilot vendor/quota inputs are approved by D-010 through D-017. This remains a formula model, not a budget or authorization to spend. Public list prices must be reverified during procurement. Unpublished or incomparable prices remain TBD; the model does not fabricate them.

## Capacity scenarios

Assume one six-person main room and S session minutes.

| Scenario | Concurrent participants | Concurrent rooms | Participant-minutes per S-minute wave | Room-minutes per wave |
| --- | ---: | ---: | ---: | ---: |
| Prototype | 12 | 2 | 12S | 2S |
| Early | 100 | 17 | 100S | 17S |
| Growth | 1,000 | 167 | 1,000S | 167S |
| Large | 10,000 | 1,667 | 10,000S | 1,667S |

## Cost equations

| Cost area | Usage driver | Formula / evidence status |
| --- | --- | --- |
| Managed media | Participant-minutes, recording, region | participant-minutes × verified tier rate; recording N/A initially |
| TURN | Relay GB/minutes | measured relay share × bitrate × minutes × verified egress rate |
| Application compute | Requests, connections, timers | NCP Standard-g2 119 KRW/h example plus storage/network/VAT |
| PostgreSQL | Instance, storage, I/O, backup | NCP Cloud DB public 250 KRW/h per 2vCPU/8GB node plus storage/backup/VAT |
| Redis | Memory, operations, HA | N/A until adoption gate; then selected plan |
| Object storage | Stored GB, requests, egress | NCP 28 KRW/GB-month plus requests/egress/VAT |
| CDN | Egress and requests | only if private delivery design uses it; TBD |
| Identity/phone | Verification attempt | attempts × contracted rate; public Korean pricing often TBD |
| Notifications | AlimTalk, SMS, email | SENS AlimTalk 7.5 KRW/send; SMS 50/month free then 9 KRW; current email allowance; VAT caveats |
| Payment | Transaction/refund/dispute | N/A: excluded from initial MVP |
| Moderation | Automated calls + human minutes | items × rate + cases × handling time × labor rate |
| Observability | Events, logs, spans, seats | retained volume × verified tier; sensitive data must be filtered |
| Support/operations | Sessions, failures, cases | session interventions × handling time × labor rate |

## Verified Public Price Inputs

**Research finding:** these are official public list-price snapshots verified 2026-07-27, not vendor selections or Korea-region quotes.

| Cost input | Public evidence | Limitation |
| --- | --- | --- |
| Daily media | 10,000 participant-minutes/month free; audio-only USD 0.00099, video+audio USD 0.004 per additional participant-minute | any video track triggers video rate; tax, Korea region, support, custom terms not stated |
| Agora audio | USD 0.99 per 1,000 audio participant-minutes; 10,000-minute free tier shown | tax, residency, proxy minimums, contract terms vary |
| Twilio Group Rooms | USD 0.004 per participant-minute | Korea availability, tax, credits, volume terms TBD |
| Amazon Chime SDK | USD 0.0017 per attendee-minute, six-second increment/minimum | AWS excludes applicable taxes/duties; regional charges vary |
| LiveKit Cloud Build | 5,000 participant-min/month, 100 concurrent, 50GB downstream | hard cap/no rollover; account-wide quota and terms must be rechecked |
| Grafana Cloud Free / Pro | Free USD 0; Pro USD 19/month plus published usage units | region/tax and final volume vary |
| PostHog analytics | first 1m events/month free; USD 0.0000500/event for 1m–2m tier | privacy, region, tax, and higher tiers require review |
| NCP hosting/database/storage/SMS/Kakao | dated public inputs are recorded in Korean vendor verification | VAT, network, backup, G3 and contract quotes remain gates |
| Payment | N/A for initial MVP | future PortOne platform pricing excludes VAT and PG fees |

Source detail and dates: [RTC options](../research/technology/realtime-media-options.md), [hosting/observability](../research/technology/hosting-observability-options.md), and [future payment research](../research/technology/payment-deposit-options.md).

## Illustrative 60-Minute Media Wave

This bounded range applies public marginal audio/media participant-minute rates, ignores monthly free allowances, and excludes TURN, tax, support, application hosting, identity, notifications, moderation, and labor. Candidates are not feature-equivalent.

| Concurrent participants | Participant-minutes | Low: Daily/Agora audio USD 0.00099 | Base: Chime USD 0.0017 | High: Twilio or Daily with video USD 0.004 |
| ---: | ---: | ---: | ---: | ---: |
| 12 | 720 | 0.71 | 1.22 | 2.88 |
| 100 | 6,000 | 5.94 | 10.20 | 24.00 |
| 1,000 | 60,000 | 59.40 | 102.00 | 240.00 |
| 10,000 | 600,000 | 594.00 | 1,020.00 | 2,400.00 |

These figures are arithmetic sensitivity inputs, not total cost, budget, procurement recommendation, or proof a provider meets Korea quality/privacy gates.

## Scenario worksheet

For each tier record session duration, waves/day, attendance, relay ratio, average media bitrate, media tier, database/compute plan, media uploads, notification mix, incident rate, moderation time, retention, and support coverage. Produce low/base/high ranges only from verified rates and measured usage.

## Cost allocation

- Per attended participant: total wave cost / attended participants.
- Per completed session: session-attributable cost / completed rooms.
- Per mutual progression: attributable cost / compatible mutual outcomes, never framed as selling interest.
- Safety and accessibility costs are core operations, not optional paid features.

## Key uncertainty

Media/TURN dominate variable technical cost at scale; identity, SMS/Kakao, human moderation, cohort recovery, and support may dominate per-session operations. Provider quotas and Korea-region egress can matter more than headline rates. Tax, currency, VAT, contracted discounts, minimums, and overages require procurement evidence.

## Cost controls

Voice-only default, no recording, bounded media upload, lifecycle deletion, sampled/redacted telemetry, AlimTalk/email with bounded SMS fallback, and operational cancellation thresholds may reduce cost. None may weaken consent, safety, or required evidence.

## Payment exclusion

Session fee, refundable deposit, offline venue deposit, authorization hold, penalty, refunds, chargebacks, receipts, tax, and store billing are excluded from the approved Pilot by D-005. Payment research is future-only; its initial cost is N/A rather than zero.

## Approval gate

Pilot providers, Korea hosting region and bounded quotas are approved in decisions/Accepted ADRs. Spend, provisioning, staffing, contractual rates, VAT-inclusive budget and production scale remain unapproved; procurement must attach dated official pricing and contract limitations.

## Sensitivity analysis

Model at least low/base/high values for attendance, session duration, relay share, retry/reconnect rate, media bitrate, notification-channel mix, moderation incidence, and human handling time. Report which variable changes cost most; do not hide labor behind a technical per-minute figure.

## Capacity validation gates

At each tier, run room-creation bursts, synchronized stage changes, reconnect storms, interest-selection writes, signed-media reveal bursts, notification batches, and moderation-event ingestion. Verify database connection headroom, provider quotas, object access, telemetry sampling, and operator dashboard usability.

## Cost evidence register

Each entered price records publisher/vendor, product/tier, region, currency, tax treatment, unit, minimum, included allowance, overage, publication/update date, verification date, and limitations. Contracted and unpublished prices remain confidential/TBD rather than inferred.

## Scale stop conditions

Do not proceed to a higher tier if media quality, critical-state durability, safety staffing, deletion capability, incident response, or vendor quota is unproven. Capacity is not only compute; cohort operations and safety response must scale with scheduled waves.
