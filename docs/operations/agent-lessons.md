---
title: Agent Automation Lessons
document_type: operations-reference
classification: research finding
status: Reviewed reference; not execution authority
last_verified: 2026-08-03
related_documents:
  - agent-automation-overview.md
  - openclaw-omx-workflow.md
  - ../archive/autonomous-harness-experiment.md
decision_authority: repository evidence and owner-directed Issue #78 documentation scope
---

# Agent Automation Lessons

Lessons help later planning and review. They do not grant execution, change
policy automatically or override AGENTS, Decisions, Specs, ADRs or an Issue
scope. An Agent may propose a lesson; a human reviews any promotion into
durable guidance.

## LESSON-001

- Date: 2026-08-03
- Context: Requested Codex sandbox versus effective Worker behavior.
- Observation: A requested writable sandbox can still behave read-only.
- Root cause: Runtime configuration and effective enforcement can differ from the request.
- Applied fix: Require same-environment positive-write and denied-boundary evidence.
- Reusable rule: Verify effective capability before a write task; do not infer it from flags.
- Scope: Codex or other Agent execution environments.
- Revalidate when: Runtime, version, config, host or sandbox policy changes.

## LESSON-002

- Date: 2026-08-03
- Context: Harness probe and budget failure classification.
- Observation: Early verdicts can hide the evidence needed to diagnose failure.
- Root cause: Classification occurred before durable sanitized artifact finalization.
- Applied fix: Preserve raw sanitized output, event inventory and filesystem results first.
- Reusable rule: Preserve failure evidence before classification, cleanup or retry.
- Scope: Tests, probes, reviews and Agent runs.
- Revalidate when: Artifact format or storage boundary changes.

## LESSON-003

- Date: 2026-08-03
- Context: Capability probe repository discovery and MCP execution.
- Observation: Discovery MCP calls obscured whether the actual boundary probe ran.
- Root cause: Repository discovery and capability verification shared one tool surface.
- Applied fix: Separate discovery from a minimal probe with extra tools disabled.
- Reusable rule: Keep repository discovery and capability probes as separate stages.
- Scope: Sandbox, network and tool capability verification.
- Revalidate when: The runtime exposes a new trusted probe contract.

## LESSON-004

- Date: 2026-08-03
- Context: Windows PowerShell boundary probe.
- Observation: A complex inline command failed with `MissingCatchOrFinally`.
- Root cause: Nested quoting and inline script transport changed PowerShell parsing.
- Applied fix: Use one hash-bound script file with exact arguments.
- Reusable rule: Prefer reviewed script files over complex inline PowerShell commands.
- Scope: Windows automation with nested quoting or structured error handling.
- Revalidate when: The command becomes trivial or uses a safer structured launcher.

## LESSON-005

- Date: 2026-08-03
- Context: OMX adapted leader preflight in this runtime.
- Observation: Adapted leader proof is unsupported while native typed roles are exposed.
- Root cause: The fallback proof path does not represent the active native routing surface.
- Applied fix: Use native `agent_type` routing and stop if it is unavailable.
- Reusable rule: Never fabricate a role or substitute session state for typed routing proof.
- Scope: OMX Planner, Architect, Critic and Reviewer delegation.
- Revalidate when: OMX routing or plugin mode changes.

## LESSON-006

- Date: 2026-08-03
- Context: Converting run observations into reusable policy.
- Observation: A local workaround or single run can be too narrow for a global rule.
- Root cause: Automated promotion loses authority, scope and counterexample review.
- Applied fix: Record a candidate here and require human review for policy changes.
- Reusable rule: Agent-created lessons are advisory until explicitly reviewed.
- Scope: All repository automation guidance.
- Revalidate when: The repository adopts a formal reviewed policy-promotion process.
