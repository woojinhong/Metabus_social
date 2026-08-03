---
title: Native Agent Phase 1 Pilot Runbook
document_type: operations
classification: proposal
status: Phase 1 Pilot
last_verified: 2026-08-03
related_documents:
  - agent-automation-overview.md
  - openclaw-omx-workflow.md
  - github-workflow.md
decision_authority: Issue #80 scope and the Native Codex/Worktree direction merged in PR #79
---

# Native Agent Phase 1 Pilot Runbook

## 1. Purpose and fixed boundary

This is the operating checklist for the first real documentation-only Pilot of
the Native Codex/Worktree direction. Use the role model and authority boundary
in [Agent automation overview](agent-automation-overview.md), the detailed role
map in [OpenClaw and OMX workflow](openclaw-omx-workflow.md), and the publication
policy in [GitHub documentation workflow](github-workflow.md); do not reproduce
their longer explanations here.

- [ ] Keep the maximum concurrent Executor/worktree count at `1`.
- [ ] Preserve `scripts/harness/**`, `schemas/automation/**` and all existing
  Autonomous Harness artifacts as historical experimental reference.
- [ ] Confirm OpenClaw is not installed and Slack is not connected; neither is
  part of this Pilot.
- [ ] Make no product code, migration, dependency, lockfile, workflow,
  Harness/schema, credential, deployment or integration change.

## 2. Ordered execution checklist

### Preconditions

- [ ] In the base repository, confirm branch `master` and a clean working tree.
- [ ] Run `git fetch origin` and confirm `HEAD` equals `origin/master`.
- [ ] For this Pilot, confirm both local and remote base resolve to
  `42c536b9fe48b202c27e78af5f99264bda948ef0`, then inspect existing branches
  and worktrees for collisions. Stop and report any failed precondition.

### Native Planner: read-only

- [ ] Route to native typed `planner` and record scope, allowed/prohibited
  paths, acceptance criteria, tests, risks, branch and worktree proposal.
- [ ] During Planner work, do not edit files, create an Issue/branch/worktree,
  commit, push or create a PR.
- [ ] If typed native routing is unavailable, stop as
  `role_routing_unavailable`. Do not substitute another role or run
  `omx ralplan preflight --json`.

### One Issue, branch and worktree

- [ ] Search both open and closed Issues for the same outcome.
- [ ] Reuse the matching Issue, or create exactly one Issue if none matches.
- [ ] Record purpose, allowed files, prohibited scope, validation, completion
  conditions and the human-only Merge/Ready/Issue-close policy in that Issue.
- [ ] Create exactly one `docs/{issue-number}-native-agent-phase1-pilot` branch
  and one non-colliding worktree for the Issue. Never edit `master` directly.
- [ ] Link the Issue number from the branch, commit and Draft PR.

### Native Executor and local tests

- [ ] Route implementation to native typed `executor`, confined to the task
  worktree and Issue-authorized files.
- [ ] Implement the smallest checklist-oriented documentation change and
  minimal index links; do not copy long passages from related documents.
- [ ] Run, in order:
  1. `node scripts/docs/semantic-gates.test.mjs`
  2. `node scripts/docs/validate-docs.mjs`
  3. `git diff --check`
- [ ] Run any additional documentation test required by repository policy.
- [ ] Confirm allowed-files-only changes, zero deletions, zero credentials and
  zero product, migration, dependency, workflow, Harness or schema changes.
- [ ] A failed local test blocks commit, push and PR creation.

### Native Architect, then fixes

- [ ] Run native typed `architect` after the first local test pass. Do not run
  Architect and Code Reviewer concurrently.
- [ ] Check alignment with PR #79, preservation of Harness history, clear role
  boundaries, correct Issue/branch/worktree/Draft-PR transitions, human-only
  powers, low complexity and limited duplication.
- [ ] Require final status `CLEAR` and no unresolved CRITICAL, HIGH or MEDIUM
  finding.
- [ ] Route findings back to Executor in the same worktree, then rerun all
  required local tests before continuing.

### Native Code Reviewer, then final fixes

- [ ] Only after Architect clearance, run native typed `code-reviewer` against
  the complete diff and fresh test evidence.
- [ ] Check requested scope, allowed paths, policy consistency, credential and
  security boundaries, test results, links/indexes and Draft PR eligibility.
- [ ] Require final status `APPROVE` and no unresolved CRITICAL, HIGH or MEDIUM
  finding.
- [ ] Route any finding back to Executor, run the final local tests, and obtain
  Code Reviewer `APPROVE` on the revised diff. If the fix affects an Architect
  criterion, repeat Architect first so both verdicts cover the published diff.

### Scoped publication and Actions

- [ ] Publish only when all local tests pass, Architect is `CLEAR`, Code
  Reviewer is `APPROVE`, and unresolved CRITICAL/HIGH/MEDIUM findings equal `0`.
- [ ] Stage only Issue-authorized files, commit with the Issue number, push only
  the task branch and open exactly one Draft PR against `master`.
- [ ] Inspect all configured and triggered GitHub Actions and record each result.
- [ ] If an Action fails, keep the PR Draft and use the same branch/worktree:
  Executor fix -> local tests -> Architect -> Executor fix/retest if needed ->
  Code Reviewer -> Executor fix/final tests if needed -> commit/push -> Actions.
- [ ] Never automatically mark Ready, merge, or close the Issue. Those actions
  remain the repository owner's responsibility.

## 3. Human-only controls

The human supplies or confirms the request and any materially changed scope,
reviews the Draft PR, decides whether and when to mark it Ready, merges it, and
closes the Issue. The human also grants any future product-code authority and
accepts residual risk. Agent execution stops at a Draft PR with reported
Actions results; repository/runtime state never implies those human decisions.

## 4. Failure evidence to preserve

For every failure or blocked transition, retain or report the Issue, branch,
absolute worktree path, current commit, dirty-file list, role and stage, exact
command, exit code, timestamp, sanitized relevant output, test/review verdicts,
finding severity, Actions job/check URL where available, retry count and next
safe boundary. Never record tokens, credentials, personal data or raw Slack
content. Do not automatically delete a failed branch, worktree or evidence.

## 5. Completion and next-Pilot gate

Phase 1 is complete only when one Issue maps to one branch/worktree and Draft
PR; the scoped documentation and indexes are present; all local tests and
configured Actions pass; Architect is `CLEAR`; Code Reviewer is `APPROVE`; no
CRITICAL/HIGH/MEDIUM finding remains; preserved evidence and final Git status
are reported; and no Ready, Merge or Issue-close action was performed.

A later product-code Pilot requires a separate Issue and explicit owner grant
for exact product paths, acceptance criteria, tests, security/data/migration
boundaries and rollback risk. It may begin only after this documentation Pilot
is accepted, its failures and review findings are resolved, required Actions
are stable, the one-worktree isolation is proven, and no existing product,
migration, dependency, workflow or deployment gate is bypassed.
