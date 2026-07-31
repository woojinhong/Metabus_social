---
title: Dry-run Planner Contract Proposal
document_type: automation specification proposal
classification: proposal
status: Machine schema foundation implemented; no planner execution or GitHub mutation authority
implementation_ready: false
last_verified: 2026-07-31
related_documents: ["../../../schemas/automation/dry-run.schema.json","../../../schemas/automation/error.schema.json","../../discovery/autonomous-harness-foundation-approval-plan.md","../autonomous-harness-readiness-audit-2026-07-31.md","requirement-schema.md","work-package-and-issue-schema.md","workgraph-state-lock-schema.md","../README.md","../github-workflow.md","../../discovery/decisions.md","../../discovery/slice-01-product-implementation-approval-plan.md"]
decision_authority: explicit Owner instruction on 2026-07-31 authorizes Issue #48 machine schema and deterministic contract tests only; Planner execution and GitHub mutation remain separately gated
---

# Dry-run Planner Contract Proposal

## 1. 목적, 역할과 권위 경계

[RECOMMENDED] 이 문서는 승인된 Source Snapshot에서 Requirement, Work Package, WorkGraph와 GitHub Issue 초안을 생성하는 Dry-run Planner의 입력·출력·검증 계약을 정의한다. 출력은 검토 가능한 Plan Proposal이며 실행 명령이 아니다. 이 문서만으로 Issue·Branch·Worktree 생성, Agent 실행, 파일·코드 수정, Commit·Push·PR·Merge 또는 후속 Node 해제 권한을 부여하지 않는다.

Planner는 snapshot 읽기, atomic Requirement 후보 추출, 세 Schema 검증, Work Package/WorkGraph/Issue 초안 생성과 충돌·누락·위험·차단 보고만 한다. Requirement 승인, `[OPEN]` 확정, Execution Grant 발급, Evidence 수용, Human Approval 완료와 저장소·GitHub mutation은 할 수 없다. `[CONFIRMED]` 입력 계약은 [Requirement](requirement-schema.md), [Work Package](work-package-and-issue-schema.md), [WorkGraph](workgraph-state-lock-schema.md) Proposal을 그대로 참조하며 권위를 승격하지 않는다.

## 2. 입력 Schema

```yaml
schema_id: "https://github.com/woojinhong/metabus_social/schemas/automation/dry-run.schema.json"
schema_version: "1.0.0"
repository: {canonical_uri: "", repository_sha: "", default_branch: ""}
planning_scope:
  {vertical_slice: "", workstream: "", modules: [], source_documents: [{document_path: "", document_blob_sha: "", section_anchor: "", source_text_hash: ""}], source_requirement_ids: []}
policy:
  {policy_version: "", allowed_work_package_types: [], allowed_risk_levels: [], max_work_packages: 0, max_graph_nodes: 0, max_parallel_nodes: 0, allow_product_code_change: false, allow_infrastructure_change: false, allow_external_access: false}
execution_authority: {approval_record_ids: [], approval_records: [{approval_record_id: "", approval_type: "", state: "", required_actor_role: "", source: "", source_approval_record_id: null, scope: [], source_sha: "", decided_by: "", decided_at: "", valid_until: null, record_hash: ""}], allowed_scopes: []}
external_evidence_context: {accepted_evidence_ids: [], accepted_evidence_records: [{evidence_id: "", state: ACCEPTED, acceptor: "", source: "", scope: [], source_sha: "", accepted_at: "", revalidate_at: null, conflicts: [], record_hash: ""}]}
existing_state: {snapshot: {source: "", as_of: "", source_sha: "", record_hash: ""}, open_issues: [], completed_work_packages: [], active_work_packages: [], existing_graphs: []}
```

`Y/C`는 필수/조건부다. Digest `Y`는 `result_digest`의 논리적 canonical projection에도 포함됨을 뜻한다.

| 입력 필드 | 필수·형식 | 작성→검증 | 권위 원본 | 변경 시점 | Digest | 누락/오류 |
| --- | --- | --- | --- | --- | --- | --- |
| `schema_version` | Y; semver prerelease | Caller→schema validator | 이 계약 | 새 계약 | Y | reject/schema error |
| `repository.canonical_uri` | Y; canonical URI | Caller→Git validator | Git remote/Owner | 입력 전 | Y | reject/`DRP_SOURCE_NOT_FOUND` |
| `repository.repository_sha` | Y; 40-hex | Caller→Git validator | Git object DB | 실행 시작 전 고정 | Y | `DRP_INPUT_SHA_MISSING`/invalid SHA |
| `repository.default_branch` | Y; ref name | Caller→Git validator | repository metadata | 입력 전 | Y | reject/ref invalid |
| `planning_scope.vertical_slice` | C; stable slug | Owner/Caller→scope reviewer | 승인 plan | planning 전 | Y | warning/invalid scope |
| `planning_scope.workstream` | Y; stable slug | Owner/Caller→scope reviewer | 승인 plan | planning 전 | Y | reject/unbounded |
| `planning_scope.modules` | Y; sorted module ID[] | Caller→architecture reviewer | architecture/SOT | planning 전 | Y | blocked/unknown module |
| `planning_scope.source_documents` | Y; snapshot[] | Caller→Git/authority validator | pinned Git objects | 입력 전 | Y | `DRP_SOURCE_NOT_FOUND`/snapshot error |
| `source_documents[].document_path` | Y; root-relative path | Caller→Git validator | pinned tree | 입력 전 | Y | source not found/path invalid |
| `source_documents[].document_blob_sha` | Y; Git object ID | Caller→Git validator | pinned blob | 입력 전 | Y | `DRP_SOURCE_BLOB_MISMATCH` |
| `source_documents[].section_anchor` | Y; normalized anchor | Caller→locator validator | pinned document | 입력 전 | Y | extraction failed/anchor invalid |
| `source_documents[].source_text_hash` | Y; SHA-256 | Caller→hash validator | pinned section bytes | 입력 전 | Y | `DRP_SOURCE_TEXT_HASH_MISMATCH` |
| `planning_scope.source_requirement_ids` | Y; unique ID[] | Caller→Requirement validator | Requirement records | 입력 전 | Y | extraction failed/unknown ID |
| `policy.policy_version` | Y; stable version | Owner/Caller→policy validator | approved policy record | 입력 전 | Y | `DRP_POLICY_VERSION_MISSING`/stale |
| `policy.allowed_work_package_types` | Y; type enum[] | Owner→policy validator | policy | Owner 변경 시 | Y | blocked/disallowed type |
| `policy.allowed_risk_levels` | Y; risk enum[] | Owner→risk validator | policy | Owner 변경 시 | Y | `DRP_RISK_POLICY_EXCEEDED` |
| `policy.max_work_packages` | Y; positive int | Owner→limit validator | policy | Owner 변경 시 | Y | `DRP_LIMIT_EXCEEDED` |
| `policy.max_graph_nodes` | Y; positive int | Owner→limit validator | policy | Owner 변경 시 | Y | `DRP_LIMIT_EXCEEDED` |
| `policy.max_parallel_nodes` | Y; positive int | Owner→graph validator | policy | Owner 변경 시 | Y | graph blocked/invalid bound |
| `policy.allow_product_code_change` | Y; boolean | Owner→authority validator | grant/policy | 새 승인 시 | Y | false blocks code package |
| `policy.allow_infrastructure_change` | Y; boolean | Owner→authority validator | grant/policy | 새 승인 시 | Y | false blocks infra package |
| `policy.allow_external_access` | Y; boolean | Owner→permission validator | grant/policy | 새 승인 시 | Y | false blocks external access |
| `execution_authority.approval_record_ids` | Y; durable ID[] | Owner record→bijective record index | approval records | decision event | Y | `DRP_WORK_PACKAGE_GRANT_MISSING` |
| `execution_authority.approval_records[]` | Y; ID/type/state/role/source/lineage/scope/SHA/actor/time/expiry/hash | Owner record→authority/hash validator | pinned approval record | decision event | Y | missing/stale/revoked/expired grant blocked |
| `execution_authority.allowed_scopes` | Y; constraint[] | Owner record→scope validator | approval records | 새 grant 시 | Y | grant/scope mismatch |
| `external_evidence_context.accepted_evidence_ids` | Y; durable ID[] | Acceptor record→bijective record index | evidence records | acceptance event | Y | `DRP_EXTERNAL_EVIDENCE_REQUIRED` |
| `external_evidence_context.accepted_evidence_records[]` | Y; ID/state/acceptor/source/scope/SHA/time/expiry/conflict/hash | Acceptor record→evidence/hash validator | pinned evidence record | acceptance event | Y | missing/stale/non-ACCEPTED evidence blocked |
| `existing_state.snapshot` | Y; source/as-of/SHA/hash | State reader→freshness/hash validator | immutable read snapshot | planning 시작 시 | Y | `DRP_SOURCE_STALE` |
| `existing_state.open_issues` | Y; immutable snapshot[] | GitHub reader→mapping validator | GitHub read model | planning 시작 시 | Y | unavailable/ambiguous blocks |
| `existing_state.completed_work_packages` | Y; ID/revision/digest[] | Ledger export→digest validator | approved history | planning 시작 시 | Y | warning/stale history |
| `existing_state.active_work_packages` | Y; ID/revision/digest[] | State export→duplicate validator | approved read model | planning 시작 시 | Y | unavailable/duplicate blocks |
| `existing_state.existing_graphs` | Y; ID/revision/digest[] | State export→graph validator | approved read model | planning 시작 시 | Y | unavailable/stale blocks |

ID 목록과 pinned records는 일대일이어야 하며 Planner는 여러 record의 scope를 합치지 않는다. Grant는 `GRANTED`+type/actor/scope/source SHA/유효기간/lineage, Evidence는 `ACCEPTED`+acceptor/scope/source SHA/재검증일/conflict 없음과 record hash가 모두 맞아야 한다. unavailable/stale/revoked/expired record는 각각 Grant/Evidence 오류로 차단한다. Runtime Ledger가 없는 현재 단계에서는 `existing_state`를 explicit empty arrays가 포함된 승인 문서/GitHub snapshot으로 고정하며 source/as-of/SHA/hash가 없거나 open/active/graph freshness를 판정할 수 없으면 차단한다. Issue·Label은 runtime 권위가 아니다.

## 3. Source Snapshot과 Requirement 추출

Branch/working tree가 아니라 canonical URI+commit SHA+path+blob SHA+anchor+text hash+policy version을 고정한다. SHA/path 부재는 reject, blob 불일치는 reject, text 변화나 planning 중 변경은 `STALE`이며 자동 보정하지 않는다. 최신 `master`와 다른 SHA는 명시적 historical 또는 unmerged-source approval record가 있을 때만 허용하고, proposal을 승인 Source로 사용하면 reject한다.

순서는 `Source Authority→atomic 분리→Stable ID/UUIDv5→requirement_record_hash→중복→Conflict→Lifecycle→Execution Grant→Evidence Readiness`다. 기존 atomic `FR/UX/SR/NFR` ID를 우선하고 다른 ID는 alias, 동일 의미의 낮은 권위 Source는 supporting snapshot이다. Parent/related/supersede 이력을 보존하며 Agent는 lineage나 conflict를 해결하지 않는다. 미해결 conflict, `OPEN`, evidence 미충족과 proposal-only Source는 실행 후보를 차단하고 추출 오류가 하나라도 있으면 Work Package compile을 금지한다.

```yaml
requirements: [{requirement_id: "", requirement_record_hash: "", requirement_kind: "", title: "", statement: "", source: {}, authority: {}, lifecycle: "", implementation_gate: {}, external_evidence: {}, conflicts: [], validation_result: {status: "", errors: []}}]
requirement_set_digest: "sha256:"
```

ID/hash와 sorted `(requirement_id, requirement_record_hash)` 집합의 `requirement_set_digest`는 Requirement Schema를 따른다. 추출은 승인이나 Grant가 아니며 unresolved conflict record를 삭제하지 않는다.

## 4. Work Package compile과 출력

생성 조건은 Requirement 검증, conflict 없음, type/lifecycle 양립, 실행 후보의 Grant+Evidence, bounded scope/path, verifiable acceptance와 risk 판정이다. 한 Package는 한 검토 결과만 가지며 독립 acceptance/owner/path/risk가 다르면 분리한다. limit 초과·복수 독립 결과는 oversized로 차단한다. Shared path는 Lock 요구를 만든다. 실행 불가 Requirement는 Source가 허용할 때만 `DOCUMENTATION|DESIGN|EVIDENCE_COLLECTION|HUMAN_DECISION` 후보가 되며 실행 가능으로 승격하지 않는다.

제품 코드는 policy true+정확한 Grant scope에서만 후보화한다. Migration·Deployment·Secret·Production·결제·법률 결정 Package는 모든 Dry-run에서 차단하고 별도 Owner 계약 전에는 policy로 완화할 수 없으며 `HUMAN_DECISION|DESIGN|EVIDENCE_COLLECTION` 후보만 허용한다. ID/revision과 `work_package_plan_digest`는 Work Package Schema를 따르고 Grant scope와 package scope가 불일치하면 `BLOCKED`다.

```yaml
work_packages: [{work_package_id: "", work_package_revision: 1, work_package_plan_digest: "", package_status: PROPOSED, type: "", title: "", source_requirements: [], objective: "", scope: [], out_of_scope: [], dependencies: [], path_policy: {}, acceptance_criteria: [], required_tests: [], required_checks: [], required_evidence: [], risk: {}, agent_profile: {}, human_approval: {}, external_evidence_gate: {}, validation_result: {}}]
work_package_set_digest: "sha256:"
```

`READY`와 `BLOCKED`를 구분하되 `READY`는 실행 명령이 아니다. Set digest는 sorted `(work_package_id, revision, work_package_plan_digest)`다.

## 5. WorkGraph, Lock과 병렬성

각 WP에 WORK, `required_checks`의 independent/security/architecture rule에 REVIEW/SECURITY_REVIEW/ARCHITECTURE_REVIEW, repository mutation 또는 CI check에 CI_VERIFICATION, `REQUIRED` approval record마다 HUMAN_APPROVAL, 미수용 evidence gate마다 EVIDENCE, repository/PR projection mutation과 필수 CI+review+merge approval gate가 선언된 WP에 INTEGRATION, non-empty recovery 또는 reversible mutation에 ROLLBACK Node를 정확히 하나 만든다. Immutable PR commit은 INTEGRATION 생성 조건이 아니라 미래 Runtime 진입 prerequisite다. Edge는 execution approval→WORK `APPROVES`, WORK→REVIEW/CI_VERIFICATION/SECURITY_REVIEW/ARCHITECTURE_REVIEW `VALIDATES`, EVIDENCE→consumer `PRODUCES_EVIDENCE_FOR`, validators→INTEGRATION과 INTEGRATION→merge approval `REQUIRES`, merge approval→merge-observed `APPROVES`, merge-observed→unlock `PRODUCES_EVIDENCE_FOR`, recovery→target `ROLLBACK_OF`로 고정한다. 모든 Node/edge는 `{source_wp, source_field, policy_rule_id}` provenance를 갖고 근거 없는 추론은 금지한다. Node UUIDv5 name은 graph ID+type+target WP/node+gate/evidence ID, edge name은 from+to+type+condition이며 packages/edges를 ID 정렬하고 topological tie는 node ID로 푼다. Hard는 완료 없이는 안전·정합성이 깨지는 의존, Soft는 정보상 선호다. canonical validation target은 Node `target_node`다. 독립 root component를 sorted root ID로 분리하되 연결 component가 `max_graph_nodes`를 넘으면 분리하지 않고 `DRP_LIMIT_EXCEEDED`; cycle·orphan·reachability를 함께 검사한다.

```yaml
workgraph: {graph_id: "", graph_revision: 1, requirement_set_digest: "", work_package_set_digest: "", workgraph_plan_digest: "", graph_status: PROPOSED, entrypoints: [], nodes: [], edges: [], graph_policy: {}, validation_result: {planner_status: READY_FOR_OWNER_REVIEW}}
lock_analysis: {required_locks: [{lock_id: "", node_id: "", lock_type: PATH, resource: "", mode: WRITE, scope: "", hold_until: ATTEMPT_END}], conflicts: [], safe_parallel_groups: [], serialized_groups: [], required_fence_types: [], integration_hold_required: false, integration_holds: [{source_node_id: "", required_lock_ids: [], reason: "", release_condition: {merge_event: true, expected_commit: true, expected_base: true, expected_checks: SUCCESS, reconciled: true}}]}
```

Canonical `graph_status`는 WorkGraph enum을 유지하고 Dry-run은 실행 전 `PROPOSED|VALIDATING|BLOCKED|STALE`만 기록한다. `validation_result.planner_status`는 `PROPOSED|VALIDATING|READY_FOR_OWNER_REVIEW|BLOCKED|STALE|REJECTED`이며 Runtime Node state가 아니다. `workgraph_plan_digest`는 WorkGraph Schema의 normative structure를 따른다. Planner는 Lock을 획득하거나 Attempt/Lease/Fence를 발급하지 않는다.

Lock은 Node의 module/path/shared fields에서 deterministic UUIDv5로 materialize하고 `node_id+type+canonical resource+mode+scope+hold_until`을 Graph Node lock과 `workgraph_plan_digest`에 동일하게 고정한다. Type은 `MODULE|PATH|SHARED_RESOURCE|BUILD_SYSTEM|WORKFLOW|MIGRATION_NAMESPACE|API_SCHEMA|DOCUMENT_INDEX`, mode는 READ/WRITE/EXCLUSIVE다. READ/READ만 기본 병렬, immutable snapshot 근거의 READ/WRITE만 조건부, overlapping WRITE/WRITE와 EXCLUSIVE는 직렬화한다. POSIX/NFC, Windows case-fold, glob·symlink·`..` 탈출을 검사하며 미정의 lock은 `BLOCKED`; BUILD_SYSTEM/WORKFLOW/MIGRATION_NAMESPACE/API_SCHEMA/DOCUMENT_INDEX 또는 `hold_until: PR_MERGED`는 Integration Hold와 per-resource Lock Fence 요구를 출력한다.

## 6. GitHub Issue 초안

```yaml
issue_drafts: [{work_package_id: "", renderer_version: "issue-template@1.0.0", canonical_fields: {}, title: "", body: "", labels: [], milestone: null, parent_issue: null, existing_issue_candidate: null, duplicate_check: {}, source_links: []}]
```

`canonical_fields`는 Work Package Schema의 목적·권위·범위·path·acceptance·test/check/evidence·risk/gate·자동화 정책, 숨김 ID/revision/digests, Requirement ID와 commit permalink를 key 순서로 고정한다. title/body는 versioned fixed template의 순수 rendering이어야 하며 자유문을 추가하지 않는다. 자동 closure는 금지하여 기본은 `Refs`; `Closes`는 별도 Owner closure 정책 없이는 쓰지 않는다. 기존 Open Issue는 ID+revision+digest+scope+acceptance가 일치할 때만 재사용 후보이며 ambiguous/duplicate는 차단한다. Label은 Projection이고 mutation하지 않는다.

## 7. 전체 출력, Digest와 판정

```yaml
dry_run:
  {dry_run_id: "", schema_version: "", generated_at: "", generated_by: "", input_snapshot: {},
   requirements: [], requirement_set_digest: "", work_packages: [], work_package_set_digest: "",
   workgraph: {}, issue_drafts: [], lock_analysis: {}, risk_summary: {}, human_decisions: [],
   external_evidence_gaps: [], warnings: [], errors: [], blocked_reasons: [],
   execution_summary: {executable_nodes: [], blocked_nodes: [], human_nodes: [], evidence_nodes: [], review_nodes: []},
   result: DRY_RUN_BLOCKED, result_digest: "sha256:<pending-canonical-bytes>"}
```

`result_digest` 논리 입력은 schema/input snapshot, Requirement records/set digest, Package normative records/set digest, Graph normative structure/plan digest, Issue `renderer_version+canonical_fields`, lock/risk/gate/gap/finding codes와 판정이다. rendered title/body, 설명 prose, labels 표시 순서, `generated_at`, 출력 경로, Markdown formatting, 조회 시각과 generator display version은 제외한다. `[OPEN]` canonical JSON byte 규칙을 확정하기 전에는 실제 digest를 authoritative로 발행하지 않고 placeholder와 `DRY_RUN_BLOCKED`를 사용한다.

| 판정 | 조건 |
| --- | --- |
| `DRY_RUN_VALID` | 오류·경고·차단 없음; 그래도 실행 권한 아님 |
| `DRY_RUN_VALID_WITH_WARNINGS` | 비차단 경고만 존재 |
| `DRY_RUN_BLOCKED` | conflict/gate/evidence/human/risk/limit/lock/dependency 차단 |
| `DRY_RUN_STALE` | source/policy/existing-state snapshot 변경 |
| `DRY_RUN_REJECTED` | 입력·권위·구조가 유효 계약을 만들 수 없음 |

차단 사유가 하나라도 있으면 partial branch와 관계없이 `execution_summary.executable_nodes: []`로 두며 후보 분석은 별도 목록에 보존한다. Warning은 검토 필요지만 계약상 안전성을 깨지 않고, Error는 판정을 BLOCKED/STALE/REJECTED로 만든다.

## 8. 오류 계약

`A/O/B`는 자동 수정 가능/Owner 개입 필요/전체 Dry-run 실행 후보 차단이며 값은 `Y|N`이다.

| 코드 | 발생 조건 | 급 | 결과 | A/O/B |
| --- | --- | --- | --- | --- |
| `DRP_INPUT_SHA_MISSING` | SHA 누락/형식 오류 | E | `DRY_RUN_REJECTED` | N/Y/Y |
| `DRP_SOURCE_NOT_FOUND` | repository/path/object 없음 | E | `DRY_RUN_REJECTED` | N/Y/Y |
| `DRP_SOURCE_BLOB_MISMATCH` | tree blob과 입력 불일치 | E | `DRY_RUN_REJECTED` | N/Y/Y |
| `DRP_SOURCE_TEXT_HASH_MISMATCH` | section bytes hash 불일치 | E | `DRY_RUN_STALE` | N/Y/Y |
| `DRP_SOURCE_STALE` | planning 중 source/policy/state 변경 | E | `DRY_RUN_STALE` | N/Y/Y |
| `DRP_POLICY_VERSION_MISSING` | policy 누락/미승인 | E | `DRY_RUN_REJECTED` | N/Y/Y |
| `DRP_REQUIREMENT_EXTRACTION_FAILED` | source를 record로 만들 수 없음 | E | `DRY_RUN_REJECTED` | N/Y/Y |
| `DRP_REQUIREMENT_NON_ATOMIC` | 독립 규범 혼합 | E | `DRY_RUN_BLOCKED` | Y/Y/Y |
| `DRP_REQUIREMENT_CONFLICT_UNRESOLVED` | conflict state≠RESOLVED | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_REQUIREMENT_NOT_EXECUTABLE` | non-exec Package로 안전 변환됨 | W | `DRY_RUN_VALID_WITH_WARNINGS` | Y/Y/N |
| `DRP_REQUIREMENT_SET_DIGEST_MISMATCH` | sorted set 재계산 불일치 | E | `DRY_RUN_REJECTED` | Y/N/Y |
| `DRP_WORK_PACKAGE_SCOPE_UNBOUNDED` | scope/out-of-scope 불명확 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_WORK_PACKAGE_PATH_POLICY_INVALID` | path 누락/탈출/충돌 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_WORK_PACKAGE_ACCEPTANCE_INVALID` | 검증 불가능/복수 결과 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_WORK_PACKAGE_GRANT_MISSING` | 실행 Grant/scope 불일치 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_WORK_PACKAGE_EVIDENCE_UNMET` | evidence 미수용/만료/충돌 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_WORK_PACKAGE_SET_DIGEST_MISMATCH` | package set 재계산 불일치 | E | `DRY_RUN_REJECTED` | Y/N/Y |
| `DRP_GRAPH_DEPENDENCY_MISSING` | edge 근거/endpoint 없음 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_GRAPH_HARD_CYCLE` | hard edge cycle | E | `DRY_RUN_REJECTED` | N/Y/Y |
| `DRP_GRAPH_ORPHAN_NODE` | root에서 미도달 Node | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_GRAPH_LOCK_CONFLICT` | lock 불명확/비직렬화 충돌 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_GRAPH_PLAN_DIGEST_MISMATCH` | graph canonical input 불일치 | E | `DRY_RUN_REJECTED` | Y/N/Y |
| `DRP_DUPLICATE_ACTIVE_ISSUE` | 동일 결과 active Issue 중복 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_EXISTING_ISSUE_AMBIGUOUS` | 재사용 후보가 다중/불일치 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_RISK_POLICY_EXCEEDED` | 허용 risk 초과 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_HUMAN_DECISION_REQUIRED` | OPEN/approval 결정 필요 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_EXTERNAL_EVIDENCE_REQUIRED` | acceptor evidence 필요 | E | `DRY_RUN_BLOCKED` | N/Y/Y |
| `DRP_LIMIT_EXCEEDED` | connected Package/Node/parallel 상한 초과 | E | `DRY_RUN_BLOCKED` | N/Y/Y |

## 9. 결정성, 보안, 저장과 Pilot

입력/Set은 ID·digest 순, path는 root-relative POSIX/NFC와 case-fold 비교, text/title은 NFC+LF+trim+공백 정규화, JSON key는 lexical, null과 `[]`은 구분하고 숫자/문자열 type을 보존한다. 랜덤 값과 모델 자유문은 ID/digest 입력에서 금지하며 제목·Issue body는 canonical template로 만들고 설명용 prose는 digest에서 제외한다. `dry_run_id`는 repository URI+SHA+scope+policy version UUIDv5다. 같은 입력의 두 실행은 display timestamp를 제외하고 같은 논리 결과여야 한다. [IMPLEMENTED FOUNDATION] `scripts/harness/canonical-json.mjs`와 `canonical-identity.mjs`가 approved normalization, JCS-compatible bytes, SHA-256와 repository UUIDv5 golden contract를 구현하지만 Planner는 구현하지 않는다.

Planner는 read-only Git object와 기존 Issue/PR 조회, stdout·OS temp 출력만 허용한다. 저장소/index/branch/worktree/GitHub/label/secret/Production/vendor mutation과 Worker 실행은 금지한다. Prompt는 경계가 아니며 sandbox, tool allowlist와 read-only token이 경계다.

| 저장 후보 | 판정 |
| --- | --- |
| stdout | [RECOMMENDED] 민감정보 없는 ephemeral 검토 |
| OS 임시 JSON | [RECOMMENDED] 기계 판독 원본; 실행 후 정리 |
| 검토용 JSON artifact | [REVISIT-WHEN] Owner가 보존·접근 정책 승인 |
| Markdown report | [RECOMMENDED] JSON의 사람용 Projection |
| GitHub PR attachment | [NOT-RECOMMENDED] 권위 원본 아님; 별도 업로드 권한 필요 |

Runtime Ledger 등록과 Issue 생성은 별도 단계다. AH-P0-01은 single-host SQLite authority와 GitHub projection을 승인된 design boundary로 두지만 별도 구현 Grant 전에는 저장 파일/table/API를 만들지 않는다.

[CONFIRMED] 첫 Pilot은 D-009를 primary approved Source, Slice 1 Product Implementation Approval Plan을 proposal decomposition/supporting Source, Issue #35를 bounded Execution Grant record, PR #36을 immutable historical completion evidence로 고정한 Product Bootstrap이다. 외부 Evidence·Production·Secret·Migration 없이 완료 결과와 비교하며 재실행하지 않는다. 예상 topology는 `WORK→{Architecture Review, CI Verification}→Integration→Owner Merge Approval→merge-observed EVIDENCE→후속 PR B Unlock`의 병렬 fan-out/fan-in이며 Requirement 후보, Work Package 1개, Issue 초안 1개, Lock 요구, Risk Summary, warning과 plan digest를 출력한다.

[IMPLEMENTED FOUNDATION] [Dry-run](../../../schemas/automation/dry-run.schema.json)과 [Error](../../../schemas/automation/error.schema.json) machine schema 및 structural contract test를 Issue #48에서 구현한다. Full JSON Schema engine, Extractor, semantic Validator, Planner, Runtime Ledger, Dispatcher, Hermes, Slack과 Issue 생성기는 미구현이다.
