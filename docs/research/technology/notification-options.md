---
title: Notification and Invitation Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/external-services.md
decision_authority: docs/discovery/decisions.md only
---

# Notification and Invitation Options

## Candidate channel comparison

| Channel | Best role | Security boundary | Fallback and limitation |
| --- | --- | --- | --- |
| FCM and APNs | Native reminder and state-change push | Push is not admission authority | Best-effort delivery |
| Email | Confirmation, calendar, support | No reusable room credential in body | Deliverability and delayed reading |
| Kakao AlimTalk | Korea-oriented transactional reminder | Template/provider approval and data terms | Commercial verification |
| SMS | High-urgency fallback | Minimize content and data | Cost and delivery issues |
| Deep or universal links | Return to authenticated state | Link resolves then account/stage rechecked | Platform configuration needed |

## Proposal - unapproved lifecycle

1. Reservation acknowledgement. 2. Cohort confirmation. 3. Attendance reconfirmation. 4. Reminder. 5. Authenticated device check. 6. Waiting-room admission. 7. Cancellation/reconnect notice. 8. Post-session support follow-up.

Proposal - unapproved: no reusable room URL authorizes entry. Admission requires an authenticated account, one-time or short-lived server credential, valid reservation, and current stage.

## Recommendation and approval gate

- Recommended: email/calendar for durable confirmation and FCM/APNs when a native client exists; evaluate Kakao AlimTalk or SMS as Korea-specific fallback.
- Fallback: browser/device notifications where available, with authenticated in-product status.
- Rejected: static meeting links and invitation-only authorization.
- Approval gate: notification vendor, channel consent, templates, retention, and regional provider selection require approval.

## Source ledger

- Title: Firebase Cloud Messaging documentation
  - Publisher: Google Firebase
  - URL: https://firebase.google.com/docs/cloud-messaging
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: FCM supports cross-platform push research.
  - Limitations: Delivery is not guaranteed and cannot authorize a session.

- Title: Apple Push Notification service
  - Publisher: Apple
  - URL: https://developer.apple.com/documentation/usernotifications/setting-up-a-remote-notification-server
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Apple documents remote-notification mechanics.
  - Limitations: It requires an Apple-platform delivery path.

- Title: Kakao AlimTalk
  - Publisher: Kakao
  - URL: https://business.kakao.com/info/alimtalk/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Kakao documents a Korean business-message category.
  - Limitations: Terms, templates, and provider access need commercial verification.


## Channel decision criteria

| Criterion | Why it matters | Evidence required |
| --- | --- | --- |
| Timeliness | Late reminders cause empty cohorts | Delivery and open/click proxy review |
| Privacy | Previews can expose sensitive dating context | Minimal wording and consent design |
| Admission safety | Link reuse can bypass intent | Authenticated recheck and short TTL test |
| Accessibility | Participants use different devices/channels | Equivalent in-product status and support route |
| Failure recovery | Push may be delayed or absent | Email/SMS/Kakao fallback policy |
| Cost control | Bursts happen near session start | Volume model by reminder type |

## Exit and scaling notes

- Keep notification intent and delivery audit in the application domain; providers are transport adapters.
- Do not infer attendance from delivery receipts.
- Regional sender registration, Kakao template approval, and SMS identity requirements are commercial/operations dependencies.
- Deep links should restore an authenticated session and show current state, never embed authority that survives cancellation or stage changes.
- Evidence gap: no channel conversion or preference evidence has been collected for intended Korean cohorts.
