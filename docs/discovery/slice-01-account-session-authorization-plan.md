---
title: Slice 01 Account, Session, and Basic Authorization Implementation Plan
document_type: implementation plan
classification: proposal
status: Unapproved
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["../spec/traceability-implementation.md","../spec/api/README.md","../spec/data/domain-data-model.md","../architecture/application-architecture.md","../architecture/security-privacy.md"]
decision_authority: Issue #27 scopes this proposal; implementation requires separate owner approval
---

# Slice 01 계정·서버 세션·기본 권한 구현 계획

## 1. 목표와 범위

서버가 인증 상태와 현재 권한의 권위 원본이 된다. 계정 정지와 세션 폐기는 다음 요청부터 반영하고, 브라우저는 서버 세션을 사용한다. 큰 역할만으로 업무 접근을 허용하지 않으며 Application Service가 현재 Resource Scope를 재검사한다. 감사 기록은 일반 로그와 분리하고 응답은 최소 개인정보만 포함한다.

포함: Account lifecycle, 로그인·로그아웃·rotation·폐기·강제 로그아웃, coarse role, 현재 권한 조회/재검사, CSRF, 오류, 감사, PostgreSQL Testcontainers 계획. 제외: IdP/MFA/OAuth/OIDC, 예약·공식 세션·SSE·LiveKit, 신고·Case·제재·이의·삭제 Workflow, Redis/broker/Docker/배포와 실제 코드·DDL.

현재 저장소에는 생산 백엔드, Gradle/Maven, Spring Security, DB/migration 설정이 없다. 승인 기준은 OpenJDK 25/Spring Boot 4.1, PostgreSQL authority, Redis 비기본값이다. 공식 근거는 [Boot 요구사항](https://docs.spring.io/spring-boot/system-requirements.html), [Spring Session JDBC](https://docs.spring.io/spring-session/reference/configuration/jdbc.html), [Session security](https://docs.spring.io/spring-security/reference/7.0/servlet/authentication/session-management.html), [CSRF](https://docs.spring.io/spring-security/reference/7.0/servlet/exploits/csrf.html), [Password storage](https://docs.spring.io/spring-security/reference/7.0/features/authentication/password-storage.html), [PostgreSQL Testcontainers](https://java.testcontainers.org/modules/databases/postgres/)이다. 정확한 patch/dependency는 [OPEN].

## 2. 구현 단위

| 단위 | 책임·소유 모듈·의존 | 주요 상태·전이 | 개인정보·감사 | 동시성·삭제/보존 |
| --- | --- | --- | --- | --- |
| Account | Account; Authentication/Authorization이 Query Port로 참조 | `ACTIVE/SUSPENDED/ACCESS_CLOSED` 후보 | PII; 상태 변경 감사 | version; 삭제 Workflow는 제외, 보존 [OPEN] |
| Authentication Session | Authentication; Account 현재 상태 의존 | `ACTIVE/REVOKED/EXPIRED` 후보 | 비밀 참조; 발급/회전/폐기 감사 | 조건부 폐기; 보안 목적 후 삭제 [OPEN] |
| Current Authorization | Authorization; Account/resource 참조 | `ACTIVE/REVOKED/EXPIRED` 후보 | restricted; 부여/회수 감사 | version·단일 활성 후보; 목적 종료 후 보존 [OPEN] |
| Authorization History | Authorization; Current Authorization 참조 | append-only 전이 후보 | restricted evidence; audit-linked | 전이와 동시 append; 기간 [OPEN] |
| Audit Record | Audit; 각 Application Service가 등록 | governed action outcome | 보호 record; 일반 로그와 분리 | 필수 감사 실패 시 업무 rollback; 기간/변조방지 [OPEN] |

## 3. API Operation 후보

최종 URL, HTTP Method, operation ID, DTO 필드는 확정하지 않는다.

| Operation | C/Q | 인증·큰 역할 | Application Service 검사 | 멱등성 | 성공·오류·감사 |
| --- | --- | --- | --- | --- | --- |
| 로그인 | C | 불필요; anonymous | credential, Account 상태 | retry/중복 [OPEN] | 새 session; 실패/정지; 성공·실패 후보 감사 |
| 로그아웃 | C | 필요; any | 현재 session/Account | 동일 폐기 반복 허용 | revoked/무효화; 감사 |
| 현재 사용자 | Q | 필요; any | Account와 session 현재 상태 | 불필요 | 최소 projection; 401/정지 |
| 현재 권한 | Q | 필요; any | 활성 grant·lifetime·scope | 불필요 | 최소 scope; 403/권한 없음; 보호조회 감사 후보 |
| 전체 session 폐기 | C | 필요; self/admin 후보 | actor, Account, 대상 범위 | key 후보 | 폐기 수/reference; 403/충돌; 감사 |
| 특정 session 폐기 | C | 필요; self/admin 후보 | 소유·대상 session 현재 상태 | 반복 폐기 허용 | revoked/current result; 감사 |
| Account 정지 | C | 필요; 관리 역할 후보 | 현재 권한·Account version·사유 | key 필요 후보 | suspended+sessions revoked; 403/409; 감사 |
| Account 정지 해제 | C | 필요; 관리 역할 후보 | 독립 권한·version·복구 조건 [OPEN] | key 필요 후보 | active 후보; 403/409; 감사 |
| session 상태 | Q | 필요; self/admin 후보 | 소유/관리 scope·최소 필드 | 불필요 | 최소 상태; 403/404; 보호조회 감사 후보 |

자기 session 작업은 subject ownership+own-account scope, 타인 session 폐기는 privileged current grant+exact target scope를 요구한다. 정지와 해제는 독립 grant 후보이며 coarse role이 남아도 현재 grant·scope·lifetime 불일치 시 거부한다.

## 4. 상태 전이 후보

상태명은 최종 Enum 승인이 아니다. 기타 상태는 `[OPEN]`이다.

### Account
| 현재 | Command | 전제조건 | 다음 | 동시 기록 | 거부 |
| --- | --- | --- | --- | --- | --- |
| ACTIVE | suspend | 현재 관리 권한·version·사유 | SUSPENDED | session 폐기+history+audit | 권한/버전/이미 종료 |
| SUSPENDED | restore 후보 | 복구 권한·version·정책 [OPEN] | ACTIVE | history+audit; 새 session 없음 | 조건/권한/버전 |
| ACTIVE/SUSPENDED | close access | 별도 승인된 목적 [OPEN] | ACCESS_CLOSED | session 폐기+history+audit | 삭제 완료로 오인 |

### Authentication Session
| 현재 | Command | 전제조건 | 다음 | 동시 기록 | 거부 |
| --- | --- | --- | --- | --- | --- |
| ACTIVE | rotate | 인증 성공/권한 상승 후보 | ACTIVE(new ID) | old 폐기·발급 audit | Account 비활성 |
| ACTIVE | revoke/logout | 현재 소유/관리 권한 | REVOKED | revoked time+audit | scope 불일치 |
| ACTIVE | expire | server clock·expiry | EXPIRED | cleanup/history 후보 | clock 불확실 |
| REVOKED/EXPIRED | revoke | 동일 대상 | 동일 | prior result | 다른 actor/scope |

### Current Authorization
| 현재 | Command | 전제조건 | 다음 | 동시 기록 | 거부 |
| --- | --- | --- | --- | --- | --- |
| `[OPEN]/REVOKED/EXPIRED` | grant | grant 권한·유효 scope/lifetime | ACTIVE | history+audit | 중복 활성/범위 오류 |
| ACTIVE | revoke | revoke 권한·version | REVOKED | history+audit | stale version |
| ACTIVE | expire | server clock·lifetime | EXPIRED | history 후보 | clock 불확실 |
| REVOKED/EXPIRED | grant | 새 의도·현재 정책 | ACTIVE 후보 | 새 grant/history+audit | 과거 record 재활성화 |

## 5. 인증·권한 실행 흐름

```text
브라우저 -> Secure/HttpOnly cookie -> Spring Security session 인증
 -> Account 현재 상태 -> session 폐기·만료 -> coarse role
 -> Application Service -> Current Authorization + resource scope
 -> 업무 -> Audit -> PostgreSQL commit
```

Cookie가 있어도 정지/종료 Account, 폐기 시각 이후 session은 거부한다. claim·화면·role만 신뢰하지 않고 role과 현재 Resource Scope를 분리한다. 권한·DB·session-store 불확실성은 fail closed다. 일반 로그에 Cookie, token, 원본/복원 가능한 session ID, credential을 기록하지 않는다.

## 6. 서버 세션·Cookie·CSRF 후보

| 방식 | 강제 로그아웃/재시작 | 단일/다중 instance | 복잡도·rotation/expiry | 테스트·개인정보·전환 |
| --- | --- | --- | --- | --- |
| Spring Session JDBC | principal/session 삭제·조회 지원 후보; 지속 | 모두 가능, DB 의존 | 중간; framework lifecycle | 실제 PG 검증 가능; 직렬화/최소 attribute 검토; Redis 전환 가능 |
| 직접 DB-backed session | 정밀 제어 | 모두 가능 | 높음; 보안 lifecycle 자체 책임 | 도메인 맞춤/테스트 가능; 유지보수·전환 비용 큼 |
| 기본 Servlet session | instance 폐기 가능; 재시작 손실 후보 | 단일 적합 | 낮음; container rotation | 빠른 시작; 강제 전체 폐기/확장/복구 증거 약함 |
| Redis-backed session | 즉시 폐기·재시작 지속 | 다중 적합 | 운영 의존 추가 | 빠른 TTL; 새 개인정보 store·장애면 fail closed; 초기값 금지 |

추천 후보는 Spring Session JDBC이나 선택은 보류한다. Framework session row와 별도 Domain Session 원장 중 권위·이력·삭제 후 조회를 정하고, transaction manager/propagation을 통합해 Account·session·audit 원자성을 증명해야 한다. exact dependency, schema ownership/migration, serialization, cleanup은 [OPEN]; 측정 전 Redis는 선택하지 않는다.

Cookie 후보: `Secure=true`, `HttpOnly=true`, `SameSite`·`Path`·`Domain`·Max-Age/session-cookie는 배포 domain/flow 확정 전 [OPEN], HTTPS 필수. CSRF는 기본 보호를 유지하고 SPA용 header/token 전달 및 로그인·로그아웃 뒤 token 갱신을 검증한다. 로그인/권한 상승 뒤 session ID를 rotate하고, 로그아웃은 cookie 제거+서버 폐기, 강제 로그아웃은 서버 상태를 먼저 폐기한다.

## 7. 계층별 책임

| 계층 | 책임 | 금지 |
| --- | --- | --- |
| API Entry | shape 검증, Principal 연결, 오류 변환, Application Port 호출 | scope 결정·Repository 접근 |
| Application Service | Account/session/현재 권한 검사, 전이, transaction, Audit | 오래된 claim·외부 호출 신뢰 |
| Domain | Account 정지/복구, session 폐기/만료, authorization 활성/회수 규칙 | framework/DB/actor 조회 |
| Repository | Account/session/grant 조회·조건부 갱신, unique/version 충돌 mapping | cross-module mutation·post-filter auth |
| Query Service | 최소 current-user/authorization/session projection | mutation·무제한 보호조회 |

## 8. 트랜잭션·동시성

| 업무 | 경계·조건/version/unique | 멱등·재시도 | 감사·실패 |
| --- | --- | --- | --- |
| 로그인 | credential+Account 확인 후 session 발급; active ID unique | 불확실 결과 재조회; blind retry 금지 | 성공/실패 후보; 중립 오류 |
| 로그아웃 | active 조건부 revoke | 반복은 prior result | 같은 transaction audit; cookie 제거 |
| Rotation | old active 확인, new unique 발급, old revoke | 동일 의도 중복 방지 | 원자성+audit; 충돌 시 재인증 |
| 강제 로그아웃 | actor/scope 재검사, 대상 active 일괄 조건부 revoke | action key 후보 | count/reference audit; stale 재조회 |
| Account 정지 | Account version/authorization epoch guard+모든 active session revoke 후보 | key+version; DB transient만 bounded retry | 단일 transaction 가능성 검증 전 [OPEN] |
| 권한 부여 | Account/resource/scope 확인+single-active unique | key 후보; 충돌 재조회 | grant+history+audit 원자 |
| 권한 회수 | active+version 조건 | 반복은 prior result 후보 | revoke+history+audit 원자 |
| 정지 직전 요청 | business write가 Account version/authorization epoch 조건을 함께 검사; lock order 후보 [OPEN] | 자동 성공 재시도 금지 | guard 실패 409/403; Snapshot 재조회 |

같은 transaction은 즉시성과 단순 증명이 강점이나 Spring Session transaction propagation과 모듈 경계를 먼저 검증해야 한다. Account orchestrator가 Authentication Command Port와 Audit Port를 조정하는 후보다. 분리 store라면 정지 fact가 먼저 fail closed하고 내구성 후속 폐기를 수행하되 Job 성공을 업무 완료로 부르지 않는다.

## 9. 데이터베이스 논리 계획

논리 저장 단위는 Account, Credential 후보, Authentication Session, Current Authorization, Authorization History, Audit Record다. Account 1:N Session/Grant, Grant 1:N History, Audit는 opaque reference로 연결한다. ID는 opaque UUID/유사 후보; account credential, session identifier/hash, active grant에 unique 후보; Account/Grant에 version, session expiry/revoked/last-used 시각 후보와 필요한 인덱스를 검토한다. 원본 session ID 저장 여부와 hash/lookup 전략은 threat review 전 [OPEN]. 마지막 사용 시각은 보안 목적·write load·retention을 비교한다.

비밀번호가 포함되면 Credential을 Account와 분리하는 후보를 우선 검토하고 Spring `PasswordEncoder`/`DelegatingPasswordEncoder`, bcrypt/PBKDF2/scrypt/Argon2 후보, 검증시간 benchmark와 로그인 시 재해시를 Gate로 둔다. algorithm/parameter/pepper/recovery는 보안 검토 전 확정하지 않는다.

## 10. 오류 모델

| 오류 | HTTP 후보 | 재인증/재시도 | 메시지·로그·Snapshot |
| --- | ---: | --- | --- |
| 인증 필요 | 401 | 예/인증 후 | 중립; correlation만; 인증 후 조회 |
| 로그인 실패 | 401 | 아니오/제한 후 | Account 존재 비노출; credential 금지 |
| Account 정지 | 403 후보 | 정책상 예/아니오 | 최소 안내; 사유 보호; 현재 상태 조회 후보 |
| session 만료/폐기 | 401 | 예/아니오 | 동일 중립 범주 후보; 재인증 |
| 권한/현재 권한 없음 | 403 | 아니오 | scope·대상 존재 비노출; 필요 시 snapshot |
| 전이/version 충돌 | 409 | 아니오/명시 재제출 | 안전한 stale 안내; snapshot 필수 |
| 중복 요청 | 409 또는 prior result | 아니오 | prior result 조회; key payload 로그 금지 |
| 검증 실패 | 400/422 | 수정 후 | 안전한 field만; 보호값 로그 금지 |
| 내부 오류 | 500 | 먼저 재조회 | generic; sanitized correlation; snapshot 후 판단 |

## 11. 감사·테스트 계획

감사 후보: 로그인 성공/실패, 로그아웃, rotation, 특정/전체 session 폐기, Account 정지/해제, 권한 부여/회수, 보호된 현재 권한 조회. Break-glass는 제외/[OPEN]. actor type, action, opaque target, purpose/scope, outcome, time, correlation을 최소 기록하고 Cookie·비밀번호·원본 session ID·보호 payload는 기록하지 않는다.

필수 테스트: Account/session/authorization 전이; Spring Security 인증·CSRF·rotation; 로그아웃/강제폐기/정지 뒤 기존 Cookie 거부; 권한 회수 뒤 재요청 거부; 실제 PostgreSQL Testcontainers; conditional UPDATE/낙관 잠금·unique 충돌; session transaction propagation과 Account/session/audit 전체 rollback; 정지와 in-flight write 경주; 감사 원자성; 오류·로그 비노출. 조건부: 다중 instance, Redis, IdP, 부하, 실제 domain Cookie. Testcontainers 실행 환경은 [OPEN]이다.

## 12. 예상 구현 파일
| 순서·범주 | 논리 파일/패키지 후보와 목적 | 의존 방향 | 승인 전 확정 |
| --- | --- | --- | --- |
| 1 오류 | `[base].[common].error`/response 후보 | API -> common | 범주만; 이름 [OPEN] |
| 2 Account Domain | `[base].account.domain` lifecycle | Account Application -> Domain | 논리 package만 |
| 3 Authentication Domain | `[base].authentication.domain` session | Authentication Application -> Domain | 논리 package만 |
| 4 Authorization Domain | `[base].authorization.domain` grant/history | Authorization Application -> Domain | 논리 package만 |
| 5 Account Application | suspend/restore orchestrator+Authentication/Audit Ports | API -> Account -> Ports | 책임만 |
| 6 Authentication Application | login/logout/rotate/revoke Ports | Security/API -> Authentication | 책임만 |
| 7 Authorization Application | grant/revoke/current-scope Ports | API/Account -> Authorization | 책임만 |
| 8 API/DTO | auth/account/authorization Entry와 분리 in/out DTO | API -> Application Ports | 최종 이름/field 불가 |
| 9 설정 | Security/Session/CSRF/Cookie config 후보 | framework -> Ports | 값/파일 [OPEN] |
| 10 Account persistence | owned Repository Adapter+migration 후보 | Adapter -> Account | DDL/도구 불가 |
| 11 Session persistence | Spring Session Adapter+Domain mapping+migration 후보 | Adapter -> Authentication | 권위/DDL 불가 |
| 12 Authorization persistence | grant/history Repository+migration 후보 | Adapter -> Authorization | DDL 불가 |
| 13 Query/Audit | 최소 projection; 별도 Audit Port/Adapter/migration 후보 | Application -> owned adapters | schema/retention 불가 |
| 14 단위 테스트 | 세 domain lifecycle | tests -> Domain | suite만 가능 |
| 15 통합/보안 테스트 | PG Repository, Security, CSRF, race, log capture | tests -> adapters/application | suite만 가능 |

### 구현 순서
1 오류/공통 응답—비열거 계약; 2 Account—정지/복구 전이; 3 Session—rotate/revoke/expire; 4 Authorization—grant/history; 5 Repository+PG—제약/race; 6 Spring Security—session/CSRF; 7 login/logout—재사용 거부; 8 강제 logout—대상/전체 폐기; 9 Account 정지—원자성/직렬화; 10 current query—최소 projection/scope; 11 Audit—업무와 rollback; 12 전체 테스트—보안·동시성 회귀 통과. 실제 경로·클래스·migration은 구현 승인 뒤 확정한다.

## 13. Slice 1 구현 승인 Gate

| Gate | 상태 | 필요한 결정·증거 | 미충족 영향 | 다음 조치 |
| --- | --- | --- | --- | --- |
| Account 상태 | PARTIALLY_READY | 최종 상태·복구/종료 의미 | Account 전이 불가 | owner contract review |
| Session 상태 | PARTIALLY_READY | 최종 상태·만료/폐기 의미 | Session 전이 불가 | security review |
| Authorization 상태 | PARTIALLY_READY | 최종 상태·scope/lifetime | Grant 전이 불가 | authorization review |
| API Operation | PARTIALLY_READY | URL/method/DTO/idempotency | executable API 불가 | API review |
| 오류 모델 | PARTIALLY_READY | status/code/requery vocabulary | 안전한 client 처리 불가 | security/API review |
| 서버 session 저장 | PARTIALLY_READY | JDBC schema/serialization/cleanup/load | 저장 구현 불가 | Spring Session JDBC spike 승인 |
| Session 권위 매핑 | BLOCKED | framework row와 Domain 원장·이력·propagation | 강제폐기/감사 증명 불가 | transaction 통합안 결정 |
| CSRF | PARTIALLY_READY | SPA token 전달·갱신 | state-changing 요청 보호 불가 | security review |
| Cookie 정책 | PARTIALLY_READY | domain, SameSite, path, timeout | browser auth 불가 | 배포/security review |
| Password 정책 | BLOCKED | login identifier, encoder/parameter/recovery | credential 구현 불가 | owner+security 결정 |
| 트랜잭션 경계 | BLOCKED | session propagation·정지/폐기/audit 원자성 | partial commit 위험 | PG transaction 검증 |
| 동시성 | BLOCKED | authorization epoch/version guard·lock order | 정지 뒤 늦은 commit 위험 | race test/guard 결정 |
| 멱등성 | PARTIALLY_READY | operation key/scope/retention | retry 중복 위험 | API/data review |
| 감사 | PARTIALLY_READY | 대상, retention, access/tamper | 책임성 증명 불가 | security/operations review |
| PostgreSQL migration 도구 | BLOCKED | Flyway/Liquibase와 session schema ownership | schema 생성 불가 | build/data 결정 |
| Testcontainers | PARTIALLY_READY | version/image/CI runtime | 실제 PG 증거 없음 | CI/tooling 결정 |
| 패키지 구조 | BLOCKED | build tool, base package, module boundary | 파일 경로 확정 불가 | bootstrap proposal 승인 |
| 코드 스타일 | BLOCKED | formatter/static checks/convention | 일관된 구현 불가 | tooling 결정 |
| 외부 IdP/MFA | EXTERNAL_EVIDENCE_REQUIRED | 이번 Slice 제외; 향후 vendor/policy | federated/strong auth 없음 | 별도 evidence Gate |
| 구현 승인 | BLOCKED | 이 계획과 executable contract에 대한 별도 Owner 승인 | 코드/DDL/migration 생성 금지 | Owner가 승인 여부 결정 |

READY인 항목도 코드 승인을 뜻하지 않는다. 열린 결정은 build tool/base package, credential/recovery, exact dependency, session schema와 migration ownership, Cookie/CSRF 값, retention/tamper, concurrency/idempotency 세부다.
