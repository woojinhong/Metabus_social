---
title: AH-P2-01 Lightweight Worktree Runner Pilot Authority
document_type: automation implementation authority
classification: user decision
status: Owner-approved scope; AH-P2-15 preserved as NO_CHANGE; Issue #72 verifies effective patch-only sandbox
last_verified: 2026-08-01
related_documents: ["autonomous-harness-foundation-approval-plan.md","autonomous-harness-readonly-planner-authority.md","../operations/autonomous-harness-readiness-audit-2026-07-31.md","../operations/automation/dry-run-planner-contract.md","../operations/github-workflow.md","../operations/README.md","../INDEX.md"]
decision_authority: explicit Owner instructions on 2026-07-31, Issue #54 and Issue #58
---

# AH-P2-01 Lightweight Worktree Runner Pilot 권한

## 1. 결정과 효력

Owner는 AH-P1-01의 검증된 출력만 소비하는 AH-P2-01 Lightweight Worktree Runner의
bounded 구현을 승인한다. 이 문서와 상위 문서 정합화가 `master`에 병합된 뒤 별도 Harness
Issue에서 구현할 수 있다. [HISTORICAL] Issue #54와 그 Draft PR은 문서만 바꿨고 Runner를
구현하거나 실행하지 않았다. 후속 Issue #56이 아래 bounded foundation을 구현한다.

이 권한은 Work Package 1~3개를 격리된 branch/worktree에서 실행할 수 있는 Pilot
capability의 구현 경계다. 실제 run마다 별도 Owner approval record가 필요하다. Runner
완료가 자동 실행, 제품 권한, 후속 단계, merge 또는 Issue 종료 권한을 만들지 않는다.

## 2. Planner와 Runner 분리

- Planner는 canonical Requirement에서 deterministic `READ_ONLY_DRY_RUN` Proposal을 만들며
  branch/worktree/Worker/GitHub를 변경하지 않는다.
- Runner는 Owner가 digest와 선택 목록을 승인한 Dry-run만 소비한다.
- Runner는 Requirement나 Work Package를 재해석·분해·추가하거나 scope, path, test,
  dependency, authority, risk와 budget을 넓히지 않는다.
- Candidate, `BLOCKED_OWNER`, `BLOCKED_DEPENDENCY`와 승인 목록 밖 Package는 실행하지 않는다.
- Planner의 `READY`만으로는 실행할 수 없고 per-run Owner approval이 함께 있어야 한다.

## 3. 고정 입력

Run 시작 전에 다음을 하나의 immutable input bundle로 고정한다.

- schema-valid `record_kind: READ_ONLY_DRY_RUN` record와 `result_digest`;
- Owner approval record ID, actor, timestamp, approved digest와 exact selected WP IDs;
- 1~3개의 selected `READY` Work Package ID, revision과 plan digest;
- canonical repository URI, source repository SHA와 최신 `master` 일치 증거;
- Package별 `allowed_paths`, `prohibited_paths`, `required_tests`와 proposed branch;
- wall-clock, token, retry, process와 동시성 실행 budget;
- warning 검토 결과와 overlap/exclusive-path conflict 판정.

Digest, source SHA, approval, Package 상태, path 또는 test가 불일치하거나 stale이면 fail
closed한다. Runner는 최신 값을 추측하거나 Planner를 자동 재실행하지 않는다.

## 4. Pilot 선택과 동시성

- 첫 Pilot은 `docs/**` 또는 `scripts/harness/**`만 허용하며 `src/**`는 금지한다.
- reviewable default는 최대 동시 2개이고 Owner record가 명시한 경우에도 절대 상한은 3개다.
- 각 Work Package는 독립 branch, Git worktree, Codex CLI Worker와 Draft PR을 가진다.
- 동일·상하위 path가 겹치는 Package는 병렬 실행하지 않는다.
- `build.gradle.kts`, `settings.gradle.kts`, `.github/workflows/**`, `migration/**`,
  `AGENTS.md`, `docs/INDEX.md`는 기본 `EXCLUSIVE`다.
- overlap 또는 exclusive 소유권이 모호하면 Runner는 해결·merge하지 않고 상태 `BLOCKED`,
  reason `BLOCKED_CONFLICT`로 중단한다.

## 5. Worker context와 capability

Worker는 전체 Spec, 다른 Package 또는 자유 탐색 bundle을 받지 않는다. Context pack
envelope는 WP ID/revision/digest를 식별하고 normative payload는 다음으로 제한한다.

- source canonical Requirement record;
- acceptance criteria;
- allowed/prohibited paths;
- required tests;
- pinned authority와 repository SHA.

Worker는 자신의 worktree 안에서 allowed path만 수정할 수 있다. Network는 deny-by-default,
secret 접근은 금지하고 dependency, migration 또는 workflow 변경은 별도 Owner Gate 없이는
거부한다. merge, reset, clean, force push, direct `master` push, history rewrite와 destructive
Git은 금지한다.

Worker는 파일 수정과 test 결과를 Runner에 반환한다. GitHub credential은 context/Worker에
노출하지 않고 Runner control plane의 pre-authenticated Git/GitHub 경계만 검증 성공 뒤
exact branch의 commit, push와 Draft PR에 사용할 수 있다. 전체 WP 실행 권한의 publication
상한은 Draft PR이며 control plane이 commit SHA를 Worker/run 결과에 추가한다.

## 6. 최소 상태 모델

| 상태 | 의미 |
| --- | --- |
| `PROPOSED` | 승인 전 immutable run 후보 |
| `APPROVED` | Owner가 digest와 selected IDs 승인 |
| `PREPARING` | collision 확인과 branch/worktree 준비 |
| `RUNNING` | bounded Worker가 allowed path 수정 |
| `TESTING` | required tests와 diff policy 검증 |
| `PR_DRAFT` | commit/push 뒤 Draft PR 생성 |
| `COMPLETED` | Draft PR과 결과 요약 생성 완료; merge 의미 아님 |
| `BLOCKED` | authority/dependency/conflict/manual Gate 대기 |
| `FAILED` | deterministic Worker/test/publication 실패 |
| `CANCELLED` | Owner 취소; 자동 재개 없음 |

정상 전이는 `PROPOSED→APPROVED→PREPARING→RUNNING→TESTING→PR_DRAFT→COMPLETED`다.
승인 뒤 어느 단계든 `BLOCKED|FAILED|CANCELLED`로 끝날 수 있다. 상태는 OS 임시 디렉터리의
run manifest를 기본으로 하며, 승인된 경우에만 추적되지 않는 local state file을 쓴다.
ID/SHA/status/test 결과만 기록하고 secret이나 사용자 데이터를 저장하지 않는다.

이 manifest는 Runtime Ledger, 다중 host authority, lease, heartbeat, fence, retry queue,
crash recovery 또는 exactly-once 실행을 주장하지 않는다. Crash 뒤 자동 resume하지 않고
worktree와 진단을 보존한 채 사람이 다음 조치를 결정한다.

## 7. Worktree 수명주기

1. clean/current `master`와 approved source SHA 일치를 다시 검증한다.
2. exact proposed branch와 새 worktree path가 모두 비어 있을 때만 생성한다.
3. 기존 branch/worktree/path 충돌은 덮어쓰기·삭제하지 않고 `BLOCKED_CONFLICT`다.
4. Worker 종료 뒤 changed path, prohibited path와 required tests를 다시 검증한다.
5. 성공하면 Package별 commit, push와 Draft PR을 만들고 PR merge 전 worktree를 유지한다.
6. 실패·차단이면 worktree를 보존하고 상태, changed files, tests와 진단을 출력한다.
7. PR merge 뒤 별도 사람 승인 cleanup에서만 worktree/branch를 제거한다.

## 8. Test, publication과 결과

모든 `required_tests`와 allowed/prohibited path 검증이 성공해야 commit/push할 수 있다.
Worker 결과에는 WP/Requirement ID, changed files, test command/result와 commit SHA를
포함한다. Draft PR body에는 WP ID/revision/digest, Requirement ID, acceptance criteria,
tests, Planner `result_digest`, authority record와 금지 범위를 기록한다.

사람용 run summary는 Package별 상태, branch/worktree, changed files, tests, commit, Draft
PR과 blocker/error를 출력한다. 이는 Ledger나 완료 권위가 아니다. Merge, Ready 전환,
Issue 종료와 cleanup 결정은 사람만 수행한다.

## 9. 계속 금지

- 승인 없는 자동 선택, Planner 재해석, Candidate 또는 blocked Package 실행;
- `src/**` 제품 코드, V7+ migration, dependency와 workflow 변경;
- secret, Slack webhook, vendor/cloud/provisioning와 production deploy;
- direct/force push, auto-merge, Issue 자동 종료와 GitHub Project/Kanban writer;
- Critic 반복, Lesson Learned 자동 승격 또는 다른 Agent의 권한 생성;
- SQLite Runtime Ledger, lease, heartbeat, fence, recovery와 다중 host 실행.

## 10. 구현 시작 조건

1. 이 authority와 상위 문서가 Owner review 뒤 `master`에 병합되어야 한다.
2. 시작 시 clean/current `master`, `HEAD == origin/master`와 PR #53 Planner 존재를 확인한다.
3. 별도 구현 Issue와 `harness/<issue>-lightweight-worktree-runner` branch를 사용한다.
4. 구현은 `scripts/harness/runner/**`, bounded fixture/test와 관련 문서로 제한한다.
5. schema, product, migration, dependency와 workflow 변경은 0이어야 한다.
6. collision, path escape, context minimization, concurrency, state, failure preservation,
   tests-before-publish와 no-merge/no-close를 golden test로 검증한다.
7. 외부 dependency가 필요하면 설치하지 말고 별도 Owner dependency Gate에서 중단한다.

구현 검증 완료 뒤에도 실제 Pilot run은 Owner-approved Dry-run digest, selected WP IDs와
per-run approval record 없이는 시작할 수 없다.

## 11. Issue #56 구현 결과와 남은 Gate

Issue #56 구현은 `scripts/harness/runner/**`, Runner fixture와
`scripts/harness/runner.test.mjs`로 dependency-free foundation을 구현한다. 입력 loader는
schema-valid `READ_ONLY_DRY_RUN`, 재계산한 Planner digest, exact selected `READY` Package,
source SHA와 Owner approval hash/pin을 fail closed로 검증한다. OS 임시 manifest는 동일
`run_id` 덮어쓰기를 거부하고 위 상태만 기록하며 Ledger, crash recovery와 multi-host
authority를 주장하지 않는다.

Worktree, Worker process, required test와 GitHub publication은 adapter 경계로 분리했다.
검증은 OS 임시 Git repository와 fake Worker/GitHub adapter만 사용하며 실제 branch,
worktree, Codex Worker, push 또는 PR을 Runner로 실행하지 않는다. 기본 CLI mode는
`prepare-only`다. 현재 구현 환경에서 `codex` CLI가 PATH에 없어 실제 sandbox/network
flag, filesystem isolation과 Windows process-tree containment를 검증하지 않았으므로
Worker와 required-test 실행 adapter 활성화는 첫 Pilot의 별도 환경·승인 Gate다.

첫 실제 Pilot은 exact `dry_run_id`, `result_digest`, source SHA, 1~3개 selected Package의
ID/revision/plan digest, exact allowed path scope, max concurrency, budget, absolute worktree
root와 Draft-only publication policy를 pin한 Owner run approval record와 별도 전달되는
out-of-band expected record hash가 필요하다. 이는 record mutation을 탐지하지만 Owner
전자서명이나 Runtime Ledger 인증을 주장하지 않는다.
제품 code, schema/migration, dependency/workflow, Dispatcher/Ledger/Critic, merge/Ready/close와
cleanup 권한은 계속 없다.

## 12. AH-P2-03 Real Codex Worker Adapter 권한과 결과

Owner는 Issue #58에서 direct Codex CLI 0.146.0 adapter, strict environment allowlist,
bounded JSONL/비-JSON log 수집, reparse escape 검사와 Windows process-tree fallback을
구현하도록 승인했다. 실행은 `--real-codex-worker`와 exact Owner approval의
`worker_policy` pin이 함께 있을 때만 구성되며 기본값은 계속 unavailable/prepare-only다.
Worker에는 GitHub/API/cloud/database secret을 전달하지 않고 제거된 변수 이름만 기록한다.

검증은 fake/local process와 OS temp Git repository만 사용했다. Windows `taskkill /PID
<integer> /T` 뒤 `/F` fallback은 argument injection을 막고 descendant test 결과를
기록하지만 handle-pinned Job Object가 아니며 PID reuse를 제거하지 못한다. Node `lstat`
reparse 거부와 Runner 전후 diff 검사는 race-free filesystem sandbox가 아니다. Codex
config에 network restricted 값을 명시해도 OS-level network deny 증거는 아니다.

OS temp read-only Codex smoke는 repository를 변경하지 않았지만 in-process app-server
초기화 access-denied로 종료했다. 따라서 network, filesystem과 strict process containment
상태는 계속 `BLOCKED_ENVIRONMENT`이며 실제 Pilot은 새 per-run Owner approval 뒤에도
모든 환경 Gate가 별도로 충족되기 전까지 실행할 수 없다.

Issue #64의 [JSONL evidence](autonomous-harness-codex-jsonl-usage.md)는 0.146.0 usage를 검증한다.
[AH-P2-11](autonomous-harness-codex-cost-budget-authority.md)은 좁은 cost 예외만 승인한다. Issue #68은 exact approval, aggregate token/external-call gate, `FAILED_BUDGET`, patch-ready state와 실패 artifact 보존을 Draft PR에서 연결하며 새 run 승인은 여전히 필요하다.

## 13. AH-P2-05 `EXECUTE_PATCH_ONLY`

Issue #60/#62 confine this mode to one exact `docs/**` path in an OS-temp clone with command-scoped `safe.directory`; commit, push, PR and persistent Git configuration remain forbidden. AH-P2-13 and AH-P2-15 ended `NO_CHANGE` after effective read-only rejected the runbook CREATE; both runs and artifacts are preserved and never reusable.
Issue #70 pins requested `workspace-write` in approval, CLI and adapter, but AH-P2-15 proved requested and effective sandbox can differ. Issue #72 requires a same-host Codex write probe before a real patch-only Worker; read-only denial is `RUNNER_CODEX_EFFECTIVE_SANDBOX_MISMATCH`, missing or stale evidence is `RUNNER_CODEX_EFFECTIVE_SANDBOX_UNVERIFIED`, and neither may become `NO_CHANGE`.
The probe uses the same executable, version, detected config-source hashes, exact environment-value hashes, host identity and command policy as the Worker, records no config secret values, and is not reusable across changed bindings or sessions. It must both write inside the workspace and receive a machine-readable denial outside the workspace/dedicated temp boundary; its verified usage consumes the same Owner token/time budget. Exact-path, HEAD, index, remote, all Git metadata, reparse and pre/post-test checks remain.
If the host cannot prove effective `workspace-write`, operation is `BLOCKED_ENVIRONMENT`. Any next real Pilot requires a new run ID, fresh exact Owner approval and residual-risk acceptance; product code, schema/migration, dependency/workflow and automatic publication remain prohibited.
