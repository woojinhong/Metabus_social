---
title: Slice 01 Spring Session PostgreSQL Spike Results
document_type: technical validation result
classification: proposal
status: Unapproved
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["../discovery/slice-01-session-concurrency-validation.md","../spec/api/slice-01-account-session-executable-contract.md","../../experiments/slice-01-session-postgresql/README.md"]
decision_authority: Issue #31 test-scope evidence; product implementation still requires separate owner approval
---

# Slice 01 Spring Session PostgreSQL Spike 결과

## 범위와 실행 환경

Issue #31과 PR #30 계약에 따라 제품 코드와 분리된 `src/test` 전용 실험을 수행했다.
Controller, 최종 Entity/API/Migration, Credential, 배포 설정은 만들지 않았다.

| 항목 | 실제 값 |
| --- | --- |
| Runtime | Temurin Java 25.0.3, Spring Boot 4.1.0, Spring Session 4.1.0 |
| Build/DB | Gradle 9.1.0, PostgreSQL `18-alpine`, Testcontainers 2.0.5 |
| Schema | Spring Session 4.1.0 공식 PostgreSQL SQL + 실험 Fixture, Flyway 적용 |
| 반복 증거 | Draft PR [#32 checks](https://github.com/woojinhong/Metabus_social/pull/32/checks), PostgreSQL matrix 1·2와 문서 CI 성공 |
| 경계 | 테스트 전용, 실제 데이터·외부 호출·Secret·배포 없음 |

초기 원격 실행은 컨테이너 시작 순서, 테스트 Controller 중복 등록, Boot 4의
Session/Flyway starter 누락 때문에 시나리오 전에 실패했다. 이후 실행은 12개 테스트를
발견했으며, 공개 probe와 Provider 이중 등록을 바로잡았다. 안전성 assertion은 제거하거나
완화하지 않았다.

## 실험 결과

| 가설·위험 | 실제 테스트 | 관찰 | 판정·제품 영향 |
| --- | --- | --- | --- |
| 공식 Schema/Flyway | `flywayAppliesOfficialSessionSchemaAndExperimentFixtures` | 두 migration과 index 재현 | PASS; 자동 schema init 금지 유지 |
| 기본 propagation | `defaultSessionOperationsCommitIndependentlyWithRequiresNew` | 외부 rollback 뒤 session 저장 유지 | PASS; 기본 repo 작업은 별도 commit |
| custom propagation | `customRequiredRepositoryCanJoinAccountSessionAndAuditRollback` | `REQUIRED` 후보에서 셋 모두 rollback | PASS; 명시 호출만 가능, filter 종료 저장은 과장 금지 |
| Account 정지 | `suspensionAndEpochRejectExistingCookieWithoutDeletingSession` | row 존치 중 403, 복구 뒤 과거 epoch도 거부 | PASS; 상태+epoch가 요청 fencing |
| 로그인·전체 폐기 | `loginSavedAfterRevokeAllUsesStaleEpochAndIsRejected` | 경쟁 로그인 403, 이후 새 epoch 로그인 200 | PASS; 발급 epoch 재검사 필수 |
| 특정 Session 폐기 | `deleteByIdIsNotUndoneByConcurrentFilterSave` | delete 전후 row 없음, 과거 Cookie 401 | PASS; ON_SAVE 경쟁에서 부활 0 |
| in-flight Command | `accountGuardSerializesBusinessCommandAndSuspensionWithoutLateCommit` | Account lock 양방향 직렬화, 정지 뒤 commit 0 | PASS; Account fence 증명, cross-aggregate 순서는 별도 제품 테스트 |
| 필수 Audit 실패 | `auditConstraintFailureRollsBackAccountStateAndEpochs` | 상태·version·epoch 모두 rollback | PASS; Account 변경과 필수 Audit 동일 tx |
| Rotation | `springSecurityRotatesSessionAndRejectsPreviousIdentifier` | ID 교체, 이전 401, 신규 200, epoch 유지 | PASS; framework rotation 사용 |
| Cleanup 격리 | `expiredSessionIsUnusableEvenWhenScheduledCleanupIsDisabled` | cleanup 없이 만료 session 조회 불가 | PASS; housekeeping은 권위 상태 아님 |
| Action 재조정 | `pendingSessionActionReconcilesAfterDeleteOutcomeFailure` | 무관 audit와 동시 동일-key 재시도 후 해당 audit 1건·outcome 수렴 | PASS; 원본 ID 대신 hash reference, pending/reconciled |
| 로그인 비열거·로그 | `anonymousLoginFailuresDoNotEnumerateAccountStateAndLogsContainNoSecrets` | 4 원인 동일 401/body/type, 내부 원인 분리, 비밀 문자열 0 | PASS; timing 동일성은 주장하지 않음 |

## 설계 판정

- HTTP 인증 세션의 현재 권위는 `SPRING_SESSION*` 하나로 유지한다. 별도 Domain
  Authentication Session은 만들지 않고 Audit/Security Event만 둔다.
- Account 정지는 Account 상태·session epoch·필수 Audit을 한 transaction에서 commit한다.
  Session row 삭제는 별도 보안 action이며 정지 성공 조건이 아니다.
- 모든 변경 Command는 Account fence를 먼저 lock/guard한다. 정지가 먼저면 Command를 거부하고,
  Command가 먼저면 정지보다 먼저 commit한다. `Account -> Authorization -> Aggregate` 전체
  순서는 제품 저장 단위가 생긴 뒤 별도 통합 테스트로 닫는다.
- 전체 폐기는 epoch 증가가 안전 경계다. 물리 삭제와 cleanup 실패는 과거 epoch의 사용을
  허용하지 않는다.
- 특정 폐기는 검증한 Spring Session 4.1 JDBC `ON_SAVE` 경로에서 부활하지 않았다.
  framework 버전 또는 save mode 변경 시 이 경쟁 테스트를 승격해 재실행한다.
- 기본 `REQUIRES_NEW` 때문에 Session 삭제와 업무 Audit의 완전 원자성을 일반화하지 않는다.
  필요한 action은 durable intent/outcome과 실제 repository 재조회로 수렴시킨다.

## 구현 승인 Gate

| Gate | 증거 | 남은 위험 | 판정 |
| --- | --- | --- | --- |
| Framework Session 단일 권위 | 공식 schema와 repository만 현재 session 저장 | Redis 전환 시 재검증 | PASS |
| 기본/custom propagation | rollback 대조 실험 | filter 저장은 별도 경계 | PASS |
| 정지·epoch·전체 폐기 | 기존/경쟁 Cookie 거부 | 모든 제품 entry에 guard 적용 | PASS |
| 특정 폐기 경쟁 | row 부활 0, Cookie 401 | framework upgrade 회귀 | PASS |
| Account in-flight fence | 양방향 정지 경쟁에서 늦은 commit 0 | 제품 entry 적용 | PASS |
| Cross-aggregate lock order | Account fixture만 실행 | Authorization/Aggregate 제품 통합 검사 | PARTIAL |
| Audit 원자성 | 제약 실패 전체 rollback | retention/tamper 정책 | PASS |
| Rotation/Cleanup | 이전 ID 401, 만료 조회 불가 | 운영 timeout 값 | PASS |
| Action 재조정 | 무관 audit+동시 key, correlation audit 1건, hash reference | 최종 schema/API 이름·HMAC 여부 | PASS |
| Flyway/Testcontainers/Java CI | matrix 두 번 성공 | Node 20 action 경고 갱신 | PASS |
| 로그 비밀정보 | fixture password/cookie/session ID 0 | 운영 log capture 재검증 | PASS |
| Modulith/SpotBugs/Spotless | format·SpotBugs test 성공; main은 `NO-SOURCE` | 제품 module 생성 후 Modulith 검증 | PARTIAL |
| 제품 구현 승인 | 내부 기술 위험은 owner 심사 가능 수준 | 별도 Owner 승인 | READY_FOR_OWNER_APPROVAL |

## 제거·승격과 열린 결정

- 제거: 테스트 Controller, 가짜 Account/Audit/Action tables, failure hook, latch endpoint.
- 승격: epoch fencing, 특정 폐기, in-flight lock, audit rollback, rotation, 비열거 회귀 테스트.
- Owner 결정 전에는 URL/DTO/DDL, Cookie·CSRF 배포 값, password parameter, retention을 확정하지 않는다.
- 이 결과는 `implementation_ready: true` 전환이나 제품 구현 승인이 아니다.
