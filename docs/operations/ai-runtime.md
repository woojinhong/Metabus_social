# AI Runtime

## Verified setup

- **Confirmed fact:** Codex CLI is the primary coding-agent surface.
- **Confirmed fact:** The official oh-my-codex npm CLI is installed.
- **Confirmed fact:** The official oh-my-codex Plugin is enabled.
- **Confirmed fact:** User CODEX_HOME is C:\Users\hong\.codex.
- **Confirmed fact:** Project-local Codex configuration and native agents live under .codex/.
- **Confirmed fact:** Project-local OMX runtime state lives under .omx/ and is ignored by Git.
- **Confirmed fact:** AGENTS.md is the primary project guidance for Codex and OMX.
- **Confirmed fact:** CLAUDE.md is the minimal Claude Code adapter.
- **Confirmed fact:** Superpowers is not active in Codex.
- **Confirmed fact (user-provided environment constraint):** Native Windows may emit EPERM fsync durability warnings.

## Recommended OMX flow

1. $deep-interview for product and requirement clarification.
2. $best-practice-research for bounded official-source research when needed.
3. $ralplan for architecture and implementation planning.
4. $prometheus-strict only for high-risk plan stress testing.
5. $ultragoal for approved durable execution.
6. $team only when parallel execution is justified.
7. $code-review and $ultraqa for final verification.

## Security and boundaries

- Secrets and auth.json must never be copied into this repository.
- Local Fork-based OMX development is not used by this project.
- Application implementation remains blocked until explicit user approval.
