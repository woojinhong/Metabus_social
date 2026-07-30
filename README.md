# Metabus Social Product Bootstrap

This repository contains the approved Slice 1 PR A product bootstrap. It is a
single Spring Boot modular monolith project rooted at `metabus.social`.

## Scope

The bootstrap provides the executable application shell, module boundary
verification, deterministic formatting, static analysis, tests, and Java CI.
It intentionally contains no controller, database connection, product schema,
account model, authentication, authorization behavior, security configuration,
or server session configuration.

## Toolchain

- Java toolchain: Eclipse Temurin 25; CI pins `25.0.4`
- Spring Boot: `4.1.0`
- Gradle Wrapper: `9.6.1`
- Foojay toolchain resolver: `1.0.0`
- Spring Modulith: `2.1.0`
- Testcontainers: `2.0.5`
- Spotless: `8.8.0`
- Google Java Format: `1.35.0`
- SpotBugs Gradle plugin / engine: `6.5.9` / `4.10.3`

The wrapper can provision a matching Java 25 toolchain when one is not already
installed. Docker and PostgreSQL are not required for PR A tests.

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

## Local verification

Windows:

```text
gradlew.bat clean build
gradlew.bat spotlessCheck
gradlew.bat test
gradlew.bat spotbugsMain
```

Linux or macOS:

```text
./gradlew clean build
./gradlew spotlessCheck
./gradlew test
./gradlew spotbugsMain
```

`test` includes both the database-free Spring context load and Spring Modulith
module discovery/verification. Testcontainers is test-scoped groundwork only;
the first real PostgreSQL container and persistence tests belong to PR B after
PR A is merged with green CI.
