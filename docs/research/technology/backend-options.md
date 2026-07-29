---
title: Backend Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-29
related: README.md; ../../discovery/decisions.md; ../../architecture/application-architecture.md; ../../architecture/security-privacy.md; ../../architecture/data-architecture.md; ../../adr/ADR-001-modular-monolith-managed-rtc.md
decision_authority: docs/discovery/decisions.md and Accepted ADRs only
---

# Backend Options

## Decision context

- [CONFIRMED] ADR-001 selects OpenJDK 25 and Spring Boot 4.1 with a modular-monolith platform baseline. This research explains the tradeoff; it does not authorize implementation.
- [OPEN] Exact patch versions, framework support window, dependency compatibility, build plugins, team skill distribution, memory budget, throughput, and hosting cost require implementation planning and measurements.
- [RECOMMENDED] The primary problem is not maximum synthetic throughput. It is one diagnosable transaction boundary for current authorization, official session state, report–case–sanction–appeal, assignment/work records, privacy workflow, idempotency, and vendor reconciliation.

## Language and framework comparison

| Criterion | Java + Spring Boot | Kotlin + Spring Boot | Node.js + NestJS | Go |
| --- | --- | --- | --- | --- |
| Type safety | Strong static types and mature nullability tooling conventions | Strong static types with language-level null safety | TypeScript compile-time safety; runtime payload validation still required | Strong static types; explicit error/data handling |
| Transactions/data consistency | Mature Spring transaction/JPA/JDBC ecosystem | Same Spring transaction ecosystem | ORM/query-library choice and async flow need consistent conventions | Explicit SQL/transaction handling; less integrated domain stack |
| Authentication/authorization | Spring Security covers session, CSRF, coarse roles and extensible checks | Same Spring Security capabilities | Passport/guards mature, but project policy composition is team-owned | Middleware/libraries available; more policy infrastructure assembled locally |
| JPA/DB access | Direct access to JPA, JDBC, jOOQ ecosystem | Same, with Kotlin/JPA proxy/nullability caveats | TypeORM/Prisma/SQL alternatives; migration from ADR path | database/sql and query generators; explicit mapping |
| Domain modeling | Verbose but explicit aggregates/services and long-lived conventions | Concise domain types and sealed models | Fast DTO/controller iteration; runtime boundary discipline important | Simple explicit services; richer domain conventions are team-designed |
| Realtime connections | MVC/SSE/WebSocket available; blocking server shares JVM resources | Same | Event-loop ecosystem is natural for many I/O connections | Efficient goroutines/networking |
| Provider adapters | Mature HTTP/resilience/testing ecosystem | Same | Broad web SDK availability | Strong HTTP/concurrency; vendor SDK coverage varies |
| Testing | JUnit/Spring slices/integration/Testcontainers ecosystem | Same plus Kotlin test options | Jest and HTTP/integration tooling | Standard test tooling; more custom application harness |
| Observability/diagnosis | Mature JVM diagnostics, Micrometer/OpenTelemetry ecosystem | Same JVM operations | Mature OpenTelemetry/logging, event-loop diagnosis required | Low-overhead runtime and mature profiling; application conventions needed |
| Memory/startup | Typically higher footprint/startup than Go/Node; exact values workload-dependent | Similar JVM baseline | Often lower startup than Spring; memory varies by dependencies/workload | Usually lean binary/runtime |
| CPU/concurrency | Strong general throughput; blocking workload sized by pools | Same | Strong I/O concurrency; CPU work must not block event loop | Strong concurrency and efficient network workloads |
| Team capability | [OPEN] No verified staffing matrix; ADR records platform choice | Adds language/compiler conventions | Adds runtime/package/security/toolchain change | Largest architecture/tooling rewrite |
| Repository/ADR fit | [CONFIRMED] Direct alignment | Partial alignment; retains Spring/JVM | Conflicts with selected backend baseline | Conflicts with selected backend baseline |
| Transition cost | Lowest from approved baseline | Moderate source/language migration | High rewrite of security, transactions, tests, operations | High rewrite plus ecosystem replacement |

## Recommendation and tradeoff

- [RECOMMENDED] Retain Java + Spring Boot for the business server because Spring Security, local transactions, JPA/JDBC options, structured testing, and JVM diagnostics directly support the project's revocable authorization and strongly consistent workflow.
- [RECOMMENDED] This choice prioritizes correctness and operational diagnosis over the lower memory footprint and connection-oriented simplicity Go or Node may provide.
- [RECOMMENDED] Keep domain rules and provider-neutral request/result models away from vendor SDK types. Use framework abstractions where they provide transaction/security value, not an interface for every class.
- [REVISIT-WHEN] Kotlin becomes preferable if the approved team has sustained Kotlin capability and a prototype proves JPA, serialization, proxy, nullability, debugging, and build conventions without splitting the codebase.
- [REVISIT-WHEN] Node/NestJS or Go becomes preferable for an extracted realtime/provider component only when independent connection load, failure isolation, release ownership, and operations show a material benefit; do not rewrite the transactional core for anticipated scale.

## Spring MVC, WebFlux, and separation

| Option | Business request fit | JPA fit | Realtime fit | Complexity | Decision |
| --- | --- | --- | --- | --- | --- |
| Spring MVC | Blocking transaction/request model aligns with JPA and current command/query flow | Direct and predictable | SSE/WebSocket possible within bounded load | Familiar thread/pool capacity model; blocking calls visible | [RECOMMENDED] Initial business server |
| Spring WebFlux | Useful for end-to-end nonblocking I/O and high connection concurrency | JPA remains blocking and needs isolation | Strong reactive connection handling | Reactive context, backpressure, debugging, library compatibility | [NOT-RECOMMENDED] Initial core |
| MVC plus reactive client/library | Blocking business path with bounded async integration | Preserves JPA transactions | Selective nonblocking client benefit | Mixed mental models and scheduler boundaries | [OPEN] Only for a measured adapter need |
| Separate realtime gateway | Independent connection runtime and scaling | Business data remains behind API | Best isolation for very high connection load | Another deployable, auth propagation, routing, tracing, on-call | [REVISIT-WHEN] Measured gateway entry gates pass |

[NOT-RECOMMENDED] JPA plus WebFlux does not make database work nonblocking. Offloading blocking persistence to another scheduler keeps thread pools and adds context/error/transaction complexity, so it has no demonstrated Pilot advantage.

## Operational and security consequences

| Concern | Java/Spring MVC mitigation | Residual risk/evidence |
| --- | --- | --- |
| Current permission | Spring Security coarse gate plus Application Service/row-scope recheck | Exact policy/test configuration [OPEN] |
| Transaction conflict | Expected state, optimistic version, constraints, short locks | Final persistence dependency/schema [OPEN] |
| Duplicate request | PostgreSQL idempotency and recorded result | Key scope/retention [OPEN] |
| Provider latency | Commit intent first; worker/Outbox; timeout and bounded retry | Provider behavior/SLA [OPEN] |
| SSE connections | Measure connections, threads, heap, GC, fan-out and REST impact | Numeric threshold [OPEN] |
| Memory/cost | Size from measured heap/GC and request/connection profile | VM size/price [OPEN] |
| Diagnosis | Structured redacted logs, metrics, traces, JVM dumps/profiles under access control | Tool/service configuration [OPEN] |

## Testing and migration gates

- [RECOMMENDED] A backend proof must cover Spring Security session revocation, assignment/resource scope, allowed/forbidden transitions, real PostgreSQL transactions, optimistic conflicts, unique constraints, duplicate commands, webhook replay/disorder, Outbox/job retry, provider timeout, and deletion reconciliation.
- [RECOMMENDED] Use contract tests at external adapters and keep provider DTOs outside business/domain APIs to limit vendor or future language migration cost.
- [REVISIT-WHEN] Extract a module only when its data ownership, API contract, idempotency, failure policy, observability, deployment owner, and migration/backfill plan are explicit.
- [OPEN] No performance claim is accepted until representative REST, SSE, database, worker, and media-control workloads are measured in the approved environment.

## Source and evidence limits

- Spring Boot system requirements: <https://docs.spring.io/spring-boot/system-requirements.html> (repository research previously verified 2026-07-27; exact support/compatibility must be rechecked before implementation).
- NestJS documentation: <https://docs.nestjs.com/> (documents the framework, not comparative suitability for this product).
- Framework documentation does not establish team skill, secure configuration, throughput, memory, regional hosting cost, or vendor compatibility for Propscans; those remain [OPEN].
