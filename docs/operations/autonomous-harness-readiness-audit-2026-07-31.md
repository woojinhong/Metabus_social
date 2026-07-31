---
title: Autonomous Development Harness Readiness Audit
document_type: readiness audit
classification: research finding
status: Historical pre-AH-P0/AH-P1 snapshot; no decision authority
last_verified: 2026-07-31
related_documents: ["../INDEX.md","../discovery/autonomous-harness-readonly-planner-authority.md","automation/requirement-schema.md","automation/work-package-and-issue-schema.md","automation/workgraph-state-lock-schema.md","automation/dry-run-planner-contract.md","github-workflow.md","../discovery/slice-01-current-authority.md"]
decision_authority: none; read-only repository and GitHub settings audit at origin/master 1416aad
---

# Propscans 자율형 개발 Harness 준비도 감사

판정 표기: **E** Evidence, **I** Inference, **U** Unknown. 파일 근거는 `path:line`이다. Live GitHub 설정은 2026-07-31 API snapshot이다. 이 감사의 “권한 없음” 판정은 당시 snapshot이며, 후속 AH-P0-02 완료와 [AH-P1-01 승인](../discovery/autonomous-harness-readonly-planner-authority.md)이 현재 권한을 정한다.

# 1. 결론

1. **E/High:** 최신 기준은 PR #45 merge `origin/master@1416aad`; 최초 working tree는 clean, 단일 worktree였으나 branch는 `decision/44...@b1f1cea`, local `master`는 2 commits 뒤였다. 두 tree hash는 `d3405ad`로 같아 최신 파일 내용으로 감사했다.
2. **E/High:** Requirement, Work Package, WorkGraph, Dry-run Planner는 상세한 Markdown Proposal일 뿐 모두 `implementation_ready: false`이며 실행 권한이 없다(`automation/*.md:2-9`).
3. **E/High:** 저장소가 Planner, Validator, Dispatcher, Runtime Ledger, Issue generator 미구현을 직접 명시한다(`docs/operations/README.md:23-39`, `automation/dry-run-planner-contract.md:197`).
4. **I/High:** 즉시 가능한 것은 수동 read-only 분석과 기존 validator/CI 실행뿐이다. 목표 A–R workflow의 안전한 자율 실행은 바로 구현·운영할 수 없다.
5. **E/High:** 문서 Gate는 강하지만 live `master` branch protection/ruleset이 없어 금지가 기술적으로 강제되지 않는다.
6. **I/High:** 첫 MVP도 canonical identity/schema와 bounded Harness 실행 Grant가 먼저 필요하며, 제품 코드 자동 수정·merge·deploy는 제외해야 한다.
7. **I/High:** 권장 구조는 Node Dispatcher + SQLite Ledger + Codex worktree Worker + GitHub Project projection + GitHub Actions validation의 혼합형이다.

# 2. 현재 준비된 자산

| 분류 | 자산과 판정 |
| --- | --- |
| 실제 실행 코드 | 문서 link/front matter/stable-ID/semantic/migration 정책 validator만 존재: `scripts/docs/validate-docs.mjs`, `semantic-gates.mjs`, `semantic-gates.test.mjs`; 제품 JPA/Flyway V1–V6 코드는 Harness가 아님. |
| 실행 가능한 설정 | docs/Java/spike CI(`.github/workflows/*.yml`), Issue forms, PR template, 22개 Codex role config(`.codex/agents/*.toml`); orchestration/ledger가 아니라 개별 검증·prompt 자산. |
| Schema만 존재 | Requirement/WP/Graph/Planner의 YAML-like Markdown record 예시는 있으나 `*.schema.json`/machine validator는 0개(`automation/*.md`). |
| 계약 문서만 존재 | source snapshot, Grant, path policy, risk, state, lock, lease, fence, stale/recovery, Issue projection 계약은 상세(`requirement-schema.md:17-190`, `work-package...:17-197`, `workgraph...:17-169`, `dry-run...:20-197`). |
| 제안만 존재 | 모든 automation contract가 `classification: proposal`, Owner review 상태이며 authority를 만들지 않음. |
| 미구현 | Extractor, deterministic Compiler/Planner, apply writer, Dispatcher, Ledger, outbox, worktree manager, Critic gate, lesson store, Project projector. |
| Owner 승인 대기 | canonicalization 및 Harness implementation/apply Pilot; PR C/D, V7+, API/realtime/frontend/deploy는 별도 `NOT_GRANTED`(`slice-01-current-authority.md:20-33,52-60`). |
| 외부 시스템 의존 | GitHub Issues/PR/Checks/Project, Codex CLI, Docker/Testcontainers; Project ID/field/option은 현 token의 `read:project` 부재로 U. |
| 현재 권한상 금지 | 자동 merge/Issue close/direct protected-branch push/force/reset/clean, production/vendor/provisioning 및 bounded PR A/B 밖 제품 구현(`AGENTS.md:50-58,92-105`). |
| 이력 | automation 관련 PR #39/#41/#43은 schema/contract 문서 merge; Harness Issue #3은 OPEN. PR #45는 MERGED, Issue #44는 OPEN으로 Owner-only closure 정책과 일치. |

# 3. 목표 Workflow 단계별 준비도

열 `저장/복구/멱등`은 현재 authority와 누락을 함께 표시한다.

| 단계 | 입력 → 출력 | 구현/Schema/검증 | 저장/복구/멱등 | 사람 Gate·Gap·실제 시작 |
| --- | --- | --- | --- | --- |
| A Spec/SOT | Git commit/blob/docs → source snapshot | 수동 가능; authority order와 commit/blob/anchor 규칙 있음(`requirement-schema.md:17-30`) | Git이 authority; repin/STALE; SHA+blob | Gate 없음; automated collector 없음; **read-only 가능** |
| B Requirement | snapshot → canonical Requirement set | Markdown schema·dedupe/conflict 규칙 있음; extractor/JSON Schema 없음(`requirement-schema.md:125-190`) | 저장소 없음; stale/supersede 계약; UUID/digest placeholder | Owner-pinned set 전 필요; **구현 권한 없음** |
| C Work Package | Requirement set → bounded WP | scope/path/test/risk/profile 계약 있음; compiler/validator 없음(`work-package...:31-148`) | Ledger 없음; revision/digest 계약; key는 WP ID+digest | Grant/Evidence 필요; **시작 불가** |
| D WorkGraph | WP set → DAG/locks | cycle/orphan/state/parallel 정적 규칙 있음; graph validator 없음(`workgraph...:74-117`) | Ledger 없음; revision/STALE; graph digest placeholder | Owner canonicalization 필요; **시작 불가** |
| E Gate | Requirement/approval/evidence → READY/BLOCKED | fail-closed 규칙은 강함; gate evaluator 없음(`work-package...:17-30,143-148`) | approval record store 없음; revoke→STALE; scoped ID 요구 | Human grant 필수; **자동 판정 불가** |
| F Issue | approved WP/Issue draft → Issue | canonical body/Refs/duplicate key 제안; actual forms와 불일치, writer 없음(`work-package...:149-175`) | GitHub는 projection; outbox 없음; repo+WP ID+digest | mutation Grant/auth 필요; **수동만 가능** |
| G Kanban | Issue/state → Project item/status | repo config/Project IDs 없음; `has_projects=true`만 E | Project는 projection; recovery/polling 없음 | Project 선택·IDs·auth 필요; **불가** |
| H Branch/Worktree | READY WP → isolated checkout | human branch policy만 있음(`github-workflow.md:97-105`); manager/ownership 없음 | Git; orphan recovery/branch collision key 없음 | write Grant 필요; **수동 CLI만 가능** |
| I Worker | WP+lease+worktree → commit | Codex roles/AGENTS 있음; capability sandbox enforcement 없음 | Worker memory 비권위; attempt/lease runtime 없음 | 제품 범위는 NOT_GRANTED; **Harness pilot 전 불가** |
| J Test | commit → test evidence | docs validator, Spotless, unit, Modulith, PG Testcontainers, SpotBugs, build CI 실행 가능(`java-ci.yml:42-65`) | JUnit/Gradle/GH artifacts; collector·retry class 없음 | CI는 가능; **자율 전이 불가** |
| K Critic | spec+immutable diff+tests → verdict/findings | generic `critic`은 plan, `code-reviewer`는 code prompt; canonical result schema/gate 없음 | finding store/fingerprint 없음 | independent review 계약 필요; **수동만** |
| L 수정 반복 | blocking findings → new attempt | RETRY_WAIT/fence 개념만 있음(`workgraph...:87-101,118-129`) | runtime 없음; same finding dedupe 없음 | max loop/escalation 미정; **불가** |
| M Draft PR | verified commit → Draft PR | PR template/policy만 있음; writer 없음(`pull_request_template.md:1-40`) | GitHub projection; idempotent PR bind 없음 | Draft까지만 허용 가능; **수동만** |
| N CI/Review | PR SHA/check/review → verified events | Actions 실행 가능; webhook/poller/outbox/projector 없음 | GitHub eventual state; immutable event store 없음 | required-check set/branch rule 미강제; **불가** |
| O Merge wait | merge-ready evidence → Owner decision | Owner-only 정책 명확(`github-workflow.md:109-142`) | approval Ledger 없음; GitHub만 관찰 | live master 보호 없음; **사람 수동만** |
| P Post-merge | merge event → release/cleanup/unlock | Integration Hold/reconcile 계약만 있음(`workgraph...:135-144`) | event/outbox/worktree cleanup 없음 | Issue closure/follow-up unlock 별도; **불가** |
| Q Lesson | plan/diff/findings/CI/feedback/result → lesson | 관련 schema/store 0개 | 없음 | 사실·추론 검토 Gate 필요; **불가** |
| R Learning | accepted lessons → next rules/prompts | agent memory만 가능하나 비권위; repo promotion contract 없음 | supersede/version/audit 없음 | Owner 승인 없이 전역 규칙화 금지; **불가** |

# 4. 가장 큰 차단 요소

| Risk | 차단 요소와 근거 |
| --- | --- |
| Critical | Ledger/Dispatcher/atomic claim·lease·fence·outbox 구현이 없어 병렬 Worker가 중복 실행·stale publish·충돌 write를 막지 못함(`workgraph...:118-169`). |
| Critical | live `master`가 unprotected이고 ruleset 0개라 direct/force/unchecked merge 금지가 문서 정책뿐임; 현재 관리 token은 broad `repo,workflow` scope. |
| Critical | Worker capability/path/command/network/secret 정책은 schema 문장뿐이고 실제 sandbox/tool allowlist/kill switch가 없음(`work-package...:137-142`). |
| High | canonical JSON bytes, repository UUID namespace, machine JSON Schema/version migration이 미확정이라 stable digest/idempotency를 authoritative하게 계산할 수 없음(`dry-run...:120-132,179-197`). |
| High | LLM semantic extraction과 deterministic compiler가 분리되지 않아 같은 source에서 byte-identical Requirement set을 보장할 수 없음(`requirement-schema.md:147-158`, `dry-run...:73-84`). |
| High | GitHub Project/field/option IDs, transition writer, rate-limit/retry, auth model과 audit log가 U; 실제 labels도 기본 9개이고 proposed `agent:*` taxonomy 미생성. |
| High | Critic finding schema/독립 commit pin/block verdict/false-positive/loop limit이 없어 review가 실행 Gate가 아님. |
| High | dependency/license/security scan과 prompt-injection/untrusted Issue/PR text 격리 계약이 없음; Actions는 `allowed_actions=all`, SHA pinning 강제=false이고 일부 action은 tag 참조. |
| Medium | local master/checkout preflight 불일치, worktree naming/ownership, numeric PR size/concurrency/token/cost/time defaults와 flaky/Docker-missing 분류가 미정. |

# 5. Planner Gap

**E:** source commit/blob/anchor, atomic split, primary/supporting dedupe, typed conflicts, Gate, cycle/orphan, declared path locks, stale propagation, dry-run/apply 금지는 비교적 성숙하다(`requirement-schema.md:17-180`, `workgraph...:74-144`, `dry-run...:73-142`). **E:** actual JSON Schema/code는 없고 Requirement `1.0`, WP/Graph `1.0-proposal`, Planner `1.0.0-proposal` 사이 compatibility rule도 없다. **U:** canonical bytes, namespace URI, graph migration, ledger/storage, lease/fence 값, PR size가 OPEN(`workgraph...:165-169`). **I:** 현재 계약으로 기술적으로 가능한 첫 구현은 owner-pinned Requirement JSON을 입력받는 read-only deterministic compiler와 static DAG/lock analyzer뿐이나, 현재 authority상 그것도 별도 Grant 전 시작 불가다. LLM Extractor는 candidate만 만들고 Owner/reviewer가 canonical Requirement set을 pin한 뒤 Compiler가 소비해야 한다.

# 6. GitHub Issue·Kanban Gap

Issue body, `Refs`(not `Closes`), parent/child 표시, duplicate key `repository+WP ID+digest`는 문서화됐지만 actual Issue forms는 `labels: []`이고 WP metadata/parent/dependency/idempotency 필드가 없다(`work-package...:149-175`, `.github/ISSUE_TEMPLATE/*.yml:1-5`). 생성 주체·최소권한은 미정, closure는 Owner-only다. GitHub App을 Issues/PR/Checks/Projects 최소권한 writer로 권장하며 PAT/관리 GH_TOKEN은 금지한다. Webhook은 Issue/PR/review/check/merge/Project-item 변화에 사용하고 polling은 missed-event reconciliation용으로 둔다. Project는 authority가 아니라 Ledger projection이다.

권장 Project projection: `BACKLOG←PROPOSED`, `PLANNED←VALIDATING`, `READY`, `BLOCKED_OWNER←WAITING_FOR_HUMAN`, `IN_PROGRESS←CLAIMED/RUNNING`, `CRITIC_REVIEW←VERIFYING/WAITING_FOR_REVIEW`, `CHANGES_REQUESTED←BLOCKED(review)`, `PR_DRAFT`, `CI_FAILED←FAILED(CI)`, `OWNER_REVIEW`, `MERGED`, `LEARNED`, `CANCELLED`. Canonical state는 기존 WorkGraph enum(`workgraph...:81-101`)이며 Project 수동 변경은 transition이 아니다.

# 7. Dispatcher·Runtime Ledger Gap

V1은 **단일 Dispatcher**가 유일한 scheduler이고 Worker는 다음 작업을 고르지 않으며 claim 요청만 해야 한다. 권장 authority는 local SQLite WAL; GitHub Project/Issue와 `.omx`/Agent memory는 projection 또는 비권위다. 동일 transaction에 append-only `events`, `node_projection(row_version)`, `attempts(agent_run_id,attempt_id,fence)`, `leases/heartbeats`, `locks`, `integration_holds`, `worktree_ownership`, `outbox/dead-letter`, `projector_offsets`, approvals/evidence를 기록하고 CAS로 transition한다. startup/periodic reconciler는 expired lease, orphan process/worktree, GitHub drift, stale SHA를 복구한다. 전역 EXCLUSIVE 대상은 build/workflow/migration namespace/API schema/AGENTS·Decision·Index/automation schema다. 현재 계약은 좋은 설계 입력이나 storage/CAS/event/outbox/worker registry가 없어 실제 병렬 실행에는 불충분하다.

# 8. Worker·Worktree Gap

Codex CLI 단독은 한 번에 하나의 scoped worktree에서 edit/test/Draft PR을 수동 수행할 수 있다. 별도 orchestrator가 필요한 것은 queue, atomic ownership, worktree lifecycle, upstream SHA/digest STALE 판정, cross-worker path lock, retries/budgets/cancel, secret/network/command enforcement, GitHub reconciliation이다. WP가 system context를 생성하되 `AGENTS.md`와 immutable Requirement/WP/Grant가 우선해야 한다. allow/deny path는 filesystem sandbox로, command는 allowlist로, network/secret은 deny-by-default로 강제한다. dependency·V7+ migration·generated files·shared build/workflow는 Human Gate다. commit은 한 WP/attempt 단위, push와 Draft PR은 별도 capability, merge는 영구 deny다.

# 9. Critic·Test Loop Gap

새 `critic-result.schema.json`이 필요하다: run/attempt/commit/source digests, verdict `PASS|CHANGES_REQUIRED|ESCALATE`, finding stable fingerprint, category(spec/architecture/security/test/migration/concurrency/privacy/docs), severity `BLOCKER|CRITICAL|HIGH|MEDIUM|LOW|INFO`, evidence path/line, requirement/criterion, blocking, lifecycle/open-resolution/false-positive/supersede. Critic은 Worker와 독립 context·immutable SHA에서 실행하고 BLOCKER/CRITICAL/HIGH 또는 필수 dimension 누락 시 전이를 막는다; 같은 finding 반복·권한/보안/개인정보/migration ambiguity·budget 초과는 Human escalation이다.

현재 Gate: docs→semantic tests+validator; Java/build/migration→validator+Spotless+unit/Modulith+PG integration+SpotBugs+build; full regression은 Owner review 전. Docker 없음은 environment BLOCKED, deterministic failure는 FAILED, transient infrastructure만 bounded RETRY_WAIT로 분류한다. 각 결과를 stable check ID, command, env, SHA, attempt, exit, duration, artifact URI로 Ledger에 적재하고 `VERIFYING→WAITING_FOR_CI/REVIEW`; failure는 Project `CI_FAILED` projection으로 보낸다. 보안/dependency/license CI, prototype frontend CI와 flaky policy는 현재 미구현이다.

# 10. Lesson Learned Gap

현재 lesson/retrospective schema와 store는 없다. merge·failed·cancelled terminal 모두 대상으로 최초 plan, actual diff, attempts, Critic findings, CI failures, Owner feedback, merge/close 결과를 입력한다. raw trace는 redacted runtime storage, machine lesson은 Ledger event, Owner가 승인한 재사용 rule만 `docs/operations/lessons/`에 `LESSON-<uuidv5>`로 승격한다. fact/inference, reusable/one-off, Issue/PR/commit, privacy/secret redaction, supersedes/expiry를 필수화한다. Agent memory는 session-local 비권위이고 repository lesson은 review된 SOT다; prompt/AGENTS 반영은 별도 Owner Gate로 잘못된 전역 학습을 차단한다.

# 11. 권장 기술 아키텍처

| 대안 | 복잡도/Windows | 병렬·복구/GitHub·test·관측 | 보안·비용·lock-in/유지보수·확장 | 판정 |
| --- | --- | --- | --- | --- |
| A PowerShell/Node scripts+Codex | 낮음/좋음 | 약함/수동 | 저비용/낮은 lock-in/작은 Pilot만 | Phase 0–2 scaffold |
| B Node 단일 Orchestrator | 중간/좋음 | SQLite/outbox면 강함/테스트 용이 | 분리·저비용/팀이 유지 가능/adapter 확장 | core 권장 |
| C Spring Boot 내부 서비스 | 높음/보통 | 가능하나 product DB와 결합 | 현재 제품·V7+ Gate 충돌/운영 부담 | 비권장 |
| D GitHub Actions 중심 | 중간/좋음 | CI 강함, local lease/worktree·장기 loop 약함 | SaaS 의존/보안 설정 중요 | validator/projector |
| E 외부 Agent Framework | 높음/가변 | 기능은 빠르나 contract adaptation U | dependency/vendor/network Gate·lock-in | 초기 제외 |
| F 혼합형 | 중상/좋음 | Node+SQLite authority, Codex Worker, GH projection, Actions evidence | 최소권한 분리/점진 확장; multi-host 때 PostgreSQL | **선택** |

# 12. 준비도 점수표

| 영역 | 점수/5 | 근거 |
| --- | ---: | --- |
| Spec/SOT 품질 | 4.0 | authority/read order/current Slice boundary 명확(`AGENTS.md`, `INDEX.md`, `slice-01-current-authority.md`). |
| Requirement schema | 2.0 | 상세 Proposal; machine schema/compiler/namespace 없음. |
| Work Package schema | 2.0 | scope/gate/test/idempotency 설계; validator/writer 없음. |
| WorkGraph schema | 2.0 | state/lock/recovery 설계; Ledger/atomic runtime 없음. |
| Planner contract | 2.0 | dry-run fail-closed; canonical bytes/extractor/compiler 없음. |
| GitHub Issue 자동화 | 1.0 | templates/policy만, writer/outbox/auth 없음. |
| Kanban 자동화 | 0.5 | Project 사용 가능 표지만 있고 IDs/fields/projector U. |
| Dispatcher | 0.0 | 없음. |
| Runtime Ledger | 0.0 | 없음. |
| Worker isolation | 1.0 | AGENTS/role configs/contract만, enforced worktree sandbox 없음. |
| Critic contract | 1.0 | generic prompts만, canonical finding Gate 없음. |
| Test orchestration | 2.5 | 실제 CI/test 풍부, selection/result collector/retry 분류 없음. |
| Lesson Learned | 0.0 | 없음. |
| Security controls | 1.5 | 문서 금지·read CI·secret scanning은 양호; master unprotected/tool enforcement 없음. |
| Recovery/idempotency | 1.5 | 계약은 상세, persistence/outbox/reconciler 없음. |
| Observability | 0.5 | GH checks/artifacts뿐, run/attempt/event metrics 없음. |
| Owner approval model | 3.0 | scoped Grant/merge/closure 분리 명확, runtime verification과 branch protection 없음. |

# 13. 구현 Phase 로드맵

표 약어: `M/N`=수정/신규 파일, `AC/T`=acceptance/tests, `D→N/P/O/R/B`=선행→후행/병렬/Owner/보안/branch·PR·난이도.

| ID·Phase·이름 | 목적/Gap; 입력→출력 | M/N | AC/T | D→N/P/O/R/B |
| --- | --- | --- | --- | --- |
| AH-P0-01 Authority & Canonical Identity | OPEN decision을 owner-review package로 고정; 4 contracts→approved choices, 실행 없음 | M automation docs; N `docs/discovery/autonomous-harness-foundation-approval-plan.md` | canonical bytes/URI+UUID/version/Extractor-Compiler boundary/ledger projection 명시; docs tests | none→P0-02/N/Y/High/`decision/<n>-harness-foundation`, 1 docs PR, S |
| AH-P0-02 Machine Schemas | prose→Requirement/WP/Graph/DryRun/error JSON Schema+golden fixtures | M contracts; N `schemas/automation/*.schema.json`,`scripts/harness/schema-validator.mjs`,`test/fixtures` | positive/negative/version/digest fixtures deterministic | P0-01→P1/P2/N/Y/High/`harness/<n>-machine-schemas`, M |
| AH-P1-01 Read-only Planner | pinned Requirement set→WP/Issue draft; no mutation | N `scripts/harness/{cli,compiler,renderer}.mjs`,`test/planner` | byte-identical golden, Gate fail-closed, stdout/temp only | P0-02→P2/Y/Y/High/`harness/<n>-readonly-planner`, L |
| AH-P2-01 Dry-run WorkGraph | WP→DAG/cycle/lock/parallel/report | N `scripts/harness/{workgraph,lock-analyzer,dry-run}.mjs`,`test/workgraph` | cycle/orphan/conflict/stale/result enums | P0-02,P1→P3/P with P1 renderer/Y/High/`harness/<n>-dry-run-graph`, L |
| AH-P3-01 GitHub Issue/Kanban Writer | approved dry-run→idempotent Issue/Project projection | M templates; N `scripts/harness/github/*`,`test/github-contract` | mock API/outbox/rate-limit/drift; no close/merge | P2+Project/auth decision→P4/N/Y/Critical/`harness/<n>-github-writer`, L |
| AH-P4-01 Dispatcher/Ledger | graph→atomic claims/events/projections/outbox | N `harness/ledger/*.sql`,`scripts/harness/{dispatcher,reconciler}.mjs`,`test/runtime` | crash/restart/duplicate/zombie/CAS/fence tests | P2; P3 adapter parallel→P5/N/Y/Critical/`harness/<n>-runtime-ledger`, XL |
| AH-P5-01 Worktree Worker | claim→owned worktree/verified commit | N `scripts/harness/{worktree,worker-policy}.mjs`,`test/worktree` | path escape, stale upstream, orphan, conflict, cancel | P4→P6/N/Y/Critical/`harness/<n>-worker-isolation`, XL |
| AH-P6-01 Test/Critic Loop | commit→machine checks/findings/bounded retries | N `schemas/automation/critic-result.schema.json`,`scripts/harness/{test-collector,critic-loop}.mjs`,`test/critic` | independence/fingerprint/false-positive/escalation/retry cap | P4,P5→P7/Y after schema/Yes/High/`harness/<n>-critic-loop`, XL |
| AH-P7-01 Draft PR Automation | verified commit→Draft PR/check/review projection | N `scripts/harness/{pr-writer,ci-projector}.mjs`,`test/pr` | head SHA bind, duplicate PR, close/drift/outbox; never merge | P3,P6→P8/N/Y/Critical/`harness/<n>-draft-pr`, L |
| AH-P8-01 Lesson Ledger | terminal run→redacted lesson candidate→approved rule | N `schemas/automation/lesson.schema.json`,`scripts/harness/lessons.mjs`,`docs/operations/lessons/README.md` | success/fail/cancel, redaction, supersede, promotion Gate | P4,P7→P9/Y/Y/High/`harness/<n>-lessons`, M |
| AH-P9-01 Bounded E2E Pilot | historical replay→one docs-only live Pilot | M Pilot plan only; N `test/e2e/harness-pilot` | kill switch, max concurrency=1, no product/merge/close, recovery drill | P0–P8→P10/N/Y/Critical/`experiment/<n>-harness-pilot`, L |
| AH-P10-01 Multi-project Adapter | single repo→adapter API/PostgreSQL option | N `harness/adapters/*`,`harness/storage/postgres/*`,`test/multi-project` | tenant/project isolation, migration/recovery/compatibility | P9→later/N/Y/High/`harness/<n>-multi-project`, XL |

# 14. 가장 먼저 해야 할 Work Package 하나

**AH-P0-01 Authority & Canonical Identity.** 코드를 만들기 전에 canonical JSON byte algorithm, canonical repository URI/UUID namespace, schema version compatibility, LLM Extractor=candidate/Owner-pinned Requirement set/Compiler=deterministic 경계, SQLite authority/GitHub projection 후보를 하나의 Owner review package로 고정한다. Product/GitHub mutation/Worker 권한은 계속 NOT_GRANTED로 둔다. 이 결정 없이는 이후 ID, digest, idempotency test가 모두 placeholder다.

# 15. A/B/C 병렬화 가능 시점과 작업 분배

P0-01 전에는 병렬 구현 금지. P0-02 승인 뒤 A=`machine schema+validator`, B=`read-only compiler golden fixtures`, C=`GitHub read adapter/Project metadata discovery`를 별도 파일로 병렬화할 수 있다. P4 ledger contract가 고정된 뒤 A=`worktree isolation`, B=`test result collector`, C=`Critic result schema/rules`를 병렬 수행하고 Dispatcher가 shared schema/build/workflow lock을 통합한다. Product write 병렬성은 Pilot에서 1로 유지한다(`workgraph...:108`).

# 16. 현정님이 결정해야 하는 항목

1. canonical JSON bytes, repository URI/UUID namespace, schema version/compatibility policy.
2. 첫 MVP 입력을 Owner-pinned Requirement set으로 제한하고 LLM Extractor는 candidate-only로 둘지(권장 Yes).
3. 혼합형 F, SQLite authority/GitHub projection, single Dispatcher를 채택할지.
4. 사용할 GitHub Project와 Project/field/option IDs, GitHub App 최소권한, webhook 범위; 현재 token scope 확대는 승인하지 말 것.
5. live `master` branch protection/ruleset과 required checks/review/force-delete 금지를 먼저 강제할지(필수).
6. Phase별 Harness 실행 Grant, 숫자 상한(PR files/LOC, concurrency, retry, token/cost/time); 제품 자동수정·merge·deploy는 MVP에서 계속 제외.

# 17. 다음 실행 프롬프트

```text
Propscans 최신 origin/master의 clean tree에서 AH-P0-01 Authority & Canonical Identity 문서 Work Package만 수행해줘.
현재 repository 파일과 Git 이력만 근거로 쓰고, automation 4계약의 OPEN인 canonical JSON bytes, canonical repository URI/UUID namespace, schema version compatibility, LLM candidate Extractor와 Owner-pinned Requirement/ deterministic Compiler 경계, SQLite authority와 GitHub projection 선택을 하나의 Owner-review proposal로 정합화한다.
제품/Harness 실행 코드, dependency, JSON Schema, GitHub 자동 writer/Project 설정, Worker 실행, migration, merge는 만들거나 수행하지 않는다.
확인되지 않은 Project ID/token scope/운영값은 Unknown 또는 reviewable default로 남기고 새 Owner Decision으로 쓰지 않는다.
Issue→decision/<issue>-harness-foundation→문서 검증→commit→push→Draft PR까지만 수행하며 Ready/merge/Issue closure는 하지 않는다.
완료 조건은 네 계약의 version/identity/digest 용어 일치, broad product authority NOT_GRANTED 유지, 후속 AH-P0-02의 exact files/tests/approval gate 정의, semantic-gates.test·validate-docs·git diff --check 통과다.
```
