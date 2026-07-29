---
title: Slice 01 Session Authority and Concurrency Validation
document_type: technical validation plan
classification: proposal
status: Unapproved
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["slice-01-account-session-authorization-plan.md","../spec/api/slice-01-account-session-executable-contract.md","../architecture/security-privacy.md","../adr/ADR-001-modular-monolith-managed-rtc.md","../adr/ADR-004-postgresql-primary-store.md"]
decision_authority: Issue #29 proposes executable contracts; source code and the Spike require separate owner approval
---

# Slice 01 세션 권위·동시성 기술 검증

## 1. 확인된 기준과 근거

현재 저장소에는 backend/build/migration/Spring/Java CI가 없고 문서 CI만 있다. ADR-001은 Java 25·Spring Boot 4.1, ADR-004는 PostgreSQL 업무 권위를 선택했지만 구현을 승인하지 않는다. 이 문서는 Spring Boot 4.1 계열의 공식 문서와 2026-07-29 upstream을 기준으로 하며 정확한 dependency patch는 구현 시 BOM으로 재검증한다.

- [Spring Session JDBC](https://docs.spring.io/spring-session/reference/configuration/jdbc.html): framework schema, 기본 `REQUIRES_NEW`, 별도 transaction operations, 만료 cleanup.
- [Spring Session JDBC API](https://docs.spring.io/spring-session/reference/4.1/api/java/org/springframework/session/jdbc/JdbcIndexedSessionRepository.html): principal index와 idempotent `deleteById`; JDBC 구현은 session event를 publish하지 않는다.
- [Spring Security session](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/session-management.html): SecurityContext 저장, fixation protection, registry 경계.
- [Spring Security CSRF](https://docs.spring.io/spring-security/reference/7.0/servlet/exploits/csrf.html): unsafe request와 SPA token 갱신.
- [Spring transaction propagation](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html): `REQUIRED`는 같은 물리 transaction, `REQUIRES_NEW`는 독립 connection/commit.
- [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html)과 [row locks](https://www.postgresql.org/docs/current/explicit-locking.html): statement snapshot, 경쟁 조건 재평가, transaction 종료까지 row lock.
- [Boot database initialization](https://docs.spring.io/spring-boot/how-to/data-initialization.html), [Boot Testcontainers](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html), [PostgreSQL Testcontainers](https://java.testcontainers.org/modules/databases/postgres/).

## 2. 세션 권위 후보

| 기준 | A Framework row 단일 권위 | B Framework+Domain 이중 원장 | C 직접 DB session |
| --- | --- | --- | --- |
| 현재 인증 권위 | 단일 | 이중·drift 위험 | 단일 |
| 강제 폐기/정지 | repository 삭제+Account guard | 이중 전이 필요 | 직접 구현 |
| rotation/Security 정합성 | framework 기본 | 양쪽 순서·보상 필요 | 직접 연동 |
| 재시작/다중 instance | PostgreSQL 지속 | 지속하나 동기화 필요 | 지속 가능 |
| transaction/감사 | 기본 별도 tx; 검증 필요 | 원자성 가장 어려움 | 한 tx 설계 가능 |
| 중복/난이도/시험 | 낮음/중간/중간 | 높음/높음/높음 | 낮음/매우 높음/높음 |
| Redis 전환 | repository 교체 가능 | 이중 원장 유지 문제 | 재작성 |
| migration/운영 | 공식 schema를 프로젝트가 적용 | framework+domain schema | 전체 자체 소유 |

**추천 A.** `SPRING_SESSION*` row만 HTTP 인증 세션의 현재 권위다. Account와 Current Authorization은 별도 업무 권위이며 매 요청·Command에서 재검사한다. append-only Session Security Event/Audit는 증거이지 현재 Session 원장이 아니다. in-memory `SessionRegistry`도 권위가 아니며 필요 시 Spring Session-backed registry만 보조로 쓴다.

## 3. 정지·폐기·정리 의미

| 행위 | 권위 효과 | 원자성 | 복구/실패 의미 |
| --- | --- | --- | --- |
| Account 정지 | Account 비활성+session epoch 증가로 다음 요청 fail closed | 상태+epoch+history+필수 audit는 Account transaction | 남은 Cookie/row/활성 grant가 우회하지 못함 |
| Session 폐기 | 특정 row 삭제; 전체 폐기는 session epoch 증가+row 삭제 | 독립 보안 Command; 성공한 효과만 폐기 완료 | Account 복구가 과거 epoch session을 되살리지 않음 |
| 물리 cleanup | 만료 framework row 제거 | framework housekeeping | 실패해도 정지·권한회수·업무완료는 유효 |

Account 정지와 모든 session 삭제를 한 transaction으로 강제하지 않는다. 기본 Session JDBC는 `REQUIRES_NEW`이므로 단일 원자성을 주장할 수도 없다. 정지 commit의 비활성 상태+증가한 epoch가 즉시 접근을 막고, row 삭제는 방어 심화다. 소량·동일 DB라도 삭제 실패를 성공으로 보고하지 않는다. 대량/분리 store에서는 내구성 있는 action intent/outcome과 재시도를 쓰되 Job 성공을 정지 완료로 부르지 않는다.

## 4. In-flight Command Guard

초기 filter 검사는 stale해질 수 있다. 상태를 바꾸는 모든 업무 Command는 같은 PostgreSQL transaction에서 다음 순서를 적용한다.

1. `Account` row를 lock하고 `ACTIVE`와 authorization epoch/version을 재검사한다.
2. lock 순서는 `Account -> Authorization -> 업무 Aggregate`로 고정한다.
3. 대상 Aggregate는 허용 상태+version 조건부 UPDATE와 DB unique/check/FK를 사용한다.
4. 정지가 먼저 commit하면 대기하던 Command는 비활성 상태로 rollback한다.
5. Command가 먼저 lock하면 정지가 기다리므로 그 Command commit은 정지보다 먼저다.

로그인은 Account lock 아래 현재 session epoch를 캡처하고 framework session attribute에 넣는다. 정지와 전체 폐기는 epoch를 단조 증가시키며 모든 요청은 row 존재 외에도 저장 epoch=현재 Account epoch를 검사한다. 따라서 filter 저장이 늦어도 stale row는 쓸 수 없고 복구도 epoch를 되돌리지 않는다. 특정 폐기는 target row 삭제 경쟁을 Spike로 통과하기 전 구현하지 않는다.

순수 Query는 commit 직렬화 없이 현재 상태/epoch를 재조회한다. 고위험·다중 Aggregate Command는 추가 target row lock을 허용한다. 전체 isolation 상향은 기본값이 아니며, Application Event는 stale commit 방어가 아니다. Guard 누락은 module test로 탐지한다. 충돌은 안전하게 403 또는 409로 변환하고 snapshot을 재조회한다. deadlock/serialization만 idempotent Command에 bounded retry하며 의미 충돌은 자동 재시도하지 않는다.

## 5. Transaction 검증과 최소 Spike

기본 `REQUIRES_NEW`는 확인됐지만 filter save/rotation/custom transaction의 실제 순서는 문서만으로 닫지 않는다. Workflow가 코드 Spike를 승인하지 않아 이번 변경은 계획만 작성한다. 승인 후 별도 `experiment` Issue의 test source에서 실제 PostgreSQL을 사용하고 제품 Controller/Entity/운영 migration은 만들지 않는다.

| 실험 | 가설·최소 범위 | 성공 조건 | 실패 시 조치 | 처리 |
| --- | --- | --- | --- | --- |
| 기본 propagation | Session repo+service+SQL trace | Account rollback과 독립 session commit 재현 | 원자성 주장 제거 유지 | 제거 |
| custom propagation | 동일 DataSource/TM+`REQUIRED` 후보 | service delete와 audit가 함께 rollback | 별도 Command/후속 처리 고정 | 제거 |
| suspend+revoke | Account fixture+session repository | 상태/epoch commit과 삭제 순서 관찰 | 정지 우선·삭제 후속 고정 | 제거 |
| audit failure | 실패 adapter/DB constraint | Account 상태+필수 audit 모두 rollback | audit 저장 경계 재설계 | 승격 가능 test |
| login rotation | Security filter+old/new row 관찰 | old ID 재사용 불가·순서 문서화 | framework hook 재선정 | 제거 |
| business↔suspend | 두 connection+latch+Account guard | 정지 뒤 늦은 업무 commit 0건 | lock/guard 강화 | 승격 가능 test |
| login↔suspend/all-revoke | filter save latch+epoch | 늦게 저장된 과거 epoch Cookie 거부 | 발급/epoch 직렬화 강화 | 승격 가능 test |
| filter-save↔specific delete | 동일 session의 두 request+latch | 삭제 뒤 row 부활·Cookie 성공 0 | 특정 폐기 설계 변경 | 승격 가능 test |
| residual Cookie | MockMvc+실제 session DB | 정지/삭제/만료 뒤 fail closed | request guard 수정 | 승격 가능 test |
| cleanup failure | cleanup 실패 주입 | 정지/권한 효과 불변 | cleanup 격리 | 제거 |

## 6. 도구 기본안

| Migration 후보 | 재현·이력/rollback | PG·Session·Testcontainers/CI | 판정 |
| --- | --- | --- | --- |
| [Flyway SQL](https://documentation.red-gate.com/flyway/flyway-concepts/migrations/versioned-migrations) | checksum+forward history; rollback은 새 migration | PostgreSQL SQL과 공식 session schema review에 직접적 | **추천** |
| Liquibase | changelog+rollback metadata, 학습/DSL 비용 | 다중 DB에는 유리하나 현재 PG 단일 Slice에 과함 | 제외; 복잡 이관 시 재검토 |
| Session 자동 초기화 | 빠르나 배포 이력·review 약함 | 운영 재현/upgrade 책임 불명확 | 운영·CI 기본값 금지 |
| 수동 SQL | SQL 제어는 높으나 적용 이력 자동화 없음 | 환경 drift 위험 | 제외 |
| 도구 없음 | 초기 비용 0 | migration/CI/복구 증거 없음 | 제외 |

Flyway가 framework 요구 schema와 프로젝트 domain schema를 같은 history로 적용한다. 공식 PostgreSQL SQL은 프로젝트 migration으로 소유하며 framework upgrade마다 공식 diff와 새 version을 review한다.

| Build 후보 | 공식 지원·가독성/plugin·dependency·CI | 비용/판정 |
| --- | --- | --- |
| [Gradle Kotlin DSL](https://docs.gradle.org/current/userguide/kotlin_dsl.html) | Boot 지원, type-safe 설정, 작은 bootstrap | DSL 학습 필요; **추천** |
| Gradle Groovy DSL | Boot 지원, 예제 많음 | 동적 설정 오류와 현재 추가 이점이 작아 제외 |
| Maven | Boot 지원, 선언적·안정적 CI | XML 장황; 팀 경험이 우세하면 fallback |

Base package는 개인/미확정 회사 domain을 주장하지 않는 `metabus.social` 후보, module은 `account/authentication/authorization/audit/common`이다. 내부 `api/application/domain/infrastructure`는 필요할 때만 두고 모든 class interface, CQRS/ES/broker를 만들지 않는다.

| 품질 도구 | 문제/현재 필요 | 비용·중복 | 판정/재검토 |
| --- | --- | --- | --- |
| [Spotless](https://github.com/diffplug/spotless/tree/main/plugin-gradle)+Google Java Format | 결정적 format/필수 | 낮음 | **추천**; exact version은 build Spike |
| Checkstyle | 명명·source 규칙/일부 | formatter·정적도구와 중복, 설정 중간 | 보류; 팀별 규칙 필요 시 |
| [SpotBugs](https://spotbugs.readthedocs.io/en/stable/gradle.html) | bytecode 결함/필수 | 중간, PMD 일부 중복 | **추천** |
| PMD | source smell/비필수 | 규칙 tuning·SpotBugs 중복 | 보류; 반복 smell 증거 시 |
| ArchUnit | 세밀 의존 규칙/조건부 | Modulith와 중복 | 보류; custom rule 필요 시 |
| [Spring Modulith](https://docs.spring.io/spring-modulith/reference/verification.html) | cycle/API 경계/필수 | 낮음~중간 | **추천** |
| Error Prone | compile-time 결함/조건부 | compiler/toolchain 통합 높음 | 보류; SpotBugs 누락 증거 시 |
| Nullness 도구 | null contract/조건부 | annotation·adoption 높음 | 보류; nullable defect 신호 시 |

Java CI는 문서 CI와 분리해 format check, compile, unit, Modulith, SpotBugs, Testcontainers integration 순으로 실패를 보고해야 한다. 현재 CI에는 Java runner 계약이 없으므로 실제 실행 증거는 Spike 승인 뒤 필요하다.

## 7. 구현 승인 Gate 재판정

`READY`는 제안 계약의 검토 준비 상태이며 코드 승인이 아니다.

| Gate | 상태 | 이번 결과 | 남은 차단 | 구현 전 |
| --- | --- | --- | --- | --- |
| Account/Session/Authorization 상태 | READY | 권위·상태 의미 분리 | 명칭은 후보 | 필수 |
| 세션 권위 모델 | READY | 후보 A 선택 | Owner 수용 | 필수 |
| Session transaction propagation | PARTIALLY_READY | 기본 `REQUIRES_NEW`, 10개 Spike | 실제 PG 증거 | 필수 Spike |
| 정지 원자성 | READY | Account+audit 원자; 삭제 분리 | Owner 수용 | 필수 |
| In-flight Guard | PARTIALLY_READY | Account lock+epoch+조건부 write | race 증거 | 필수 Spike |
| API/오류/멱등성 | PARTIALLY_READY | 비열거+action intent/replay 정의 | session delete race 증거·URL/field | 필수 Spike |
| CSRF/Cookie | PARTIALLY_READY | fail-closed 후보 | 배포 domain/timeout | 필수 |
| Password | PARTIALLY_READY | encoder/rehash 경계 | algorithm parameter/recovery | 필수 |
| 감사 | PARTIALLY_READY | 필수 원자성·금지값 | retention/tamper | 필수 |
| Migration/Build/Package/품질 | READY | Flyway/Gradle KTS/구조/최소 도구 | Owner 수용·version | 필수 |
| Testcontainers | PARTIALLY_READY | 위험별 실제 PG 계약 | Java CI·container 증거 | 필수 Spike |
| 실제 구현 승인 | BLOCKED | `READY_FOR_OWNER_APPROVAL` 후보 조건 충족 | 별도 Owner 승인 | 필수 |

권위 단일성, propagation 검증 방법, in-flight 방어, 도구·package 기본안, 위험별 시험, Slice 제한과 vendor 비의존성이 모두 정의됐다. 따라서 Owner가 먼저 **test-scope Spike만 승인**할 수 있다. 제품 구현과 `implementation_ready: true` 전환은 Spike 증거와 별도 Owner 승인 전까지 금지한다.
