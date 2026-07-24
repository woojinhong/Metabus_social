# Project Guidance

## Current phase

- This project is in product discovery and technical planning.
- No application implementation is approved yet.
- Architecture, technology stack, database, APIs, and product scope are undecided.

## Source of truth

1. Read [docs/INDEX.md](docs/INDEX.md).
2. Read approved decisions.
3. Read relevant research and proposals.
4. Treat unapproved proposals as non-authoritative.
5. Inspect code only after application code exists.

## Documentation promotion

- Unresolved product exploration belongs in [docs/discovery/product-concept.md](docs/discovery/product-concept.md).
- Approved decisions belong in [docs/discovery/decisions.md](docs/discovery/decisions.md).
- Approved content is promoted to the appropriate durable document.
- Proposals must never be treated as decisions.

## Classification rules

Classify every statement as one of:

- confirmed fact
- user decision
- assumption
- research finding
- proposal
- open question

Never convert a proposal or model inference into an approved decision.

## Approval gates

Explicit user approval is required before:

- product scope approval
- MVP approval
- architecture selection
- technology-stack selection
- database selection
- public API or external data-source selection
- authentication design
- payment design
- creation of application source code
- commit, push, merge, reset, clean, delete, or history rewrite

## OMX workflow

OMX is the primary Codex workflow. Recommended flow:

- $deep-interview for product and requirement clarification
- $best-practice-research for bounded official-source research
- $ralplan for architecture and implementation planning
- $prometheus-strict only for high-risk plan stress testing
- $ultragoal for approved durable execution
- $team only when parallel execution is justified
- $code-review and $ultraqa for final verification

Do not recreate generic OMX skills or agents locally.
