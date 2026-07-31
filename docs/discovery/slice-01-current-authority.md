---
title: Slice 01 Current Implementation Authority
document_type: current authority register
classification: confirmed fact
status: Active
last_verified: 2026-07-31
related_documents: ["decisions.md","slice-01-product-implementation-approval-plan.md","../spec/traceability-implementation.md","../operations/github-workflow.md"]
decision_authority: D-024 plus repository files and Git history on master at 33b1f7b; unavailable Issue #37 approval wording is not authority
---

# Slice 01 현재 구현 권한

## 1. 범위와 증거 기준

이 문서는 `master` commit `33b1f7b`의 파일과 도달 가능한 Git 이력에서 확인되는
Slice 1 현재상태를 기록한다. 새 Owner Decision이나 구현 Grant를 만들지 않는다.
Issue/PR 제목과 branch 번호는 lineage 증거지만, Git 이력에 없는 Issue 본문이나 승인
원문은 복원하거나 추측하지 않는다.

## 2. 현재 권한 상태

| 범위 | 현재 상태 | 확인 근거 | 다음 Gate |
| --- | --- | --- | --- |
| D-024 UX baseline | SATISFIED | D-024와 승인 UX SOT | UX 재개는 별도 Owner 결정 |
| PR A Product Bootstrap | BOUNDED_COMPLETE | PR #36 merge `446ba9f`; 현재 root application/toolchain/module/CI 파일 | 변경·확장은 별도 scope 승인 |
| PR B Persistence Foundation | BOUNDED_COMPLETE | PR #38 merge `fc1cfd0`, PR #42 merge `376a57c`; 현재 JPA/Flyway와 V1–V6 | 기존 migration은 immutable; V7+와 새 경로는 별도 승인 |
| PR C Authentication | NOT_GRANTED | 현재 README의 명시적 제외와 미구현 파일 상태 | Credential/password/session/security contract Owner 승인 |
| PR D Security Commands | NOT_GRANTED | 현재 README의 명시적 제외와 미구현 파일 상태 | 정지·복구·폐기·scope·audit/reconciliation Owner 승인 |
| API/Realtime/Production Frontend | NOT_GRANTED | proposal contracts의 `implementation_ready: false` | 별도 authoritative promotion과 구현 승인 |
| Vendor/provisioning/deployment/live Pilot | NOT_GRANTED | D-024와 operations gate | legal/procurement/security/device/operations 및 별도 실행 승인 |

`BOUNDED_COMPLETE`는 해당 병합 결과가 현재 저장소에 존재한다는 뜻이다. Slice 1 전체,
PR C/D, API, Realtime, Production Frontend 또는 production 운영이 승인됐다는 뜻이 아니다.

## 3. PR B 선택과 확인 가능한 lineage

- PR #34 merge `ce168d5`는 PR A–D의 당시 proposal plan을 `master`에 추가했다.
- PR #36 merge `446ba9f`는 branch `feat/35-slice-01-product-bootstrap`의 PR A를 병합했다.
- PR #38 merge `fc1cfd0`는 branch `feat/37-slice-01-persistence-foundation`의 PR B를
  병합했다. 이 merge와 현재 파일은 JPA repository/entity, Flyway, V1–V5를 확인시킨다.
- PR #42 merge `376a57c`는 PR B gate follow-up으로 V6와 현재 migration Harness 경계를
  병합했다.
- 현재 `build.gradle.kts`, `application.properties`, persistence package와
  `src/main/resources/db/migration`은 Spring Data JPA, Flyway, PostgreSQL 및 정확한
  V1–V6 선택을 확인시킨다.

Issue #37이 PR B branch와 연결됐다는 사실은 merge message에서 확인된다. 그러나
Issue #37의 Owner 승인 원문, actor/time/source SHA/scope를 충족하는 Grant record는 현재
Git 이력만으로 확인할 수 없다. 상태는 **Unknown / Owner confirmation required**이며,
새 Decision이나 더 넓은 권한을 추론하지 않는다.

## 4. `implementation_ready: false` 해석

proposal contract의 `implementation_ready: false`는 해당 문서가 OpenAPI/AsyncAPI,
최종 API/DTO, 전체 data schema, realtime payload/state machine, Production Frontend나
추가 제품 구현을 스스로 승인하지 않는다는 뜻이다. 별도 merge lineage로 완료된 정확한
PR A/B 파일과 V1–V6의 존재를 취소하거나 미구현으로 되돌리는 표지가 아니다.

현재 V1–V6는 immutable baseline이다. 내용을 바꾸거나 V7+, Java migration, alternate
Flyway location을 추가하는 것은 이 문서와 기존 Harness가 승인하지 않는다.

## 5. Historical plan 해석

[기존 승인 계획](slice-01-product-implementation-approval-plan.md)의 2026-07-29
`READY_FOR_OWNER_APPROVAL`, Spring JDBC 우선, JPA 별도 근거, “PR A 파일 없음” 문구는
당시 proposal의 역사적 상태다. PR A/B에 대해서는 현재 merge evidence가 이를
supersede한다. PR C/D와 광범위한 production promotion의 별도 승인 Gate는 계속 유효하다.

## 6. 후속 Harness PR 제안

이번 문서 PR은 `scripts/docs/semantic-gates.mjs`와 관련 test를 수정하지 않는다. 별도
Harness Issue/PR에서 다음 범위를 검토한다.

1. authoritative-state 메시지가 PR A/B bounded completion과 broad production block을
   동시에 표현하도록 한다.
2. 정확한 V1–V6 allowlist와 checksum 보호는 유지하고 V7+/alternate path 거부를 유지한다.
3. 상위 SOT의 PR A/B complete, PR C/D not-granted, Issue #37 unknown 문구를 fixture로
   고정한다.
4. historical/superseded section이 current-state claim으로 오인되지 않는 회귀 test를
   추가한다.

Harness 변경은 새 제품 구현 Grant를 만들지 않으며 별도 Owner review를 거친다.
