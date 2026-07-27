---
title: GitHub Discovery and UX-Gate Workflow
document_type: operations
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related_documents:
  - ../../korea.md
  - ../INDEX.md
  - ../discovery/decisions.md
  - ../spec/ux/README.md
  - github-initial-backlog.md
decision_authority: decisions.md and repository owner approval
---

# GitHub Discovery and UX-Gate Workflow

## 1. 목적과 권위

**제안 — 미승인:** GitHub는 작업과 검토를 조정합니다. durable knowledge는 repository Markdown에 남깁니다.

> Markdown files store durable project knowledge. Issues track the work required to produce, validate, approve, or change that knowledge.

- 제품 결정: `docs/discovery/decisions.md`
- 외부 근거: `docs/research/`
- 제품·행동 사양: `docs/spec/`
- 아키텍처 결정: `docs/adr/`
- 운영 정책: `docs/operations/`
- `korea.md`, `docs/wiki/`, `docs/reviews/`, Issue·PR·GitHub Wiki: 비권위

## 2. 현재 단계

제품·MVP·Pilot 플랫폼 기준선과 ADR-001~ADR-010은 승인되었다. 그러나 D-024 때문에 상세 UX, OpenAPI, DB schema, real-time protocol, frontend contract와 source-code implementation은 승인되지 않았다.

Issues는 지금 사용하되 UX 승인 패키지, vendor/legal 검증, 실기기 시험, 문서 무결성처럼 결과와 완료 조건이 명확한 작업만 만든다.

현재 Issue 예시:

- `[UX] Approve the information architecture and screen inventory`
- `[UX] Approve session, disclosure, no-match, and recovery wireflows`
- `[Accessibility] Approve responsive and assistive interaction behavior`
- `[Vendor] Validate LiveKit Korean-device quality and data-transfer terms`
- `[Vendor] Close NICE contract, field, MVNO, and foreign-resident gates`
- `[Privacy] Complete qualified retention and cross-border review`
- `[Harness] Maintain documentation validation`

지나가는 아이디어, 작은 wording 질문, 실행 단계 없는 생각, 이미 Markdown에 충분한 질문, 완료 조건 없는 광범위한 작업, 승인 전 endpoint/table/screen/component 구현 Issue는 만들지 않는다.

## 3. Markdown과 Issue의 관계

```text
Open question or gate in Markdown
  -> Research, UX, Risk, or Decision Issue
  -> Evidence and review
  -> Source-of-truth document update
  -> Explicit approval when required
  -> decisions.md and, when relevant, ADR/spec update
  -> Issue closed
```

최종 결론을 Issue comment에만 남기지 않는다. durable knowledge를 바꾸는 완료 Issue는 해당 Markdown SOT를 갱신해야 한다.

## 4. Issue 크기

한 Issue는 한 번에 검토 가능한 결과 하나를 가진다.

- 좋은 단위: IA 승인, 화면 inventory 승인, wireflow 하나 결정, LiveKit device matrix 검증, NICE data-field gate 종료, retention legal review 하나
- 나쁜 단위: 전체 UX 완성, 모든 vendor 계약, 전체 앱 구축, 모든 API·DB·frontend 구현

큰 승인 영역만 parent Issue를 쓰고 독립 결과를 child Issue로 나눈다. 작은 작업에는 hierarchy를 만들지 않는다.

예: `[UX Gate] Close D-024` 아래에 IA/screens, session flow, disclosure/matching, recovery, safety/moderator, responsive/accessibility를 둔다.

## 5. GitHub Project

actionable Issue가 약 5개 이상이면 UX 승인과 Pilot 준비용 Project 하나를 만든다.

- Status: Inbox, Research, Needs Decision, Ready, In Progress, Review, Blocked, Done
- Type: Research, Decision, Documentation, Experiment, Risk, Feature, Bug, Harness
- Domain: Product, UX, Game, Safety, Privacy, Architecture, Vendor, Repository
- Priority: P0, P1, P2, P3
- Phase: Discovery, UX Approval, Implementation Planning, Pilot, Production
- Approval: Not Required, User Required, Approved, Rejected

sprint, story point, 복잡한 capacity field는 아직 쓰지 않는다. milestone은 `UX Approval`, `Procurement/Legal Gates`, `Implementation Authorization`처럼 실제 gate에만 둔다.

## 6. Label과 branch

- Labels: `type: research`, `type: decision`, `type: docs`, `type: experiment`, `type: risk`, `type: harness`
- Domains: `domain: ux`, `domain: safety`, `domain: privacy`, `domain: architecture`, `domain: vendor`
- Controls: `priority: p0..p3`, `approval: required`, `blocked`
- Branches: `research/<issue>-<slug>`, `decision/<issue>-<slug>`, `docs/<issue>-<slug>`, `experiment/<issue>-<slug>`

승인 후 구현만 `feature/<issue>-<slug>` 또는 `fix/<issue>-<slug>`를 쓴다. 한 branch는 한 primary Issue와 한 reviewable outcome을 가진다.

## 7. Pull Request 정책

큰 `AGENTS.md` 변경, 문서 구조 재편, MVP/UX 사양의 실질 변경, 큰 연구 추가, ADR 신설·상태 변경, 승인 결정 기록, architecture·harness 변경, agent 생성 대형 문서는 PR을 사용한다.

owner가 명시적으로 허용한 경우에만 typo, broken link, source date, 작은 wording·metadata를 direct-to-main으로 처리할 수 있다.

기본 흐름은 `Issue -> working branch -> Draft PR -> automated validation -> owner review -> merge`다. PR은 목적, 관련 Issue, 변경 영역, 승인 영향, 만든 결정과 만들지 않은 결정, 검증, 위험, owner approval을 간결하게 기록한다.

## 8. 구현 Issue gate

상세 구현 Issue는 다음 조건을 모두 만족한 뒤 만든다.

- D-024의 IA, 화면 목록, 핵심 journey, session/disclosure/interest/recovery/safety wireflow, responsive/mobile, accessibility가 명시적으로 승인됨
- 그 UX에 종속된 API·DB·real-time 사양이 승인 가능한 수준으로 작성됨
- vendor legal/procurement boundary가 필요한 범위에서 종료됨
- source-code creation이 별도로 명시 승인됨

그 전에는 controller, endpoint, table, enum, screen, component 구현 Issue를 만들지 않는다. 현재 Accepted ADR은 이 gate를 우회하지 않는다.

## 9. GitHub Wiki

`docs/`가 single source of truth이고 `docs/wiki/`는 repository 내부 navigation이다. GitHub Wiki는 선택적 비권위 portal이다. 활성화하더라도 Home, Product Overview, Documentation Guide, Session Overview, Safety Principles, Development Overview에서 repository 문서로 연결하고 권위가 없음을 표시한다. 자동 동기화하지 않는다.

## 10. Automation

지금 안전한 automation:

- PR과 default-branch push의 documentation validation
- 향후 Issue·PR의 Project 자동 추가와 Inbox 기본값
- Issue template label
- linked PR은 Review, linked Issue close는 Done
- `decisions.md`, ADR status, `AGENTS.md` owner review
- high-impact 문서 변경 시 generated snapshot stale 경고

연기: autonomous merge, ADR 자동 Accepted, `decisions.md` 자동 수정, 제품·vendor 자동 승인, 승인 전 구현 Issue 생성, production deployment, GitHub Wiki 동기화.

현재 repository에서 허용되는 것은 무료 local documentation validation뿐이다. Project·label·review rule은 remote 설정 승인이 필요하다.

## 11. 완료 규칙

- Research/Experiment: 결과·한계·assumption 상태를 durable document에 기록
- UX/Decision: 승인·반려를 결정 문서와 해당 spec에 기록
- ADR: status와 matching decision 일치
- Documentation: links, lines, IDs, classification 검증 통과
- Vendor/Legal: 증거, 계약 또는 검토 gate 상태와 미해결 제한 기록

초기 제안 작업은 [GitHub Initial Backlog](github-initial-backlog.md)를 따른다.
