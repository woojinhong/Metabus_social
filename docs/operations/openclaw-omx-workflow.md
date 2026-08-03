---
title: OpenClaw and OMX Workflow
document_type: operations
classification: proposal
status: Phase 1 proposed; Phase 2 through 4 not configured
last_verified: 2026-08-03
related_documents:
  - agent-automation-overview.md
  - ai-runtime.md
  - github-workflow.md
  - agent-lessons.md
decision_authority: explicit repository-owner direction for Issue #78; external integration remains separately gated
---

# OpenClaw and OMX Workflow

## 1. Verified boundary

Current repository evidence confirms Codex CLI, OMX plugin mode and project
native agent definitions. Native typed role routing is required; if it is not
available, stop rather than fabricate a role or use an adapted leader proof.
Do not run `omx ralplan preflight --json` for this workflow.

OpenClaw is not installed or connected here. Its official documentation
supports a future Slack channel integration and deterministic agent routing,
but does not provide a built-in Propscans `Slack -> OMX -> Codex -> Draft PR`
adapter. That bridge is Phase 2 work, not a completed capability.

External evidence retrieved 2026-08-03:

- [OpenClaw Slack integration](https://docs.openclaw.ai/providers/slack)
- [OpenClaw channel routing](https://docs.openclaw.ai/provider-routing)
- [Codex CLI commands](https://learn.chatgpt.com/docs/developer-commands.md?surface=cli)
- [Codex and Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees.md)
- [GitHub pull request reference](https://docs.github.com/en/pull-requests/reference/pull-requests)
- [GitHub status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [OMX v0.20.4 native routing guard](https://github.com/Yeachan-Heo/oh-my-codex/blob/a62d5bd77bef6d2bc7df467dcae68082b8616239/skills/ralph/SKILL.md#L35-L38)

## 2. Native role map

| Workflow label | Native type | Responsibility |
| --- | --- | --- |
| Planner | `planner` | Scope, allowed files, tests, risks and worktree plan |
| Worker | `executor` | Scoped implementation and local tests in the worktree |
| Architect | `architect` | Structure, authority, regression and simplification review |
| Critic gate | `code-reviewer` | Diff, requirements, security and test review with severity |
| Optional plan critic | `critic` | Pre-execution plan challenge only |

The general-purpose `worker` type is reserved for active OMX team/swarm
runtimes and is not the Phase 1 executor.

## 3. Phase 1 local sequence

1. Confirm `master`, clean worktree and fetched `origin/master`.
2. Run native Planner read-only on the direct request or supplied Issue.
3. Search open and closed work; reuse a matching Issue or create exactly one.
4. Record scope, allowed files, tests and risks under that exact Issue.
5. Create one Issue branch and one non-colliding Git worktree.
6. Run native Executor only in that worktree.
7. Run scoped tests, then the required broader local repository checks.
8. Run native Architect; fix findings, retest and require `CLEAR`.
9. Run native Code Reviewer as final Critic gate; fix findings and retest.
10. With local tests passing and no MEDIUM-or-higher findings, commit scoped
    files, push the branch and open one Draft PR.
11. Observe configured and triggered Actions. On failure, keep the same PR
    Draft, return to Executor, rerun local gates, push fixes and observe again.
12. After required Actions pass, report Issue, branch, commit, tests, reviews,
    Draft PR and remaining risks. Stop for human Ready/merge/Issue closure.

## 4. Phase 1 request template

```text
Repository: <exact absolute path and GitHub repository>
Input: <GitHub Issue number or exact task description>
Publication authority: commit, push and one Draft PR only

Analyze this task with native typed roles and complete it in one task-specific
Git worktree. Do not edit master directly.

Planner:
- define scope, allowed files, prohibited files, acceptance criteria, tests,
  risks and the branch/worktree plan;
- preserve repository Decisions, Specs, ADRs and explicit gates.

Executor (workflow label: Worker):
- implement only the approved scope in the task worktree;
- run targeted tests and all required repository checks;
- preserve sanitized failure evidence before retry or handoff.

Architect:
- review structure, authority boundaries, regressions, unnecessary complexity
  and whether the change remains single-project and incremental;
- report CRITICAL/HIGH/MEDIUM/LOW findings and a final CLEAR/WATCH/BLOCK status.

Code Reviewer (final Critic gate):
- review the complete diff, requirements, tests, security and publication scope;
- report CRITICAL/HIGH/MEDIUM/LOW findings with file evidence.

Controls:
- treat a direct request as read-only until duplicate search reuses or creates
  exactly one Issue under the repository policy;
- one task equals one branch and one worktree;
- maximum concurrent Executor/worktree count is 1;
- commit, push and Draft PR are allowed only after every required local test
  passes, Architect is CLEAR and no CRITICAL/HIGH/MEDIUM finding remains;
- after PR creation, observe configured Actions; a failure keeps the PR Draft
  and requires Executor fixes, local revalidation, review and another push;
- never merge, mark Ready, close an Issue, modify protected history, provision,
  deploy or use credentials outside the exact task grant.

Deliver after required Actions pass or a blocker is proven: scope, changed
files, tests, Actions, Architect/Reviewer verdicts, commit, Draft PR link,
remaining risks and final git status.
```

## 5. Phase 2 through 4 handoff

Phase 2 may add a configured OpenClaw Slack plugin, Propscans-only route,
request normalization, thread replies and a verified owner's thread-bound
start/execution-approval relay after a separate credential/security review.
That relay is runtime input, not a requirements decision, repository SOT,
Ready, merge or Issue-close grant. Sender allowlists, approver identity, thread
binding, audit evidence and redaction require that later Issue. Tokens, webhook
URLs and Slack message content must never enter the repository or logs. Phase 3
may add bounded scheduling only after Phase 2 recovery is proven. Phase 4 may
raise concurrency to two only for verified non-overlapping paths; uncertain
overlap stays sequential.
