---
title: AH-P1-01 Read-only Planner Implementation Authority
document_type: automation implementation authority
classification: user decision
status: Owner-approved bounded implementation scope; effective from merge to master
last_verified: 2026-07-31
related_documents: ["autonomous-harness-foundation-approval-plan.md","../operations/automation/requirement-schema.md","../operations/automation/work-package-and-issue-schema.md","../operations/automation/workgraph-state-lock-schema.md","../operations/automation/dry-run-planner-contract.md","../../schemas/automation/dry-run.schema.json","../operations/github-workflow.md"]
decision_authority: explicit Owner instruction on 2026-07-31 and Issue #50
---

# AH-P1-01 Read-only Planner 구현 권한

## 1. 결정과 효력

Owner는 AH-P0-02 machine schema와 canonical identity를 입력 계약으로 사용하는
AH-P1-01 bounded Read-only Planner 구현을 승인한다. 이 기록이 `master`에 병합된 뒤
별도 Harness Issue가 clean/current `master`에서 시작 조건을 검증해야 구현을 시작할 수
있다. 이 승인은 계획 Proposal 생성 권한이며 실행·mutation 권한이 아니다.

Planner 출력은 모두 Owner review 대상 Proposal이다. `READY`는 입력과 정적 Gate가 계획
후보 조건을 충족했다는 뜻일 뿐 Worker 실행, 저장소 변경, GitHub mutation, 승인 또는
후속 단계 해제를 명령하지 않는다.

## 2. 허용 입력

Planner는 다음이 모두 고정된 입력만 받을 수 있다.

- `record_kind: CANONICAL_REQUIREMENT`, `schema_version: 1.0.0`인 schema-valid record;
- Owner 또는 위임 reviewer의 durable approval lineage;
- canonical repository URI와 repository commit SHA;
- source document path, blob SHA와 source text hash;
- approved planning scope와 policy/schema version;
- canonical bytes, record digest와 Requirement set digest가 검증된 입력.

`CANDIDATE`, proposal-only, approval lineage 누락, stale source SHA, version mismatch,
unknown field, digest mismatch, 위조된 `READY`/`GRANTED`, 미해결 conflict 입력은
fail closed한다. AH-P1-01은 Spec 또는 Markdown에서 Requirement를 자동 추출하지 않는다.

## 3. 허용 출력

Deterministic rule과 versioned template만 사용해 다음을 생성할 수 있다.

- proposed Work Package와 이미 충족된 Requirement의 deterministic `NO_OP`;
- 실행하지 않는 WorkGraph와 hard/soft/approval/evidence/validation dependency;
- path/module/resource lock 후보, cycle/orphan/conflict 분석과 병렬 가능 후보;
- schema-valid Issue draft record;
- `READY`, `BLOCKED_OWNER`, `BLOCKED_DEPENDENCY` Gate 판정;
- warnings, errors, blocked reasons와 deterministic digest;
- schema-valid `record_kind: READ_ONLY_DRY_RUN` record.

같은 canonical 입력은 byte-identical 논리 출력과 digest를 만들어야 한다. Requirement
배열 순서는 논리 결과와 digest를 바꾸지 않는다. 출력은 stdout 또는 호출자가 명시한
OS 임시 경로에만 쓰며 repository tracked file에 저장하지 않는다.

## 4. 구현 경계

AH-P1-01 구현은 `scripts/harness/planner/**`, bounded fixtures와 planner contract test만
후속 Issue에서 제안할 수 있다. 기존 AH-P0-02 schema와 canonical identity 규칙을
재사용하고 제품 source, migration, workflow 또는 dependency manifest를 변경하지 않는다.

Planner는 다음 상태를 읽거나 제안할 수 있어도 획득·저장·실행하지 않는다.

- WorkGraph Node와 dependency;
- 예상 path/module/resource lock;
- Issue title/body/metadata;
- authority, evidence와 dependency Gate;
- proposed branch name.

## 5. 계속 금지

- 실제 GitHub Issue, Project/Kanban, Label, Check 또는 PR 생성·수정;
- repository branch/worktree 생성, tracked file 수정 또는 Planner 결과 실행;
- Codex Worker, Dispatcher, Critic loop 또는 다른 Agent 실행;
- SQLite Runtime Ledger, Attempt, Lease, Fence, Lock 또는 outbox 구현·저장;
- 제품 코드, API, Realtime, Frontend, migration, vendor 또는 infrastructure 변경;
- Draft PR writer 자동화, Ready 전환, merge, Issue 종료 또는 auto-merge.

AH-P1-01 완료는 AH-P2, GitHub Issue writer, Worktree runner, Dispatcher, Ledger, Critic,
Worker 또는 제품 구현 권한을 자동 승인하지 않는다. 각 후속 단계는 별도 Owner Gate와
명시적 scope, dependency, validation 및 mutation 계약이 필요하다.

## 6. Dependency 결정

현재 automation schema가 사용하는 bounded keyword subset은 기존 Node 표준 라이브러리
structural validator와 canonicalization 코드로 검증할 수 있다. 따라서 AH-P1-01에는
Full JSON Schema engine과 외부 dependency가 필요하지 않으며 dependency를 추가하지 않는다.

향후 schema keyword 확대, 표준 전체 호환성 또는 외부 validator 채택이 필요하면 패키지,
버전, 이유, 대안, license, security와 유지보수 영향을 별도 Owner dependency Gate에서
승인받기 전 설치하거나 manifest/lockfile을 변경하지 않는다.

## 7. 후속 구현 시작 조건

1. 이 승인 기록과 상위 문서 정합화가 Owner review 뒤 `master`에 병합되어야 한다.
2. 구현 시작 시 branch가 `master`, working tree가 clean이고 `HEAD == origin/master`여야 한다.
3. PR #49와 AH-P0-02 schema/canonical identity baseline이 존재해야 한다.
4. 별도 AH-P1-01 Harness Issue와 `harness/<issue>-readonly-planner` branch를 사용해야 한다.
5. 외부 dependency가 없고 허용·금지 경계가 바뀌지 않았음을 다시 확인해야 한다.

구현 완료 판단은 golden fixtures, byte/digest determinism, order independence,
Candidate/unapproved/stale fail-closed, schema-valid dry-run/error 출력, mutation 코드 부재와
문서·Harness 검증 통과를 요구한다. Commit, push와 Draft PR은 repository workflow에 따른
사람 주도 작업이며 Planner 기능이 아니다.
