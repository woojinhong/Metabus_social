---
title: Autonomous Harness Authority and Canonical Identity Approval Plan
document_type: automation foundation decision
classification: user decision
status: Bounded AH-P1-01 implemented for Owner review; runtime and product execution not granted
implementation_ready: false
last_verified: 2026-07-31
related_documents: ["autonomous-harness-readonly-planner-authority.md","../operations/autonomous-harness-readiness-audit-2026-07-31.md","../../schemas/automation/requirement.schema.json","../operations/automation/requirement-schema.md","../operations/automation/work-package-and-issue-schema.md","../operations/automation/workgraph-state-lock-schema.md","../operations/automation/dry-run-planner-contract.md","../operations/github-workflow.md"]
decision_authority: explicit Owner instructions on 2026-07-31 authorize AH-P0-02 and the bounded Issue #50/#52 AH-P1-01 implementation scope
---

# 자율형 Harness 권한과 Canonical Identity 승인 계획

## 1. 목적과 권위

이 문서는 AH-P0-01의 Owner-approved bounded foundation이다. 같은 pinned 입력에서 같은 공식
ID, digest와 plan을 만들기 위한 baseline을 한곳에 모은다. 근거는
[준비도 감사](../operations/autonomous-harness-readiness-audit-2026-07-31.md)와 네
automation 계약이다. PR #47/#49는 AH-P0-02를 고정했고, [AH-P1-01 권한](autonomous-harness-readonly-planner-authority.md)은
Owner-pinned 입력에서 Proposal만 만드는 bounded Planner 구현을 승인한다. Runtime과
product Execution Grant는 아니다.

## 2. 승인 baseline

| 결정 영역 | 승인 baseline | 현재 상태 |
| --- | --- | --- |
| Canonical repository | `https://github.com/woojinhong/metabus_social` | APPROVED |
| Stable namespace | RFC 4122 URL namespace에서 repository URI로 만든 project UUIDv5 | APPROVED |
| Canonical JSON | schema normalization 뒤 RFC 8785 JCS bytes, SHA-256 | APPROVED |
| Schema version | SemVer; 첫 machine schema `1.0.0` | APPROVED |
| Semantic authority | LLM은 Candidate만; Owner/reviewer-pinned Requirement만 Compiler 입력 | APPROVED |
| Runtime authority | 단일 local Dispatcher가 쓰는 SQLite Ledger | APPROVED_DESIGN_ONLY |
| GitHub 역할 | Issue/Project/Label/Check/PR은 Ledger projection | APPROVED_DESIGN_ONLY |
| AH-P0-02 | machine schema와 canonicalization fixture만; 실행·mutation 없음 | AUTHORIZED_SCHEMA_ONLY |
| AH-P1-01 | pinned canonical Requirement→deterministic dry-run Proposal | IMPLEMENTED_FOR_OWNER_REVIEW |

Machine Schema foundation과 Planner는 공식 ID/digest와 Proposal을 검증·생성할 수 있지만
Dispatcher, Ledger 또는 Writer처럼 authoritative runtime record를 발행할 권한은 없다.

## 3. Canonical repository와 ID

Repository URI는 HTTPS, lowercase host/owner/repository, `.git`과 trailing slash 없음으로
정규화한다. remote alias, local path, branch, worktree와 clone URL credential은 identity가
아니다. 이 저장소의 제안 URI는 위 표의 값이다.

Project namespace는 RFC 4122 URL namespace에 canonical repository URI를 넣은 UUIDv5다.
Requirement, Work Package, WorkGraph, Node, Edge, Lock과 Criterion은 이 project
namespace와 각 계약의 normalized name으로 UUIDv5를 만든다. 기존 `FR/UX/SR/NFR-*`는
Requirement Schema의 직접 stable ID 규칙을 유지한다.

공식 ID는 pinned source SHA/blob, canonical record와 검증된 Owner/reviewer record에서만
계산한다. LLM Candidate의 `candidate_ref`는 run-local opaque reference이고 공식
`REQ-*`, set digest, duplicate key 또는 실행 입력이 아니다. 같은 normalized name은 같은
ID, identity 입력의 의미 변경은 새 ID와 `supersedes`, record만 바뀌면 같은 ID의 새
revision/digest다.

## 4. 공식 JSON과 digest

AH-P0-02의 JSON Schema가 Requirement, Work Package, WorkGraph, Dry-run과 error record의
공식 field/type/nullability를 정한다. Markdown/YAML-like 예시는 설명용 projection이다.

Canonical bytes는 다음 순서로 만든다.

1. schema에 따라 optional omission과 explicit `null`, array와 set-like collection을
   구분한다.
2. text는 Unicode NFC, line ending LF, path는 root-relative POSIX로 정규화한다.
3. set-like collection은 계약의 stable key로 정렬하고 semantic array 순서는 보존한다.
4. runtime timestamp, rendered prose, local path와 projection field는 각 계약이 제외한
   digest 입력에서 제거한다.
5. normalized JSON을 RFC 8785 JCS로 serialize하고 UTF-8 bytes의 SHA-256을 lowercase
   `sha256:<64-hex>`로 기록한다.

NaN/Infinity, duplicate object key, unpaired Unicode surrogate, schema 밖 field와 자유문
LLM output은 canonical record에서 거부한다. JSON rendering 전 normalization과 JCS 뒤
hashing은 서로 다른 단계이며 둘 다 golden fixture로 고정한다.

## 5. Schema version과 호환성

모든 automation record는 `schema_id`와 SemVer `schema_version`을 가진다. AH-P0-02 machine
schema의 통일 version은 `1.0.0`이다. 기존 prerelease record는 실행 입력으로 재사용하지 않는다.

- Major: field 의미/type/requiredness, canonicalization 또는 ID input의 incompatible 변경.
- Minor: 새 optional field처럼 새 reader가 같은 major의 이전 record를 읽는
  backward-compatible 변경. 이전 reader는 모르는 minor를 fail closed한다.
- Patch: instance 의미와 canonical bytes를 바꾸지 않는 schema 설명/validator 수정.
- Prerelease: proposal/fixture이며 실행 권한과 production compatibility를 주장하지 않는다.

Historical record는 overwrite하지 않는다. Deterministic migrator는 source schema/version,
source record digest, target version과 migration ID를 가진 새 record를 만들며 Owner가
승인한 migration path만 쓴다. Schema 변경으로 canonical record가 바뀌면 record/set/plan
digest를 다시 계산하고 영향 Node를 STALE로 둔다.

## 6. LLM, Owner와 Compiler 경계

1. LLM Extractor는 source snapshot에서 Candidate와 근거 locator를 제안한다.
2. Validator는 source SHA/blob/text, atomicity, authority, conflict와 evidence gap을
   확인하되 승인하지 않는다.
3. Owner 또는 위임된 reviewer가 canonical Requirement record/set, scope와 source SHA를
   pin하고 durable approval record를 남긴다.
4. Deterministic Compiler는 pinned set만 받아 Work Package, WorkGraph와 Issue draft를
   만든다. 모델 자유문은 ID/digest 입력이 아니다.
5. Execution Grant, Evidence acceptance, review, merge와 follow-up unlock은 서로 다른
   record이며 어느 단계도 앞 단계의 권위를 자동 승격하지 않는다.

Candidate extraction의 재현성과 Compiler 결정성을 혼동하지 않는다. Candidate 차이는
review 대상이고, 같은 pinned canonical input의 Compiler 결과 차이는 오류다.

## 7. Runtime authority와 GitHub projection

첫 Runtime Ledger 권고안은 single-host SQLite다. 단일 Dispatcher만 write하며 transaction,
unique constraint, row version/CAS, append-only event, Attempt/Lease/Lock fence와 outbox를
권위로 쓴다. SQLite file, table, migration과 Dispatcher 구현은 AH-P4 별도 승인 전
만들지 않는다.

GitHub Issue, Project/Kanban, Label, Check와 PR은 사람용 projection이다. 수동 변경,
eventual consistency, API 장애나 삭제가 Ledger transition, approval, Claim 또는
COMPLETED를 만들지 않는다. Webhook과 polling reconciliation은 projection drift만
수정한다. `.omx`, Agent memory, chat과 local JSON file도 runtime authority가 아니다.

## 8. Capability와 금지선

| 단계 | 허용 후보 | 계속 금지 |
| --- | --- | --- |
| AH-P0-01 | Markdown audit/proposal/contract 정합화 | code/schema/dependency/runtime/GitHub Project 설정 |
| AH-P0-02 | machine JSON Schema, canonical fixtures, read-only contract tests | Planner/Dispatcher/Ledger/Worker/mutation |
| AH-P1-01 | Owner-pinned canonical Requirement compile, Dry-run Proposal | extraction, Planner의 Issue/Project/branch/tracked-file/PR mutation |
| Writer Pilot | 별도 Grant 뒤 Issue/Project projection과 Draft PR | merge/Issue close/Ready/direct push |
| Worker Pilot | 별도 product/Harness Grant와 sandbox 뒤 bounded worktree | scope 확대, secret, deploy, vendor, production |

PR C/D, V7+ migration, authoritative API/realtime/frontend, cloud/vendor/live Pilot,
automatic merge, Issue closure, protected-branch direct/force push, destructive Git와 rule
self-modification은 이 proposal로 승인되지 않는다.

## 9. 멱등성, 동시성과 복구 효과

Requirement/WP/Graph ID와 digest는 same pinned input의 중복 생성을 막는다. Issue duplicate
key는 `repository + work_package_id + work_package_plan_digest`다. Ledger의 atomic Claim,
lease와 fence는 같은 Node의 중복 Worker와 stale publication을 막고, outbox는 GitHub
projection 재시도를 담당한다. 이 효과는 AH-P0-02/P4 구현과 검증 뒤에만 성립하며 현재는
설계 목표다.

## 10. Owner 승인 결과

Owner는 canonical repository URI/UUIDv5, JCS+SHA-256, SemVer 호환성, Candidate-only LLM,
pinned Requirement Compiler input, SQLite authority design, GitHub projection-only와
AH-P0-02 schema-only 범위와 AH-P1-01 bounded read-only Planner 구현을 승인했다.
Issue #52 구현은 그 경계에서 Planner, golden fixture와 tests만 추가한다. Planner 출력은
Proposal이고 Candidate 입력, Dispatcher/Ledger/Writer/Worker, GitHub mutation과 제품
실행은 승인하지 않았으며 계속 별도 Gate다.

## 11. AH-P0-02 완료 근거

Issue #48은 `schemas/automation/{common,requirement,work-package,workgraph,dry-run,error}.schema.json`,
`scripts/harness/{canonical-json,canonical-json.test,schema-contract.test}.mjs`,
`scripts/harness/{canonical-identity,canonical-identity.test}.mjs`와
`scripts/harness/fixtures/{schema,canonical,identity}/**`를 구현한다. 제품 source, database/migration,
GitHub writer와 third-party dependency는 제외한다.

Acceptance는 (1) 모든 schema JSON parse와 `$id`/version/ref 고정, (2) valid/invalid fixture,
(3) NFC/path/set/null normalization, (4) JCS bytes와 SHA-256 golden vector, (5) 같은 pinned
input 두 번 실행 byte equality, (6) unknown/newer/incompatible version fail closed,
(7) Candidate가 official ID/digest/READY를 만들 수 없음이다. 실제 JSON Schema engine이나
dependency가 필요하면 AH-P0-02 시작 전 별도 dependency Gate를 연다.

## 12. 남은 비결정과 종료 상태

GitHub Project/field/option ID, GitHub App permission, branch protection 설정, heartbeat/lease,
fence overflow, PR/concurrency/token/cost 숫자, full JSON Schema engine과 Graph migration
구현은 후속 Gate다. 이 문서는 그 값을 추측하지 않는다.

AH-P0-01은 PR #47, AH-P0-02는 PR #49로 완료됐다. AH-P1-01 승인 기록은 PR #51로
`master`에 병합됐고 Issue #52의 bounded 구현은 Owner review 대상이다. Full JSON Schema
engine은 필요하지 않아 dependency를 추가하지 않았다. Spec 자동 추출, Issue/Kanban
writer, Worktree runner, Dispatcher/Ledger/Critic/Worker, 제품 코드 자동 수정과 AH-P2는
미구현·미승인이며 각각 별도 Owner Gate, pinned input, mutation 계약과 검증이 필요하다.
