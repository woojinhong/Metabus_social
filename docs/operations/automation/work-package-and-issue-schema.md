---
title: Work Package and GitHub Issue Schema Proposal
document_type: automation specification proposal
classification: proposal
status: Draft for owner review; no issue creation, agent execution or merge authority
implementation_ready: false
last_verified: 2026-07-30
related_documents: ["requirement-schema.md","../README.md","../github-workflow.md","../../discovery/decisions.md","../../discovery/slice-01-product-implementation-approval-plan.md","../../spec/traceability-implementation.md"]
decision_authority: H-session owner instruction authorizes this proposal documentation only; execution, issue creation, merge and follow-up unlock remain separately gated
---

# Work Package and GitHub Issue Schema Proposal

## 1. 목적과 권위 경계

[RECOMMENDED] 이 문서는 검증된 Requirement를 하나의 제한되고 검토 가능한 작업과 GitHub Issue 투영으로 표현한다. 입력은 [Requirement Schema](requirement-schema.md), 출력은 미래 WorkGraph 후보와 Issue 초안이다. 이 문서만으로 Issue 생성, Agent 실행, 코드 수정, Merge 또는 후속 Node 해제 권한을 부여하지 않으며 WorkGraph 상태·Edge·Dispatcher는 정의하지 않는다. Issue/PR은 승인 Spec을 대체하지 않고 Owner review·merge는 자동화 밖이라는 정책을 유지한다 ([GitHub workflow](../github-workflow.md) lines 19-36, 110-113).
## 2. Requirement에서 생성되는 조건

`valid source + atomic + not rejected/superseded + current snapshot + lifecycle-compatible type + executable이면 GRANTED + required evidence ACCEPTED/NOT_REQUIRED + bounded scope + verifiable acceptance`가 모두 참이어야 `READY`가 된다. 후보 생성은 실행 허가가 아니며 Work Package는 Requirement 권위·lifecycle·grant·evidence를 변경하지 않는다.
| Lifecycle | 허용 후보 | 실행 가능한 제품 Work Package |
| --- | --- | --- |
| `DRAFT` | DOCUMENTATION/DESIGN/HUMAN_DECISION | 불가 |
| `CONFIRMED` | 문서·설계·review·evidence | 별도 APPROVED+Grant 전 불가 |
| `APPROVED` | Requirement와 양립하는 모든 type | `GRANTED`+Evidence+package gate일 때만 |
| `OPEN` | DOCUMENTATION/DESIGN/EVIDENCE_COLLECTION/HUMAN_DECISION | 불가 |
| `BLOCKED` | blocker 조사·evidence·HUMAN_DECISION | blocker 해소 전 불가 |
| `EXTERNAL_EVIDENCE_REQUIRED` | EVIDENCE_COLLECTION/HUMAN_DECISION | Evidence 수용 전 불가 |
| `SUPERSEDED` | lineage 보존만 | 불가 |
| `REJECTED` | 감사 이력만 | 불가 |
`implementation_gate.state != GRANTED`이면 제품 코드·인프라·migration package를 만들 수 없다. `implementation_ready: false` proposal은 자체 Grant가 아니다 ([Traceability](../../spec/traceability-implementation.md) lines 97-125).
## 3. Work Package Schema

```yaml
{
schema_version: "1.0-proposal", work_package_id: "WP-<uuidv5>", work_package_revision: 1,
title: "", type: DOCUMENTATION, workstream: "", vertical_slice: null,
source_snapshot: {repository: "", repository_sha: "", source_digest: "sha256:", policy_version: ""},
source_requirements: [{requirement_id: "", requirement_record_hash: "sha256:", authority_status: APPROVED, lifecycle: APPROVED, execution_grant: NOT_GRANTED, evidence_state: NOT_REQUIRED}],
source_documents: [], authority_status: {source_authority: APPROVED, execution_grant: NOT_GRANTED, evidence_readiness: NOT_REQUIRED, package_status: PROPOSED},
objective: "", scope: [], out_of_scope: [], dependencies: [], blocks: [], owned_modules: [],
path_policy: {allowed_paths: [], forbidden_paths: [], shared_paths: [], required_paths: [], approved_exceptions: []},
expected_changes: [], acceptance_criteria: [{criterion_id: "AC-<uuidv5>", source_requirements: [], statement: "", verification_method: "", required_evidence: []}],
required_tests: [], required_checks: [], required_evidence: [],
risk: {level: LOW, factors: [], mitigations: []}, agent_profile: {role: "", capabilities: [], denied_capabilities: [], network_policy: DENY_BY_DEFAULT, secret_policy: NONE},
execution_mode: READ_ONLY, retry_policy: {max_retries: 0, retryable_errors: [], non_retryable_errors: [], backoff: NONE, same_error_limit: 1, new_attempt: true},
timeout_policy: {claim_seconds: 0, worker_seconds: 0, ci_seconds: 0, review_seconds: 0, human_approval_seconds: null}, budget: {max_execution_seconds: 0, max_tokens: 0, max_cost: 0, currency: USD, max_external_calls: 0},
human_approval: {execution: approval_record, review: approval_record, merge: approval_record, follow_up_unlock: approval_record},
external_evidence_gate: {requirement_ids: [], required_evidence: [], acceptor: null, state: NOT_REQUIRED, expires_at: null, conflicts: [], blocks_execution: false},
lock_requirements: {modules: [], paths: [], shared_resources: []}, rollback_or_recovery: [], completion_definition: [],
issue_mapping: {title: "", labels: [], milestone: null, parent_issue: null, existing_issue: null},
plan_digest: "sha256:", created_at: "", generated_by: ""
}
```
`approval_record`는 `{state: REQUIRED, actor: null, source: null, scope: [], source_sha: "", decided_at: null, valid_until: null}`다. 네 권위 축, package 상태와 네 사람 승인은 독립 필드이며 하나의 `status`/`approved` boolean으로 합치지 않는다.
## 4. 필드 정의표

표면 `I/C/L`은 Issue 표시/Agent Context 전달/미래 Runtime Ledger 저장, `Y/N/C`는 yes/no/conditional이다.
| 필드 | 필수·형식/허용 값 | 작성→검증 | 변경/새 Revision | I/C/L |
| --- | --- | --- | --- | --- |
| schema, ID, revision, title, type | Y; semver/UUIDv5/int/string/type enum | Planner→schema/ID validator | identity 불변; 내용/Y | Y/Y/Y |
| workstream, vertical_slice | Y/C; stable slug | Planner→Owner/reviewer | planning 전/Y | Y/Y/Y |
| source snapshot 4필드 | Y; URI/40-hex/hash/version | Compiler→Git/hash validator | source/policy/Y | Y/Y/Y |
| source requirements 6필드 | Y; ID/hash/권위 enum | Compiler→Requirement validator | upstream/Y | Y/Y/Y |
| source_documents | Y; snapshot locator[] | Planner→Git/authority review | source/Y | Y/C/Y |
| source_authority | Y; PROPOSAL/CONFIRMED/APPROVED/BLOCKED/SUPERSEDED | Compiler→authority review | 결정/Y | Y/Y/Y |
| execution_grant | Y; NOT_GRANTED/GRANTED/REVOKED/EXPIRED | grant record→authority review | grant/Y | Y/Y/Y |
| evidence_readiness | Y; NOT_REQUIRED/MISSING/PARTIAL/ACCEPTED/EXPIRED/CONFLICTING | acceptor→evidence review | evidence/Y | Y/Y/Y |
| package_status | Y; PROPOSED/VALIDATING/READY/BLOCKED/STALE/SUPERSEDED/CANCELLED/COMPLETED | Planner/ledger→state validator | event/N | Y/Y/Y |
| objective, scope, out_of_scope | Y; atomic string/string[] | Planner→Owner/reviewer | READY 전/Y | Y/Y/Y |
| dependencies, blocks | Y; WP ID[]; blocks derived | Planner/compiler→reference check | graph compile/Y | Y/Y/Y |
| owned_modules | Y; module ID[] | Planner→architecture review | READY 전/Y | Y/Y/Y |
| allowed_paths | Y; canonical path-rule[] | Planner→path validator | READY 전/Y | Y/Y/Y |
| forbidden_paths | Y; canonical path-rule[] | Planner→path validator | READY 전/Y | Y/Y/Y |
| shared/required paths, exceptions | Y; rules/approval locator[] | Planner/Owner→path review | 확대/Y | Y/Y/Y |
| expected_changes | Y; `{path,operation}`[] | Planner→scope review | READY 전/Y | Y/Y/Y |
| acceptance criteria 5필드 | Y; deterministic ID/trace/text/method/evidence | Planner→reviewer | 변경/Y | Y/Y/Y |
| required_tests | Y; command/test ID+environment+success+artifact[] | Planner→test review | 변경/Y | Y/Y/Y |
| required_checks | Y; check ID+provider+success[] | Planner→gate review | 변경/Y | Y/Y/Y |
| required_evidence | Y; typed evidence[] | Planner→completion review | 변경/Y | Y/Y/Y |
| risk 3필드 | Y; LOW/MEDIUM/HIGH/CRITICAL+arrays | Planner→risk owner | finding/scope/Y | Y/Y/Y |
| agent profile 5필드 | Y; capability/deny/network/secret contract | Planner→permission review | 모델 N, 권한 Y | Y/Y/Y |
| mode/retry/timeout/budget | Y; enum+finite bounds | Planner/Owner→runtime/budget review | 확대/Y | C/Y/Y |
| human execution approval | Y; approval record | Owner/delegate→authority review | decision/Y | Y/Y/Y |
| human review approval | Y; approval record | reviewer/Owner→gate validator | decision/N | Y/N/Y |
| human merge approval | Y; approval record | Owner→integrator validator | decision/N | Y/N/Y |
| follow-up unlock approval | Y; approval record | Owner/policy→graph validator | decision/N | Y/N/Y |
| external evidence gate | Y; typed gate | Planner/acceptor→evidence review | evidence/Y | Y/Y/Y |
| locks, recovery, completion | Y; module/path/resource/step[] | Planner→reviewer | READY 전/Y | Y/Y/Y |
| issue mapping, digest, audit metadata | Y; projection/hash/RFC3339/generator | Compiler→mapping/hash/schema | plan Y; binding/audit N | Y/C/Y |
## 5. Work Package ID와 Revision

[RECOMMENDED] Requirement Schema와 같은 canonical repository URI 기반 UUIDv5 namespace를 쓴다. name은 `normalized workstream/slice + type + sorted source Requirement IDs + normalized objective identity`, 표시는 `WP-<calculated-uuidv5>`이며 계산기 전에는 Placeholder다. Requirement record hash, scope/out-of-scope, acceptance, path, risk/gate, policy나 capability 변경은 같은 논리 결과의 revision과 digest를 바꾼다. 모델 교체, retry/attempt는 계약이 같으면 revision을 바꾸지 않는다. objective/type/Requirement 결과 집합이 달라지거나 독립 결과로 분리되면 새 ID다.
`plan_digest`는 schema+source hashes+normative scope/path/acceptance/test/check/evidence/risk/profile/gates/runtime bounds/locks/recovery/completion의 canonical JSON SHA-256이며 projection/runtime timestamps는 제외한다. 동일 ID·digest는 재사용하고 동일 ID·다른 digest는 덮어쓰지 않고 새 revision을 `VALIDATING`한다.
## 6. Work Package 유형

`C`는 권위·Grant·risk·path gate 충족 시만 가능, 사람 칸 `Y`는 승인 필수다. 모든 Git 변경의 자동 Merge는 `N`이다.
| Type | Auto/Code/Infra/External/Net | 사람 실행/Merge | 최소 Evidence/Retry/AutoMerge |
| --- | --- | --- | --- |
| DOCUMENTATION | C/N/N/C/DENY | C/Y | diff+docs checks+review/C/N |
| DESIGN | C/N/N/C/DENY | C/Y | proposal+traceability+review/C/N |
| SPIKE | C/C/N/C/ALLOWLIST | Y/Y | hypothesis+repro+limits/C/N |
| BOOTSTRAP | C/Y/N/N/DENY | Y/Y | diff+tests+CI+review/C/N |
| IMPLEMENTATION | C/Y/N/C/DENY | Y/Y | acceptance map+tests+CI+review/C/N |
| TEST | C/Y/N/C/DENY | C/Y | failing/passing evidence+CI/C/N |
| SECURITY_REVIEW | C/N/N/C/ALLOWLIST | C/Y | findings+severity+verdict/C/N |
| ARCHITECTURE_REVIEW | C/N/N/C/DENY | C/Y | boundary findings+verdict/C/N |
| EVIDENCE_COLLECTION | C/N/N/Y/ALLOWLIST | C/Y | source/date/access/limits+acceptance/C/N |
| MIGRATION | N/Y/C/N/DENY | Y/Y | forward/rollback+DB verification/N/N |
| DEPLOYMENT | N/C/Y/Y/ALLOWLIST | Y/Y | approval+deploy/health/rollback/N/N |
| OPERATIONS | C/C/C/C/ALLOWLIST | Y/Y | runbook+dry-run+review/C/N |
| HUMAN_DECISION | N/N/N/C/DENY | Y/Y | durable decision record/N/N |
외부 계약, 개인정보 보존, 운영 데이터 삭제, Production 배포, Secret 변경, 결제, 법률 판단과 Incident 파괴 조치는 자동 실행하지 않고 `HUMAN_DECISION` 또는 명시적 사람 승인 Node를 선행한다.
## 7. Scope와 Path Policy

한 package는 하나의 독립 검토 결과만 가지며 objective/scope는 acceptance로 검증한다. `out_of_scope`는 필수이고 “필요한 모든 변경”은 `WP_SCOPE_UNBOUNDED`다. Path는 root 상대 POSIX canonical path/glob과 `CREATE|MODIFY|DELETE`를 쓰며 absolute, `..`, symlink, case-fold 탈출을 막는다. 코드 변경에 빈 allowed set은 금지하고 forbidden이 우선한다. SOT/Decision/ADR, secrets, production, migrations와 타 package 영역은 기본 금지이며 Owner source·scope·SHA가 있는 exception만 허용한다. build, workflow, 공통 schema/module, migration namespace, 문서 index는 shared path와 lock 요구만 선언하며 Lock 실행은 미래 WorkGraph 책임이다.
## 8. Acceptance Criteria

Criterion ID는 `WP ID + normalized statement + sorted source Requirement IDs` UUIDv5다. Requirement `acceptance_intent`를 검증 결과로 구체화하며 한 Requirement는 여러 criterion으로 나눌 수 있다. 하나의 evidence가 한 결과로 여러 Requirement를 검증할 때만 합치고 그 외는 분리한다. 비기능은 측정/정적 검사, 보안·architecture는 지정 reviewer verdict, 사람 판단은 actor+durable record를 method로 쓴다. “정상/적절/필요한 테스트”와 복수 독립 결과는 거부하며 criterion 변경은 새 revision이다.
## 9. Tests, Checks, Evidence

| 구분 | 계약 |
| --- | --- |
| `required_tests` | command 또는 stable test ID, environment, success condition, result artifact |
| `required_checks` | diff/path/source-SHA/CI/security/architecture/dependency gate와 provider/verdict |
| `required_evidence` | changed files, commit, PR, acceptance mapping, test/check result, reviews/findings, known failures, recovery |
테스트 이름만 있고 실행법·식별자·성공 조건·결과 요구가 없으면 `READY`가 아니다.
## 10. 위험 수준

SOT, security, privacy, authn/authz, migration, production, secret, external service, shared build, multi-module, rollback와 testability를 평가한다.
| Risk | Agent/독립 review | 사람 실행·Merge | Retry/자동 실행 |
| --- | --- | --- | --- |
| LOW | bounded/표준 review | 실행 C/Merge Y | bounded/C |
| MEDIUM | specialist 가능/독립 Y | 변경 Y/Merge Y | bounded/비제품만 C |
| HIGH | 지정 specialist/보안·architecture | Y/Y | 명시 승인만/N |
| CRITICAL | HUMAN_ONLY·감독/복수 review | Y/Y | 자동 retry N/N |
`HIGH`/`CRITICAL`은 자동 실행·Merge하지 않으며 누락 factor는 `WP_RISK_UNDERCLASSIFIED`다.
## 11. Agent Profile

Profile은 모델명이 아니라 capability 계약이다. 예: `bounded-java-bootstrap-worker`에 `READ_REPOSITORY`, `WRITE_ALLOWED_PATHS`, `RUN_LOCAL_TESTS`, `CREATE_DRAFT_PR`만 주고 `MERGE_PR`, `MODIFY_SECRETS`, `DEPLOY_PRODUCTION`, `CHANGE_REQUIREMENTS`, `EXPAND_SCOPE`를 거부한다. Prompt는 보안 경계가 아니며 실제 tool permission과 sandbox가 경계다. Worker는 Requirement/grant/evidence, 다른 package claim/생성, merge를 바꿀 수 없고 Context 부족은 scope 확대 대신 `BLOCKED`다.
## 12. Execution Mode, Retry, Timeout, Budget

`READ_ONLY`, isolated `WORKTREE`, stronger `SANDBOX`, `HUMAN_ONLY`만 허용한다. retry는 유한 횟수, retryable/non-retryable 오류, 동일 오류 한계, backoff와 새 attempt 여부를 가진다. stale source, permission/evidence/gate, non-atomic scope는 retry하지 않는다. claim/worker/CI/review timeout과 실행 시간/token/비용/외부 호출은 유한 상한이다. `human_approval_seconds: null`은 실행 중 무제한이 아니라 package의 무기한 비실행 대기다.
## 13. 사람 승인과 External Evidence Gate

각 승인은 `NOT_REQUIRED|REQUIRED|GRANTED|REVOKED|EXPIRED`, actor, durable source, scope, source SHA, time, expiry를 가진다. Requirement Execution Grant, package execution/review/Merge/follow-up unlock은 서로 대체하지 않는다. Slack/label만으로 고위험 승인을 확정하지 않고 SHA/scope 변경은 재검증한다. Evidence gate는 Requirement, 자료, acceptor, `NOT_REQUIRED|MISSING|PARTIAL|ACCEPTED|EXPIRED|CONFLICTING`, 만료·충돌·차단을 기록하며 Worker는 우회할 수 없다.
## 14. 완료 정의와 Evidence

완료는 각 `Criterion -> changed files -> test -> CI check -> review verdict`와 필수 evidence가 같은 PR commit을 가리킬 때만 가능하다. criterion 누락, test 미실행/실패, check/approval/evidence 미충족, source digest 불일치, path 위반, HIGH/BLOCK finding, PR/evidence commit 불일치, known failure 은폐, secret/개인정보 포함은 실패다. Agent의 완료 선언은 evidence가 아니다.
## 15. GitHub Issue 변환

```markdown
## 목적
## 권위 근거
## 포함 범위
## 제외 범위
## 선행 작업
## 허용 변경 경로
## 금지 변경 경로
## 구현 또는 조사 내용
## Acceptance Criteria
## 필수 테스트
## 필수 검증
## 완료 Evidence
## 위험과 승인 Gate
## 자동화 정책
<!-- work-package-id: WP-...; work-package-revision: 1 -->
<!-- plan-digest: sha256:...; source-sha: 40-hex -->
```
제목은 `[WP:<work_package_id>][<TYPE>] <title>`이다. Requirement IDs와 commit permalink/line, slice, milestone, parent/child를 표시한다. Open Issue는 scope+acceptance+ID/digest 일치 때만 bind하며 closed Issue는 감사 링크다. Owner-only closure 때문에 자동화는 `Refs #n`만 쓰고 `Closes`로 닫지 않는다 ([GitHub workflow](../github-workflow.md) lines 73-113, 135-140). Issue/label은 미래 Runtime Ledger의 projection이다.
## 16. Label 규격

[CONFIRMED] 현재 Issue templates는 `labels: []`이다 (`../../../.github/ISSUE_TEMPLATE/documentation.yml` lines 1-5). [RECOMMENDED] 후보는 `agent:{ready,claimed,running,review,blocked,failed,paused}`, `gate:{human,external-evidence,security,architecture,privacy}`, `type:{documentation,design,spike,bootstrap,implementation,test,evidence}`, `risk:{low,medium,high,critical}`, `slice:01`, `module:{account,authentication,authorization}`다. Label은 검색·표시·routing projection이고 수동 변경은 상태 전이를 만들지 않는다. Ledger 불일치는 drift로 차단하며 저장 구조는 후속 WorkGraph에서 정한다.
## 17. 중복과 재사용

중복 키는 `repository + work_package_id + plan_digest`다. 같은 ID·digest는 active package/Issue를 재사용하고 같은 ID·다른 digest는 새 revision, 다른 ID지만 Requirement+scope가 같으면 의미 중복 경고다. Open Issue는 metadata·scope·acceptance 일치 때만 bind하고 closed/COMPLETED evidence는 감사 근거일 뿐 신규 실행 권한이 아니다. source 변경은 `STALE` 재검증, `SUPERSEDED`는 신규 실행 금지다. Agent는 유사 Issue를 임의로 닫거나 재사용하지 않는다.
## 18. 정상 예시: Slice 1 Product Bootstrap

[CONFIRMED] 이는 병합 전 PR A의 역사적 Schema 예시다. 현재 `master` `446ba9f3e31381c43d9f1b13f14129ae9cb50622`에는 PR #36 구현이 병합됐으므로 신규 Issue/실행 지시가 아니다.
```yaml
{
work_package_id: "WP-<calculated-uuidv5>", work_package_revision: 1, type: BOOTSTRAP, source_snapshot: {repository: "https://github.com/woojinhong/Metabus_social", repository_sha: ce168d5381015e46171a13c2a3b2b80509c299b1, source_digest: "sha256:<calculated>", policy_version: "requirement-schema@1.0-proposal"},
source_requirements: [{requirement_id: "REQ-<java25-bootstrap-uuidv5>", requirement_record_hash: "sha256:<calculated>", authority_status: APPROVED, lifecycle: APPROVED, execution_grant: GRANTED, evidence_state: NOT_REQUIRED}], source_documents: [{path: docs/discovery/decisions.md, lines: 73-78, blob: 01598392614871ea2c4b8e136574e8fa5bf0e05c, role: "approved D-009"}, {path: docs/discovery/slice-01-product-implementation-approval-plan.md, lines: 80-93, blob: 7ebec161f53931dbeb590b7e486bd30564d0ab3b, role: "proposal decomposition"}],
authority_status: {source_authority: APPROVED, execution_grant: GRANTED, evidence_readiness: NOT_REQUIRED, package_status: READY}, objective: "후속 PR용 기능 없는 Java/Spring Boot build·module·quality 기반",
scope: ["root Gradle KTS/wrapper", "Java 25 and Boot 4.1 shell", "metabus.social module skeleton", "DB-free tests", "Spotless/SpotBugs/Modulith", "Java CI"], out_of_scope: ["feature behavior", "security/session", "controller/API/DTO", "Flyway/PostgreSQL/migration", deployment], dependencies: ["PR #34 merged", "Issue #35 scoped Owner execution grant"],
path_policy: {allowed_paths: [build.gradle.kts, settings.gradle.kts, "gradle/**", gradlew, gradlew.bat, "src/**", .github/workflows/java-ci.yml, .gitignore, README.md], forbidden_paths: [docs/discovery/decisions.md, "docs/spec/**", "docs/adr/**", "**/db/migration/**", "**/*secret*"], shared_paths: [build.gradle.kts, .github/workflows/java-ci.yml]},
acceptance_criteria: [{criterion_id: "AC-<context-uuidv5>", statement: "DB·secret·외부 서비스 없이 context load 성공", verification_method: "./gradlew test", required_evidence: ["test result"]}, {criterion_id: "AC-<module-uuidv5>", statement: "module cycle/internal access/승인 방향 위반 0", verification_method: "Modulith verification test", required_evidence: ["test result"]}, {criterion_id: "AC-<quality-uuidv5>", statement: "format, SpotBugs, build와 최소권한 CI 성공", verification_method: "local commands + remote checks", required_evidence: [checks, CI]}],
required_tests: ["gradlew.bat clean build", "gradlew.bat spotlessCheck", "gradlew.bat test", "gradlew.bat spotbugsMain"], required_checks: ["node scripts/docs/validate-docs.mjs", "git diff --check", "allowed-path check", "remote CI", "architecture/build-supply-chain review"],
required_evidence: [changed_files, commits, pull_request, acceptance_mapping, tests, checks, reviews, known_failures, rollback_or_recovery], risk: {level: MEDIUM, factors: ["shared build", CI, multi-module], mitigations: ["bounded paths", "no product behavior", "independent review"]},
agent_profile: {role: bounded-java-bootstrap-worker, capabilities: [READ_REPOSITORY, WRITE_ALLOWED_PATHS, RUN_LOCAL_TESTS, CREATE_DRAFT_PR], denied_capabilities: [MERGE_PR, EXPAND_SCOPE, MODIFY_SECRETS, DEPLOY_PRODUCTION], network_policy: DENY_BY_DEFAULT, secret_policy: NONE},
human_approval: {execution: "GRANTED by Owner via Issue #35 for PR A", merge: REQUIRED, follow_up_unlock: "REQUIRED: Owner merge + green remote CI before PR B"},
completion_definition: ["criteria mapped", "tests/checks pass", "HIGH/BLOCK zero", "Draft PR evidence"], issue_mapping: {existing_issue: 35, labels: []}, plan_digest: "sha256:<placeholder>"
}
```
D-009는 Source Authority, proposal plan은 분해 근거, Issue #35는 제한된 Execution Grant이며 서로의 권위를 대신하지 않는다.
## 19. 거부 예시와 미래 Validator

다음 오류는 모두 해소 전 `READY`를 금지한다: `WP_REQUIREMENT_MISSING`(참조 없음), `WP_REQUIREMENT_STALE`(hash/source 변경), `WP_REQUIREMENT_NOT_EXECUTABLE`(lifecycle/type 불일치), `WP_OPEN_REQUIREMENT_IMPLEMENTATION`(OPEN 구현), `WP_EXECUTION_GRANT_MISSING`, `WP_EXTERNAL_EVIDENCE_UNMET`, `WP_SCOPE_UNBOUNDED`, `WP_ALLOWED_PATHS_EMPTY`, `WP_PATH_POLICY_CONFLICT`, `WP_ACCEPTANCE_NOT_VERIFIABLE`, `WP_REQUIRED_TEST_UNDEFINED`, `WP_RISK_UNDERCLASSIFIED`, `WP_HUMAN_GATE_MISSING`, `WP_DUPLICATE_ACTIVE_PACKAGE`, `WP_PLAN_DIGEST_MISMATCH`, `WP_SUPERSEDED_SOURCE`. Superseded/OPEN은 새 권위 결정 없이는 해결되지 않고 duplicate는 기존 bind 또는 사람 판단, 나머지는 해당 계약 재검증이 필요하다.
[RECOMMENDED] 미래 Validator는 필드·enum·hash/time, Requirement/record hash, commit/path/blob/digest, lifecycle/type/Grant/Evidence, scope/out-of-scope, path canonicalization·교집합·탈출, acceptance, test/check, risk/gate/profile, bounded retry/timeout/budget, Issue metadata, duplicate/digest, proposal 권위 승격, OPEN 구현과 auto Merge를 검사한다. 실패는 `READY`를 차단하고 권위 결정을 생성하지 않는다. [CONFIRMED] 이번 단계는 계약만 기록하며 Validator, WorkGraph와 Runtime Ledger는 구현하지 않는다.
[CONFIRMED] 한 Issue 한 결과, 중복 검색, branch/commit/Draft PR와 Owner-only closure는 [GitHub workflow](../github-workflow.md) lines 58-113, 135-140에 있다. Product Bootstrap은 [approval plan](../../discovery/slice-01-product-implementation-approval-plan.md) lines 80-93이고 lines 147-155는 Owner 승인 전 실행을 막았다. [OPEN] UUID namespace URI의 영구 표기, canonical JSON, Runtime Ledger/WorkGraph 상태와 label 동기화는 후속 승인 문서가 정해야 한다.
