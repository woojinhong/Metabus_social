---
title: "Journey: Live Session and Mutual Progression"
document_type: specification
classification: proposal
status: "Proposal — Unapproved"
last_verified: 2026-07-27
related_documents: ["user-journeys.md","session-experience.md","matching-and-progression.md","progressive-disclosure.md"]
decision_authority: "Only explicit approvals in ../discovery/decisions.md"
---

> **Proposal — Unapproved.** This document defines reviewable candidate behavior. It does not authorize implementation.

# Journey: Live Session and Mutual Progression

| ID / stage | Goal | Anxiety | Required information | Hidden information | Consent point | Primary action | Failure states | Recovery | Accessibility | Web | Mobile | Measurable event | Security boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| UX-JRN-301 / Stage 13 — Rules and consent | Know current boundaries | Hidden recording/contact risk | Visible data, allowed actions, capture limits, exit/report | Private preferences and choices | Live voice and current-stage participation | Acknowledge or leave | Missing consent; changed policy | Explain; decline safely; rebook if appropriate | Plain language, text and audio-compatible | Persistent rules access | Same; interruption safe | rules_viewed/accepted/declined | Consent version and stage recorded; no coerced progression |
| UX-JRN-302 / Stage 14 — Structured group interaction | Participate without performing | Dominance; speech pressure | Turn, pass, timer, prompt, visible clues | Private answers until game rule grants display | Per-answer or clue display when needed | Speak, pass, text, react | Silence; abuse; disconnect; prompt discomfort | Pause/pass; moderator action; reconnect | Thinking time; text option; captions hypothesis; reduced motion | Keyboard/reaction parity | Reachable controls; audio-route notice | turn_started/passed/completed/followup | Server stage gates; no open text/contact exchange |
| UX-JRN-303 / Stage 15 — Temporary smaller groups | Understand candidate branch | Isolation; unsafe subgroup | Hypothetical membership, duration, return | Other subgroup activity | Would require separate group transfer grant | No initial action | Split failure; exclusion; moderator coverage | Remain in main room | Would require equivalent controls | Would require reconnect-safe transfer | N/A; deferred | subgroup_not_available | Proposal — Deferred under OQ-SES-003; no initial FR/NFR/state/capacity dependency |
| UX-JRN-304 / Stage 16 — Controlled free conversation | Continue naturally | Interruption; solicitation | Time, turn guidance, report/leave | Private profile and choices | Short text, if enabled, has separate stage grant | Converse, pass, react | Dominance; contact sharing; abuse; disconnect | Prompt, mute, remove, reconnect, early exit | Text alternative; participation balance | Chat only if server enables | Keyboard-safe chat/audio switching | free_talk_started/participation_balance/report | URL/handle filters; stage-limited chat; audit metadata only |
| UX-JRN-305 / Stage 17 — Initial interest selection | Express private curiosity | Public rejection; pressure | Options, deadline, later reveal rule | Everyone's selections and counts | Interest submission only | Select eligible choices or none | Timeout; duplicate; stale client | Edit until close; idempotent submit; none accepted | Private keyboard/screen-reader form | No shared-screen leakage guidance | App switch/lock privacy | interest_draft/submitted/none | Encrypted durable selection; least-privilege access; no counts |
| UX-JRN-306 / Stage 18 — Limited profile reveal | View a consented resource | Unfair reveal; capture | Exact resource, audience, purpose, expiry, limits | Non-granted fields and other viewers | Subject live grant plus eligible viewer; viewer acknowledgement | Grant/decline and view if authorized | Withdrawal race; stale grant; unavailable photo | Fail closed; no-reveal path; support | Text description alternative; no mandatory photo | Authenticated ephemeral view | Screenshot warning without prevention promise | reveal_granted/declined/view_authorized/revoked | Policy-specific grant; no public URL; server checks at access time |
| UX-JRN-307 / Stage 19 — Final mutual selection | Choose compatible next step | Exposed choice; implied consent | Available progression types and independence | Choices, non-match, rejection reason | Selection is not messaging/webcam/offline consent | Choose one-to-one voice or no progression | Incompatible intent; replay; block race | No-match outcome; idempotent retry; block wins | Clear independent toggles | Private form and safe history behavior | Lock-screen privacy | final_choice_submitted/mutual_progression/none | Atomic compatibility evaluation; no unilateral access |

## Live-session invariants

| ID | Proposal — unapproved |
| --- | --- |
| SR-JRN-301 | Server-authoritative stage transitions issue least-privilege media and interaction permissions |
| SR-JRN-302 | Block, removal, consent withdrawal, or session closure overrides queued reveals and progression |
| SR-JRN-303 | Audit events record actor, policy, stage, result, and identifiers without storing voice content or private rejection reasons |
| UX-JRN-308 | The interface must show who can currently hear, see, message, or contact the participant |
