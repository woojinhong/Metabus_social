---
title: MVP UX 저충실도 프로토타입 검증 기록
document_type: review
classification: confirmed fact
status: completed local validation
last_verified: 2026-07-28
related_documents: ["../spec/ux/README.md","../../DESIGN.md","../../prototype/ux-mock/README.md"]
decision_authority: D-024
implementation_ready: false
---

# MVP UX 저충실도 프로토타입 검증 기록

## 범위와 한계

- 위치: [격리된 React Mock](../../prototype/ux-mock/README.md).
- 목적: D-024 승인 UX의 이해·안전·복구·반응형 상호작용 검토.
- 데이터/상태: 합성 데이터와 브라우저 메모리만 사용한다.
- 제외: 인증, NICE, SMS, LiveKit, 실제 마이크, API, DB, 저장소,
  분석, 파일 업로드, 운영자 시스템과 실제 신고 전송.
- 결과는 생산 UI, 접근성 인증, 실기기 또는 실사용자 증거가 아니다.

## 구현된 검토 경로

`P08 → P09 → P10 규칙 → P11 대표 게임 → P12 전환 → P13 →`
`P14 → P15 → P16 → P17/P18 전환 → P19`와 문맥 `P20`을 구현했다.
P10 셸은 라이브 단계에서 유지되며 P13–P17은 별도 보호 경계다.
P18은 실제 음성이 아니라 10분 음성 권한 전환만 표시한다.

## 합성 시나리오

Happy path, 초기 상호 관심 없음, 공개 동의 거절, 공개 자원 이용 불가,
명시적 아무도 선택하지 않음, 초기 관심 만료, 최종 다음 단계 없음,
상호 최종 결과, 상대 미입장, 약한 연결, 재연결 성공, 만료 후 재연결,
마이크 거절, 미지원 기기, 6인 미충원 취소, 시작 후 이탈, 남은 5인
비공개 계속 동의, 사용자 나가기, 차단, 최소 신고 시작을 포함한다.

## 접근성·브라우저 검증

- 키보드로 건너뛰기 링크, 주요 흐름, 대화상자와 Escape를 검토했다.
- 대화상자는 고유 이름, 포커스 진입·순환·호출점 복귀를 제공한다.
- 재연결에서 안전 퇴장으로 전환할 때 한 개의 모달만 유지한다.
- 의미 있는 단계·재연결 변화만 polite live region으로 알린다.
- 360px 모바일과 320px/200% 확대에서 수평 문서 넘침을 검사했다.
- 44px 검토 기준, 비색상 상태, reduced-motion 규칙을 포함했다.
- axe smoke는 동의, 상호 결과와 최소 신고 표면에서 위반 0건이었다.
- Chromium 콘솔 오류와 깨진 로컬 자산은 발견되지 않았다.
- 독립 전수 검사에서 20/20 시나리오 렌더, axe 위반·외부 요청·콘솔 오류
  0건과 데스크톱/360px 수평 넘침 0건을 확인했다.

## 스크린샷 검토

- [기기 점검](../../prototype/ux-mock/artifacts/screenshots/01-device-check.png)
- [대기실](../../prototype/ux-mock/artifacts/screenshots/02-waiting-room.png)
- [라이브 게임 셸](../../prototype/ux-mock/artifacts/screenshots/03-live-game-shell.png)
- [초기 관심](../../prototype/ux-mock/artifacts/screenshots/04-initial-interest.png)
- [공개 동의](../../prototype/ux-mock/artifacts/screenshots/05-disclosure-consent.png)
- [제한 공개](../../prototype/ux-mock/artifacts/screenshots/06-limited-reveal.png)
- [공통 결과](../../prototype/ux-mock/artifacts/screenshots/07-common-result.png)
- [재연결](../../prototype/ux-mock/artifacts/screenshots/08-reconnect.png)
- [안전 진입](../../prototype/ux-mock/artifacts/screenshots/09-safety-entry.png)
- [좁은 모바일](../../prototype/ux-mock/artifacts/screenshots/10-mobile-narrow.png)
- [200% reflow](../../prototype/ux-mock/artifacts/screenshots/11-reflow-200.png)

DESIGN과 시각 브리프의 차분한 비경쟁 톤, 성별 비코딩 색, 한 화면의
주 판단, 추론 방지 문구를 대조했다. 실제 얼굴 대신 추상 자리표시자를
사용하고 공개를 보상처럼 표현하지 않았다.

## 검토 후 수정

1. 하단 제어막대가 P14 동의 내용을 가리던 문제를 데스크톱 우측 제어
   영역과 좁은 화면의 축약 라벨/2행 배치로 수정했다.
2. P14 사용자 동의와 P15 상대 권한을 독립시켜, 허용되지 않은 자원과
   내부 원인을 노출하지 않도록 수정했다.
3. P13/P16의 빈 초안을 자동 의도로 처리하지 않고 명시 제출과 확인을
   요구하며, 합성 상호 권한 없이는 P18을 열지 않도록 수정했다.
4. 나가기·차단·긴급 도움을 실제 로컬 확인/종료 상태로 연결하고 신고와
   독립시켰다.
5. 모달 고유 이름, 포커스 복귀와 재연결→안전 전환의 중첩을 수정했다.

## 자동 검증 결과

| 검사 | 결과 |
| --- | --- |
| dependency audit | 취약점 0 |
| Biome lint | 통과, 8개 파일 |
| TypeScript | 통과 |
| Vitest | 통과, 7/7 |
| Vite build | 통과, 29 modules |
| Playwright Chromium | 통과, 3/3 |
| 콘솔·반응형·키보드·axe | 통과 |

## 남은 위험

- iOS Safari, Android Chrome, Bluetooth, 통화/잠금과 실제 마이크 복구는
  실기기 검증이 필요하다.
- 음성 중심 MVP의 청각·발화 대안은 텍스트·패스·반복만 검토했으며 실제
  보조기술 사용자와 운영 지원 검증이 필요하다.
- 3개 게임 중 대표 1개만 구현했으므로 공통 주기는 문서 기준 검증이다.
- 신고·운영자·P18 음성은 실제 처리나 전송을 검증하지 않았다.
- 생산 계약, 최종 Route/권한/상태/이벤트와 시각 토큰은 후속 명시적
  단계에서 별도로 결정해야 한다.
