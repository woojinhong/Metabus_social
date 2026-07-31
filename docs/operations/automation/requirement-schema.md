---
title: Requirement Extraction Schema Proposal
document_type: automation specification proposal
classification: proposal
status: Machine schema foundation implemented; no product or agent execution authority
implementation_ready: false
last_verified: 2026-07-31
related_documents: ["../../../schemas/automation/requirement.schema.json","../../discovery/autonomous-harness-readonly-planner-authority.md","../../discovery/autonomous-harness-foundation-approval-plan.md","../autonomous-harness-readiness-audit-2026-07-31.md","../../INDEX.md","../README.md","../github-workflow.md","../../discovery/decisions.md","../../spec/traceability-implementation.md","../../discovery/slice-01-product-implementation-approval-plan.md"]
decision_authority: Owner instructions on 2026-07-31 authorize the machine schema and bounded read-only Planner consumption; product and agent execution remain separate
---

# Requirement Extraction Schema Proposal

## 1. 목적과 적용 범위

[RECOMMENDED] 이 문서는 병합된 Decision, 승인 Spec/SOT, Architecture, ADR와 proposal-only 구현 계약에서 atomic Requirement를 결정적으로 추출·추적하는 규격이다. 출력은 후속 Work Package 후보 입력이며 Work Package, WorkGraph 또는 실행 규격이 아니다. 이 문서만으로 제품 구현 권한이나 Agent 실행 권한을 부여하지 않는다. Agent는 `[OPEN]`, proposal 또는 evidence gap을 임의로 확정할 수 없다. 권위 순서와 Stable ID 규칙은 [Documentation Index](../../INDEX.md) lines 33-43, 77-83을 따른다.
## 2. 권위 원본과 Source Snapshot

```yaml
source_snapshot:
  repository: https://github.com/woojinhong/metabus_social
  repository_sha: 40-character commit SHA
  document_path: repository-relative Git path
  document_blob_sha: Git blob SHA
  section_anchor: normalized Markdown heading anchor
  line_range: {start: 1, end: 1}
  source_text_hash: sha256:<hex>
```

[RECOMMENDED] Branch는 이동하므로 identity가 아니며 commit과 blob을 함께 고정한다. 줄은 이동하므로 locator일 뿐 ID 입력이 아니다. `document_path` 이동은 동일 blob/text와 Git history가 입증되면 `identity_path`를 유지하고 location history를 추가한다. 문장 변경, Source SHA 변경 또는 삭제는 재검증하며 삭제 레코드는 지우지 않고 `BLOCKED` 또는 `SUPERSEDED`로 보존한다. 같은 문장은 각 Source snapshot을 별도 수집한 뒤 가장 높은 단일 권위 Source를 primary로, 나머지를 supporting source로 둔다.
## 3. Requirement Schema

```yaml
schema_id: "https://github.com/woojinhong/metabus_social/schemas/automation/requirement.schema.json"
schema_version: "1.0.0"
requirement_id: FR-... | REQ-<uuidv5>
requirement_kind: FUNCTIONAL | UX | SAFETY | NON_FUNCTIONAL | POLICY | ARCHITECTURE | EXECUTION_CONSTRAINT
stable_aliases: []
title: ""
source:
  repository: ""
  repository_sha: ""
  identity_path: ""
  document_path: ""
  document_blob_sha: ""
  section_anchor: ""
  line_range: {start: 0, end: 0}
  source_text_hash: "sha256:"
  previous_locations: []
authority: {document_classification: "", source_status: "", source_authority: PROPOSAL, approval_record: null, approved_by: null, approved_at: null, supporting_sources: []}
status: {lifecycle: DRAFT, changed_by: "", changed_at: ""}
statement: ""
rationale: ""
acceptance_intent: []
implementation_gate: {state: NOT_GRANTED, reason: "", approval_record_id: null, grant_source: null, granted_by: null, granted_at: null, valid_until: null, scope: []}
external_evidence: {required: false, state: NOT_REQUIRED, references: [], accepted_by: null, accepted_at: null, revalidate_at: null}
parent_requirement: null
related_requirements: []
conflicts: [{conflict_id: "", conflicts_with: "", conflict_type: MUST_VS_MUST_NOT, detected_from: [], state: DETECTED, resolution_record: null, resolved_by: null, resolved_at: null}]
supersedes: []
superseded_by: []
created_at: ""
generated_by: ""
content_hash: "sha256:"
requirement_record_hash: "sha256:"
```
Requirement 집합은 개별 record 밖의 `{repository_sha, requirements: [{requirement_id, requirement_record_hash}], requirement_set_digest}` envelope로 고정한다.
`authority.source_authority`, `status.lifecycle`, `implementation_gate.state`, `external_evidence.state`는 각각 Source 권위, Requirement 생명주기, 실행 Grant, Evidence 준비도를 나타내며 서로 승격시키지 않는다.
## 4. 필드 정의표

표면은 `W` Work Package, `I` Issue, `R` Runtime이며 `Y/N/C`는 전달/표시/저장의 yes/no/conditional이다.

| 필드 | 필수·형식/허용 값 | 작성→검증 | 변경 시점 | W/I/R |
| --- | --- | --- | --- | --- |
| `schema_version` | Y; semver | Planner→schema reviewer | 새 schema | Y/N/Y |
| `requirement_id` | Y; Stable ID/UUIDv5 | Generator→ID validator | 불변 | Y/Y/Y |
| `requirement_kind` | Y; enum | Planner→reviewer | DRAFT만 | Y/Y/Y |
| `stable_aliases` | Y; unique string[] | Planner→ID validator | lineage 확인 시 | Y/Y/Y |
| `title` | Y; string | Planner→reviewer | DRAFT만 | Y/Y/Y |
| `source.repository` | Y; canonical URI | Planner→Git validator | 불변 | Y/Y/Y |
| `source.repository_sha` | Y; 40-hex | Extractor→Git | 새 snapshot | Y/Y/Y |
| `source.identity_path` | Y; Git path | Extractor→Git/history | 이동 증명 시 유지 | Y/N/Y |
| `source.document_path` | Y; Git path | Extractor→Git | 새 snapshot | Y/Y/Y |
| `source.document_blob_sha` | Y; Git object ID | Extractor→Git | 새 snapshot | Y/N/Y |
| `source.section_anchor` | Y; normalized string | Extractor→link validator | 새 snapshot | Y/Y/Y |
| `source.line_range` | Y; positive range | Extractor→locator check | 새 snapshot | Y/Y/Y |
| `source.source_text_hash` | Y; SHA-256 | Extractor→hash check | 새 snapshot | Y/N/Y |
| `source.previous_locations` | Y; locator[] | Planner→history reviewer | 이동 시 append | N/N/Y |
| `authority.document_classification` | Y; repository value | Extractor→front matter check | source 변경 시 | Y/Y/Y |
| `authority.source_status` | Y; raw source status | Extractor→front matter check | source 변경 시 | Y/Y/Y |
| `authority.source_authority` | Y; authority enum | Planner→authority reviewer | 승인/폐기 기록 시 | Y/Y/Y |
| `authority.approval_record` | C; source locator | Owner record→reviewer | append-only | Y/Y/Y |
| `authority.approved_by` | C; actor ID | Owner record→reviewer | approval 시 | Y/Y/Y |
| `authority.approved_at` | C; RFC3339 | Owner record→reviewer | approval 시 | Y/Y/Y |
| `authority.supporting_sources` | Y; snapshot[] | Planner→authority reviewer | evidence 추가 시 | Y/N/Y |
| `status.lifecycle` | Y; lifecycle enum | Planner/Owner→state validator | 허용 전이 시 | Y/Y/Y |
| `status.changed_by` | Y; actor ID | transition owner→validator | 전이 시 | Y/N/Y |
| `status.changed_at` | Y; RFC3339 | transition owner→validator | 전이 시 | Y/N/Y |
| `statement` | Y; atomic normative text | Extractor→reviewer | 의미 변경은 새 ID | Y/Y/Y |
| `rationale` | Y; string/null | Extractor→reviewer | 새 revision | Y/C/Y |
| `acceptance_intent` | Y; verifiable string[] | Planner→reviewer | 새 revision | Y/Y/Y |
| `implementation_gate.state` | Y; grant enum | Owner record→authority validator | grant event 시 | Y/Y/Y |
| `implementation_gate.reason` | Y; string | grant owner→reviewer | grant event 시 | Y/Y/Y |
| `implementation_gate.approval_record_id` | C; durable approval ID | Owner record→authority validator | grant event 시 | Y/Y/Y |
| `implementation_gate.grant_source` | C; locator | Owner record→authority validator | grant event 시 | Y/Y/Y |
| `implementation_gate.granted_by` | C; actor ID | Owner record→authority validator | grant event 시 | Y/Y/Y |
| `implementation_gate.granted_at` | C; RFC3339 | Owner record→authority validator | grant event 시 | Y/Y/Y |
| `implementation_gate.valid_until` | C; RFC3339/null | Owner→time validator | grant event 시 | Y/Y/Y |
| `implementation_gate.scope` | Y; constraint[] | Owner→scope validator | 새 grant 필요 | Y/Y/Y |
| `external_evidence.required` | Y; boolean | Planner→evidence reviewer | source 변경 시 | Y/Y/Y |
| `external_evidence.state` | Y; evidence enum | Acceptor→evidence reviewer | evidence event 시 | Y/Y/Y |
| `external_evidence.references` | Y; evidence locator[] | Collector→evidence reviewer | append 가능 | Y/Y/Y |
| `external_evidence.accepted_by` | C; actor ID | Acceptor→reviewer | acceptance 시 | Y/Y/Y |
| `external_evidence.accepted_at` | C; RFC3339 | Acceptor→reviewer | acceptance 시 | Y/Y/Y |
| `external_evidence.revalidate_at` | C; RFC3339/null | Acceptor→time validator | acceptance 시 | Y/Y/Y |
| `parent_requirement` | C; requirement ID | Planner→cycle check | lineage review 시 | Y/C/Y |
| `related_requirements` | Y; ID[] | Planner→reference check | append 가능 | Y/C/Y |
| `conflicts` | Y; typed conflict[] | Detector/Owner→conflict validator | detect/resolve 시 | Y/Y/Y |
| `supersedes` | Y; ID[] | Planner/Owner→lineage check | 결정 기록 시 | Y/Y/Y |
| `superseded_by` | Y; ID[] | Planner/Owner→lineage check | 결정 기록 시 | Y/Y/Y |
| `created_at` | Y; RFC3339 | Generator→schema check | 불변 | N/N/Y |
| `generated_by` | Y; generator ID/version | Generator→schema check | 불변 | N/N/Y |
| `content_hash` | Y; SHA-256 | Generator→hash check | content 변경 시 | Y/N/Y |
| `requirement_record_hash` | Y; SHA-256 | Generator→hash check | record 변경 시 | N/N/Y |
| `requirement_set_digest` | set envelope Y; SHA-256 | Compiler→hash check | selected set 변경 시 | Y/N/Y |
## 5. Requirement ID 생성 규칙

[RECOMMENDED] Project namespace는 RFC 4122 URL namespace에 canonical repository URI를 넣은 UUIDv5이고, Requirement UUIDv5 name은 `identity_path + "\n" + normalized_anchor + "\n" + requirement_kind + "\n" + normalized_statement`이다. URI host/owner/repo와 anchor는 lowercase, Git path case는 보존하며 slash는 `/`로 통일한다. Text는 Unicode NFC, LF, trim, 연속 공백 1개로 만들고 Markdown emphasis/code fence 표시는 제거하되 code token case는 보존한다. Link는 label text를 ID에 쓰고 target 변경은 hash로 탐지한다. 문장 순서가 바뀌어도 atomic statement가 같으면 ID는 같다.

경로 이동은 검증된 rename에서 `identity_path`를 유지한다. 정규화 statement 변경은 기본적으로 새 ID와 `supersedes`; 줄 이동·표현 Markdown만의 변화는 유지한다. 예시 name 결과 형태는 `REQ-<calculated-uuidv5>`이며 계산 코드가 없으므로 실제 UUID 확정값이 아니다. 재계산 불일치, 하나의 ID에 다른 content, 또는 같은 normalized input의 다중 레코드는 `REQ_ID_COLLISION`; 폐기 ID 재사용은 금지한다.
## 6. 기존 Stable ID 연결

[CONFIRMED] 저장소 형식은 `FR/UX/SR/NFR-*`, `D-*`, `ADR-*`, `A-*`, `OQ-*`, `WM-GATE-*`이다 (`../../INDEX.md` line 79). 하나의 atomic 규범을 유일하게 선언한 `FR/UX/SR/NFR`은 `requirement_id`로 직접 사용한다. Decision/ADR/assumption/question/evidence ID는 복제하지 않고 `stable_aliases`와 Source/approval/evidence에 연결한다. 한 ID에서 여러 의무가 나오면 각 UUIDv5 Requirement가 같은 alias를 공유하며, 여러 Source가 같은 의미를 지지하면 하나의 primary와 supporting snapshots를 사용한다.
## 7. 상태 매핑

| Lifecycle | 기존 표현/의미 | 진입→종료·변경자 | 후보/실행/사람 |
| --- | --- | --- | --- |
| DRAFT | proposal 초안 | 추출→review; Planner | Y/N/C |
| CONFIRMED | `[CONFIRMED]` 사실 | 근거 확인→승인/폐기; reviewer | Y/N/C |
| APPROVED | 승인 SOT/Decision 규범 | approval record→supersede; Owner | Y/Grant+Evidence 필요/C |
| OPEN | `[OPEN]` 미결정 | source 선언→Owner 결정 | 조사만/N/Y |
| BLOCKED | `[BLOCKED]` 선행 Gate | blocker 확인→해소; Owner/reviewer | 제한/N/Y |
| EXTERNAL_EVIDENCE_REQUIRED | evidence 미충족 | gate 확인→accept/reject; acceptor | evidence만/N/Y |
| SUPERSEDED | 후속 규범이 대체 | lineage 승인; Owner | N/N/Y |
| REJECTED | 명시 거절 | rejection record; Owner | N/N/Y |

`[RECOMMENDED]`는 DRAFT, `implementation_ready: false`는 lifecycle이 아니라 `implementation_gate.state: NOT_GRANTED`, `[EXTERNAL_EVIDENCE_REQUIRED]`는 lifecycle과 evidence state를 함께 설정한다. Approved Requirement도 Grant와 Evidence가 없으면 실행할 수 없다.
## 8. Atomic Requirement 분리 규칙

- AND는 각 절이 독립 승인·검증·폐기 가능하면 분리하고 하나의 불가분 성공 조건이면 유지한다.
- MUST와 SHOULD, 기능과 보안, 구현과 운영은 kind/강도/owner가 달라 각각 분리한다.
- 조건과 효과는 하나의 Requirement에 함께 두되 별도 효과는 분리한다.
- Rationale은 `rationale`, 검증 결과는 `acceptance_intent`, 예시(`예:`, `for example`)는 규범에서 제외한다.
- 한 Requirement는 하나의 명확한 주체, 의무, 조건·효과와 검증 가능한 결과를 가져야 한다.
## 9. 중복과 충돌 판정

동일 Source/의미는 한 레코드, 다른 Source의 동일 의미는 primary+supporting, 상·하위 반복은 높은 권위를 primary로 둔다. 의미상 후보는 자동 병합하지 않는다. Conflict type은 `MUST_VS_MUST_NOT|VALUE_MISMATCH|AUTHORITY_CONFLICT|VERSION_CONFLICT|PROPOSAL_VS_APPROVED|SCOPE_CONFLICT`, state path는 `DETECTED→UNDER_REVIEW→RESOLVED|SUPERSEDED|REJECTED`이며 terminal 이력을 보존한다.

`RESOLVED`가 아닌 conflict는 Requirement를 실행 불가로 만들고 Work Package `READY`를 금지한다. Agent는 대상을 선택하거나 conflict를 해소할 수 없다. 해결은 Owner/권한 있는 Decision record의 ID, actor, source SHA, scope와 시각을 `resolution_record`에 남기고 `resolved_by/resolved_at`은 그 record와 일치해야 하며 이력은 삭제하지 않는다. Conflict `SUPERSEDED/REJECTED`는 충돌 검토를 종료해도 현재 Requirement를 실행 가능하게 만들지 않고, `RESOLVED`만 양립 가능한 현재 규범을 뜻한다. Requirement supersede lineage와 conflict resolution은 서로 대신하지 않는다.
## 10. 상위·하위 Requirement와 Supersede

Parent는 넓은 결과, Child는 독립 검증 가능한 제약이며 related는 비계층 연결이다. Parent 폐기는 Child를 자동 폐기하지 않고 영향 검토로 막는다. Child 변경은 Parent를 바꾸지 않는다. 부분 대체는 새 Requirement가 대체한 ID만 `supersedes`에 기록한다. Source 교체는 snapshot과 lineage를 추가하며 기존 record, hash, approval와 evidence 이력은 삭제하지 않는다.
## 11. OPEN 처리

OPEN은 조사, proposal 문서 또는 Human Decision 후보만 만들 수 있고 제품 구현 후보와 실행 가능한 Work Package를 만들 수 없다. Owner의 명시 기록 뒤에만 lifecycle/authority를 전이하며 Agent는 OPEN을 CONFIRMED나 APPROVED로 승격할 수 없다.
## 12. 외부 Evidence 처리

Evidence 요구는 Requirement 폐기가 아니다. Evidence Collection 후보가 source/date/accessed-at/scope/limitations를 수집하고 지정 acceptor가 ACCEPTED/PARTIAL/CONFLICTING과 재검증일을 기록한다. 링크만으로 진실·계약·현재성을 확정하지 않는다. MISSING/PARTIAL/EXPIRED/CONFLICTING이 구현 안전성에 영향을 주면 실행은 차단한다. Worker는 evidence state나 acceptor를 바꿀 수 없다.
## 13. 구현 Gate

Requirement 승인은 “무엇이 규범인가”, Grant는 “누가 어떤 source SHA와 scope의 실행을 허용했는가”다. Issue 또는 Owner 기록은 actor, 시각, scope, source SHA가 식별될 때만 GRANTED다. SHA/scope 변경은 재검증하고 취소는 REVOKED, 기한 경과는 EXPIRED다. 문서 Work Package는 승인된 문서 workflow 범위에서 가능하지만 제품 구현은 별도 Grant가 필요하다. `implementation_ready: false` Source는 자체적으로 구현 Node를 열지 못한다 (`../../spec/traceability-implementation.md` lines 97-125).
## 14. Content Hash와 변경 감지

| Hash | 입력·변화 |
| --- | --- |
| Source text | 선택된 원문 bytes의 LF 정규화; 공백·링크·이동 후 원문 변화 탐지 |
| Content | kind+statement+rationale+acceptance; statement/acceptance/의미 rationale 변경 |
| Requirement record | Source, authority, lifecycle, grant, evidence, conflict, lineage를 포함한 canonical record |
| Requirement set | selected record 밖에서 sorted `(requirement_id, requirement_record_hash)` canonical 집합 |

`requirement_set_digest`는 위 Requirement set의 canonical JSON SHA-256이며 개별 record에 저장하지 않는다. 공백/Markdown만의 변화도 hash를 재검증하고 statement 의미 변경은 새 ID, acceptance/authority/status/grant/evidence/conflict 변경은 `requirement_record_hash`와 이를 포함한 set digest를 바꾼다. 이동은 location만, 삭제는 BLOCKED/SUPERSEDED와 set digest 변경이다.
## 15. 정상 예시

[CONFIRMED] 병합 commit `ce168d5381015e46171a13c2a3b2b80509c299b1`의 [D-009 lines 73-78](https://github.com/woojinhong/Metabus_social/blob/ce168d5381015e46171a13c2a3b2b80509c299b1/docs/discovery/decisions.md#L73-L78), blob `01598392614871ea2c4b8e136574e8fa5bf0e05c`는 승인 Source다. Line 75의 첫 문장은 “OpenJDK 25 LTS 사용”, “Spring Boot 4.1 사용”, “modular monolith 사용”, “managed RTC adapter 경계”로 나누고, 둘째 문장의 capability boundary와 exact-contract pending Gate도 별도 Requirement로 분리한다. 각 ID는 `REQ-<calculated-uuidv5>` 예시이고 D-009는 alias다. Source Authority는 APPROVED이나 line 77은 source code를 승인하지 않으므로 기본 Grant는 NOT_GRANTED다. [Issue #35](https://github.com/woojinhong/Metabus_social/issues/35)는 PR A scope의 별도 Grant로만 연결하며 D-009나 proposal plan을 승인 Source로 바꾸지 않는다.
## 16. 거부 예시

Source/identity 오류는 `REQ_SOURCE_SHA_MISSING|REQ_LINE_ID_FORBIDDEN|REQ_ID_COLLISION|REQ_SOURCE_STALE`, 권위/실행 오류는 `REQ_PROPOSAL_AS_APPROVED|REQ_OPEN_NOT_EXECUTABLE|REQ_EXTERNAL_EVIDENCE_UNMET|REQ_SUPERSEDED_REFERENCE|REQ_NON_ATOMIC`이다.
Conflict 오류는 미해결 상태의 `REQ_CONFLICT_UNRESOLVED`, decision record가 없는 `REQ_CONFLICT_RESOLUTION_MISSING`, actor/source SHA/scope 권위가 불일치한 `REQ_CONFLICT_AUTHORITY_INVALID`다. 모두 Work Package 후보의 실행 가능 판정과 `READY`를 차단한다.
## 17. 검증 규칙

[IMPLEMENTED FOUNDATION] [Requirement machine schema](../../../schemas/automation/requirement.schema.json)는 Candidate와 canonical record, 필수 필드·enum·nullability·format과 proposal 승격 차단을 `1.0.0`으로 고정한다. `scripts/harness/schema-contract.test.mjs`의 dependency 없는 structural subset은 AH-P1-01에 충분하고 full JSON Schema engine은 별도 dependency Gate다. [AH-P1-01](../../discovery/autonomous-harness-readonly-planner-authority.md)은 Owner-pinned canonical record 소비만 승인하며 Extractor, semantic approval, Runtime Validator와 제품 실행은 미구현·미승인이다.
