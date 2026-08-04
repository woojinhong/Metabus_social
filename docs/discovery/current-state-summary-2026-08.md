---
title: Current State Summary (2026-08)
document_type: discovery
classification: research finding
status: Non-authoritative summary; not a decision
last_verified: 2026-08-03
related_documents:
  - decisions.md
  - open-questions.md
  - ../spec/mvp-scope.md
  - ../spec/README.md
  - ../wiki/product-rules.md
  - ../wiki/session-state-machine.md
decision_authority: decisions.md and approved spec/ADR files only; this file has none
---

# 현재 기획 현황 요약 (2026-08-03 기준)

아래 항목은 괄호에 병기한 저장소 근거 파일을 대조해 정리한 결과 요약이다.
이 문서 자체는 요약 캐시이며 권위 없음
(`decisions.md`, `spec/mvp-scope.md`, Accepted ADR이 SOT).

## 1. 제품 컨셉 & 타겟
- 한 줄 정의: 정확히 6명의 자격 있는 상호 호환 성인이 예약 후 사적 온라인 룸에서
  음성 중심 그룹 상호작용 (`discovery/product-concept.md` §2)
- 타겟: 서울 활동권, 25–39세(참가일 만 19세+), 데이팅 의도, 이성애 3:3 코호트 —
  Pilot 리크루팅 경계일 뿐 보편 타겟 주장 아님 (`discovery/product-brief.md`)
- 국내 한정: 이미 국내(서울) 한정. 확장 범위 자체는 미검증

## 2. MVP 스코프 (근거: `spec/mvp-scope.md`, D-001~D-023)
- 포함: 계정/신원(NICE)/예약, 정확히 6인 음성 그룹, 승인 게임 3종+자유대화,
  비공개 관심→상호동의 제한공개→최종선택→상호 시 10분 페어보이스, 신고/제재
- 명시적 제외: 결제·보증금·페널티, 웹캠, 오프라인 조율, 사전 사적 텍스트,
  임시 소그룹, 실시간 진행자, 녹화, 매력/인기 점수화, 생체·문서 인증, LLM 단독 모더레이션
- 상태: Approved product/UX baseline이며 PR A Product Bootstrap과 PR B Persistence Foundation
  (V1–V6)은 `BOUNDED_COMPLETE`. PR C/D, V7+, authoritative API/realtime/production frontend와
  광범위한 production promotion은 별도 승인 전이며 proposal contract는 `implementation_ready: false`

## 3. 세션/게임 설계 현황
- 세션 구조: 90분 = 규칙5+게임45(15×3)+자유대화20+관심5+공개5+최종5+복구버퍼5
  (`spec/session-experience.md`, D-003/D-004) — 완전 실시간, 시간 슬롯(스테이지) 개념 이미 있음
- 게임 3종은 카드형이 아니라 반응형: 익명선택+추측(눈치게임 계열), 단서-소유자 매칭,
  협력 시나리오(상황극형) (`spec/game-content-system.md` FR-GAM-001~003)
  단, 한국 특유의 "눈치게임/초성게임/MBTI 블라인드 추리" 명칭 자체는 어디에도 없음(공백)
- 그룹→1:1 전환: **세션 도중 분기형 사이드룸은 없음.** 그룹 전체 종료 후, 상호 최종선택
  성립 시에만 순차적으로 10분 페어보이스로 넘어가는 구조만 존재
  (`wiki/session-state-machine.md`, `spec/matching-and-progression.md`)
- 점진적 공개: 사진 1장은 예약 전 필수 제출, 세션 중 공개는 상호동의 기반 grant(최대5분/60초 서명URL)
  — S'More식 "언블러 애니메이션" UI는 없고 이진적 grant 모델 (`spec/progressive-disclosure.md`)
- 상시접속형 아님: 이미 "예약 슬롯형"이나, 슬롯 사이 비동기 콘텐츠/텍스트 리텐션 설계는 없음
  (`operations/session-operations.md` — 콜드스타트 전략 자체가 공백)

## 4. 신원/프라이버시/신뢰 설계 현황
- 나이/신원: NICE PASS+SMS폴백. 신원확인·성인적격 판정 결과, 검증 시각, 공급자, 정책 버전,
  최소 불투명 transaction reference만 저장하며 원시 DOB/이름/통신사/provider response,
  CI/DI/신분증·liveness·얼굴비교·생체 template은 미저장 (ADR-009, D-014)
- 모더레이션: 결정론적 연락처 필터+QR/EXIF스캔+rate limit+신고+인간리뷰+제재+이의제기,
  LLM은 보조적(assistive only)만 허용 (`spec/trust-safety-moderation.md`, `operations/moderation-sanctions-and-appeals.md`)
- 노쇼: 페널티/보증금 없이 기록만; 6인 미충원 시 무페널티 취소/재예약 (`spec/invitations-and-attendance.md`)
- **완전 공백(문서 어디에도 없음)**: 지인(연락처/카카오) 차단, 스크린샷·화면녹화 탐지,
  익명가입(전화인증 자체가 전제라 상충 가능), 알림 문구 중립화(데이터 최소화 원칙만 있음),
  앱 아이콘 위장 (`architecture/security-threat-model.md`, `architecture/security-privacy.md` 전수 확인)
- 캡처 방지는 "불가능함을 인정하는 disclaimer"만 존재, 탐지 설계 없음

## 5. 수익화 설계 현황
- 결제/보증금: D-005로 MVP 전면 제외. "환불형 보증금" 후보는 이미 조사됨
  (`research/technology/payment-deposit-options.md`) — deferred, 이유: no-show 판정 절차·
  authorization/capture/refund 상이·공정성 인식 리스크
- 비용모델에서도 결제는 "0원"이 아니라 "N/A(정의 안 됨)"로 분리 표기 (`architecture/capacity-and-cost-model.md`)
- 코스메틱/아바타/선물/배지: 도메인 데이터 모델·화면 인벤토리 어디에도 엔티티/화면 없음(완전 신규)
  (`spec/data/domain-data-model.md`, `spec/ux/screen-inventory.md`)
- design-principles.md는 순위·부스트·공개인기·보상연출을 명시적으로 "거부 패턴"으로 등록
  (`spec/ux/design-principles.md`) — 게임화 수익화 요소와 잠재 충돌

## 6. 기술/아키텍처 확정 사항
- 실시간 미디어: LiveKit Cloud(1순위)/Daily/Agora/self-host, 마이크 전용 publish,
  세션중 failover 없음, 서울 리전 아님(일본/싱가포르 경유) (ADR-003)
- TTS(음성합성) 대안: 전 문서에 언급 전무 — ADR-003의 "마이크 전용 publish"는 입력 제한이지
  출력 대체(TTS)를 직접 금지하진 않으나 완전 미결정 상태
- 웹 우선: React+Vite/PWA, 네이티브는 수치게이트 실패시만 (ADR-002)
- 호스팅: NCP Korea 확정 (ADR-008) — 단 RTC(LiveKit)와 관측성(Grafana Cloud)은 해외 경유로
  이미 인지된 예외
- 나이 인증: 위 4번 참조, 이미 확정

## 7. 아직 열려 있는 질문 (근거: `discovery/open-questions.md`)
- 법률/프라이버시: 선호정보·NICE·안전증거 처리의 적법근거/동의문구, 3:3 코호트 모집의
  공정성/설명가능성, LiveKit 국경간 전송 고지, 한국법상 보존기간, 사고/침해 통지 절차
- 조달/운영: NICE·LiveKit·NCP·SENS·Grafana 각 벤더 계약조건/DPA/가격 확정, 모더레이터
  채용·교육·이의제기 독립성, break-glass, 사고 태블탑 훈련
- 구현: PR A Product Bootstrap과 PR B Persistence Foundation(V1–V6)은 `BOUNDED_COMPLETE`.
  PR C/D, V7+, authoritative API/realtime/production frontend와 그 밖의 새 구현은 별도 승인 전
- 세션 설계 자체의 미결정: 콜드스타트 전략, 슬롯 간 비동기 리텐션 설계

## 8. 확정된 "절대 규칙" (근거: `wiki/product-rules.md`, `decisions.md` — 이 요약은 캐시일 뿐)
- 서울·25–39세·만19세+·이성애 호환 3:3 Pilot 코호트, 완화 금지
- 정확히 6명, 90분 그룹 음성(게임3+자유대화20)→비공개관심(0-2명)→상호동의 제한공개→
  최종선택(0-1명)→상호 시 10분 페어보이스만
- 금지: 공개 카운트/거절사유 노출, 그룹 웹캠, 사전 사적텍스트, 결제, 녹음, 외부연락처 교환,
  생체/서류 수동심사, 인기 점수화, LLM 단독 비가역 제재
- 백엔드가 항상 단계/권한의 유일한 권위, RTC는 관찰만
- 화면/UX는 D-024로 승인됐으나 구현 계약(API/DB/실시간 payload)은 전부 별도 게이트로 미승인
- 문서 수정 절차: Issue→branch→문서변경→검증스크립트→Draft PR, merge/Ready/Issue close는
  owner 전용 (`operations/github-workflow.md`)
