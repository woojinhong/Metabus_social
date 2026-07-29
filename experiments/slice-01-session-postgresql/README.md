# Slice 01 Spring Session PostgreSQL Spike

Issue #31의 test-scope 기술 실험이다. 제품 코드, 실제 API, 운영 Entity·Migration,
Credential, 배포 설정이 아니며 실제 사용자 데이터나 Secret을 사용하지 않는다.

## Boundaries

- 모든 Java fixture는 `src/test`에만 둔다.
- PostgreSQL은 Testcontainers `postgres:18-alpine`만 사용한다.
- Spring Session 4.1 공식 PostgreSQL schema를 experiment Flyway prefix `X`로 적용한다.
- `spring.session.jdbc.initialize-schema=never`, cleanup cron 비활성으로 경계를 관찰한다.
- H2, repository mock, Redis, broker, Docker Compose를 사용하지 않는다.

## Commands

```text
gradlew.bat spotlessCheck test spotbugsMain spotbugsTest
gradlew.bat integrationTest
gradlew.bat check
```

Docker가 없는 로컬 환경에서는 integration task를 성공으로 간주하지 않는다. 전용 CI가
Java 25와 Docker를 제공하고 integration test를 두 번 반복한다.

## Disposal

Bootstrap, fixture migration과 helper는 검증 후 제거 대상이다. 재현성 있는 security,
transaction, concurrency test만 별도 Owner 승인 후 제품 test로 승격할 수 있다.
