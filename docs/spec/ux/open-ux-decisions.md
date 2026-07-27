---
title: Approved UX Decision Register
document_type: UX prerequisite
classification: user decision
status: approved UX baseline
implementation_ready: false
last_verified: 2026-07-28
related_documents: ["README.md","../../discovery/decisions.md"]
decision_authority: D-024
---

# Approved UX Decision Register

This is the canonical UX decision register. Approval fixes review behavior, not routes, components, state enums, events, APIs, DTOs, schemas or authorization. Each decision was checked for product consistency, privacy/safety, UX/accessibility and adversarial cross-document consistency.

| ID | Status / decision | Downstream boundary |
| --- | --- | --- |
| UX-OQ-001 | Owner approved 2026-07-27: hybrid preparation/dashboard/persistent-live-shell information architecture and navigation | exact routes, page authorization and analytics remain undefined |
| UX-OQ-002 | Owner approved 2026-07-27: distinct preparation screens, P10-associated protected stages, contextual P20 and role-filtered operator work areas | exact routes, API grouping and admin navigation remain undefined |
| UX-OQ-003 | Owner approved 2026-07-28: readiness, private late/underfill/continuation and cancellation behavior | presence and notifications remain contract work |
| UX-OQ-004 | Owner approved 2026-07-28: persistent shell hierarchy, neutral participants and restrained timer | commands/events and layout implementation remain undefined |
| UX-OQ-005 | Owner approved 2026-07-28: reusable game cycle and neutral alternatives | response and moderation contracts remain undefined |
| UX-OQ-006 | Owner approved 2026-07-28: explicit private zero-to-two submission and recovery | persistence and concurrency remain undefined |
| UX-OQ-007 | Owner approved 2026-07-28: live resource-specific consent and five-minute protected view | consent/media contracts remain undefined |
| UX-OQ-008 | Owner approved 2026-07-28: private final choice, capability-only result and common close | progression/result contracts remain undefined |
| UX-OQ-009 | Owner approved 2026-07-28: current-authority recovery without automatic intent | replay/state/error contracts remain undefined |
| UX-OQ-010 | Owner approved 2026-07-28: independent safety actions and role-separated operations | case/admin contracts remain undefined |
| UX-OQ-011 | Owner approved 2026-07-28: portrait mobile-first resilient shell | breakpoints and native evaluation remain separate |
| UX-OQ-012 | Owner approved 2026-07-28: task-level WCAG 2.2 AA review target and alternatives | certification and production evidence not claimed |
| UX-OQ-013 | Owner approved 2026-07-28: calm neutral visual language and Korean critical copy | tokens and component system remain undefined |

## Decisions 001–002 — approved foundation

The approved baseline uses guided linear pre-session preparation, a
lightweight reservation/account dashboard and `P10` as a dedicated persistent
live-session shell. Rules/introduction is the first content stage inside
`P10`; `P11`–`P18` are associated stage contents or protected subflows, not
final routes or backend states. Safety, exit, support and relevant privacy
information remain contextually accessible without exposing private choices.
Browser navigation alone never means submit, withdraw, revoke consent or leave.

Owner approval is recorded in [the decision log](../../discovery/decisions.md).
The approved screen baseline keeps `P01`–`P09` independently reviewable, keeps
`P10` as the approved persistent shell, and treats `P11`–`P18` as shell stage
contents or protected subflows. `P13`–`P17` remain separate review boundaries.
`P19` is common closing; `P20` combines contextual safety entry with a
post-session follow-up destination without becoming one page; `P21` remains an
account/dashboard destination.

`O01`–`O07` remain distinct capabilities in a proposed role-filtered console,
with sanction, appeal and audit responsibilities separated. Inline, overlay,
blocking, contextual sheet/dialog and post-session classifications are review
boundaries only. Owner approval is recorded in
[the decision log](../../discovery/decisions.md). It defines no final route,
page permission, component, state enum, event, API, DTO or data contract.

## Decision 003 — readiness and cancellation

- Ready means `P08` has passed supported-device, microphone/input/output and network checks and the participant explicitly confirms readiness in `P09`.
- Too-early entry shows the eligible window and countdown. Late entry before
  rules/introduction closes rechecks every gate; later entry is neutrally blocked.
- Start requires exactly six eligible admitted participants. Underfill cancels
  with penalty-free rebooking; individual attendance and causes stay private.
- After one departure, pause and ask each remaining person privately. Continue
  only with intact compatibility and five explicit consents; timeout or any
  refusal cancels without identifying a cause.
- Rejected: presence-as-readiness, public missing counts and a five-person start.

## Decision 004 — persistent live controls

- `P10` always presents stage, audience, time, connection, microphone, neutral voice state, primary task, stage secondary action, leave and safety access.
- Participant representation shows only nickname, turn, speaking/muted and
  connection state; no popularity, selection, accuracy or engagement signal.
- Visual time remains available. Announce stage start, five minutes when relevant,
  one minute and end—not every second and never with punitive language.
- Operator pause stops the task and is labelled separately from local reconnect.
  Mobile keeps state and safety reachable; desktop only expands supporting detail.
- Rejected: transient shell, active-speaker ranking and hidden safety controls.

## Decision 005 — three-game interaction

- All games use introduction → think → private input/preparation → confirmation → controlled sharing → turn/discussion → reflection → transition.
- Pass, repeat instruction, one private fixed extra-thinking-time request and
  permitted structured text are equal alternatives without public stigma.
- Empty or timed-out input is “no response,” never an inferred pass or submission.
  Uncertain submission is verified; reconnect never republishes input.
- Neutral automatic rotation is the default; participants may pass and an operator
  may give verbal turn guidance but cannot score or infer personality.
- Rejected: free chat, audio replay, scoring, winners and operator-authored answers.

## Decision 006 — initial interest

- Select zero to two, including an explicit “아무도 선택하지 않기.” Drafts may change until submit; after submit only whole-selection withdrawal to none is allowed before close.
- Unsubmitted timeout closes without a choice and never silently submits a draft.
  Only the user’s confirmed action is shown.
- Stale/removed targets require review before submit. Blocking removes that target
  and ends related access without exposing the blocker.
- Reconnect restores only confirmed current state; background return starts with
  a privacy veil. Peer submission status and counts never appear.
- Rejected: autosubmit, post-submit target swapping and mutuality hints.

## Decision 007 — disclosure and consent

- `P14` asks live, named-viewer consent separately for face photo, exact age and occupation category; every resource defaults to not granted.
- Show resource, named audience, purpose, user-visible expiry and capture limits
  before action. Refusal requires no reason and does not block final choice.
- `P15` shows only granted resources for the remaining reveal stage, at most five
  minutes. The technical fetch lifetime is separate and is not extra viewing time.
- Withdrawal stops new access and closes current viewing where possible but cannot
  undo memory or local capture. Missing/declined/unavailable share one neutral
  viewer message: “이 정보는 이번 공개에서 제공되지 않아요.”
- Rejected: blanket pre-consent, bundled all-or-nothing grant and reward framing.

## Decision 008 — final choice and closing

- `P16` accepts zero or one, with explicit none. Drafts may change until submit; after submit only withdrawal to none is allowed. Unsubmitted timeout is no choice.
- `P17` opens after the common close point and states only the user’s next
  capability. Layout, timing and actions remain structurally common across results.
- Mutual final choice opens only a ten-minute `P18` voice capability. Entry is
  explicit with microphone off; no text, contact exchange or automatic audio.
- Peer absence, reconnect, withdrawal and expiry are neutral capability states.
  Leave, block and report remain available; all paths reach `P19`.
- Rejected: peer-choice explanations, celebration, “rejected/failed” and auto-contact.

## Decision 009 — recovery

- Weak network is inline; short reconnect, verification and operator pause use
  overlays/panels; no-continuation expiry, cancellation and unsupported devices block.
- Refresh, history, background, lock, calls and route changes recheck the latest
  stage and permissions. They never express submission, withdrawal, consent or exit.
- No auto-resubmit, auto-unmute or restoration of expired choice, reveal, speech
  or pair-voice authority. OS interruption requires explicit microphone reactivation.
- Stale stages move to the valid current stage. Provider outage pauses then
  cancels/rebooks if recovery fails; errors remain socially neutral.
- Rejected: optimistic restore, infinite spinner and mid-session provider switch.

## Decision 010 — safety and operator experience

- Persistent safety access separates immediate leave, block, report, emergency
  help and support. None requires another; immediate leave avoids repeated confirmation.
- Initial report asks only subject/context and an optional short description;
  evidence may be added later and is not an upload implementation commitment.
- Reporter identity and case evidence stay restricted. Participants see receipt,
  review and closure-level status, not sanctions, reporter details or private evidence.
- `O01`–`O07` remain role-filtered work areas. Mute, remove, pause and cancel are
  the only live controls; destructive actions confirm target, effect and scope.
- Rejected: forced report, auto-block, recording prompts, bulk private-choice access
  and the same reviewer deciding sanction and appeal.

## Decision 011 — mobile and responsive behavior

- Portrait current iOS Safari and Android Chrome are primary. Stage/audience/time,
  task, voice state, microphone, leave and safety retain that priority at every width.
- Check 320 CSS-pixel equivalent, 200% zoom/reflow, soft keyboard, safe areas,
  browser chrome and rotation; no hover-only or precision gesture interaction.
- Core touch targets use a 44×44 CSS-pixel review baseline. Desktop expands
  supporting detail without changing hierarchy.
- App switching/lock minimizes protected previews. Return rechecks state and
  requires explicit audio reactivation after OS interruption.
- Rejected: desktop-first reordering, background-microphone assumptions and camera.

## Decision 012 — accessibility

- WCAG 2.2 AA is the review target, not a certification claim. Keyboard, visible
  focus, screen reader, logical DOM/focus order, 200% reflow, non-color state and
  reduced motion apply to every critical task.
- Live regions announce meaningful stage/reconnect changes, not every timer second.
  Pass, repeat, thinking time and permitted structured text remain first-class.
- Essential instructions/status are textual. No automatic transcription or caption
  service is inferred; the remaining live-speech hearing limitation is a Pilot risk.
- Errors preserve recovery and safety. Protected reveal names scope and expiry
  without generating facial-trait descriptions. Safety actions must be found in 10s.
- Rejected: accessibility mode, audio-only instructions and automated-only evidence.

## Decision 013 — visual language and Korean copy

- [Frontend visual brief](frontend-visual-brief.md) is the detailed visual authority;
  `DESIGN.md` provides the repository-level summary.
- Tone is calm, private, adult and trustworthy; use a neutral non-gender-coded
  direction and one primary judgment per screen.
- Critical Korean copy follows state → effect → action → support in respectful,
  non-accusatory language. Avoid selected/unselected, rejection, match failure,
  winner, popularity, score, reward, hearts, swipe cards and celebration.
- Protected media has named audience and visible expiry, no download/share/zoom,
  abstract prototype placeholders and honest capture limits.
- Rejected: club/game/meeting styling, reward-like reveal and cause-revealing copy.

## Closure and residual boundaries

All thirteen items are owner approved and recorded in
[the decision log](../../discovery/decisions.md). D-024 authorizes only an isolated
low-fidelity React UX prototype. Production code and all route, permission,
component, API, DTO, database, real-time, vendor and infrastructure contracts
require a later explicit phase. Residual risks are Korean user comprehension,
assistive-technology and real-device evidence, live-speech hearing limitations,
legal wording and operational staffing—not unresolved UX decisions.

