---
title: WorkGraph State and Lock Schema Proposal
document_type: automation specification proposal
classification: proposal
status: Machine schema foundation implemented; no graph execution, claim or integration authority
implementation_ready: false
last_verified: 2026-07-31
related_documents: ["../../../schemas/automation/workgraph.schema.json","../../discovery/autonomous-harness-readonly-planner-authority.md","../../discovery/autonomous-harness-foundation-approval-plan.md","../autonomous-harness-readiness-audit-2026-07-31.md","requirement-schema.md","work-package-and-issue-schema.md","../README.md","../github-workflow.md","../../discovery/slice-01-product-implementation-approval-plan.md","../../spec/traceability-implementation.md"]
decision_authority: Owner instructions on 2026-07-31 authorize machine schema and bounded non-executing WorkGraph compilation only; runtime state, claims, GitHub mutation, merge and follow-up unlock remain separately gated
---

# WorkGraph State and Lock Schema Proposal

## 1. 목적과 권위 경계

[RECOMMENDED] Requirement는 무엇, Work Package는 하나의 제한된 작업, WorkGraph는 실행 가능 순서, Issue/Label은 사람용 Projection, 미래 Runtime Ledger는 Node state·Attempt·Lease·Lock의 실행 권위다. 이 문서는 WorkGraph 표현·검증·상태·Lock 계약 Proposal이며 WorkGraph 실행, Agent Claim, Branch/코드/Issue 변경, Merge나 후속 Node 해제 권한을 부여하지 않는다. Issue/Label·Slack·Chat·Agent memory는 상태 권위가 아니고 Graph는 Requirement/Work Package 권위를 승격시키지 못한다 ([Work Package Schema](work-package-and-issue-schema.md) lines 14-19, 143-175).
## 2. Work Package 관계와 WorkGraph Schema

Node는 immutable `work_package_id+revision+digest`를 고정하고 Work Package의 `package_status`와 별도 `execution_state`를 가진다. 같은 Work Package는 active WORK Node 하나만 허용하며 review/rollback은 `target_node`/lineage로 참조한다. `edges`가 canonical plan이고 Node dependency arrays는 일치해야 하는 materialized index다.

```yaml
{
schema_id: "https://github.com/woojinhong/metabus_social/schemas/automation/workgraph.schema.json", schema_version: "1.0.0", graph_id: "WG-<uuidv5>", graph_revision: 1, title: "",
source_snapshot: {repository: "", repository_sha: "", requirement_set_digest: "sha256:", work_package_set_digest: "sha256:", policy_version: ""},
graph_status: PROPOSED, workgraph_plan_digest: "sha256:", entrypoints: [],
nodes: [{
  node_id: "N-<uuidv5>", work_package_id: null, work_package_revision: null, work_package_plan_digest: null,
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

[RECOMMENDED] Requirement/Work Package와 같은 repository UUIDv5 namespace에서 name=`normalized workstream/slice + root objective + sorted Work Package IDs`로 `WG-<calculated-uuidv5>`를 만든다. Work Package 추가·삭제, root objective/workstream 변경은 새 Graph ID다. 같은 목적에서 package revision/digest, edge, priority/order, lock, Human Node, source SHA나 policy가 바뀌면 Graph revision과 digest를 갱신한다. Retry/Attempt/heartbeat는 revision이 아니다.

Graph `requirement_set_digest`는 pinned Work Package들의 source Requirement union을 sorted `(requirement_id, requirement_record_hash)`로 재계산한 값이다. `work_package_set_digest`는 sorted `(work_package_id, revision, work_package_plan_digest)` canonical 집합의 SHA-256이다. `workgraph_plan_digest`는 source snapshot, pinned package set, Node normative fields, edges와 graph policy의 canonical JSON SHA-256이며 runtime state, refs, attempt·lease·hold·heartbeat·timestamps는 제외한다. 동일 Graph ID·digest는 재사용하고 다른 digest는 overwrite 없이 새 revision `VALIDATING`; set digest 변경도 영향 재검증 전 재사용 금지다.
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
| INTEGRATION | C/C/N/N | CI+reviews+immutable PR commit | Integration Hold+merge-ready verdict, not merge | C/C |
| ROLLBACK | Y/C/WP정책/C | original target+lineage | recovery checks+residual risk | policy/C |

HUMAN_APPROVAL은 Agent가 완료하지 못한다. REVIEW는 대상 Worker Attempt와 독립이고 INTEGRATION은 CI/review를 우회하지 않는다. ROLLBACK은 original lineage가 필요하며 EVIDENCE 수집은 외부 Evidence 수용이 아니다.
## 5. Edge 유형과 방향

Hard edge의 `from`은 선행 Node, `to`는 dependent Node다. `BLOCKS`는 blocker/gate `from`이 condition을 만족할 때까지 `to`를 막는다. `VALIDATES`는 산출 Node→검증 Node이고 REVIEW/CI/SECURITY/ARCHITECTURE 검증 Node의 `target_node`가 canonical 대상이다. `metadata.target_node`를 materialized index로 제공하면 반드시 Node 값과 일치해야 한다. `APPROVES`는 승인 Node→승인에 의존하는 Node다.

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
| READY | 모든 gate·lock 가능 | CLAIMED/WAITING_FOR_HUMAN/PAUSED/STALE/CANCELLED | COMPLETED | D/claim-or-wait/N | ready/ready |
| CLAIMED | atomic lease 발급 | RUNNING/READY/RETRY_WAIT/CANCELLED | COMPLETED | D,W/claim/C | claimed/claimed |
| RUNNING | 유효 fence로 실행 | VERIFYING/BLOCKED/RETRY_WAIT/FAILED/STALE/CANCELLED | COMPLETED | W,D/worker/C | running/running |
| VERIFYING | 결과·path·evidence 검사 | WAITING_FOR_CI/WAITING_FOR_REVIEW/WAITING_FOR_HUMAN/COMPLETED/BLOCKED/FAILED | gate skip | V/check/C | review/verifying |
| WAITING_FOR_CI | commit 고정, CI 대기 | VERIFYING/WAITING_FOR_REVIEW/BLOCKED/RETRY_WAIT/FAILED/STALE | direct complete if more gates | V/CI/C | review/wait-ci |
| WAITING_FOR_REVIEW | 독립 verdict 대기 | VERIFYING/WAITING_FOR_HUMAN/BLOCKED/FAILED/STALE | review bypass | R/review/N | review/wait-review |
| WAITING_FOR_HUMAN | scoped decision 대기 | VERIFYING/BLOCKED/CANCELLED/STALE | agent claim/approval | D,H/indefinite non-runtime/N | gate:human/wait-human |
| PAUSED | operator/policy hold | prior safe state/CANCELLED/STALE | direct complete | D,H/없음/N | paused/paused |
| BLOCKED | unmet dependency/gate | VALIDATING/CANCELLED/STALE | READY/RUNNING | D,V,H/없음/N | blocked/blocked |
| RETRY_WAIT | bounded backoff | READY/FAILED/CANCELLED/STALE | RUNNING | D/backoff/Y | paused/retry |
| FAILED | terminal attempt failure | RETRY_WAIT/SUPERSEDED | RUNNING | D,H/없음/policy | failed/failed |
| STALE | source/plan invalid | VALIDATING/SUPERSEDED/CANCELLED | RUNNING/COMPLETED | V,D/없음/N | blocked/stale |
| CANCELLED | terminal cancellation | SUPERSEDED | READY/RUNNING | H,D/없음/N | paused/cancelled |
| SUPERSEDED | replacement lineage | 없음 | READY/RUNNING | P,H/없음/N | no-active/superseded |
| COMPLETED | evidence+모든 gate 충족 | STALE/SUPERSEDED | result mutation/RUNNING | V,I,H/없음/N | owner-close-eligible/completed |

전역 금지는 `READY→COMPLETED`, `RUNNING→COMPLETED`, `FAILED→RUNNING`, `STALE→RUNNING`, `CANCELLED→READY`, `SUPERSEDED→READY`다. WORK는 `READY→CLAIMED→RUNNING→VERIFYING`, CI/REVIEW는 `READY→CLAIMED→RUNNING→VERIFYING→COMPLETED`, HUMAN은 Worker Claim 없이 `READY→WAITING_FOR_HUMAN→VERIFYING→COMPLETED`만 쓴다.

HUMAN READY는 hard dependency와 evidence/review가 충족되고 Planner/compiler가 decision 없는 canonical approval placeholder를 `REQUIRED`로 생성해 distinct ID, actor role, scope와 source SHA를 고정한 때다. 이 placeholder는 승인 권위가 아니다. Dispatcher/ledger gate evaluator만 WAITING에 진입시키며 Worker lease를 만들지 않는다. 권한 있는 Human의 decision 뒤 VERIFYING은 ID/type, actor role, scope, source SHA, state, 시각/만료와 source reference를 검사한다. `GRANTED`만 COMPLETED이고 모든 hard gate가 완료된 dependent가 READY 후보가 된다. `REJECTED`는 BLOCKED, `EXPIRED`는 BLOCKED, `CANCELLED`는 CANCELLED, 완료 뒤 `REVOKED`나 source/scope 변경은 STALE이다. `human_approval_seconds: null`은 실행 중 timeout이 아니라 active Attempt 없는 비실행 대기다.
## 8. READY 판정과 병렬 실행

`graph/package not STALE + package executable + hard dependencies COMPLETED + approvals/evidence/reviews satisfied + locks acquirable + parallel/budget limits + requirement/package set and plan digests match`일 때만 READY다. SOFT_REQUIRES는 기본 warning이고 `graph_policy`가 명시하면 차단한다. READY 계산과 atomic `CLAIMED`는 분리한다.

READ/READ는 병렬, WRITE/WRITE와 EXCLUSIVE overlap은 금지, READ/WRITE는 immutable snapshot read일 때만 허용한다. 같은 module write, overlapping path write는 병렬 금지다. Build와 GitHub Workflow는 global lock, Migration/API Schema/문서 Index는 전용 lock, 공통 module은 영향 module review가 필요하다. Pilot은 product WRITE 1개만 허용하고 판단은 Agent가 아닌 Validator/Dispatcher policy 결과다.
## 9. Lock Schema와 충돌

```yaml
{lock_id: "L-<uuidv5>", lock_type: MODULE, resource: "", mode: WRITE, scope: "", issued_to_attempt: "", required_attempt_fence: 1, lock_fence: 1, lease_expires_at: "", hold_until: ATTEMPT_END}
```

Type은 `MODULE|PATH|SHARED_RESOURCE|BUILD_SYSTEM|WORKFLOW|MIGRATION_NAMESPACE|API_SCHEMA|DOCUMENT_INDEX`, mode는 `READ|WRITE|EXCLUSIVE`, hold는 `ATTEMPT_END|EVIDENCE_PINNED|PR_MERGED`다. Path는 root-relative POSIX/NFC로 정규화하고 Windows 비교는 case-insensitive이며 realpath로 symlink/`..` 탈출, glob·중첩 overlap을 검사한다. Lock은 `(type, canonical resource, mode)` 전역 순서로 한 번에 획득하거나 전부 반환해 deadlock을 막고 bounded timeout을 쓴다.

완료·취소·실패는 runtime lease를 해제한다. 성공한 Attempt가 immutable PR commit을 고정한 때만 merge-critical lock을 아래 Integration Hold로 원자 이전하고, 취소·실패는 recovery policy가 명시하지 않으면 해제한다. Code path lock은 review 중 해제 가능하지만 schema/build/migration integration lock은 merge event까지 유지한다. Zombie lock은 lease 만료 뒤 해당 resource의 `lock_fence` 증가로 회수한다. Lock은 filesystem permission/sandbox를 대신하지 않는다.
## 10. Attempt, Lease와 Fence

```yaml
{attempt_id: "A-<uuidv5>", node_id: "", worker_id: "", attempt_fence: 1, required_lock_fences: [{lock_id: "", lock_fence: 1}], lease_started_at: "", lease_expires_at: "", heartbeat_at: "", attempt_number: 1, state: CLAIMED}
```

`attempt_fence`는 Node 실행 세대, `lock_fence`는 canonical resource별 단조 증가 세대다. CLAIM은 ledger transaction에서 READY+무lease, 새 Attempt fence와 모든 lock lease/fence를 all-or-none으로 발급한다. Publication은 ledger에서 active Attempt fence, 취소/STALE 여부와 모든 required lock fence/expiry를 원자 검증하며 일부 누락·만료도 전체 Publication/COMPLETED를 차단한다. Retry는 Attempt fence, lock 재발급은 해당 resource fence를 증가시키며 이전 Attempt/lease 결과를 거부한다. Worker memory의 값은 권위가 아니고 초기값/overflow 정책은 `[OPEN]`이다. heartbeat/lease 운영값도 `[OPEN]`이며 Dispatcher 재시작은 ledger를 reconcile한다.
## 11. Dependency 실패, 취소와 Source STALE

기본은 `BLOCK_DESCENDANTS + CONTINUE_INDEPENDENT_BRANCHES`; 공통 source/security 영향은 `PAUSE_GRAPH`, 계약 변경은 `REPLAN_REQUIRED`다. Worker transient·lock/GitHub 장애는 bounded RETRY_WAIT/PAUSED, non-retryable·CI failure는 FAILED, review 거절·evidence 미충족은 BLOCKED, human 거절은 BLOCKED/CANCELLED, budget 초과는 PAUSED, Dispatcher 장애는 lease expiry 후 ledger 복구다. 영향 후손은 실행하지 않고 독립 branch만 source/lock 영향이 없을 때 계속한다.

Repository SHA, Requirement record/set digest, Work Package plan/set digest, policy, approval, evidence expiry, path나 risk 변경은 직접 Node를 STALE, hard 후손을 STALE/재검증한다. Active Attempt는 fence로 publication 권한을 회수하고 기존 commit은 보존하며 Draft PR은 stale projection으로 남긴다. 결과 재사용은 동일 content/scope/checks와 reviewer 승인 때만 가능하다. Merge 직전과 review 뒤 policy 변경도 재검증하며 기존 Graph는 감사용, 새 revision은 실행용이다.
## 12. Human Approval과 External Evidence Node

Human Node는 Work Package의 canonical `approval_record`를 `approval_record_id`로 참조하고 `source_approval_record_id`가 있으면 Requirement Grant lineage까지 검증한다. State는 `NOT_REQUIRED|REQUIRED|GRANTED|REJECTED|REVOKED|EXPIRED|CANCELLED`, type은 `EXECUTION_APPROVAL|REVIEW_ACCEPTANCE|MERGE_APPROVAL|FOLLOW_UP_UNLOCK|HIGH_RISK_DECISION|EXTERNAL_EVIDENCE_ACCEPTANCE`이며 type별 ID는 합치지 않는다. Slack/label은 record가 아니고 scope/SHA 불일치·취소·만료는 gate를 닫는다.

EVIDENCE Node는 Requirement ID, evidence kind/source, collected/accessed dates, acceptor, `MISSING|COLLECTING|PARTIAL|ACCEPTED|EXPIRED|CONFLICTING|REJECTED`, expiry, limits/conflicts와 target WP를 기록한다. Agent는 수집만 하고 acceptor만 ACCEPTED로 전이한다. 만료/충돌은 연결 실행 Node를 STALE 또는 BLOCKED로 만들고 기존 수집 이력은 보존한다.
## 13. Review와 Integration

Review는 Requirement/scope/path 위반, finding, test/evidence 누락과 source/set/plan digest를 독립 검증한다. Worker 종료 시 생성된 Hold를 Integration이 immutable PR/evidence commit, expected CI/review, branch protection와 freshness에 맞춰 검증·채택하며 새 Hold를 만들지 않는다. `COMPLETED`는 merge-ready evidence일 뿐 Merge 승인·실제 Merge·후속 unlock 권한이 아니고 Merge 승인은 이후 별도 HUMAN_APPROVAL Node다.
```yaml
integration_hold: {hold_id: "", source_attempt: "", integration_node: "", protected_resources: [], fence_tokens: [{lock_id: "", lock_fence: 1}], pull_request: "", expected_commit: "", expected_base: "", expected_checks: [{check_id: "", provider: "", required_conclusion: SUCCESS, head_sha: ""}], status: ACTIVE, lease_owner: RUNTIME_LEDGER_INTEGRATOR, lease_expires_at: "", last_reconciled_at: "", released_at: null, release_reason: null}
```
성공한 Worker Attempt 종료와 immutable PR commit 고정은 필수 lock을 Runtime Ledger/Integrator 소유 `ACTIVE` Hold로 원자 이전한다. Hold record가 resource를 예약하고 Integrator lease는 reconciliation 소유권만 나타낸다. Owner 대기 중 lease를 갱신하며 expiry는 `PAUSED`로 두고 conflicting Claim/release를 막은 채 ledger가 fence를 증가시켜 재발급한다. Restart 뒤 expected commit/base/check set과 fence로 복구한다. GitHub event/reconciliation이 expected 값과 실제 merge를 확인하면 `RELEASED/MERGED`; close-without-merge와 cancel은 `RELEASED/CLOSED_UNMERGED|CANCELLED`로 기록하고 dependent를 BLOCKED/CANCELLED한다. commit/base/merge-queue 변경은 `STALE`로 유지·재검증하고, 삭제/접근 불가는 `PAUSED`로 유지한다. Supersede는 증가 fence를 가진 replacement Hold로 원자 `TRANSFERRED`할 때만 이전 Hold를 해제하며 실패하면 유지한다. Merge event+필수 CI+별도 follow-up approval 전에는 후속 Node를 열지 않으며 자동 Merge는 계속 금지다 ([GitHub workflow](../github-workflow.md) lines 95-113).
## 14. GitHub Issue와 Label Projection

한 Work Package는 주 Issue 하나에 연결한다. Review/Approval이 독립 owner·결과를 가지면 별도 Issue, 아니면 Check/reference로 투영하고 PR commit을 연결한다. Node state는 `agent:*`와 `gate:*` label로 projection하지만 수동 label/Issue close는 transition/COMPLETED를 만들지 않는다. PR 수동 close는 reconcile 전 BLOCKED, Issue 삭제·접근 불가는 projection unavailable이다. GitHub 장애는 durable outbox+idempotent reconciliation이 필요하며 저장 기술은 `[OPEN]`이다.
## 15. 역사적 Slice 1 Graph 예시

[CONFIRMED] PR A Product Bootstrap의 병합 전 상태를 재현하는 abbreviated 예시이며 validator fixture나 실행 지시가 아니다. `omitted_fields_follow_schema_defaults`는 실제 default가 있는 필드에만 적용되고 나머지 필수 필드는 전체 record에서 채워야 한다.

```yaml
{
example_mode: abbreviated, omitted_fields_follow_schema_defaults: true,
graph_id: "WG-<calculated-uuidv5>", graph_revision: 1, source_snapshot: {repository: "https://github.com/woojinhong/metabus_social", repository_sha: ce168d5381015e46171a13c2a3b2b80509c299b1, requirement_set_digest: "sha256:<placeholder>", work_package_set_digest: "sha256:<placeholder>", policy_version: "workgraph@1.0.0"},
entrypoints: [execution-approval], workgraph_plan_digest: "sha256:<placeholder>",
nodes: [{node_id: execution-approval, node_type: HUMAN_APPROVAL, node_contract: {approval_record_id: APR-35-EXEC, approval_type: EXECUTION_APPROVAL}, execution_state: COMPLETED, execution_order: 0, entrypoint: true}, {node_id: wp-a, node_type: WORK, work_package_id: "WP-<bootstrap>", work_package_revision: 1, work_package_plan_digest: "sha256:<placeholder>", execution_state: READY, execution_order: 1, module_locks: [product-bootstrap], resource_locks: [BUILD_SYSTEM, WORKFLOW]}, {node_id: architecture-review, node_type: ARCHITECTURE_REVIEW, target_node: wp-a, execution_state: BLOCKED, execution_order: 2}, {node_id: ci, node_type: CI_VERIFICATION, target_node: wp-a, execution_state: BLOCKED, execution_order: 2}, {node_id: integration, node_type: INTEGRATION, target_node: wp-a, execution_state: BLOCKED, execution_order: 3}, {node_id: owner-merge, node_type: HUMAN_APPROVAL, target_node: wp-a, node_contract: {approval_record_id: APR-35-MERGE, approval_type: MERGE_APPROVAL}, execution_state: BLOCKED, execution_order: 4}, {node_id: merge-observed, node_type: EVIDENCE, target_node: wp-a, execution_state: BLOCKED, execution_order: 5}, {node_id: pr-b-unlock, node_type: HUMAN_APPROVAL, target_node: wp-a, node_contract: {approval_record_id: APR-35-UNLOCK, approval_type: FOLLOW_UP_UNLOCK}, execution_state: BLOCKED, execution_order: 6, terminal: true}],
edges: [{edge_id: E1, from: execution-approval, to: wp-a, type: REQUIRES}, {edge_id: E2, from: wp-a, to: architecture-review, type: VALIDATES}, {edge_id: E3, from: wp-a, to: ci, type: VALIDATES}, {edge_id: E4, from: architecture-review, to: integration, type: REQUIRES}, {edge_id: E5, from: ci, to: integration, type: REQUIRES}, {edge_id: E6, from: integration, to: owner-merge, type: REQUIRES}, {edge_id: E7, from: owner-merge, to: merge-observed, type: APPROVES}, {edge_id: E8, from: merge-observed, to: pr-b-unlock, type: PRODUCES_EVIDENCE_FOR}],
graph_policy: {max_parallel_nodes: 2, max_parallel_write_nodes: 1, failure_strategy: BLOCK_DESCENDANTS}, completion_definition: ["review and CI run after WP-A", "Integration Hold precedes Owner merge", "merge event, green CI and follow-up approval precede PR B"]
}
```
## 16. 거부 오류

구조/digest 오류 `WG_NODE_MISSING|WG_EDGE_SELF_REFERENCE|WG_EDGE_TARGET_MISSING|WG_HARD_CYCLE|WG_ENTRYPOINT_MISSING|WG_ORPHAN_NODE|WG_VALIDATION_TARGET_MISMATCH|WG_WORK_PACKAGE_SET_DIGEST_MISMATCH|WG_PLAN_DIGEST_MISMATCH|WG_SOURCE_STALE`는 Graph `READY`, 신규 Claim과 영향 Node Publication을 막는다.
상태/gate 오류 `WG_INVALID_STATE_TRANSITION|WG_HUMAN_STATE_PATH_INVALID|WG_DEPENDENCY_INCOMPLETE|WG_HUMAN_GATE_UNMET|WG_EXTERNAL_EVIDENCE_UNMET|WG_TERMINAL_NODE_MUTATION`는 offending transition/mutation을 원자 거부하고 해당 Node `READY/COMPLETED`와 dependent 해제를 막는다.
`WG_LOCK_CONFLICT|WG_LOCK_DEADLOCK_RISK|WG_DUPLICATE_CLAIM`은 lock acquisition/Claim을 실행 전에 거부한다. `WG_LEASE_EXPIRED|WG_ATTEMPT_FENCE_STALE|WG_LOCK_FENCE_STALE|WG_REQUIRED_LOCK_FENCE_MISSING`은 해당 Attempt의 heartbeat/renewal, mutation, Publication, `COMPLETED`와 후속 transition을 거부한다.
`WG_INTEGRATION_HOLD_MISSING|WG_INTEGRATION_HOLD_EXPIRED|WG_INTEGRATION_EXPECTATION_MISMATCH|WG_INTEGRATION_HOLD_TRANSFER_FAILED`는 Hold transfer/renewal과 Integration `COMPLETED`를 막는다. `WG_PR_CLOSED_UNMERGED|WG_PR_RECONCILIATION_UNAVAILABLE|WG_MERGE_EVENT_UNCONFIRMED|WG_FOLLOW_UP_UNLOCK_UNMET`는 성공 release와 후속 Node 해제를 막고, `WG_AUTOMERGE_FORBIDDEN`은 자동 merge mutation을 거부한다.
## 17. 미래 Validator와 남은 경계

[RECOMMENDED] Validator는 필드/enum, set/plan digest handoff, pinned WP ID/revision/plan digest, canonical target, graph reachability, Human path, approval/evidence mapping, resource lock/Attempt fence, atomic Publication, Integration Hold/merge event, STALE, terminal mutation, Issue drift, parallel safety와 auto Merge 금지를 검사한다. 실패는 위 차단 수준을 적용하고 authority나 transition을 만들지 않는다.

[IMPLEMENTED FOUNDATION] [WorkGraph machine schema](../../../schemas/automation/workgraph.schema.json)는 read-only plan과 planned lock만 `1.0.0`으로 고정하고 Attempt/Lease/heartbeat/fence/runtime ref를 제외한다. Runtime Ledger, Dispatcher, outbox, Claim과 Integration 실행은 미구현이며 heartbeat/lease, fence overflow, SOFT_REQUIRES와 Graph migration은 후속 Gate다.
