---
title: Autonomous Harness Experiment Inventory
document_type: archive-index
classification: proposal
status: Experimental reference; superseded as default orchestration path
last_verified: 2026-08-03
related_documents:
  - ../INDEX.md
  - ../operations/agent-automation-overview.md
  - ../operations/autonomous-harness-readiness-audit-2026-07-31.md
  - ../discovery/autonomous-harness-foundation-approval-plan.md
  - ../../schemas/automation/requirement.schema.json
decision_authority: Issue #78 classification proposal; historical approvals and evidence remain unchanged
---

# Autonomous Harness Experiment Inventory

## 1. Status boundary

The custom Autonomous Harness is preserved as experimental reference and is
not the default orchestration path for new Propscans Agent work. This inventory
does not repeal, reject or rewrite any prior owner approval, Issue result,
failed run or preserved evidence. It deletes no code or schema and grants no
new execution authority.

`scripts/harness/**`, `schemas/automation/**` and their tests remain intact.
New platform features stop here; deletion or further consolidation requires a
later Issue after the OpenClaw/OMX workflow is proven.

## 2. KEEP / REUSE / ARCHIVE / STOP inventory

| Component | Current role | Decision | Replacement | Migration action |
| --- | --- | --- | --- | --- |
| AGENTS authority hierarchy | Repository operating contract | KEEP | Same | Preserve and name the new default path |
| Decisions, Specs and ADRs | Durable product authority | KEEP | Same | Runtime state never overrides them |
| Documentation validation | Semantic and link gates | KEEP | Same tests and Actions | Continue before publication |
| GitHub Draft PR policy | Human review boundary | KEEP | Same | Preserve human-only merge/Ready/close |
| Git worktree policy | Task isolation | KEEP | Native Git worktree | One task/branch/worktree; concurrency 1 |
| Tests before publication | Result gate | KEEP | Local tests, then Draft PR Actions | Local failure blocks PR; Actions failure keeps it Draft and triggers fixes |
| Failure artifact preservation | Diagnosis and recovery | KEEP | Sanitized logs and worktree evidence | Preserve before verdict or retry |
| Planner scope/test concepts | Work Package compilation inputs | REUSE | Native Planner | Convert to prompt/checklist guidance |
| Allowed/prohibited paths | Runner change boundary | REUSE | Planner scope plus review | Keep the rule, not the custom engine |
| Worker context design | Exact scoped execution context | REUSE | Native Executor prompt | Include repo, SHA, paths, tests and grant |
| Critic severity gates | Independent findings | REUSE | Architect plus Code Reviewer | Block on unresolved MEDIUM or higher |
| Canonical identity/digest ideas | Experimental traceability | REUSE | Issue/branch/commit/PR references | Optional evidence, not new runtime authority |
| Harness lesson candidates | Run learning inputs | REUSE | `agent-lessons.md` | Human-reviewed reference only |
| Deterministic read-only Planner | Custom proposal compiler | ARCHIVE | Native OMX Planner | Retain code/tests; remove from default path |
| Lightweight Runner | Custom orchestration foundation | ARCHIVE | OMX/Codex plus worktree | Retain experiment; stop feature expansion |
| `EXECUTE_PATCH_ONLY` | Custom patch-only Worker mode | ARCHIVE | Scoped Codex worktree execution | Preserve evidence and tests |
| Sandbox probes/containment | Runtime capability experiment | ARCHIVE | Runtime controls and scoped validation | Preserve failures; do not platformize |
| WorkGraph schemas | Machine orchestration proposal | ARCHIVE | OMX workflow sequencing | Retain schemas/tests as reference |
| Token/cost gates | Custom usage authority | ARCHIVE | Provider/runtime evidence | Preserve historical contracts only |
| Draft PR/Git adapters | Custom publication path | ARCHIVE | GitHub CLI and approved policy | Exclude from new default path |
| Runtime Ledger | Planned state authority | STOP | Issue labels, Draft PR and Actions | Do not implement or extend |
| Dispatcher/reconciler/outbox | Planned scheduler/recovery engine | STOP | OpenClaw gateway later | Do not develop in this repository |
| Kanban projector/writer | Custom status projection | STOP | Optional GitHub Projects | No custom writer |
| Multi-project adapter | General platform layer | STOP | Propscans-only routing | No framework expansion |
| Sandbox platform | General containment service | STOP | Existing runtime boundaries | No custom platform |
| Cost accounting platform | General billing ledger | STOP | Provider/runtime reports | No custom platform |
| Lesson engine/store | Automatic rule promotion | STOP | One reviewed Markdown file | No automatic policy promotion |

## 3. Preservation and later decision

Existing Harness tests continue to detect accidental breakage while the files
remain. Historical `NO_CHANGE`, `FAILED_BUDGET`, containment and approval
records keep their exact status. A future cleanup Issue may evaluate deletion
only after Phase 1 and the later OpenClaw integration have reproducible evidence;
it must preserve any required audit artifact and owner decision lineage.
