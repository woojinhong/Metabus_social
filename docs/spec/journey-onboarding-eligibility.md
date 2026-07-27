---
title: "Journey: Onboarding and Eligibility"
document_type: specification
classification: proposal
status: "Proposal — Unapproved"
last_verified: 2026-07-27
related_documents: ["user-journeys.md","progressive-disclosure.md","trust-safety-moderation.md"]
decision_authority: "Only explicit approvals in ../discovery/decisions.md"
---

> **Proposal — Unapproved.** This document defines reviewable candidate behavior. It does not authorize implementation.

# Journey: Onboarding and Eligibility

## Matrix key

**Proposal:** Every row covers all required UX-analysis fields. “Hidden” means unavailable to peers, not necessarily unavailable to authorized operations. “Consent” is purpose-specific and withdrawable where practical.

| ID / stage | Goal | Anxiety | Required information | Hidden information | Consent point | Primary action | Failure states | Recovery | Accessibility | Web | Mobile | Measurable event | Security boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UX-JRN-101 / Stage 1 — Account creation | Establish accountable access | Spam; data misuse | Phone/account terms; adult-only notice | Phone and fraud signals | Terms, privacy, communications separated | Verify phone and create account | Duplicate; rate limit; code failure | Retry limit; accessible support | Voice call/text alternatives subject to evidence; readable errors | No popup dependency | OS autofill; app-link-safe return | account_started/completed/failed | Rate limits; session binding; no peer visibility |
| UX-JRN-102 / Stage 2 — Adult and identity verification | Show eligibility | Exclusion; biometric fear | What check proves and retains | Provider response and eligibility evidence | Explicit check-specific consent | Complete proposed carrier adult attestation if approved | Unsupported user; mismatch; vendor outage | Safe retry; alternate session later; no unapproved manual review | Plain-language instructions; non-camera path | Secure redirect and return | OS provider handoff and return | eligibility_started/passed/failed | Minimum attestation; no raw ID, biometric, CI/DI storage proposed |
| UX-JRN-103 / Stage 3 — Profile and eligibility setup | Supply relevant facts | Oversharing; judgment | Broad area, age, intent, required constraints | Exact answers unless later granted | Field-level use and visibility explanation | Save private eligibility profile | Missing; inconsistent; unsupported | Draft, correction, deletion/support | Labels, examples, keyboard and screen-reader grouping | Responsive form; save state | Native controls; interruption recovery | profile_section_completed/error | Sensitive fields segmented; least privilege |
| UX-JRN-104 / Stage 4 — Dating-preference compatibility | Define acceptable cohort | Opaque exclusion | Accepted ages, orientation compatibility, intent, constraints | Exact preferences and exclusion reasons | Consent to private matching purpose | Confirm non-relaxable constraints | Empty supply; conflict; changed preference | Waitlist; another time; edit without silent relaxation | Neutral language; no forced binary assumption | Explain scarcity before commit | Compact controls and safe resume | compatibility_saved/no_supply | Never reveal one person's preferences to another |
| UX-JRN-105 / Stage 5 — Photo submission | Prepare possible later reveal | Capture; appearance pressure | Required status, optionality, reveal audience | Photo until live grant; metadata | Collection/storage separate from later disclosure | Upload, review, or choose no optional media | Unsafe image; mismatch; upload failure | Replace/delete; text-only path; appeal moderation | Non-photo alternative; alt description guidance | Preview without public URL | Camera/library permission only when invoked | photo_uploaded/rejected/deleted | Private object access; EXIF strip; moderation; no reveal grant yet |
| UX-JRN-106 / Stage 6 — Game-content pre-submission | Provide a usable clue | Embarrassment; accidental identity leak | Allowed formats and audience | Submission pending game-stage grant | Submission use, moderation, display purpose | Submit clue or text alternative | Contact/QR/EXIF; unsafe or inaccessible media | Edit, replace, skip, text alternative | Text description; no media requirement | File constraints before upload | Permission-minimal picker | clue_submitted/flagged/replaced | Private storage; QR/contact scan; scoped reviewer access |

## Verification boundary

- **Safety requirement SR-JRN-101:** phone verification must not be described as proof of identity, age, safety, or good intent.
- **Safety requirement SR-JRN-102:** biometric, document, liveness, face-comparison, CI/DI retention, and manual-review flows remain deferred pending explicit approval and qualified review.
- **Proposal:** unsupported verification outcomes must not be silently converted into human collection of identity documents.
- **Open question:** evidence is needed for Korean residents, foreign residents, MVNO users, accessibility, false rejection, deletion, and provider outage.
