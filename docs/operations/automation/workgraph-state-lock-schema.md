---
title: WorkGraph State and Lock Schema Proposal
document_type: automation specification proposal
classification: proposal
status: Draft for owner review; no graph execution, claim or integration authority
implementation_ready: false
last_verified: 2026-07-30
related_documents: ["requirement-schema.md","work-package-and-issue-schema.md","../README.md","../github-workflow.md","../../discovery/slice-01-product-implementation-approval-plan.md","../../spec/traceability-implementation.md"]
decision_authority: H-session owner instruction authorizes this proposal documentation only; graph execution, runtime state, claims, GitHub mutation, merge and follow-up unlock remain separately gated
---

# WorkGraph State and Lock Schema Proposal

## 1. 목적과 권위 경계

[RECOMMENDED] Requirement는 무엇, Work Package는 하나의 제한된 작업, WorkGraph는 실행 가능 순서, Issue/Label은 사람용 Projection, 미래 Runtime Ledger는 Node state·Attempt·Lease·Lock의 실행 권위다. 이 문서는 WorkGraph 표현·검증·상태·Lock 계약 Proposal이며 WorkGraph 실행, Agent Claim, Branch/코드/Issue 변경, Merge나 후속 Node 해제 권한을 부여하지 않는다. Issue/Label·Slack·Chat·Agent memory는 상태 권위가 아니고 Graph는 Requirement/Work Package 권위를 승격시키지 못한다 ([Work Package Schema](work-package-and-issue-schema.md) lines 14-19, 143-175).
## 2. Work Package 관계와 WorkGraph Schema

Node는 immutable `work_package_id+revision+digest`를 고정하고 Work Package의 `package_status`와 별도 `execution_state`를 가진다. 같은 Work Package는 active WORK Node 하나만 허용하며 review/rollback은 `target_node`/lineage로 참조한다. `edges`가 canonical plan이고 Node dependency arrays는 일치해야 하는 materialized index다.

```yaml
{
schema_version: "1.0-proposal", graph_id: "WG-<uuidv5>", graph_revision: 1, title: "",
source_snapshot: {repository: "", repository_sha: "", requirement_digest: "sha256:", work_package_digest: "sha256:", policy_version: ""},
graph_status: PROPOSED, plan_digest: "sha256:", entrypoints: [],
nodes: [{
  node_id: "N-<uuidv5>", work_package_id: null, work_package_revision: null, work_package_digest: null,
  node_type: WORK, target_node: null, execution_state: PROPOSED, priority: 0, execution_order: 0,
  entrypoint: false, terminal: false, dependencies: [], soft_dependencies: [], approval_dependencies: [],
  evidence_dependencies: [], validation_dependencies: [], resource_locks: [], module_locks: [], path_locks: [],
  issue_ref: null, pull_request_ref: null, node_contract: {}, active_attempt: null, created_at: "", updated_at: ""
}],
edges: [{edge_id: "E-<uuidv5>", from: "", to: "", type: REQUIRES, condition: COMPLETED, required: true, metadata: {}}],
graph_policy: {max_nodes: 25, max_parallel_nodes: 2, max_parallel_write_nodes: 1, failure_strategy: BLOCK_DESCENDANTS, cancellation_strategy: BLOCK_DESCENDANTS, stale_strategy: REPLAN_REQUIRED},
created_at: "", generated_by: ""
}
```

`graph_status`는 `PROPOSED|VALIDATING|READY|ACTIVE|PAUSED|BLOCKED|STALE|FAILED|CANCELLED|SUPERSEDED|COMPLETED`다. Work Package/Node/Issue/PR/Human Approval 상태는 합치지 않는다.
## 3. Graph ID, Revision과 Plan Digest

[RECOMMENDED] Requirement/Work Package와 같은 repository UUIDv5 namespace에서 name=`normalized workstream/slice + root objective + sorted Work Package IDs`로 `WG-<calculated-uuidv5>`를 만든다. Work Package 추가·삭제, root objective/workstream 변경은 새 Graph ID다. 같은 목적에서 Work Package revision/digest, hard/soft edge, priority/order, lock, Human Node, source SHA나 policy가 바뀌면 Graph revision과 digest를 갱신한다. Retry/Attempt/heartbeat는 revision이 아니다.

Digest는 source snapshot, pinned packages, nodes의 normative fields, edges와 graph policy의 canonical JSON SHA-256이며 runtime state, refs, attempt·lease·heartbeat·timestamps는 제외한다. 동일 ID·digest는 재사용, 동일 ID·다른 digest는 overwrite 없이 새 revision `VALIDATING`; source만 갱신해도 영향 재검증 전 재사용 금지다.
## 4. Node 유형

| Type | WP/Agent/Code/Human-only | 선행 | 완료 Evidence | Retry/Terminal |
| --- | --- | --- | --- | --- |
| WORK | Y/C/WP정책/N | package gates·locks | package completion mapping | C/C |
| REVIEW | C/Y/N/N | target attempt+evidence | independent verdict | C/N |
| CI_VERIFICATION | N/system/N/N | immutable PR commit | required check results | C/N |
| SECURITY_REVIEW | C/Y/N/N | target+security evidence | severity+verdict | C/C |
| ARCHITECTURE_REVIEW | C/Y/N/N | target+architecture evidence | boundary verdict | C/C |
| EVIDENCE | C/C/N/N | identified evidence need | source/date/access/limits | C/C |
| HUMAN_APPROVAL | N/N/N/Y | required reviews/evidence | durable scoped decision | N/C |
| INTEGRATION | C/C/N/N | CI+reviews+merge approval | integration verdict, not merge | C/C |
| ROLLBACK | Y/C/WP정책/C | original target+lineage | recovery checks+residual risk | policy/C |

HUMAN_APPROVAL은 Agent가 완료하지 못한다. REVIEW는 대상 Worker Attempt와 독립이고 INTEGRATION은 CI/review를 우회하지 않는다. ROLLBACK은 original lineage가 필요하며 EVIDENCE 수집은 외부 Evidence 수용이 아니다.
## 5. Edge 유형과 방향

Hard edge의 `from`은 선행 Node, `to`는 dependent Node다. `BLOCKS`는 blocker/gate `from`이 condition을 만족할 때까지 `to`를 막는다. `VALIDATES`는 산출 Node→검증 Node이고 검증 대상은 `metadata.target_node`; `APPROVES`는 승인 Node→승인에 의존하는 Node다.

| Type | 순서/차단/실패·STALE 전파 | Cycle | Evidence/Human |
| --- | --- | --- | --- |
| REQUIRES | Y/Y/Y·Y | hard | N/C |
| BLOCKS | Y/Y/Y·Y | hard | N/C |
| SOFT_REQUIRES | warning/policy C/N·C | 제외 | N/N |
| VALIDATES | Y/Y/Y·Y | hard | verdict/C |
| APPROVES | Y/Y/Y·Y | hard | decision/Y |
| PRODUCES_EVIDENCE_FOR | Y/Y/Y·expiry Y | hard | Y/C |
| SUPERSEDES | lineage/N/N·lineage | 제외 | N/Y |
| ROLLBACK_OF | lineage/N/N·N | 제외 | recovery/C |
## 6. Graph 구조 검증

Self edge, missing Node, duplicate hard edge, hard cycle, entrypoint 없음, unreachable/목적 없는 isolated Node, target 없는 review/approval/evidence, Work Package digest mismatch, 같은 WP의 충돌 WORK Node, terminal의 outgoing hard edge, 잘못된 supersede, target 없는 rollback을 거부한다. Entrypoint는 의도된 root, non-entrypoint는 적어도 한 entrypoint에서 hard/declared soft path로 도달해야 하며 독립 목적·terminal이 없는 고립 Node는 orphan이다.
## 7. Node 상태 모델

역할은 `P` Planner, `D` Dispatcher, `W` Worker, `V` Validator/CI, `R` Reviewer, `H` Human, `I` Integrator다. Timeout은 Work Package policy를 참조하며 GH/Slack은 Projection이다.

| State | 의미·진입 | 허용 종료 | 금지 | 역할/Timeout/AutoRetry | GH/Slack |
| --- | --- | --- | --- | --- | --- |
| PROPOSED | graph 작성 | VALIDATING/CANCELLED | claim/run | P/없음/N | draft/proposed |
| VALIDATING | schema·digest 검사 | READY/BLOCKED/STALE | run | V/validation/N | paused/validating |
| READY | 모든 gate·lock 가능 | CLAIMED/PAUSED/STALE/CANCELLED | COMPLETED | D/claim/N | ready/ready |
| CLAIMED | atomic lease 발급 | RUNNING/READY/RETRY_WAIT/CANCELLED | COMPLETED | D,W/claim/C | claimed/claimed |
| RUNNING | 유효 fence로 실행 | VERIFYING/BLOCKED/RETRY_WAIT/FAILED/STALE/CANCELLED | COMPLETED | W,D/worker/C | running/running |
| VERIFYING | 결과·path·evidence 검사 | WAITING_FOR_CI/WAITING_FOR_REVIEW/WAITING_FOR_HUMAN/COMPLETED/BLOCKED/FAILED | gate skip | V/check/C | review/verifying |
| WAITING_FOR_CI | commit 고정, CI 대기 | VERIFYING/WAITING_FOR_REVIEW/BLOCKED/RETRY_WAIT/FAILED/STALE | direct complete if more gates | V/CI/C | review/wait-ci |
| WAITING_FOR_REVIEW | 독립 verdict 대기 | VERIFYING/WAITING_FOR_HUMAN/BLOCKED/FAILED/STALE | review bypass | R/review/N | review/wait-review |
| WAITING_FOR_HUMAN | scoped decision 대기 | VERIFYING/BLOCKED/CANCELLED/STALE | agent approval | H/indefinite wait/N | gate:human/wait-human |
| PAUSED | operator/policy hold | prior safe state/CANCELLED/STALE | direct complete | D,H/없음/N | paused/paused |
| BLOCKED | unmet dependency/gate | VALIDATING/CANCELLED/STALE | READY/RUNNING | D,V,H/없음/N | blocked/blocked |
| RETRY_WAIT | bounded backoff | READY/FAILED/CANCELLED/STALE | RUNNING | D/backoff/Y | paused/retry |
| FAILED | terminal attempt failure | RETRY_WAIT/SUPERSEDED | RUNNING | D,H/없음/policy | failed/failed |
| STALE | source/plan invalid | VALIDATING/SUPERSEDED/CANCELLED | RUNNING/COMPLETED | V,D/없음/N | blocked/stale |
| CANCELLED | terminal cancellation | SUPERSEDED | READY/RUNNING | H,D/없음/N | paused/cancelled |
| SUPERSEDED | replacement lineage | 없음 | READY/RUNNING | P,H/없음/N | no-active/superseded |
| COMPLETED | evidence+모든 gate 충족 | SUPERSEDED만 | mutation/RUNNING | V,I,H/없음/N | owner-close-eligible/completed |

전역 금지는 `READY→COMPLETED`, `RUNNING→COMPLETED`, `FAILED→RUNNING`, `STALE→RUNNING`, `CANCELLED→READY`, `SUPERSEDED→READY`다. WORK는 RUNNING→VERIFYING→필수 gate, CI/REVIEW는 RUNNING→VERIFYING→COMPLETED, HUMAN은 WAITING_FOR_HUMAN→VERIFYING→COMPLETED 경로만 쓴다.
## 8. READY 판정과 병렬 실행

`graph/package not STALE + package executable + hard dependencies COMPLETED + approvals/evidence/reviews satisfied + locks acquirable + parallel/budget limits + source/plan digest match`일 때만 READY다. SOFT_REQUIRES는 기본 warning이고 `graph_policy`가 명시하면 차단한다. READY 계산과 atomic `CLAIMED`는 분리한다.

READ/READ는 병렬, WRITE/WRITE와 EXCLUSIVE overlap은 금지, READ/WRITE는 immutable snapshot read일 때만 허용한다. 같은 module write, overlapping path write는 병렬 금지다. Build와 GitHub Workflow는 global lock, Migration/API Schema/문서 Index는 전용 lock, 공통 module은 영향 module review가 필요하다. Pilot은 product WRITE 1개만 허용하고 판단은 Agent가 아닌 Validator/Dispatcher policy 결과다.
## 9. Lock Schema와 충돌

```yaml
{lock_id: "L-<uuidv5>", lock_type: MODULE, resource: "", mode: WRITE, scope: "", owner_node: "", owner_attempt: "", lease_expires_at: "", fence_token: 0, hold_until: ATTEMPT_END}
```

Type은 `MODULE|PATH|SHARED_RESOURCE|BUILD_SYSTEM|WORKFLOW|MIGRATION_NAMESPACE|API_SCHEMA|DOCUMENT_INDEX`, mode는 `READ|WRITE|EXCLUSIVE`, hold는 `ATTEMPT_END|EVIDENCE_PINNED|PR_MERGED`다. Path는 root-relative POSIX/NFC로 정규화하고 Windows 비교는 case-insensitive이며 realpath로 symlink/`..` 탈출, glob·중첩 overlap을 검사한다. Lock은 `(type, canonical resource, mode)` 전역 순서로 한 번에 획득하거나 전부 반환해 deadlock을 막고 bounded timeout을 쓴다.

완료·취소·실패는 runtime lease를 해제하고 merge까지 필요한 lock은 INTEGRATION에 fence를 올려 이전한다. Immutable commit이 고정되면 code path lock은 review 중 해제 가능하지만 schema/build/migration integration lock은 merge까지 유지한다. Zombie lock은 lease 만료 뒤 fence 증가로 회수한다. Lock은 filesystem permission/sandbox를 대신하지 않는다.
## 10. Attempt, Lease와 Fence

```yaml
{attempt_id: "A-<uuidv5>", node_id: "", worker_id: "", lease_started_at: "", lease_expires_at: "", heartbeat_at: "", fence_token: 1, attempt_number: 1, state: CLAIMED}
```

CLAIM은 ledger의 READY+무lease 조건을 atomic compare-and-set하고 Attempt/Lease/fence를 발급한다. CLAIMED/RUNNING은 active lease+fence가 없으면 invalid다. Pilot 권고는 claim-to-start 5분, heartbeat 60초, running lease 180초이며 실제 값은 `[OPEN]`이다. Heartbeat가 lease를 연장하고 만료 시 Zombie로 회수한다. Retry는 새 Attempt ID와 증가 fence를 쓰며 stale fence, 취소·STALE 뒤 늦은 결과는 publication/lock/transition을 거부한다. Dispatcher 재시작은 memory가 아니라 ledger의 lease/fence를 reconcile한다.
## 11. Dependency 실패, 취소와 Source STALE

기본은 `BLOCK_DESCENDANTS + CONTINUE_INDEPENDENT_BRANCHES`; 공통 source/security 영향은 `PAUSE_GRAPH`, 계약 변경은 `REPLAN_REQUIRED`다. Worker transient·lock/GitHub 장애는 bounded RETRY_WAIT/PAUSED, non-retryable·CI failure는 FAILED, review 거절·evidence 미충족은 BLOCKED, human 거절은 BLOCKED/CANCELLED, budget 초과는 PAUSED, Dispatcher 장애는 lease expiry 후 ledger 복구다. 영향 후손은 실행하지 않고 독립 branch만 source/lock 영향이 없을 때 계속한다.

Repository SHA, Requirement record hash, Work Package digest, policy, approval, evidence expiry, path나 risk 변경은 직접 Node를 STALE, hard 후손을 STALE/재검증한다. Active Attempt는 fence로 publication 권한을 회수하고 기존 commit은 보존하며 Draft PR은 stale projection으로 남긴다. 결과 재사용은 동일 content/scope/checks와 reviewer 승인 때만 가능하다. Merge 직전과 review 뒤 policy 변경도 재검증하며 기존 Graph는 감사용, 새 revision은 실행용이다.
## 12. Human Approval과 External Evidence Node

Approval은 `{approval_type, required_actor_role, source_sha, scope, decision, decided_by, decided_at, valid_until, record}`이며 type은 `EXECUTION_APPROVAL|REVIEW_ACCEPTANCE|MERGE_APPROVAL|FOLLOW_UP_UNLOCK|HIGH_RISK_DECISION|EXTERNAL_EVIDENCE_ACCEPTANCE`다. Slack/label은 record가 아니고 scope/SHA 불일치·취소·만료는 gate를 닫는다. Agent는 완료할 수 없고 거절은 dependent를 BLOCKED/CANCELLED하며 merge와 follow-up 승인은 분리 가능하다.

EVIDENCE Node는 Requirement ID, evidence kind/source, collected/accessed dates, acceptor, `MISSING|COLLECTING|PARTIAL|ACCEPTED|EXPIRED|CONFLICTING|REJECTED`, expiry, limits/conflicts와 target WP를 기록한다. Agent는 수집만 하고 acceptor만 ACCEPTED로 전이한다. 만료/충돌은 연결 실행 Node를 STALE 또는 BLOCKED로 만들고 기존 수집 이력은 보존한다.
## 13. Review와 Integration

Review는 Requirement/scope/path 위반, security/architecture finding, test/evidence 누락, 과도한 설계와 source digest를 독립 검증한다. Integration은 PR, PR/evidence commit 일치, CI/review/merge approval, branch protection, source/plan freshness와 follow-up 조건을 확인한다. [CONFIRMED] 현재 정책상 자동 Merge는 금지다 ([GitHub workflow](../github-workflow.md) lines 95-113). INTEGRATION `COMPLETED`는 “merge-ready evidence verified”이며 실제 Merge나 후속 unlock 권한이 아니다.
## 14. GitHub Issue와 Label Projection

한 Work Package는 주 Issue 하나에 연결한다. Review/Approval이 독립 owner·결과를 가지면 별도 Issue, 아니면 Check/reference로 투영하고 PR commit을 연결한다. Node state는 `agent:*`와 `gate:*` label로 projection하지만 수동 label/Issue close는 transition/COMPLETED를 만들지 않는다. PR 수동 close는 reconcile 전 BLOCKED, Issue 삭제·접근 불가는 projection unavailable이다. GitHub 장애는 durable outbox+idempotent reconciliation이 필요하며 저장 기술은 `[OPEN]`이다.
## 15. 역사적 Slice 1 Graph 예시

[CONFIRMED] PR A Product Bootstrap의 병합 전 상태를 재현하는 Schema 예시이며 현재 구현을 재실행하지 않는다.

```yaml
{
graph_id: "WG-<calculated-uuidv5>", graph_revision: 1, source_snapshot: {repository: "https://github.com/woojinhong/Metabus_social", repository_sha: ce168d5381015e46171a13c2a3b2b80509c299b1, requirement_digest: "sha256:<placeholder>", work_package_digest: "sha256:<placeholder>", policy_version: "workgraph@1.0-proposal"},
entrypoints: [execution-approval], plan_digest: "sha256:<placeholder>",
nodes: [{node_id: execution-approval, node_type: HUMAN_APPROVAL, node_contract: {approval_type: EXECUTION_APPROVAL, decision: APPROVED, record: "Issue #35"}, execution_state: COMPLETED, execution_order: 0, entrypoint: true}, {node_id: wp-a, node_type: WORK, work_package_id: "WP-<bootstrap>", work_package_revision: 1, work_package_digest: "sha256:<placeholder>", execution_state: READY, execution_order: 1, module_locks: [product-bootstrap], resource_locks: [BUILD_SYSTEM, WORKFLOW]}, {node_id: architecture-review, node_type: ARCHITECTURE_REVIEW, target_node: wp-a, node_contract: {independent_attempt: true}, execution_state: BLOCKED, execution_order: 2}, {node_id: ci, node_type: CI_VERIFICATION, target_node: wp-a, execution_state: BLOCKED, execution_order: 2}, {node_id: owner-merge, node_type: HUMAN_APPROVAL, target_node: wp-a, node_contract: {approval_type: MERGE_APPROVAL}, execution_state: BLOCKED, execution_order: 3}, {node_id: pr-b-unlock, node_type: HUMAN_APPROVAL, target_node: wp-a, node_contract: {approval_type: FOLLOW_UP_UNLOCK}, execution_state: BLOCKED, execution_order: 4, terminal: true}],
edges: [{edge_id: E1, from: execution-approval, to: wp-a, type: REQUIRES}, {edge_id: E2, from: wp-a, to: architecture-review, type: VALIDATES}, {edge_id: E3, from: wp-a, to: ci, type: VALIDATES}, {edge_id: E4, from: architecture-review, to: owner-merge, type: REQUIRES}, {edge_id: E5, from: ci, to: owner-merge, type: REQUIRES}, {edge_id: E6, from: owner-merge, to: pr-b-unlock, type: APPROVES, metadata: {target_node: wp-a}}],
graph_policy: {max_parallel_nodes: 2, max_parallel_write_nodes: 1, failure_strategy: BLOCK_DESCENDANTS}, completion_definition: ["architecture-review and CI may run in parallel after WP-A", "Owner merge approval remains human", "PR B unlock requires approved merge and green CI"]
}
```
## 16. 거부 오류

모든 오류는 해소 전 READY/실행을 금지한다. `Auto`는 안전한 재계산·lease 회수만 `Y/C`, `Human`은 권위 판단 필요 여부다.

| 오류 | 발생 조건 | Auto/Human |
| --- | --- | --- |
| WG_NODE_MISSING | Node 목록 없음/필수 Node 누락 | N/Y |
| WG_EDGE_SELF_REFERENCE | from=to | Y/N |
| WG_EDGE_TARGET_MISSING | endpoint 없음 | N/Y |
| WG_HARD_CYCLE | hard DAG cycle | N/Y |
| WG_ENTRYPOINT_MISSING | root 없음 | N/Y |
| WG_ORPHAN_NODE | root에서 미도달·목적 없음 | N/Y |
| WG_REVIEW_TARGET_MISSING | review target 없음 | N/Y |
| WG_APPROVAL_TARGET_MISSING | approval target 없음 | N/Y |
| WG_EVIDENCE_TARGET_MISSING | evidence consumer 없음 | N/Y |
| WG_WORK_PACKAGE_DIGEST_MISMATCH | pinned digest 불일치 | C/Y |
| WG_SOURCE_STALE | source/policy/gate 변경 | C/Y |
| WG_INVALID_STATE_TRANSITION | 허용 표 밖 전이 | N/Y |
| WG_DEPENDENCY_INCOMPLETE | hard prerequisite 미완료 | C/N |
| WG_LOCK_CONFLICT | incompatible overlap | C/N |
| WG_LOCK_DEADLOCK_RISK | 순서 위반/부분 hold | Y/N |
| WG_DUPLICATE_CLAIM | active lease 중 재claim | Y/N |
| WG_LEASE_EXPIRED | heartbeat 없이 expiry | Y/C |
| WG_FENCE_TOKEN_STALE | 이전 Attempt 결과 | Y/N |
| WG_HUMAN_GATE_UNMET | 승인 없음/거절/만료 | N/Y |
| WG_EXTERNAL_EVIDENCE_UNMET | 미수용/만료/충돌 | N/Y |
| WG_PLAN_DIGEST_MISMATCH | canonical 재계산 불일치 | C/Y |
| WG_TERMINAL_NODE_MUTATION | terminal 변경/outgoing hard edge | N/Y |
## 17. 미래 Validator와 남은 경계

[RECOMMENDED] Validator는 필수 필드/enum, Graph ID/revision/digest, Node와 pinned WP ID/revision/digest, edge/type/hard cycle, entrypoint/reachability, 상태 전이/dependency, approval/evidence, path/module/resource overlap, lease/fence, source STALE, terminal mutation, Issue/label drift, parallel safety, auto Merge 금지와 `max_nodes/max_parallel*` 상한을 검사한다. 실패는 실행을 막고 authority나 transition을 만들지 않는다.

[CONFIRMED] 이번 단계는 계약만 문서화하며 Validator, Runtime Ledger, Dispatcher, outbox를 구현하거나 저장 기술을 확정하지 않는다. [OPEN] UUID namespace URI, canonical JSON, Ledger 기술, heartbeat/lease 운영값, SOFT_REQUIRES 차단 policy와 Graph revision migration을 후속 승인에서 정한다.
