---
title: Slice 01 Product Implementation Approval Plan
document_type: implementation approval plan
classification: proposal
status: PARTIALLY_SUPERSEDED_HISTORICAL_PLAN
implementation_ready: false
last_verified: 2026-07-31
related_documents: ["slice-01-current-authority.md","slice-01-account-session-authorization-plan.md","slice-01-session-concurrency-validation.md","../reviews/slice-01-session-postgresql-spike-results.md","../spec/api/slice-01-account-session-executable-contract.md","../adr/ADR-001-modular-monolith-managed-rtc.md","../adr/ADR-004-postgresql-primary-store.md","../operations/github-workflow.md"]
decision_authority: Historical Issue #33 proposal; current authority is recorded in slice-01-current-authority.md
---

# Slice 01 제품 구현 승인 계획

## 현재 상태와 역사적 경계

[현재 구현 권한 SOT](slice-01-current-authority.md)가 이 문서의 current-state 해석을
통제한다. PR A는 PR #36, PR B는 PR #38과 gate follow-up PR #42로 bounded complete다.
현재 선택은 Spring Data JPA, Flyway, PostgreSQL과 정확한 V1–V6이다. PR C/D, V7+,
API/Realtime/Production Frontend 및 운영은 별도 승인 대상이다.

이하 2026-07-29 계획은 PR #34 시점의 **historical proposal**이다. 당시의
`READY_FOR_OWNER_APPROVAL`, Spring JDBC 우선/JPA 별도 근거, “PR A 파일 없음” 문구는
PR A/B에 한해 merge evidence로 superseded됐다. Issue #37 승인 원문은 Git 이력에서
확인할 수 없어 **Unknown / Owner confirmation required**이며 추측하지 않는다.
`implementation_ready: false`는 proposal contract의 broad production promotion을
막지만 이미 병합된 bounded PR A/B 결과를 부정하지 않는다.

## 1. 목적과 비목적

PR #32의 실제 PostgreSQL Spike 증거를 Account·서버 Session·기본 권한 제품 구현의
승인 가능한 작업 단위로 전환한다. 이 문서는 구현 순서와 Gate의 제안이며 제품 코드를
승인하거나 최종 API·DDL을 확정하지 않는다.

비목적은 실제 Account/로그인/로그아웃, Controller/API, 제품 Entity/Migration,
Credential, 배포·외부 업체 연동을 만드는 것이다. Redis, Kafka, RabbitMQ,
Kubernetes, microservice, 분산 lock은 Slice 1에 추가하지 않는다.

## 2. 승인 대상 기술 기본안

| 항목 | 승인 후보 | 유지할 경계 |
| --- | --- | --- |
| Runtime | OpenJDK 25 LTS, Spring Boot 4.1, Gradle Kotlin DSL | patch와 dependency lock은 PR A에서 review |
| 구조 | 단일 modular monolith, base package `metabus.social` 후보 | 개인/미확정 회사 domain 금지 |
| Database | PostgreSQL, Flyway, Spring JDBC 우선 | Historical proposal; merged PR B selected JPA |
| Session | Spring Session JDBC row만 HTTP 인증 Session 현재 권위 | mutable Domain Authentication Session 원장 금지 |
| Security | Spring Security session auth, CSRF, fixation protection | Cookie/CSRF 배포 값은 Product Gate |
| 품질 | Spotless+Google Java Format, SpotBugs, Spring Modulith, JUnit 5 | Checkstyle/PMD/Error Prone 추가 금지 |
| Test | Testcontainers PostgreSQL, Spring Security Test | H2와 transaction repository mock 금지 |
| CI | format→compile→unit→modulith→spotbugs→PG integration | docs CI와 분리, Secret·배포 없음 |

## 3. Package와 Module 방향

후보 module은 `common`, `account`, `authentication`, `authorization`, `audit`이다.
내부 package는 실제 책임이 있을 때만 `api`, `application`, `domain`,
`infrastructure`로 나눈다.

```text
api/config -> owning application -> domain
account -> common + audit port
authorization -> account public query + audit port
authentication -> account public command/query + authorization public query + audit port
infrastructure -> owning application port + framework
```

Domain은 Spring Session·Security·JDBC를 알지 않는다. 모든 class에 interface를 만들지
않고 Provider, Clock, Audit, Query, Persistence처럼 실제 교체·격리·시험 경계에만 Port를
둔다. Account는 Authentication/Authorization에 역의존하지 않는다. 정지 뒤 Session
물리 삭제는 Authentication Application이 Account 공개 command와 제한된 후속 action을
조정하며 범용 event bus를 만들지 않는다. module cycle과 internal package 접근은
Modulith test가 차단한다.

## 4. Migration과 Session 소유권

- 프로젝트 Flyway history가 Spring Session 공식 PostgreSQL schema와 Domain schema를 적용한다.
- Framework migration과 Domain migration은 경로·설명으로 구분하고 같은 검토 절차를 따른다.
- 운영/CI에서 Spring Session 자동 schema initialization을 사용하지 않는다.
- Spring Session upgrade PR은 공식 schema diff, migration 재현, rotation/폐기 race를 함께 검증한다.
- 최종 Account/Credential/Authorization/Audit DDL은 PR B 승인 범위에서 처음 제안한다.
- Account 상태·session epoch·필수 Audit은 같은 transaction이고 Session row 삭제는 별도 action이다.

## 5. 절대 유지할 실행 계약

- 모든 인증된·보호 요청은 Account 현재 상태와 발급 session epoch를 서버에서 비교해
  fail closed한다. 로그인은 Account `ACTIVE`를 확인하고 lock 아래 현재 epoch를 캡처한다.
- coarse role 뒤 Application Service가 Current Authorization·lifetime·Resource Scope를 재검사한다.
- Account 정지, 전체 Session 폐기, 특정 Session 폐기와 물리 cleanup은 서로 다른 의미다.
- 전체 폐기의 권위 방어는 Account session epoch 단조 증가다.
- 특정 폐기는 Spring Session Repository `deleteById`와 실제 row 재조회로 판정한다.
- Session 삭제와 Audit의 완전 원자성을 주장하지 않는다. 필요 시 bounded Action
  Intent/Outcome과 idempotency key로 재조정한다.
- 원본 Session ID/Cookie/Password/credential은 Domain, Audit, 일반 log에 기록하지 않는다.
- Lock 순서는 `Account -> Authorization -> Aggregate`; 제품 저장 단위에서 다시 검증한다.

## 6. PR 분리와 완료 조건

| PR | 허용 범위 | 제외 | 완료 Gate |
| --- | --- | --- | --- |
| A Product Bootstrap | root Gradle KTS, Java 25 toolchain, Boot app shell, module skeleton, format/SpotBugs/Modulith/unit+PG CI | 기능, Controller, DDL | clean build; module cycle 0; JDK import 진단 0 |
| B Persistence Foundation | Flyway wiring, 공식 Session schema, 논리 Account/Credential/Authorization/Audit persistence 제안, repository integration | 로그인/API, 최종 운영값 | clean DB migration; unique/version/rollback tests |
| C Authentication Foundation | 승인된 Credential/Password 계약, Spring Security/Session config, Account+epoch guard, CSRF/fixation, login/logout 흐름 | 관리 정지/타인 폐기 | Owner Password Gate; 비열거·rotation·logout·stale Cookie tests |
| D Administrative Security Commands | 정지/복구, 전체/특정 폐기, authorization scope, Audit·Action reconciliation | 다른 Slice 기능 | 양방향 lock·폐기 race·audit rollback tests |

PR D가 review 가능한 크기를 넘으면 D1은 Account 정지/복구·전체 epoch 폐기, D2는 특정
Session 폐기·Action reconciliation로 나눈다. 어느 PR도 Slice 1 전체를 한 번에 구현하지
않고 선행 PR의 승인된 contract와 green CI 위에서만 시작한다.
PR C는 Owner가 Credential 분리, encoder/parameter, rehash와 recovery 경계를 승인한 뒤
시작한다. 승인되지 않으면 session guard 설정과 password login을 C1/C2로 분리해 C2를 보류한다.

## 7. Spike 산출물 분류

### 제품 회귀 테스트로 승격

- Flyway가 공식 Session schema/index를 재현하는 test.
- 기본 `REQUIRES_NEW`와 명시적 `REQUIRED` rollback 경계 test.
- 정지·복구 뒤 과거 epoch Cookie 거부와 로그인·전체 폐기 race.
- 특정 Session delete와 Filter save race 및 이전 ID 401.
- Account lock 양방향 race와 정지 뒤 늦은 business commit 0.
- 필수 Audit 실패 시 상태·version·epochs rollback.
- fixation rotation, cleanup 미실행 만료, 비열거 응답, log secret 0.
- correlation별 Action 재조정과 동시 동일-key Audit 1건.

### 제거하고 복사하지 않음

- `/spike/*` Controller, test SecurityFilterChain, fake AuthenticationProvider.
- `SPIKE_ACCOUNT_GUARD`, `SPIKE_AUDIT_FIXTURE`, `SPIKE_SESSION_ACTION`과 `X00*` migration.
- latch endpoint/control, 강제 Audit 실패 hook, 고정 사용자·비밀번호·opaque fixture.
- `SpikeTestApplication`, fixture repository와 제품 이름처럼 보이는 test model.
- SHA-256 helper를 제품 HMAC/reference 결정 없이 그대로 복사하는 행위.
- 제품 `src/main`에 experiment package, custom Session Repository 또는 직접 Session 구현을 복사하는 행위.

문서 근거로만 유지할 항목은 관찰한 transaction ordering, framework schema version,
cleanup 비권위성, Modulith/SpotBugs의 Spike `NO-SOURCE/PARTIAL` 한계다.

## 8. Java/IDE Import Preflight

Spike source의 `java.util.UUID`는 Java 25 Gradle `compileTestJava`에서 성공했으므로 코드
결함이 아니다. 현재 root에는 Java build가 없어서 IDE가 저장소 root만 열면 중첩
`experiments/slice-01-session-postgresql` project/JRE를 놓칠 수 있다.

- PR A 전에는 해당 experiment directory를 Gradle project로 import하고 wrapper refresh를 실행한다.
- JRE System Library/Project SDK는 Gradle toolchain이 받은 Java 25를 사용한다.
- 저장소에 개인 absolute JDK path나 생성된 IDE metadata를 커밋하지 않는다.
- 기준 명령은 Windows `gradlew.bat clean compileTestJava --rerun-tasks`이며 import error 0이어야 한다.
- PR A의 root Gradle bootstrap 이후 IDE import 기준은 root wrapper 하나로 통합한다.

## 9. 남은 Product Gate

| Gate | 상태 | Owner 승인/제품 증거 |
| --- | --- | --- |
| API URL·method·DTO·403/404 | BLOCKED | PR C/D contract review |
| 최종 DDL·identifier·index·retention | BLOCKED | PR B schema review |
| Cookie domain/SameSite/path/timeout | BLOCKED | 배포·security 결정 |
| CSRF repository/header/rotation | PARTIALLY_READY | PR C browser/security test |
| Password algorithm/parameter/pepper/recovery | BLOCKED | 별도 security 결정 |
| Cross-aggregate lock order | PARTIALLY_READY | PR B/D 실제 Authorization/Aggregate race |
| Action reference hash/HMAC·retention | PARTIALLY_READY | PR D security/schema review |
| Audit access/tamper/retention | BLOCKED | security·operations 결정 |
| Modulith·SpotBugs product 효과 | PARTIALLY_READY | PR A 실제 `src/main` evidence |
| Product implementation | READY_FOR_OWNER_APPROVAL | Owner가 PR A~D 범위를 명시 승인 |

## 10. 역사적 Owner 결정 요청과 현재 잔여 Gate

Owner는 (1) PR A~D 범위와 순서, (2) base package, (3) JPA 없이 Spring JDBC로 시작할지,
(4) Cookie/CSRF 환경 Gate의 시점, (5) Password/recovery 별도 승인, (6) HMAC/reference와
Audit 보존, (7) 각 PR의 구현 권한을 결정해야 한다.

2026-07-29 당시 이 문서 상태는 `READY_FOR_OWNER_APPROVAL` 제안이었고 PR A 파일 작성
전이었다. 현재는 PR A/B에 한해 merge history가 이 문구를 supersede한다. PR C/D와
broad production promotion은 여전히 명시적 Owner 승인이 필요하다.
