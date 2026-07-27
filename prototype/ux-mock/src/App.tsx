import {
  type ButtonHTMLAttributes,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type View =
  | "device"
  | "waiting"
  | "rules"
  | "game"
  | "conversation"
  | "interest"
  | "noTarget"
  | "consent"
  | "reveal"
  | "final"
  | "result"
  | "closing";

type Scenario = {
  id: string;
  label: string;
  view: View;
  mode?: string;
};

const scenarios: Scenario[] = [
  { id: "happy", label: "Happy path", view: "device", mode: "counterpart-mutual" },
  { id: "no-mutual", label: "공개 대상 없음", view: "noTarget" },
  { id: "consent-declined", label: "공개 동의 거절", view: "consent", mode: "declined" },
  { id: "resource-unavailable", label: "공개 리소스 이용 불가", view: "reveal", mode: "unavailable" },
  { id: "choose-none", label: "초기 관심: 아무도 선택하지 않음", view: "interest", mode: "none" },
  { id: "interest-timeout", label: "초기 관심 미제출 만료", view: "interest", mode: "expired" },
  { id: "final-no-next", label: "최종: 다음 음성 없음", view: "result", mode: "no-next" },
  { id: "mutual-final", label: "최종: 10분 음성 가능", view: "result", mode: "mutual" },
  { id: "peer-absent", label: "쌍 음성 상대 미입장", view: "result", mode: "peer-absent" },
  { id: "weak-network", label: "연결 약함", view: "game", mode: "weak" },
  { id: "reconnect-success", label: "재연결 성공", view: "game", mode: "reconnect" },
  { id: "reconnect-expired", label: "재연결 후 행동 만료", view: "interest", mode: "expired-reconnect" },
  { id: "mic-denied", label: "마이크 권한 거절", view: "device", mode: "mic-denied" },
  { id: "unsupported", label: "미지원 기기", view: "device", mode: "unsupported" },
  { id: "underfill", label: "6인 미충원 취소", view: "waiting", mode: "cancelled" },
  { id: "participant-left", label: "시작 후 참가자 이탈", view: "game", mode: "paused" },
  { id: "five-consent", label: "5인 비공개 계속 동의", view: "game", mode: "five-consent" },
  { id: "user-leaves", label: "사용자 나가기", view: "game", mode: "leave" },
  { id: "user-blocks", label: "사용자 차단", view: "game", mode: "block" },
  { id: "minimal-report", label: "최소 신고 시작", view: "game", mode: "report" },
];

const liveViews = new Set<View>([
  "rules",
  "game",
  "conversation",
  "interest",
  "noTarget",
  "consent",
  "reveal",
  "final",
  "result",
]);

const stageMeta: Record<View, { key: string; title: string; audience: string; time: string }> = {
  device: { key: "P08", title: "기기 점검", audience: "나만", time: "시작 전" },
  waiting: { key: "P09", title: "대기실", audience: "나만", time: "시작 08:20" },
  rules: { key: "P10", title: "규칙과 소개", audience: "6인 그룹", time: "04:42" },
  game: { key: "P11", title: "게임 1 · 공통점 카드", audience: "6인 그룹", time: "12:18" },
  conversation: { key: "P12", title: "자유 대화 전환", audience: "6인 그룹", time: "20:00" },
  interest: { key: "P13", title: "초기 관심", audience: "나만", time: "04:36" },
  noTarget: { key: "P14", title: "공개 단계 안내", audience: "나만", time: "04:10" },
  consent: { key: "P14", title: "제한 공개 동의", audience: "나만", time: "03:48" },
  reveal: { key: "P15", title: "제한 공개", audience: "한별님 한 명", time: "02:54" },
  final: { key: "P16", title: "최종 선택", audience: "나만", time: "03:32" },
  result: { key: "P17", title: "내 다음 단계", audience: "나만", time: "확인 가능" },
  closing: { key: "P19", title: "공통 종료", audience: "나만", time: "완료" },
};

const people = ["한별", "다온", "서우", "이든", "해솔"];

function Button({
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} {...props} />;
}

function Dialog({
  title,
  children,
  onClose,
  label = "대화상자 닫기",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  label?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  const returnTargetRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );
  const returnTimerRef = useRef<number | undefined>(undefined);
  onCloseRef.current = onClose;

  useEffect(() => {
    window.clearTimeout(returnTimerRef.current);
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>("button, input, textarea, select");
    focusable?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>("button, input, textarea, select")].filter(
        (item) => !item.hasAttribute("disabled"),
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      returnTimerRef.current = window.setTimeout(() => returnTargetRef.current?.focus(), 0);
    };
  }, []);

  return (
    <div className="scrim" role="presentation">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <Button className="quiet compact" onClick={onClose} aria-label={label} autoFocus>
            닫기
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ label, value, tone = "neutral" }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`status-badge ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function App() {
  const [scenarioId, setScenarioId] = useState("happy");
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [view, setView] = useState<View>("device");
  const [micOn, setMicOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [interestNone, setInterestNone] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [interestWithdrawn, setInterestWithdrawn] = useState(false);
  const [finalChoice, setFinalChoice] = useState("");
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [resources, setResources] = useState({ photo: false, age: false, job: false });
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [safetyStep, setSafetyStep] = useState<"menu" | "leave" | "block" | "emergency">("menu");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reconnectOpen, setReconnectOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("기기 점검을 시작할 수 있어요.");
  const mainHeading = useRef<HTMLHeadingElement>(null);

  const meta = stageMeta[view];
  const isLive = liveViews.has(view);
  const mode = scenario.mode;

  useEffect(() => {
    if (mode === "leave" || mode === "block") {
      setSafetyOpen(true);
      setSafetyStep(mode);
    }
    if (mode === "report") {
      setSafetyOpen(true);
      setReportOpen(true);
    }
    if (mode === "reconnect") setReconnectOpen(true);
  }, [mode]);

  const connection = useMemo(() => {
    if (reconnectOpen) return "다시 연결 중";
    if (mode === "weak") return "연결 약함";
    return "연결됨";
  }, [mode, reconnectOpen]);

  const moveTo = (next: View, message: string) => {
    setView(next);
    setAnnouncement(message);
    window.setTimeout(() => mainHeading.current?.focus(), 0);
  };

  const applyScenario = () => {
    const next = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
    setScenario(next);
    setView(next.view);
    setSelected(next.mode === "none" ? [] : []);
    setInterestNone(next.mode === "none");
    setInterestSubmitted(false);
    setInterestWithdrawn(false);
    setFinalChoice("");
    setFinalSubmitted(false);
    setResources({ photo: false, age: false, job: false });
    setSafetyOpen(false);
    setSafetyStep("menu");
    setReportOpen(false);
    setReportSent(false);
    setReconnectOpen(next.mode === "reconnect");
    setMicOn(false);
    setReady(false);
    setAnnouncement(`${next.label} 시나리오를 열었어요.`);
    if (!["leave", "block", "report", "reconnect"].includes(next.mode ?? "")) {
      window.setTimeout(() => mainHeading.current?.focus(), 0);
    }
  };

  const togglePerson = (name: string) => {
    if (interestSubmitted || interestWithdrawn) return;
    setInterestNone(false);
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : current.length < 2
          ? [...current, name]
          : current,
    );
  };

  const renderDevice = () => {
    if (mode === "unsupported") {
      return (
        <section className="blocking" aria-labelledby="unsupported-title">
          <p className="eyebrow">계속할 수 없는 상태</p>
          <h2 id="unsupported-title">이 브라우저에서는 음성 점검을 지원하지 않아요.</h2>
          <p>카메라는 요청하지 않아요. 지원 브라우저에서 다시 열거나 도움을 확인해 주세요.</p>
          <div className="actions"><Button>지원 브라우저 안내</Button><Button className="secondary">안전하게 나가기</Button></div>
        </section>
      );
    }
    return (
      <section className="task-card">
        <p className="eyebrow">P08 · 독립 화면</p>
        <h2>마이크와 연결을 먼저 확인해요.</h2>
        <p className="lede">실제 음성을 전송하지 않는 합성 점검 화면입니다. 카메라 권한은 요청하지 않아요.</p>
        <ul className="check-list">
          <li><span aria-hidden="true">✓</span> 지원 브라우저</li>
          <li><span aria-hidden="true">✓</span> 출력 장치: 합성 이어폰</li>
          <li><span aria-hidden="true">{mode === "mic-denied" ? "!" : "✓"}</span> 마이크 권한: {mode === "mic-denied" ? "허용되지 않음" : "준비됨"}</li>
          <li><span aria-hidden="true">✓</span> 네트워크: 점검 가능</li>
        </ul>
        {mode === "mic-denied" ? (
          <div className="notice error" role="alert">
            <strong>마이크가 꺼져 있어요.</strong>
            <span>브라우저 설정에서 허용한 뒤 다시 시험하거나 도움을 받아 주세요.</span>
          </div>
        ) : null}
        <div className="actions">
          <Button onClick={() => moveTo("waiting", "대기실로 이동했어요.")} disabled={mode === "mic-denied"}>점검 완료</Button>
          <Button className="secondary">문제 해결</Button>
        </div>
      </section>
    );
  };

  const renderWaiting = () => {
    if (mode === "cancelled") {
      return (
        <section className="blocking">
          <p className="eyebrow">P09 · 세션 취소</p>
          <h2>이번 세션은 시작 조건을 충족하지 못했어요.</h2>
          <p>개별 참가자의 출석이나 사유는 공개하지 않아요. 불이익 없이 다른 시간을 선택할 수 있어요.</p>
          <div className="actions"><Button>다른 시간 보기</Button><Button className="secondary">지원</Button></div>
        </section>
      );
    }
    return (
      <section className="task-card">
        <p className="eyebrow">P09 · 독립 화면</p>
        <h2>시작 조건을 확인하고 있어요.</h2>
        <p className="lede">다른 참가자의 출석 수, 준비 상태와 사유는 표시하지 않아요.</p>
        <div className="waiting-state">
          <StatusBadge label="내 기기" value="점검 완료" tone="good" />
          <StatusBadge label="내 준비" value={ready ? "준비됨" : "확인 필요"} tone={ready ? "good" : "attention"} />
          <StatusBadge label="세션" value={ready ? "입장 준비 중" : "대기 중"} />
        </div>
        <div className="notice"><strong>시작 예정 20:00</strong><span>규칙 소개가 끝난 뒤에는 새로 입장할 수 없어요.</span></div>
        <div className="actions">
          {!ready ? (
            <Button onClick={() => { setReady(true); setAnnouncement("준비됨으로 표시했어요."); }}>준비됐어요</Button>
          ) : (
            <Button onClick={() => moveTo("rules", "규칙과 소개 단계가 시작됐어요.")}>입장하기</Button>
          )}
          <Button className="secondary">도움이 필요해요</Button>
        </div>
      </section>
    );
  };

  const renderRules = () => (
    <section className="task-card">
      <p className="eyebrow">P10 첫 content stage</p>
      <h2>편안하게 참여하기 위한 규칙이에요.</h2>
      <ul className="plain-list">
        <li>세션은 음성만 사용하며 녹음하지 않아요.</li>
        <li>패스, 지시 반복, 생각 시간과 허용된 텍스트를 사용할 수 있어요.</li>
        <li>연락처·외부 계정·사적 채팅은 열리지 않아요.</li>
        <li>나가기, 차단, 신고는 서로 독립된 행동이에요.</li>
      </ul>
      <Button onClick={() => moveTo("game", "게임 1이 시작됐어요.")}>이해했어요</Button>
    </section>
  );

  const renderGame = () => (
    <section className="task-card">
      <p className="eyebrow">P11 · 생각 단계</p>
      <h2>오늘 가장 편안했던 순간을 한 단어로 준비해 주세요.</h2>
      <p className="lede">아직 그룹에 공유되지 않아요. 제출 전에 공개 범위를 다시 확인할 수 있어요.</p>
      {mode === "weak" ? <div className="notice warning" role="status"><strong>연결이 불안정해요.</strong><span>마이크는 꺼져 있고 현재 과업은 유지돼요.</span></div> : null}
      {mode === "paused" ? <div className="notice warning" role="status"><strong>운영 일시정지</strong><span>개인 사유는 공개하지 않아요. 계속 여부를 곧 안내할게요.</span></div> : null}
      {mode === "five-consent" ? (
        <fieldset className="choice-panel">
          <legend>다섯 명으로 계속할지 비공개로 선택해 주세요.</legend>
          <p>누가 어떤 응답을 했는지 공개하지 않아요. 응답하지 않으면 계속하지 않는 것으로 처리해요.</p>
          <label><input type="radio" name="continue" /> 계속해도 괜찮아요</label>
          <label><input type="radio" name="continue" /> 이번에는 종료할게요</label>
          <Button>비공개로 제출</Button>
        </fieldset>
      ) : (
        <>
          <label className="field-label" htmlFor="game-answer">내 답변 초안</label>
          <input id="game-answer" placeholder="예: 산책" />
          <p className="hint">빈 입력이나 시간 종료는 제출 또는 패스로 추정하지 않아요.</p>
          <div className="actions wrap">
            <Button onClick={() => setAnnouncement("답변을 확인했어요. 아직 공유되지 않았어요.")}>제출 전 확인</Button>
            <Button className="secondary">이번 차례 패스</Button>
            <Button className="secondary">지시 반복</Button>
            <Button className="secondary">생각 시간</Button>
          </div>
          <Button className="text-link" onClick={() => moveTo("conversation", "자유 대화 전환 안내를 열었어요.")}>대표 게임 검토 완료</Button>
        </>
      )}
    </section>
  );

  const renderConversation = () => (
    <section className="task-card">
      <p className="eyebrow">P12 · 전환 요약</p>
      <h2>이제 20분 동안 그룹으로 이야기해요.</h2>
      <p className="lede">그룹 음성만 열려요. 사적 채팅, 연락처 교환과 카메라는 사용할 수 없어요.</p>
      <ul className="plain-list"><li>침묵이 길면 중립 주제를 보여 드려요.</li><li>말이 겹치면 차례를 안내할 수 있어요.</li><li>언제든 음소거, 패스, 나가기와 신고가 가능해요.</li></ul>
      <Button onClick={() => moveTo("interest", "초기 관심 단계가 시작됐어요.")}>초기 관심 단계 보기</Button>
    </section>
  );

  const renderInterest = () => {
    const expired = mode === "expired" || mode === "expired-reconnect";
    if (expired) {
      return (
        <section className="blocking">
          <p className="eyebrow">P13 · 만료</p>
          <h2>{mode === "expired-reconnect" ? "다시 연결하는 동안 이 단계가 끝났어요." : "초기 관심 입력 시간이 끝났어요."}</h2>
          <p>미제출 초안은 자동으로 보내지 않았어요. 다른 참가자의 제출 상태는 공개하지 않아요.</p>
          <Button onClick={() => moveTo("noTarget", "공개 단계 안내로 이동했어요.")}>현재 단계로</Button>
        </section>
      );
    }
    return (
      <section className="task-card protected">
        <p className="eyebrow">P13 · 보호된 선택</p>
        <h2>더 이야기해 보고 싶은 분을 0–2명 선택해 주세요.</h2>
        <p className="lede">나만 볼 수 있어요. 제출 뒤에는 사람을 바꿀 수 없고, 전체를 철회해 없음으로만 바꿀 수 있어요.</p>
        {interestSubmitted ? <div className="notice good" role="status"><strong>내 선택을 제출했어요.</strong><span>다른 사람의 제출 여부는 표시하지 않아요.</span></div> : null}
        {interestWithdrawn ? <div className="notice" role="status"><strong>전체 선택을 철회했어요.</strong><span>없음으로 마쳤어요.</span></div> : null}
        <fieldset className="choice-panel" disabled={interestSubmitted || interestWithdrawn}>
          <legend>합성 참가자</legend>
          {people.map((person) => (
            <label key={person}>
              <input type="checkbox" checked={selected.includes(person)} onChange={() => togglePerson(person)} disabled={!selected.includes(person) && selected.length >= 2} />
              {person}님 <span>· 음성 상태만 검토</span>
            </label>
          ))}
          <label className="none-choice">
            <input type="checkbox" checked={interestNone} onChange={(event) => { setInterestNone(event.target.checked); setSelected([]); }} />
            아무도 선택하지 않기
          </label>
        </fieldset>
        <div className="actions">
          {!interestSubmitted && !interestWithdrawn ? <Button disabled={!selected.length && !interestNone} onClick={() => { setInterestSubmitted(true); setAnnouncement("내 선택을 제출했어요."); }}>내 선택 제출</Button> : null}
          {interestSubmitted && !interestWithdrawn ? <Button className="secondary" onClick={() => { setInterestWithdrawn(true); setInterestSubmitted(false); setInterestNone(true); setSelected([]); }}>전체 철회해 없음으로</Button> : null}
          {interestSubmitted || interestWithdrawn ? <Button className="secondary" onClick={() => moveTo(interestNone || interestWithdrawn ? "noTarget" : "consent", "공개 단계로 이동했어요.")}>검토용 다음 단계</Button> : null}
        </div>
      </section>
    );
  };

  const renderNoTarget = () => (
    <section className="task-card protected empty-state">
      <p className="eyebrow">P14 · 정상적인 빈 상태</p>
      <h2>이번 공개 단계에서 보여 줄 정보는 없어요.</h2>
      <p>누가 어떤 선택을 했는지는 서로에게 공개되지 않아요. 최종 선택은 그대로 진행할 수 있어요.</p>
      <Button onClick={() => moveTo("final", "최종 선택 단계로 이동했어요.")}>최종 선택으로</Button>
    </section>
  );

  const renderConsent = () => (
    <section className="task-card protected">
      <p className="eyebrow">P14 · 리소스별 동의</p>
      <h2>한별님 한 명에게 무엇을 보여 줄지 각각 선택해 주세요.</h2>
      <p className="lede">목적: 이번 세션의 제한 공개 · 남은 공개 시간: 최대 5분 · 캡처를 완전히 막을 수는 없어요.</p>
      <p>내 공개 선택은 상대 정보 열람과 교환되지 않아요. 상대가 독립적으로 허용해 현재 볼 수 있는 정보만 다음 단계에 표시돼요.</p>
      {mode === "declined" ? <div className="notice" role="status"><strong>공개하지 않아도 괜찮아요.</strong><span>이유는 상대에게 전달되지 않아요.</span></div> : null}
      <fieldset className="choice-panel">
        <legend>기본값은 모두 공개하지 않음</legend>
        <label><input type="checkbox" checked={resources.photo} onChange={(e) => setResources({ ...resources, photo: e.target.checked })} /> 얼굴 사진</label>
        <label><input type="checkbox" checked={resources.age} onChange={(e) => setResources({ ...resources, age: e.target.checked })} /> 정확한 나이</label>
        <label><input type="checkbox" checked={resources.job} onChange={(e) => setResources({ ...resources, job: e.target.checked })} /> 직업 범주</label>
      </fieldset>
      <div className="notice warning"><strong>철회 한계</strong><span>철회하면 새 접근은 막지만 이미 본 내용이나 캡처는 되돌릴 수 없어요.</span></div>
      <div className="actions">
        <Button disabled={!Object.values(resources).some(Boolean)} onClick={() => moveTo("reveal", "서로 독립적으로 허용된 정보만 제한 공개해요.")}>선택한 정보 공개</Button>
        <Button className="secondary" onClick={() => moveTo("final", "공개 없이 최종 선택으로 이동했어요.")}>공개하지 않기</Button>
      </div>
    </section>
  );

  const renderReveal = () => (
    <section className="task-card protected reveal-card">
      <p className="eyebrow">P15 · 보호된 보기</p>
      <h2>한별님이 이번 공개에서 제공한 정보예요.</h2>
      <p className="lede">한별님 한 명의 정보 · 이 단계가 끝날 때까지 · 남은 시간 02:54</p>
      {mode === "unavailable" ? (
        <div className="notice"><strong>이번 공개에서 볼 수 있는 정보가 없어요.</strong><span>동의, 시간 만료 또는 준비 상태 같은 내부 이유는 구분해 표시하지 않아요.</span></div>
      ) : (
        <>
          <div className="abstract-photo" role="img" aria-label="한별님의 보호된 얼굴 사진 자리표시자">
            <span aria-hidden="true">합성<br />이미지</span>
          </div>
          <dl className="reveal-data">
            <div><dt>직업 범주</dt><dd>교육·연구</dd></div>
          </dl>
          <p className="hint">정확한 나이는 이번 공개에서 제공되지 않아요. 이유는 구분해 표시하지 않아요.</p>
        </>
      )}
      <p className="hint">저장·공유·확대 기능은 제공하지 않지만 화면 캡처 방지를 보장하지 않아요.</p>
      <div className="actions"><Button onClick={() => moveTo("final", "최종 선택 단계로 이동했어요.")}>보기 닫고 계속</Button><Button className="secondary">새 접근 철회</Button></div>
    </section>
  );

  const renderFinal = () => (
    <section className="task-card protected">
      <p className="eyebrow">P16 · 보호된 선택</p>
      <h2>10분 음성 대화를 이어 가고 싶은 한 분을 선택할 수 있어요.</h2>
      <p className="lede">0명 또는 1명만 선택해요. 제출 뒤에는 다른 사람으로 바꿀 수 없어요.</p>
      {finalSubmitted ? <div className="notice good" role="status"><strong>내 최종 선택을 제출했어요.</strong><span>다른 사람의 선택이나 제출 여부는 표시하지 않아요.</span></div> : null}
      <fieldset className="choice-panel" disabled={finalSubmitted}>
        <legend>내 최종 선택</legend>
        {people.slice(0, 2).map((person) => <label key={person}><input type="radio" name="final" value={person} checked={finalChoice === person} onChange={(e) => setFinalChoice(e.target.value)} /> {person}님</label>)}
        <label><input type="radio" name="final" value="none" checked={finalChoice === "none"} onChange={(e) => setFinalChoice(e.target.value)} /> 아무도 선택하지 않기</label>
      </fieldset>
      {!finalSubmitted ? (
        <Button disabled={!finalChoice} onClick={() => { setFinalSubmitted(true); setAnnouncement("내 최종 선택을 제출했어요."); }}>내 선택 제출</Button>
      ) : (
        <Button onClick={() => moveTo("result", "내 다음 권한을 확인했어요.")}>내 다음 단계 확인</Button>
      )}
    </section>
  );

  const renderResult = () => {
    const mutual = mode === "mutual" || (mode === "counterpart-mutual" && finalSubmitted && finalChoice === "한별");
    const peerAbsent = mode === "peer-absent";
    return (
      <section className="task-card protected result-card">
        <p className="eyebrow">P17 · 내 권한만 표시</p>
        <h2>{mutual ? "10분 음성 대화를 시작할 수 있어요." : peerAbsent ? "음성 대화 입장을 기다리고 있어요." : "이번에는 다음 음성 대화가 열리지 않았어요."}</h2>
        <p>{mutual ? "이 권한은 음성만 허용해요. 카메라, 텍스트와 연락처 교환은 열리지 않아요." : peerAbsent ? "이유나 상대의 기기 상태는 표시하지 않아요. 권한 만료 전에 나가거나 지원을 열 수 있어요." : "선택 내용과 이유는 모두 비공개예요. 평가나 점수로 남지 않아요."}</p>
        {mutual ? <div className="voice-capability"><strong>P18 전환</strong><span>마이크 꺼짐 · 남은 권한 10:00</span><Button onClick={() => setAnnouncement("합성 음성 화면입니다. 실제 마이크는 켜지지 않아요.")}>마이크를 직접 확인하고 입장</Button></div> : null}
        <div className="actions"><Button onClick={() => moveTo("closing", "공통 종료 화면으로 이동했어요.")}>세션 마치기</Button><Button className="secondary" onClick={() => setSafetyOpen(true)}>차단·신고</Button></div>
      </section>
    );
  };

  const renderClosing = () => (
    <section className="task-card closing-card">
      <p className="eyebrow">P19 · 공통 종료</p>
      <h2>오늘 세션을 마쳤어요.</h2>
      <p>다른 사람의 선택이나 이유는 공개하지 않아요. 의견 남기기는 선택 사항이며 안전·지원은 이후에도 열 수 있어요.</p>
      <div className="actions"><Button>예약 대시보드로</Button><Button className="secondary">의견 남기기</Button><Button className="secondary" onClick={() => setSafetyOpen(true)}>안전·지원</Button></div>
    </section>
  );

  const content = {
    device: renderDevice,
    waiting: renderWaiting,
    rules: renderRules,
    game: renderGame,
    conversation: renderConversation,
    interest: renderInterest,
    noTarget: renderNoTarget,
    consent: renderConsent,
    reveal: renderReveal,
    final: renderFinal,
    result: renderResult,
    closing: renderClosing,
  }[view]();

  return (
    <div className="app">
      <header className="review-header">
        <div>
          <span className="prototype-tag">연구용 · 합성 데이터</span>
          <strong>Propscans 저충실도 UX Mock</strong>
        </div>
        <p>실제 서비스·마이크·신고 전송이 아닙니다.</p>
      </header>

      <aside className="scenario-panel" aria-label="프로토타입 검토 도구">
        <label htmlFor="scenario">검토 시나리오</label>
        <div className="scenario-controls">
          <select id="scenario" value={scenarioId} onChange={(event) => setScenarioId(event.target.value)}>
            {scenarios.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
          <Button className="secondary" onClick={applyScenario}>시나리오 적용</Button>
        </div>
        <small>이 전환 도구는 프로덕션 기능이 아닙니다.</small>
      </aside>

      {isLive ? (
        <div className="live-shell" data-testid="p10-shell">
          <section className="live-status" aria-label="현재 세션 상태">
            <div className="stage-title">
              <span>{meta.key} · P10 안의 단계</span>
              <strong>{meta.title}</strong>
            </div>
            <div className="status-grid">
              <StatusBadge label="청중" value={meta.audience} />
              <StatusBadge label="남은 시간" value={meta.time} />
              <StatusBadge label="연결" value={connection} tone={connection === "연결됨" ? "good" : "attention"} />
              <StatusBadge label="마이크" value={micOn ? "켜짐" : "꺼짐"} tone={micOn ? "attention" : "neutral"} />
            </div>
          </section>
          <div className="shell-body">
            <aside className="participants" aria-label="참가자 음성 상태">
              <h2>음성 상태</h2>
              {["나 · 마이크 꺼짐", "한별 · 듣는 중", "다온 · 말하는 중", "서우 · 듣는 중", "이든 · 연결 확인 중", "해솔 · 듣는 중"].map((person) => <span key={person}>{person}</span>)}
            </aside>
            <main id="main-content" className="main-content" tabIndex={-1}>
              <h1 className="sr-focus" tabIndex={-1} ref={mainHeading}>{meta.title}</h1>
              {content}
            </main>
            <nav className="live-controls" aria-label="라이브 세션 제어">
              <Button className="secondary" onClick={() => setMicOn((value) => !value)}>
                <span className="control-label-full">{micOn ? "마이크 끄기" : "마이크 확인"}</span>
                <span className="control-label-short" aria-hidden="true">마이크</span>
              </Button>
              <Button className="secondary">
                <span className="control-label-full">현재 단계 도움</span>
                <span className="control-label-short" aria-hidden="true">도움</span>
              </Button>
              <Button className="danger-quiet" onClick={() => setSafetyOpen(true)}>
                <span className="control-label-full">나가기·안전</span>
                <span className="control-label-short" aria-hidden="true">나가기</span>
              </Button>
            </nav>
          </div>
        </div>
      ) : (
        <main id="main-content" className="standalone" tabIndex={-1}>
          <h1 className="page-heading" tabIndex={-1} ref={mainHeading}>{meta.key} · {meta.title}</h1>
          {content}
        </main>
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>

      {reconnectOpen ? (
        <Dialog title="현재 단계와 권한을 다시 확인하고 있어요." onClose={() => { setReconnectOpen(false); setMicOn(false); setAnnouncement("연결이 돌아왔어요. 마이크는 꺼져 있어요."); }}>
          <p>이전 선택을 자동으로 보내지 않고, 만료된 공개·발화 권한을 다시 열지 않아요.</p>
          <div className="notice"><strong>마이크 꺼짐</strong><span>연결 후 직접 확인해야 다시 사용할 수 있어요.</span></div>
          <div className="actions"><Button onClick={() => { setReconnectOpen(false); setAnnouncement("연결이 돌아왔어요. 마이크는 꺼져 있어요."); }}>연결 복구 확인</Button><Button className="secondary">지원</Button><Button className="danger-quiet" onClick={() => { setReconnectOpen(false); window.setTimeout(() => { setSafetyStep("leave"); setSafetyOpen(true); }, 0); }}>안전하게 나가기</Button></div>
        </Dialog>
      ) : null}

      {safetyOpen ? (
        <Dialog title="P20 · 나가기와 안전" onClose={() => { setSafetyOpen(false); setReportOpen(false); setSafetyStep("menu"); }}>
          {safetyStep === "leave" ? (
            <>
              <p>지금 나가면 현재 세션 참여가 끝나요. 신고나 차단은 필수가 아니며 따로 선택할 수 있어요.</p>
              <div className="actions"><Button className="danger" onClick={() => { setSafetyOpen(false); setSafetyStep("menu"); moveTo("closing", "세션에서 나왔어요."); }}>나가기 확인</Button><Button className="secondary" onClick={() => setSafetyStep("menu")}>계속 참여</Button></div>
            </>
          ) : safetyStep === "block" ? (
            <>
              <p>차단하면 이 세션의 공개와 다음 진행을 중단해요. 신고는 선택 사항이며 차단 이유는 상대에게 공개되지 않아요.</p>
              <div className="actions"><Button className="danger" onClick={() => { setSafetyOpen(false); setSafetyStep("menu"); moveTo("closing", "차단을 적용한 것으로 시뮬레이션했어요."); }}>차단 확인</Button><Button className="secondary" onClick={() => setSafetyStep("menu")}>취소</Button></div>
            </>
          ) : safetyStep === "emergency" ? (
            <>
              <p>즉시 위험한 상황은 이 서비스의 일반 지원과 구분해 지역 긴급기관의 도움을 직접 요청해 주세요. 이 Mock은 연락이나 위치 전송을 하지 않아요.</p>
              <Button className="secondary" onClick={() => setSafetyStep("menu")}>안전 메뉴로</Button>
            </>
          ) : !reportOpen ? (
            <>
              <p>나가기, 차단, 신고는 서로 독립된 행동이에요. 긴급 도움은 제품 지원과 구분돼요.</p>
              <div className="safety-actions">
                <Button className="danger" onClick={() => setSafetyStep("leave")}>지금 나가기</Button>
                <Button className="secondary" onClick={() => setSafetyStep("block")}>차단 영향 확인</Button>
                <Button className="secondary" onClick={() => setReportOpen(true)}>최소 신고 시작</Button>
                <Button className="quiet" onClick={() => setSafetyStep("emergency")}>긴급 도움 안내</Button>
              </div>
            </>
          ) : reportSent ? (
            <div className="notice good" role="status"><strong>신고가 접수된 것으로 시뮬레이션했어요.</strong><span>실제 전송은 없으며 후속 검토 상태만 안내해요.</span></div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); setReportSent(true); }}>
              <p>대면 설명이나 법률 분류가 필요하지 않아요. 필요한 만큼만 알려 주세요.</p>
              <label className="field-label" htmlFor="report-subject">대상</label>
              <select id="report-subject"><option>한별님</option><option>대상을 잘 모르겠어요</option></select>
              <label className="field-label" htmlFor="report-context">맥락</label>
              <select id="report-context"><option>불편한 말이나 행동</option><option>연락처 요청</option><option>안전이 걱정됨</option><option>잘 모르겠음</option></select>
              <label className="field-label" htmlFor="report-note">짧은 설명 (선택)</label>
              <textarea id="report-note" rows={3} />
              <p className="hint">파일 첨부는 선택 사항이며 이 Mock에는 업로드가 없어요.</p>
              <div className="actions"><Button type="submit">최소 내용으로 접수 시뮬레이션</Button><Button type="button" className="secondary" onClick={() => setReportOpen(false)}>뒤로</Button></div>
            </form>
          )}
        </Dialog>
      ) : null}
    </div>
  );
}

export default App;
