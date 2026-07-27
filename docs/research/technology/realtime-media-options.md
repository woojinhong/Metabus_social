---
title: Real-Time Media Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/realtime-media.md
decision_authority: docs/discovery/decisions.md only
---

# Real-Time Media Options

## Scope and decision boundary

Research finding: the providers below offer different transport, SDK, pricing, and operating models. Proposal - unapproved: application state remains authoritative for eligibility, stage, consent, reveal, and mutual progression; an RTC provider is not the product-policy authority.

## Platform and six-person fit

| Provider | Official SDK/platform evidence | Audio and six-person evidence | Device-gap conclusion |
| --- | --- | --- | --- |
| LiveKit Cloud | Web, iOS, Android, React Native, Flutter client docs | Audio supported; six-person pilot load test required | Test target devices and Korea paths |
| Self-hosted LiveKit | Same client SDKs as LiveKit server | Same software capability; own capacity/TURN test | Operations and regional capacity are project responsibility |
| Daily | Web, iOS, Android, React Native docs | Audio-only examples; six-person test required | Flutter evidence gap in official docs reviewed |
| Agora | Web, iOS, Android, React Native, Flutter SDK families | Audio pricing/product exists; six-person load test required | Test target devices and SDK release |
| Twilio Video | Web, iOS, Android docs | Group Rooms support up to 50 participants | React Native/Flutter official evidence gap in this review |
| Zoom Video SDK | Web, iOS, Android, Flutter docs | Custom audio/video sessions; six-person test required | React Native/version evidence must be verified at trial |
| Amazon Chime SDK | JavaScript, React, iOS, Android docs | Standard session supports up to 250 attendees | React Native/Flutter evidence gap in reviewed docs |
| mediasoup | Browser client; server library | No managed capacity claim; build/load test required | Native/RN/Flutter are integration work, not a managed SDK promise |

## Network, authorization, and stage control

| Provider | SFU, TURN, reconnect evidence | Token or join control | Stage-specific permission conclusion |
| --- | --- | --- | --- |
| LiveKit Cloud | Managed WebRTC; reconnect and selective subscription docs | JWT grants documented | App must issue scoped, short-lived grants and own stage state |
| Self-hosted LiveKit | Operator owns deployment, TURN, scaling and upgrades | Same JWT model | Same app policy; more operational failure modes |
| Daily | Managed transport; changelog documents network/reconnect work | Room/meeting-token controls documented | App must enforce stage and membership |
| Agora | Managed SD-RTN; proxy modes documented | Token/channel controls documented | App must enforce stage and membership |
| Twilio Video | Group Rooms include unlimited TURN | Access-token room grant documented | App must enforce stage and membership |
| Zoom Video SDK | Managed SDK transport; exact TURN architecture not established here | Session JWT documented | App must enforce stage and membership |
| Amazon Chime SDK | Managed WebRTC; attendee-drop and reconnect data behavior docs | CreateAttendee issues join token | App must enforce stage and revoke/replace attendee access |
| mediasoup | Application supplies signaling, TURN, reconnect, and operations | Application designs authorization | App owns all stage and permission mechanics |

## Privacy, safety, events, and observability

| Provider | E2EE / recording / local-capture evidence | Events, moderation, and metrics | Evidence limit |
| --- | --- | --- | --- |
| LiveKit Cloud | E2EE/recording scope must be selected per feature; local capture cannot be prevented | Participant events, webhooks, and quality signals documented | Provider features do not replace moderation policy |
| Self-hosted LiveKit | Operator controls recording deployment; local capture still cannot be prevented | Server/client events available | Security patching and monitoring become operator duties |
| Daily | Recording APIs and recording-related events documented; local capture cannot be prevented | Webhooks/events available | E2EE and residency scope need contract verification |
| Agora | Cloud/on-prem recording price documented; local capture cannot be prevented | Analytics products documented | E2EE mode, residency, and moderation scope require provider review |
| Twilio Video | Recording products documented; local capture cannot be prevented | Video Insights documented | E2EE scope and Korea residency need contract review |
| Zoom Video SDK | Cloud-recording add-ons exist; local capture cannot be prevented | SDK events and raw media options documented | Browser E2EE/recording limits need feature-specific review |
| Amazon Chime SDK | Media capture writes to customer S3; local capture cannot be prevented | Attendee lifecycle events documented | E2EE, Korea residency, and moderation controls need AWS review |
| mediasoup | Recording and capture are application infrastructure choices | Observer events exist; moderation is application work | E2EE, capture, and audit design are operator responsibility |

## Control-capability evidence matrix

| Provider | Active-speaker events | Participant metadata | Participant/moderator mute | One-to-one video | Server-side room orchestration |
| --- | --- | --- | --- | --- | --- |
| LiveKit Cloud | Documented participant/active-speaker event surface | Participant metadata/attributes documented | App/server control must be designed; exact moderator mute scope not established here | Two-participant room is an application pattern, not a special product mode | Documented server API and JWT room grants |
| Self-hosted LiveKit | Same SDK event surface | Same metadata/attributes surface | Same application policy, plus operator duties | Same two-participant room pattern | Server deployment and APIs are operator-controlled |
| Daily | Not established in reviewed sources | Not established in reviewed sources | Not established in reviewed sources | Not established as a dedicated feature; room use requires trial | REST room/recording orchestration documented |
| Agora | Not established in reviewed sources | Not established in reviewed sources | Not established in reviewed sources | Not established in reviewed sources | Not established in reviewed sources |
| Twilio Video | Dominant-speaker detection documented | Not established in reviewed sources | Not established in reviewed sources | A two-participant Group Room is shown in official pricing examples | Room control API not established in reviewed sources |
| Zoom Video SDK | Not established in reviewed sources | Not established in reviewed sources | Not established in reviewed sources | Not established in reviewed sources | Session JWT documented; room orchestration API not established here |
| Amazon Chime SDK | Not established in reviewed sources | Not established in reviewed sources | Server DeleteAttendee/attendee lifecycle is documented; exact moderator-mute scope not established | Not established as a dedicated feature | CreateMeeting/CreateAttendee join-token flow documented |
| mediasoup | Not established in reviewed sources | Not established in reviewed sources | Application implementation responsibility | Not established as a dedicated feature | Application implementation responsibility |

Research finding: provider events or room APIs do not create a safe moderation policy. Proposal - unapproved: application authority must decide who can publish, subscribe, mute, advance, reveal, or enter one-to-one media; test every claimed provider capability before selection.
## Current public commercial evidence

| Provider | Public unit/allowance, currency, date verified | Tax, region, and contract limitation | Lock-in and exit |
| --- | --- | --- | --- |
| LiveKit Cloud | Static billing docs state 1-minute time and 0.01-GB transfer increments; current dollar unit rate not stated in reviewed static page | Tax, Korea region, quota, and enterprise terms TBD | Self-host is an operational exit, not live-room migration |
| Self-hosted LiveKit | No provider media rate; infrastructure/TURN/support cost TBD | Cloud, network, tax, and staff cost separate | Export application metadata; operate replacement stack |
| Daily | 10,000 free participant-minutes/month; USD 0.00099/audio-only participant-minute and USD 0.004/video+audio participant-minute | Tax, Korea region, support, and custom terms not stated | Reintegrate another provider; no live migration |
| Agora | USD 0.99/1,000 audio participant-minutes; 10,000-minute free tier shown | Tax, Korea residency, proxy minimums, and contract terms vary | Reintegrate; proprietary APIs remain lock-in |
| Twilio Video | USD 0.004/participant-minute for Group Rooms | Tax, Korea availability, trial credit, and volume terms TBD | Reintegrate; no portable room state |
| Zoom Video SDK | Public unit rate not stated in reviewed official docs | Plan, currency, tax, Korea, and contract terms TBD | Reintegrate; no portable room state |
| Amazon Chime SDK | USD 0.0017/attendee-minute; six-second increment/minimum | AWS prices exclude applicable taxes/duties; region/service charges vary | AWS SDK and regional-service dependency |
| mediasoup | No provider rate; compute, TURN, bandwidth, SRE, and support cost TBD | Tax and region depend on selected infrastructure | Highest operational exit/control trade-off |

## Proposal - unapproved recommendation

- Recommended: LiveKit Cloud for the initial voice-first evaluation, contingent on Korea-device latency, scoped-token, reconnection, permission-revocation, and quota tests.
- Fallback: Daily after direct web/mobile compatibility and commercial testing; Agora is another viable commercial fallback.
- Rejected for initial pilot: mediasoup, because it adds SFU, TURN, signaling, capacity, patching, and incident-response ownership before demand is demonstrated.
- Not selected: Twilio, Zoom, and Chime remain credible alternatives, but the current proposal has no requirement that outweighs their evaluation/integration cost.
- No mid-session failover: on outage, cancel, retry, or reschedule; do not migrate an active room across vendors.
- Approval gate: provider, region, recording, E2EE configuration, retention, and any self-hosting need explicit approval.

## Cross-provider evidence limits

Research finding: disabling provider recording does not prevent participant-controlled screenshots, screen recording, or local audio capture. Evidence gap: no reviewed public source establishes Korea-region latency, Korean data-residency commitment, full compliance suitability, or an acceptable end-to-end encryption configuration for every provider. Validate these contractually and with a controlled pilot.

## Source ledger

- Title: LiveKit client SDKs, token grants, billing, and deployment docs; Publisher: LiveKit; URL: https://docs.livekit.io/home/client/ ; https://docs.livekit.io/home/server/generating-tokens/ ; https://docs.livekit.io/deploy/admin/billing/ ; https://docs.livekit.io/deploy/ ; Publication/update date: not stated; Verification date: 2026-07-27; Supported claim: SDK, JWT-grant, metering, and self-hosting evidence; Limitations: static billing page does not show reviewed dollar unit rate.

- Title: Daily demos, changelog, recording API, and pricing; Publisher: Daily; URL: https://docs.daily.co/guides/additional-resources/demos ; https://docs.daily.co/changelog ; https://docs.daily.co/reference/rest-api/rooms/recordings/start ; https://www.daily.co/pricing/video-sdk/ ; Publication/update date: changelog 2026-04-29, others not stated; Verification date: 2026-07-27; Supported claim: supported SDKs, operational evolution, recording, and USD pricing; Limitations: Flutter and regional commitments were not established.

- Title: Video Calling Pricing and SDK documentation; Publisher: Agora; URL: https://www.agora.io/en/pricing/video-calling/ ; https://docs.agora.io/ ; Publication/update date: not stated; Verification date: 2026-07-27; Supported claim: participant-minute pricing, proxy modes, and SDK-family evidence; Limitations: exact E2EE/residency/stage policy remains provider review.

- Title: Video overview and pricing; Publisher: Twilio; URL: https://www.twilio.com/docs/video/overview ; https://www.twilio.com/en-us/video/pricing ; Publication/update date: pricing current May 2026; Verification date: 2026-07-27; Supported claim: web/iOS/Android, Group Room/TURN, insights, and USD rate; Limitations: RN/Flutter and Korea terms not established.

- Title: Video SDK Flutter and credentials; Publisher: Zoom; URL: https://developers.zoom.us/docs/video-sdk/flutter/ ; https://developers.zoom.us/docs/video-sdk/get-credentials/ ; Publication/update date: not stated; Verification date: 2026-07-27; Supported claim: Flutter wrapper and JWT session authorization; Limitations: public unit pricing and feature-specific privacy scope not established.

- Title: Chime SDK WebRTC media, FAQ, and pricing; Publisher: Amazon Web Services; URL: https://docs.aws.amazon.com/chime-sdk/latest/dg/webrtc-media.html ; https://docs.aws.amazon.com/chime-sdk/latest/dg/chime-sdk-faq.html ; https://aws.amazon.com/chime/chime-sdk/pricing/ ; Publication/update date: not stated; Verification date: 2026-07-27; Supported claim: platform/media limits, join tokens, events, and USD rate; Limitations: region/privacy fit remains review.

- Title: mediasoup documentation; Publisher: versatica; URL: https://mediasoup.org/documentation/v3/mediasoup/overview/ ; Publication/update date: not stated; Verification date: 2026-07-27; Supported claim: mediasoup is a lower-level SFU building block; Limitations: no managed pricing or turnkey mobile/operations guarantee.
