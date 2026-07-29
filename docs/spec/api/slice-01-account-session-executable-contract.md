---
title: Slice 01 Account, Session, and Authorization Executable Contract
document_type: api and data contract proposal
classification: proposal
status: Unapproved
implementation_ready: false
last_verified: 2026-07-29
related_documents: ["README.md","../data/domain-data-model.md","../../discovery/slice-01-account-session-authorization-plan.md","../../discovery/slice-01-session-concurrency-validation.md","../../architecture/security-privacy.md"]
decision_authority: Issue #29 proposes logical operations and storage responsibilities; URLs, DTOs, DDL, migrations, and source code require owner approval
---

# Slice 01 계정·세션·권한 실행 계약

## 1. 범위와 권위

서버의 Account, Spring Session JDBC, Current Authorization과 PostgreSQL commit만 권위다. Cookie, 화면, coarse role, framework event, cleanup Job, audit row는 현재 업무 권위를 대신하지 않는다. 최종 URL·HTTP method·DTO field·table/column/Enum은 승인하지 않는다. IdP/MFA/OAuth/OIDC, Redis, broker, 예약·공식 세션·SSE·LiveKit, 신고·Case·제재·이의·삭제 Workflow와 배포는 제외한다.

## 2. Operation

정확한 scope 이름은 후보이나 `self`와 `target-account`를 섞지 않는다. `suspend`와 `restore`도 독립 grant다.

| Operation | C/Q·필수성 | Actor·현재 권한 | 멱등성·transaction | 성공 | 오류·감사 |
| --- | --- | --- | --- | --- | --- |
| 로그인 | C·필수 | anonymous; Account active | Account lock+session epoch 캡처 뒤 framework session | 최소 current-user+새 session | 모든 credential/account 실패 동일 401; 내부 사유만 감사 |
| 로그아웃 | C·필수 | self current session | 반복 no-op; repository delete | 빈 성공+cookie 제거 | 401 또는 prior success; 필수 |
| 현재 사용자 | Q·필수 | authenticated self | 없음; 최신 Account/session 조회 | opaque account ref+coarse role | 401/403; 보호조회 후보 |
| 현재 권한 | Q·필수 | authenticated self | 없음; 최신 active scope 조회 | scope type/ref+lifetime+version | 401/403; 보호조회 후보 |
| 특정 session 폐기 | C·필수 | own current ref 또는 `session.revoke:target-account` | action intent+idempotent delete/reconcile | 삭제 결과+opaque action ref | 403/404/500 중립; 필수; race Spike 선행 |
| 모든 session 폐기 | C·필수 | self 또는 `session.revoke-all:target-account` | Account lock+epoch 증가+action intent+row 삭제 | 새 epoch+처리 수+action ref | 403/409/500; 필수 |
| Account 정지 | C·관리 | `account.suspend:target-account` | key+Account version; 상태+epoch+history+audit tx | suspended snapshot | 403/409; 필수 |
| Account 복구 | C·관리 | 별도 `account.restore:target-account` | key+version; 상태/history/audit tx | active snapshot; session 부활 없음 | 403/409; 필수 |
| session 목록/상태 | Q·제외 | current session 상태만 current-user에 최소 포함 | 목록 없음 | 다른 기기/위치/fingerprint 미노출 | 실익 증거 뒤 별도 승인 |

타인 session 식별자는 사고 대응 등 승인된 관리 흐름에서 받은 opaque reference만 허용한다. participant용 전체 session 목록은 개인정보·fingerprinting 위험보다 Slice 1 실익이 입증되지 않아 제외한다.

## 3. 상태 의미와 전이

상태 이름은 논리 후보이며 최종 Enum이 아니다.

| 단위 | 현재 | Command/전제 | 다음 | 동시 기록 | 거부 |
| --- | --- | --- | --- | --- | --- |
| Account | ACTIVE | suspend; exact grant+version+reason | SUSPENDED+session epoch 증가 | history+필수 audit | stale/권한 없음/closed |
| Account | SUSPENDED | restore; 독립 grant+version+policy | ACTIVE | history+필수 audit | 조건·stale |
| Account | ACTIVE/SUSPENDED | close access `[OPEN]` | ACCESS_CLOSED | history+필수 audit | 삭제 완료로 오인 |
| Framework Session | 존재·미만료 | rotate; 인증 성공 | 새 ID 존재, old 불가 | security event+audit | Account 비활성 |
| Framework Session | 존재·미만료 | logout/revoke; owner/scope | row 부재 | 필수 audit 결과 | 대상/scope 불일치 |
| Framework Session | 만료 | cleanup | row 부재 | 업무 전이 없음 | cleanup 실패 허용 |
| Authorization | `[OPEN]/REVOKED/EXPIRED` | grant; exact grant scope | ACTIVE | history+필수 audit | 중복 active/범위 오류 |
| Authorization | ACTIVE | revoke; scope+version | REVOKED | history+필수 audit | stale |
| Authorization | ACTIVE | server clock>=expiry | EXPIRED | history 후보 | clock 불확실 |

Session의 `REVOKED/EXPIRED`는 감사 조회 vocabulary일 뿐 framework row와 경쟁하는 mutable Domain 상태가 아니다.

## 4. 요청 실행과 동시성

```text
Browser -> Secure/HttpOnly cookie -> Spring Security/Spring Session
 -> Account current state -> framework session existence/expiry -> coarse role
 -> Application Service -> Account row Guard -> Current Authorization+scope
 -> conditional business write -> mandatory Audit -> PostgreSQL commit
```

Cookie가 있어도 Account 비활성, row 부재/만료, session 발급 epoch 불일치, 현재 scope 부재는 fail closed다. 로그인은 Account lock 아래 epoch를 캡처한다. 정지·전체 폐기는 epoch를 단조 증가시키고 복구 시 되돌리지 않는다. consequential Command는 같은 transaction에서 Account lock/status/authorization epoch를 확인하고 `Account -> Authorization -> Aggregate` 순서로 잠근다. target write는 상태+version 조건을 포함한다. 순수 Query도 현재 상태/epoch를 재조회한다.

## 5. 논리 데이터 책임

최종 table/column은 미승인이다. 식별자는 opaque UUID 후보이며 원본 Cookie/session ID를 domain/audit에 복제하지 않는다.

| 저장 단위 | 권위·소유 | Account/상태·version·시각 | 제약·index | 개인정보·보존·migration |
| --- | --- | --- | --- | --- |
| Account | 현재 lifecycle; account | self; status+version+authorization/session epochs | login ref 후보 unique; status/version | restricted PII; 삭제 제외; Flyway |
| Password Credential | 검증 권위; authentication | N:1; rehash metadata | account+credential type unique | secret hash; Account와 분리·보존 정책; Flyway |
| Framework Session | 인증 session record 유일 권위; framework adapter | principal index; issued session epoch+expiry/last access | 공식 PostgreSQL schema/index | confidential; framework cleanup; 공식 SQL을 Flyway 소유 |
| Session Security Event | append-only 증거; audit | opaque account/session hash ref; action time | action+subject+time index | protected; retention/tamper `[OPEN]`; Flyway |
| Current Authorization | 현재 scope 권위; authorization | account; status+version+expiry | 단일 활성·scope unique 후보 | restricted; 목적 종료; Flyway |
| Authorization History | append-only 전이 증거; authorization | account/current ref; transition time | subject+time | restricted evidence; retention `[OPEN]`; Flyway |
| Audit Record | 행위·결과 증거; audit | actor/target opaque ref; event time | correlation/action/time | protected; 별도 접근·tamper `[OPEN]`; Flyway |
| Idempotency/Action Record | 동일 의도·보안 action 결과 권위; owning application | actor+operation+key hash; pending/success/failure+expiry | actor+operation+key unique | session 현재 권위 아님; 짧은 보존 `[OPEN]`; Flyway |

Framework가 요구하는 schema와 프로젝트 domain schema를 구분하되 둘 다 프로젝트 Flyway history가 적용한다. Spring Session 자동 schema initialization은 운영·CI 기본값으로 쓰지 않는다. framework upgrade 시 repository owner가 공식 PostgreSQL schema diff를 검토하고 새 versioned migration을 제안한다.

## 6. Cookie·CSRF·Password

| 항목 | 계약 | 열린 값 |
| --- | --- | --- |
| Cookie | `Secure`, `HttpOnly`, HTTPS, 최소 Path; 일반 로그 금지 | SameSite/Domain/Max-Age/name은 배포 domain `[OPEN]` |
| CSRF | unsafe·login·logout 보호; SPA header/token; auth/logout 뒤 재발급 | repository/전달 exact config `[OPEN]` |
| Rotation | 로그인과 권한 상승 후보에서 `changeSessionId`; old ID 거부 | audit ordering은 Spike |
| Logout/revoke | 서버 row 삭제가 권위; client cookie도 제거 | delete 실패 시 성공 응답 금지 |
| Password | Account와 credential 분리; `DelegatingPasswordEncoder`; 검증시간 benchmark와 login-time rehash | algorithm/parameter/pepper/recovery는 security review `[OPEN]` |

응답·audit·일반 로그에 Account 존재 여부, password/hash, Cookie, CSRF secret, 원본/복원 가능한 session ID를 노출하지 않는다.

## 7. 오류 계약

| 범주 | HTTP 후보 | 재인증/재시도 | 메시지·로그·재조회 |
| --- | ---: | --- | --- |
| 인증 필요/만료/폐기 | 401 | 예/아니오 | 원인 통합; correlation만; 재인증 |
| 익명 로그인 실패 | 401 단일 범주 | 아니오/제한 후 | 없음/bad credential/정지/종료의 status·body·timing 원칙 통일; 내부 감사 사유만 분리 |
| 인증 후 Account 정지 | 403 | 재인증으로 우회 불가 | 사유 보호; 안전한 상태만 |
| 현재 권한 없음 | 403 | 아니오 | scope·target 존재 비노출; snapshot |
| lifecycle/version 충돌 | 409 | 명시 재제출 | current snapshot 재조회 |
| 중복 | prior result 또는 409 | 자동 재시도 없음 | payload hash 일치 때만 prior result |
| 검증 | 400/422 후보 | 수정 후 | 안전한 field만 |
| 내부/transient DB | 500/503 후보 | idempotent+bounded만 | generic; sanitized correlation; 재조회 |

403/404 선택은 대상 열거 방지 규칙으로 operation별 승인한다. deadlock/serialization 외 의미 충돌을 blind retry하지 않는다.

## 8. 감사 계약

필수: 로그인 성공, 로그아웃, rotation, 특정/전체 session 폐기, Account 정지/복구, 권한 부여/회수. 로그인 실패와 보호 권한 조회는 rate/민감도 검토 후보이며 Break-glass는 제외한다. 최소 actor type, action, opaque target, exact scope/purpose, outcome, server time, correlation을 기록한다. Account/Authorization 상태 변경의 필수 audit 실패는 업무를 rollback한다.

Session delete Command는 먼저 durable action intent를 기록하고 `deleteById` 후 outcome을 확정한다. delete 뒤 outcome/audit 실패 시 성공 응답을 금지하고 같은 idempotency key 재시도가 row 부재를 재조정해 누락·중복 없는 outcome/audit를 완성한다. action record는 session 현재 권위가 아니다. exact transaction/응답은 Spike 통과 전 PARTIALLY_READY다.

## 9. 테스트 실행 계약

| 수준 | 대상 | 실제 PG/Mock | 완료 조건·닫는 Gate |
| --- | --- | --- | --- |
| Unit | Account 전이, auth grant/revoke/expiry, session action policy, 비열거 오류, audit 판정 | PG 없음; Clock/Port mock 허용 | 모든 전이·거부 branch; lifecycle/error/audit |
| PG integration | Flyway, unique, conditional update, optimistic conflict, idempotency prior result | Testcontainers 필수; repository mock 금지 | 실제 constraint와 결과 count; migration/data |
| PG race | business↔suspend, login↔suspend/revoke-all, filter-save↔specific delete | 두 connection/filter latch 필수 | stale epoch/삭제 Cookie 성공·늦은 commit 0; concurrency |
| PG transaction | Session 기본/custom propagation, action reconcile, audit failure, cleanup 격리 | 실제 Spring Session schema | 오류 뒤 retry가 실제 결과+audit 수렴; transaction Gate |
| Security | login success/failure, fixation, CSRF, logout/revoke, suspended/revoked authorization Cookie | MockMvc 허용; DB/session mock 금지 | old Cookie 전부 거부; security Gate |
| Security scope | self/target session과 suspend/restore grants | 실제 authorization fixture | role-only 허용 0; API scope |
| Disclosure | 응답과 captured log | test appender 허용 | Cookie/session/password/account enumeration 0; privacy |
| Architecture/CI | Modulith, format, SpotBugs, unit+integration 분리 | container runner 필요 | module 위반·정적 결함 0; tooling |

다중 instance, Redis, IdP, 부하와 실제 domain Cookie는 Slice 조건부 시험이다. Mock은 외부 경계·Clock·실패 주입에만 쓰며 PostgreSQL transaction, constraint, Spring Session repository를 대체하지 않는다.
