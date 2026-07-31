---
title: GitHub Documentation Workflow
document_type: operations
classification: user decision
status: Approved operating policy
last_verified: 2026-07-31
related_documents:
  - ../../AGENTS.md
  - ../INDEX.md
  - ../discovery/decisions.md
  - github-initial-backlog.md
decision_authority: explicit repository-owner delegation on 2026-07-28
---

# GitHub Documentation Workflow

## 1. Purpose and authority

GitHub coordinates reviewable work. Durable knowledge remains in repository
Markdown under the authority hierarchy in [AGENTS.md](../../AGENTS.md).
Issue and PR content does not override decisions, approved specifications or
Accepted ADRs.

The official documentation flow is:

```text
Issue
  -> working branch
  -> document changes
  -> documentation validation
  -> commit
  -> push
  -> Draft PR
```

Owner review and merge are outside this delegated automation.

## 2. Current permitted scope

The flow may be used for:

- Markdown documentation, research and discovery;
- UX documentation and decision proposals;
- traceability, review and operations documents;
- documentation validation, Harness and Workflow documents.

It may not generate or promote:

- production frontend/backend code;
- authoritative OpenAPI/AsyncAPI, endpoints or DTOs;
- DBML, schema, migrations, final real-time states/events/payloads;
- vendor integration, cloud resources, credentials, spend or deployment;
- Pilot or production operation.

The bounded PR A/B baseline is already merged; this documentation workflow does
not grant changes to it. PR C/D, V7+ or new migrations, authoritative contracts
and other production work remain separately gated. D-024 closure, existing
files and Accepted ADRs do not bypass those gates.

## 3. When a new Issue and Draft PR are required

Create a new Issue when any condition applies:

- there is an independently reviewable outcome;
- multiple documents or sources of truth change;
- Decision, Spec, Traceability, ADR, Architecture, Operations or Harness changes
  materially;
- approval or gate status changes or is proposed;
- durable knowledge will govern later work;
- separate acceptance criteria and a completion judgment are needed.

One Issue owns one primary reviewable outcome. Split broad work into child
Issues only when the results can be reviewed independently.

## 4. Existing-Issue and no-new-Issue rules

Use an existing open Issue when the change directly satisfies its scope and
acceptance criteria. Small follow-ups needed to complete its Draft PR stay in
that Issue.

Do not create a new Issue for:

- read-only analysis or research that changes no file;
- ideas or questions without an execution plan;
- typo, link, date, small wording or metadata fixes within an existing Issue;
- small follow-ups required by an open Issue's acceptance criteria;
- temporary generated output or local validation logs.

A small change is promoted to a new Issue when it needs independent approval,
risk review, an SOT change or its own completion decision. “No new Issue” never
authorizes direct push to the default or protected branch. File-changing work
that needs no new Issue must belong to an existing Issue and its working
branch/Draft PR. Read-only work and temporary untracked validation output need
neither a branch nor a PR. Any other persisted standalone change is evaluated
against the new-Issue criteria before editing.

## 5. Branch, commit and Draft PR rules

- Search open and closed Issues before creating a duplicate.
- Branch from the current default branch after confirming a clean worktree.
- Prefer `<type>/<issue>-<slug>`; types include `docs`, `research`, `decision`,
  `experiment` and `harness`.
- Stage only files belonging to the Issue.
- A commit references the primary Issue when practical.
- Push only the working branch and open a Draft PR against the default branch.
- The Draft PR records purpose, Issue, scope, approval impact, decisions made
  and not made, validation, risks and remaining owner review.
- Draft proposals may edit protected SOT documents only within the Issue scope.
  They must remain explicitly proposed and must not change approved status or
  classification without recorded owner approval.

Automation must not merge, mark ready for review, close an Issue, close an owner
decision, accept an ADR, write an owner decision into `decisions.md`, or push
directly to the default/protected branch. Reset, clean, force push and history
rewrite are also prohibited.

## 6. Validation gate

Before commit:

1. run `node scripts/docs/validate-docs.mjs`;
2. confirm local links, front matter and the 200-line durable-Markdown limit;
3. run `git diff --check`;
4. reread changed files and inspect the scoped diff;
5. inspect `git status`.

Before final reporting, rerun the applicable local checks and confirm the pushed
remote branch and Draft PR.

When approval or gate status changes, search every reference to its stable ID
and update it or record why the existing wording intentionally remains.

The existing [documentation validation workflow](../../.github/workflows/docs-validation.yml)
continues to run for relevant pull requests and default-branch pushes. This
policy does not add hooks or alter that workflow.

## 7. Durable knowledge and closure

Final conclusions must update the appropriate Markdown SOT rather than exist
only in an Issue comment. Issue closure remains an owner or separately
authorized post-review action after acceptance criteria and required approval
are satisfied. Draft PR creation is not approval or closure.

## 8. Validated precedent

[Issue #1](https://github.com/woojinhong/Metabus_social/issues/1) and
[PR #2](https://github.com/woojinhong/Metabus_social/pull/2) exercised the
Issue, branch, validation, commit, push and Draft PR path. The PR validation
check passed; its later ready-for-review transition and merge were separate
owner actions and are not delegated by this policy.
