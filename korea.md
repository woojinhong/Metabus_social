---
title: 프로젝트 현재 상태
type: owner-overview
language: ko
status: maintained-summary
authority: non-authoritative
last_updated: 2026-07-29
---

# 프로젝트 현재 상태

> 이 문서는 프로젝트 소유자가 현재 상태를 빠르게 확인하기 위한 한국어 요약입니다. 내용이 원본 문서와 충돌할 경우 docs/discovery/decisions.md, 승인된 사양, Accepted ADR 및 각 영역의 원본 문서가 우선합니다.

## 1. 현재 단계와 결론

- 제품 경계와 초기 한국 Pilot MVP: **승인됨**.
- 플랫폼·인프라·Pilot 공급자 기준선: **승인됨**.
- ADR-001~ADR-010: **Accepted**.
- 상세 UI/UX, 화면·wireflow와 격리된 저충실도 prototype 검증: **D-024 범위에서 완료**.
- 제안 전용 Implementation Contract 문서 단계: **Issue #7에서 승인됨**.
- endpoint OpenAPI, DB schema, real-time payload/state machine과 production
  contract 승격: **미승인**.
- 애플리케이션·인프라 코드 작성, cloud provisioning, vendor 가입/계약/결제, 실제 사용자 Pilot: **미승인**.
- 즉시 목표: 첫 제안 산출물인
  [UX-to-Implementation 매트릭스](docs/spec/traceability-ux-implementation.md)를
  작성·검토하는 것.

## 2. 승인된 제품

서울 광역 활동권의 25~39세 성인 중 참여일에 만 19세 이상이며 상호 호환되는 이성애 데이팅 의향 사용자를 대상으로 한다. 한 세션은 정확히 6명, 목표 구성은 여성 3명·남성 3명이다. 이 모집 규칙은 Pilot에 한정되며 포용성·공정성·법률 검토가 남아 있다.

90분 음성 우선 세션은 규칙 안내, 세 가지 15분 게임, 20분 자유 대화, 초기 관심, 동의 기반 제한 공개, 최종 선택으로 구성된다. 초기 관심은 0~2명, 최종 로맨틱 선택은 0~1명이다. 상호 초기 관심과 독립적 공개 동의가 모두 있어야 얼굴 사진·정확한 나이·직업 범주를 제한 공개하며, 최종 상호 선택 때만 10분 1:1 음성을 허용한다.

## 3. MVP 포함과 제외

### 포함

- 계정·예약·출석 확인·장치 검사·대기실·계정 결합 입장
- NICE 기반 성인 적격성
- 6명 그룹 음성, 단계 제어, 세 게임과 자유 대화
- 비공개 관심 선택, 동의 기반 공개, 최종 상호 진행
- 차단·신고·운영자 제어·제재·이의제기·피드백

### 제외·후순위

결제·보증금·금전 패널티, webcam, 오프라인 예약, 녹음, 임시 소그룹, 상호 연결 전 사적 채팅, 공개 인기도, 관계 점수, 신분증 원본, liveness, face comparison, biometric, CI/DI, 수동 신분증 심사.

## 4. 주요 제품·안전 위험

지연 사진 공개 뒤의 더 큰 실망, 음성 수행 압박, 3:3 cohort 유동성·공정성, no-show, 외부 연락처·홍보, 괴롭힘·성적 비행·보복, 성인 확인 오류, screenshot/local recording, 접근성, 과도한 구조화, 민감 데이터 보존이 핵심 위험이다. D-024 UX 기준과 격리된 prototype 검증은 완료됐지만 실기기·보조기술·법률·운영 증거와 구현 계약은 아직 없다.

## 5. 승인된 기술 기준선

| 영역 | 승인 기준선 | 남은 게이트 |
| --- | --- | --- |
| Backend | OpenJDK 25 LTS + Spring Boot 4.1 modular monolith | patch pinning, source-code 승인 |
| Web | React + Vite responsive PWA first | 실제 기기·보조기술 수치 gate, 구현 승인 |
| Mobile | gate 실패 시 Expo/React Native 평가 | 구현 미승인 |
| Hosting | NCP Korea VPC | account, 견적, DPA, provisioning 승인 |
| Database | NCP Cloud DB for PostgreSQL | version/extension/restore/failover; schema 승격 미승인 |
| Redis | Pilot 미도입; 측정 후 조건부 TTL store | 실제 필요 증거 |
| RTC | LiveKit Cloud Build Pilot | 한국 기기·국외처리·DPA; Daily fallback |
| Identity | NICE PASS + 지원되는 SMS fallback, 최소 결과 저장 | 계약·필드·외국인/MVNO·법률 검토 |
| Notifications | SENS AlimTalk/SMS, NCP email 전환 규칙 | sender/template/rate, 2026-09-17 재검증 |
| Media | private NCP Object Storage | scan/delete/export/SDK 시험 |
| Observability | OTel + Cloud Insight/CLA/CAT + Grafana Cloud | redaction, region/DPA, quota |

## 6. LiveKit Pilot 용량

한 세션 최악 경로는 그룹 6명 x 90분 540분, 최대 3쌍 x 2명 x 10분 60분, reconnect 10%를 더해 660 participant-minutes다. 월 6회는 3,960분이다. Build의 5,000분 hard cap에 대해 3,500분 경고, 4,000분 초과 예상 시 신규 예약을 차단한다. 중간 공급자 전환은 하지 않는다.

## 7. 보존과 제재

원시 NICE 응답·DOB·CI/DI·음성은 저장하지 않는다. 계정 데이터는 탈퇴 후 30일 내, 관심 선택은 세션 후 30일, 예약·단계·공개 감사는 180일, 신고·증거·제재·이의는 사건 종료 후 1년, 로그 30일, Grafana trace 14일, 백업 최대 35일, export 7일이 승인된 제품 상한이다. 이는 법률 결론이 아니며 실제 Pilot 전에 자문이 필요하다.

제재는 deterministic hold → 설명/수정 → human review → 경고/제거 → 7일·30일 정지 → senior-reviewed 영구 금지 순이다. 위협, 성적 비행, hate, stalking, doxxing, impersonation, 녹음 위협, 보복은 즉시 제거 대상이다. 이의제기는 14일 내, 2영업일 접수, 7영업일 목표이며 독립 reviewer가 본다. LLM은 단독 영구 제재 권한이 없다.

## 8. D-024 이후 남은 게이트

정보 구조, 화면 목록, navigation, 대기실, session/game controls,
microphone/pass, progressive reveal, interest/no-match, reconnect/late join,
report/block/moderator, responsive/mobile, design system과 접근성 상호작용은
[D-024 UX 기준](docs/spec/ux/README.md)으로 승인됐다. 그러나 이 승인은
OpenAPI·DBML·AsyncAPI·frontend contract나 production code를 authoritative하게
만들지 않는다. Issue #7은 제안 전용 문서 단계만 승인했으며 모든 산출물은
`classification: proposal`, `implementation_ready: false`를 유지한다.

## 9. 문서 읽기

- 권위: [decisions](docs/discovery/decisions.md), [MVP](docs/spec/mvp-scope.md), [ADRs](docs/adr/README.md)
- UX 기준: [approved UX baseline](docs/spec/ux/README.md), [UX decisions](docs/spec/ux/open-ux-decisions.md)
- 현재 계약 제안: [Implementation Contract boundary](docs/discovery/implementation-contract-promotion-proposal.md),
  [UX-to-Implementation matrix](docs/spec/traceability-ux-implementation.md)
- 플랫폼: [external services](docs/architecture/external-services-selected.md), [deployment](docs/architecture/deployment-ncp-korea.md)
- 정책: [retention](docs/spec/data/retention-matrix.md), [moderation](docs/operations/moderation-sanctions-and-appeals.md)
- 근거: [vendor verification](docs/research/technology/korean-mvp-vendor-verification.md)

## 10. 다음 작업

1. UX-to-Implementation 매트릭스를 소유자가 검토한다.
2. 승인된 순서로 후속 비권위·문서 전용 contract proposal을 작성한다.
3. NICE/LiveKit/NCP/Grafana 법률·조달·실기기 gate를 검증한다.
4. 실제 사용자 Pilot 전 접근성·moderation·privacy·운영 증거를 확보한다.
5. 별도 요청으로 production contract 승격과 source-code 권한을 결정한다.
