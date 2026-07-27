import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(cleanup);

describe("Propscans UX mock", () => {
  it("starts with the standalone P08 device check", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /P08 · 기기 점검/ })).toBeInTheDocument();
    expect(screen.queryByTestId("p10-shell")).not.toBeInTheDocument();
  });

  it("keeps P10 visible for protected live stages", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("검토 시나리오"), {
      target: { value: "choose-none" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시나리오 적용" }));
    expect(screen.getByTestId("p10-shell")).toBeInTheDocument();
    expect(screen.getByText("P13 · 보호된 선택")).toBeInTheDocument();
    expect(screen.getByText("청중")).toBeInTheDocument();
    expect(screen.getAllByText("마이크").length).toBeGreaterThanOrEqual(1);
  });

  it("does not expose peer submission counts in initial interest", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("검토 시나리오"), {
      target: { value: "interest-timeout" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시나리오 적용" }));
    expect(screen.getByText(/미제출 초안은 자동으로 보내지 않았어요/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[0-6]\/6|명 제출|선택 수/);
  });

  it("offers resource-specific consent with no prechecked resources", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("검토 시나리오"), {
      target: { value: "consent-declined" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시나리오 적용" }));
    const choices = screen.getAllByRole("checkbox");
    expect(choices).toHaveLength(3);
    choices.forEach((choice) => {
      expect(choice).not.toBeChecked();
    });
    expect(screen.getByRole("button", { name: "선택한 정보 공개" })).toBeDisabled();
  });

  it("shows only independently available peer resources", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("검토 시나리오"), {
      target: { value: "resource-unavailable" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시나리오 적용" }));
    expect(screen.getByText("이번 공개에서 볼 수 있는 정보가 없어요.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("32세")).not.toBeInTheDocument();
  });

  it("requires explicit initial and final intent before progression", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("검토 시나리오"), {
      target: { value: "choose-none" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시나리오 적용" }));
    fireEvent.click(screen.getByRole("button", { name: "내 선택 제출" }));
    expect(screen.getAllByText("내 선택을 제출했어요.").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "검토용 다음 단계" }));
    fireEvent.click(screen.getByRole("button", { name: "최종 선택으로" }));
    expect(screen.getByRole("button", { name: "내 선택 제출" })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: "아무도 선택하지 않기" }));
    fireEvent.click(screen.getByRole("button", { name: "내 선택 제출" }));
    expect(screen.getAllByText("내 최종 선택을 제출했어요.").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "내 다음 단계 확인" }));
    expect(screen.getByText("이번에는 다음 음성 대화가 열리지 않았어요.")).toBeInTheDocument();
  });

  it("keeps leave, block and report independent", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("검토 시나리오"), {
      target: { value: "weak-network" },
    });
    fireEvent.click(screen.getByRole("button", { name: "시나리오 적용" }));
    fireEvent.click(screen.getByRole("button", { name: "나가기·안전" }));
    expect(screen.getByRole("button", { name: "지금 나가기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "차단 영향 확인" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "최소 신고 시작" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "지금 나가기" }));
    fireEvent.click(screen.getByRole("button", { name: "나가기 확인" }));
    expect(screen.getByText("오늘 세션을 마쳤어요.")).toBeInTheDocument();
  });
});
