# Metabus Social Product Application

This repository contains the approved Slice 1 product foundation. It is a
single Spring Boot modular monolith rooted at `metabus.social`.

## Scope

The application provides the executable shell, module boundary verification,
PostgreSQL persistence foundation, deterministic formatting, static analysis,
tests, and Java CI. It intentionally contains no controller, login/logout,
Spring Security configuration, Spring Session runtime configuration, session
epoch request guard, or administrative command.

## Toolchain

- Java toolchain: Eclipse Temurin 25; CI pins `25.0.4`
- Spring Boot: `4.1.0`
- Gradle Wrapper: `9.6.1`
- Foojay toolchain resolver: `1.0.0`
- Spring Modulith: `2.1.0`
- Testcontainers: `2.0.5`
- Spring Data JPA: `4.1.0`
- Flyway: `12.4.0`
- PostgreSQL JDBC: `42.7.11`
- PostgreSQL integration image: `postgres:18.4-alpine`
- Spotless: `8.8.0`
- Google Java Format: `1.35.0`
- SpotBugs Gradle plugin / engine: `6.5.9` / `4.10.3`

The wrapper can provision a matching Java 25 toolchain when one is not already
installed. Docker is required only for `integrationTest`; context and Modulith
tests remain database-free.

## Module boundaries

| Module | Allowed module dependencies |
| --- | --- |
| `common` | none |
| `audit` | none |
| `account` | `common`, `audit` |
| `authorization` | `account`, `audit` |
| `authentication` | `account`, `authorization`, `audit` |

Only the module root packages exist in this bootstrap. Internal
`api`/`application`/`domain`/`infrastructure` packages are added later when a
reviewed responsibility needs them.

## Persistence foundation

Flyway owns both framework and product schema history. Hibernate is configured
with `ddl-auto=validate`; schema creation or update is never delegated to JPA.
Spring Session automatic schema initialization is disabled.

| Migration | Responsibility |
| --- | --- |
| `V1` | Exact Spring Session `4.1.0` PostgreSQL tables and indexes |
| `V2` | Account lifecycle, epochs, optimistic version, status history |
| `V3` | Account-separated password credential persistence |
| `V4` | Current Authorization and append-only Authorization History |
| `V5` | Purpose-bounded Audit records and idempotency constraint |
| `V6` | Account-owned verified email login identifier persistence |

The V1 SQL is pinned to the
[Spring Session 4.1.0 upstream resource](https://github.com/spring-projects/spring-session/blob/a8a11445956c1db2babb07aa9bcbb09e3fdc034b/spring-session-jdbc/src/main/resources/org/springframework/session/jdbc/schema-postgresql.sql).
Framework Session tables have no foreign key to Account. The experiment-only
attribute index is not promoted into the official product migration.

JPA mappings live in each owning module's `infrastructure.persistence`
package. Cross-module relationships use UUID references rather than JPA object
associations, while PostgreSQL enforces the approved foreign keys with
`ON DELETE RESTRICT`. UUIDs and `Instant` timestamps are supplied by the
application boundary; PostgreSQL stores time as `timestamptz`.

The Account module owns the login identifier while Authentication owns password
credentials. V6 stores only the caller-supplied normalized email, requires a
verification timestamp, and applies bytewise active uniqueness. It does not
store a second display copy. The schema rejects outer whitespace in the stored
normalized value. Whether callers trim or reject input, plus the local-part
case, IDN, and Unicode normalization policy, remains a PR C Owner gate;
whole-address lowercasing and provider-specific dot or plus-tag canonicalization
are not assumed here.

Credential algorithm, parameters, pepper, recovery, and actual password hash
generation remain PR C gates. Audit retention/tamper policy and typed metadata
remain later gates, so PR B exposes only fixed audit fields. Session Action
Intent/reference/reconciliation also remain later gates. Outside the official
Spring Session tables, the business/domain/audit schema stores neither raw
Session IDs nor Cookies.

## Local verification

Windows:

```text
gradlew.bat clean build
gradlew.bat spotlessCheck
gradlew.bat test
gradlew.bat integrationTest
gradlew.bat spotbugsMain
```

Linux or macOS:

```text
./gradlew clean build
./gradlew spotlessCheck
./gradlew test
./gradlew integrationTest
./gradlew spotbugsMain
```

`test` includes the database-free Spring context load and Spring Modulith
verification. `integrationTest` uses actual PostgreSQL through Testcontainers
for Flyway, Hibernate validation, constraints, repositories, optimistic
conflicts, row locks, and mandatory-audit rollback. The Gradle `build` task also
depends on this integration suite.
