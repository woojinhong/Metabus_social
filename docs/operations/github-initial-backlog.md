---
title: Initial GitHub UX-Gate Backlog
document_type: operations
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related_documents:
  - github-workflow.md
  - ../discovery/decisions.md
  - ../spec/ux/README.md
  - ../spec/traceability-implementation.md
decision_authority: decisions.md and repository owner approval
---

# Initial GitHub UX-Gate Backlog

## 사용 원칙

**제안:** 아래 항목은 remote Issue가 아니라 생성 후보다. 제품·MVP·Pilot 기술 기준선은 이미 승인되었으므로, 현재 backlog는 D-024 UX gate와 법률·조달·실기기 검증에 집중한다. 결론은 반드시 durable Markdown에 반영한다.

## 1. `[UX] Approve information architecture and screen inventory`

- Type / Domain / Priority: Decision / UX / P0
- Blocks: all detailed UX and implementation contracts
- Output: `docs/spec/ux/information-architecture.md`, `screen-inventory.md`
- Approval: User Required
- Complete when: 화면 목적, entry/exit, 주요 action, loading/empty/failure/recovery와 navigation boundary가 승인됨

## 2. `[UX] Approve the primary reservation-to-session journey`

- Type / Domain / Priority: Decision / UX / P0
- Blocks: admission, notification, attendance interaction
- Output: `docs/spec/ux/user-flow-decisions.md`
- Approval: User Required
- Complete when: 가입·성인확인·예약·출석·초대·장치검사·대기실의 사용자 행동과 실패 복구가 승인됨

## 3. `[UX] Approve the session-stage wireflow`

- Type / Domain / Priority: Decision / UX / P0
- Blocks: state machine, real-time protocol, session API
- Output: `docs/spec/ux/session-wireflow.md`
- Approval: User Required
- Complete when: stage presentation, timer, voice/pass/text alternative, game/free-conversation transition, late join과 reconnect가 승인됨

## 4. `[UX] Approve disclosure, interest, and no-match flows`

- Type / Domain / Priority: Decision / UX / P0
- Blocks: progression API, disclosure grants, database schema
- Output: `docs/spec/ux/progressive-disclosure-wireflow.md`
- Approval: User Required
- Complete when: consent, reveal, withdrawal, initial/final choice, mutual result, no-match·rejection 행동이 승인됨

## 5. `[Safety] Approve reporting, blocking, and moderator wireflows`

- Type / Domain / Priority: Decision / Safety / P0
- Blocks: page authorization, moderator console, operational UI
- Output: `docs/spec/ux/safety-and-reporting-wireflow.md`
- Approval: User Required
- Complete when: 진입점, 즉시 보호, evidence consent, block effect, operator action, appeal handoff가 승인됨

## 6. `[Accessibility] Approve responsive and accessible interactions`

- Type / Domain / Priority: Decision / UX / P0
- Blocks: frontend acceptance and PWA Pilot
- Output: `docs/spec/ux/accessibility-requirements.md`
- Approval: User Required
- Complete when: keyboard, screen reader, caption/text alternative, motion, focus, timing, interruption, mobile layout 행동이 승인됨

## 7. `[Vendor] Validate LiveKit Pilot gates on Korean devices`

- Type / Domain / Priority: Experiment / Vendor / P0
- Blocks: live Pilot operation
- Output: RTC research evidence and acceptance record
- Approval: Not required for test; User Required for production gate
- Complete when: approved device matrix에서 join, audio, reconnect, network switch, Bluetooth, call/background thresholds와 quota alarm을 검증함

## 8. `[Vendor] Close NICE identity contract and coverage gates`

- Type / Domain / Priority: Risk / Safety / P0
- Blocks: adult live-session admission
- Output: identity research, security SOT, vendor gate record
- Approval: Procurement and qualified privacy/legal review
- Complete when: returned fields, deletion, outage, foreign resident, MVNO, PASS/SMS fallback, provider reference와 no-CI/DI policy가 계약 문서와 일치함

## 9. `[Privacy] Complete retention and cross-border review`

- Type / Domain / Priority: Risk / Privacy / P0
- Blocks: real-user Pilot
- Output: `docs/spec/data/retention-matrix.md`, processor register
- Approval: Qualified privacy/legal review
- Complete when: provider-controlled retention, legal-hold boundary, LiveKit/Grafana transfer, deletion/export와 user notice가 검토됨

## 10. `[Vendor] Validate NCP production gates and recovery`

- Type / Domain / Priority: Research / Vendor / P1
- Blocks: cloud provisioning
- Output: selected services and deployment SOT evidence
- Approval: Procurement and provisioning authorization
- Complete when: account/quote/VAT/quota, Cloud DB restore/failover, Object Storage scan/delete/export, notification sender/template, Secret Manager와 least privilege가 검증됨

## 11. `[Decision] Close D-024 UX approval gate`

- Type / Domain / Priority: Decision / UX / P0
- Blocks: authoritative API, DB, real-time, frontend contracts
- Output: `docs/discovery/decisions.md`, `docs/spec/ux/README.md`, traceability
- Approval: User Required
- Complete when: D-024의 열 가지 UX prerequisite가 승인 또는 명시적 반려되고 충돌이 해소됨

## 12. `[Harness] Maintain the GitHub documentation workflow`

- Type / Domain / Priority: Harness / Repository / P1
- Blocks: repeatable review and baseline protection
- Output: `.github/`, `scripts/docs/`, `docs/operations/github-workflow.md`
- Approval: User Required for remote settings
- Complete when: local templates와 validation은 통과하고 Project·labels·review rules의 remote 적용 여부가 결정됨

## Dependency order

```text
1 IA/screens -> 2 primary journey -> 3 session flow
  -> 4 disclosure/matching -> 5 safety/moderator
  -> 6 responsive/accessibility -> 11 close D-024
  -> detailed API/data/realtime planning -> separate source-code authorization

7 RTC, 8 NICE, 9 privacy and 10 NCP gates can run in parallel,
but must close before a real-user Pilot or relevant provisioning.
12 documentation harness can proceed independently.
```
