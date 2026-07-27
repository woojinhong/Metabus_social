---
title: Domain Contexts: Core
document_type: architecture analysis
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# Domain Contexts: Core

**Proposal — unapproved.** Aggregate names are candidates, not schema or code.

| Context | Responsibility | Aggregate candidates | Important invariants | Events | External dependencies | Sensitive data | Consistency | MVP / boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity and Eligibility | Account, adult/eligibility evidence, device sessions | Account, EligibilityEvidence, DeviceSession | Adult evidence current; sanctions checked | AccountVerified, EligibilityExpired | Phone/identity provider | Identity token, age result, phone | Strong for admission | Yes; true policy/security boundary |
| Profile and Progressive Disclosure | Subject-controlled profile/media and reveal grants | Profile, MediaAsset, DisclosureGrant | No reveal without current subject grant and eligible viewer | MediaSubmitted, DisclosureGranted, DisclosureWithdrawn | Object storage, image moderation | Face/non-face media, occupation clues | Strong for grants | Yes; true consent boundary |
| Preferences and Compatibility | Private constraints and compatibility result | PreferenceSet, CompatibilityPolicy | No incompatible assignment; raw preferences minimized | PreferencesChanged, CompatibilityEvaluated | Policy rules | Orientation, age range, lifestyle | Strong at assignment | Yes; sensitive policy boundary |
| Scheduling and Availability | Session catalog, times, availability | SessionSlot, Availability | Fixed time/capacity version; timezone explicit | SlotPublished, AvailabilityChanged | Calendar/time source | Availability pattern | Strong for slot change | Yes; support/domain boundary |
| Booking and Attendance | Reservation, confirmation, cancellation, attendance | Booking, AttendanceCommitment | One account seat; idempotent cancel/check-in | SeatReserved, Reconfirmed, Cancelled, CheckedIn | Notifications | Attendance/no-show | Strong | Yes; lifecycle boundary |
| Cohort Composition | Assemble compatible, viable cohorts | Cohort, CandidatePool | No known incompatibility; policy versioned; no public ranking | CohortProposed, Confirmed, Failed | Compatibility/booking | Compatibility result | Strong at confirmation | Yes; optimization/policy boundary |
| Session Orchestration | Authoritative stage, permissions, timers, recovery | SessionRun, StageCheckpoint, Admission | Legal transitions; idempotency; revoked user cannot act | SessionStarted, StageAdvanced, ParticipantRemoved | Media, content, operator | Presence, actions, stage | Strong for checkpoints | Yes; core domain boundary |
| Interest and Mutual Progression | Private choices and mutual grants | InterestRound, InterestChoice, MutualConnection | Choices private; no public counts; compatible mutual progression only | InterestSubmitted, MutualProgressionCreated | Notifications/media | Romantic/friend interest | Strong | Yes; privacy/invariant boundary |

## Notes

Identity evidence should be an eligibility result, not raw identity material, unless separately approved. Phone verification alone does not prove adulthood. Biometric comparison and manual identity review are deferred.

Temporary small-group orchestration, webcam, payment/deposit, and offline booking are not required by these MVP aggregates. Any later inclusion requires new invariants, threat review, and approval.

