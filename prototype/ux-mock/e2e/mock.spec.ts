import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const shots = join(process.cwd(), "artifacts", "screenshots");

async function applyScenario(page: Page, label: string) {
  await page.getByLabel("검토 시나리오").selectOption({ label });
  await page.getByRole("button", { name: "시나리오 적용" }).click();
}

test.beforeAll(async () => {
  await mkdir(shots, { recursive: true });
});

test("required screenshots, console safety and responsive review", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /P08 · 기기 점검/ })).toBeVisible();
  await page.screenshot({ path: join(shots, "01-device-check.png"), fullPage: true });

  await page.getByRole("button", { name: "점검 완료" }).click();
  await expect(page.getByText("P09 · 독립 화면")).toBeVisible();
  await page.screenshot({ path: join(shots, "02-waiting-room.png"), fullPage: true });

  await applyScenario(page, "연결 약함");
  await expect(page.getByTestId("p10-shell")).toBeVisible();
  await page.screenshot({ path: join(shots, "03-live-game-shell.png"), fullPage: true });

  await applyScenario(page, "초기 관심: 아무도 선택하지 않음");
  await page.screenshot({ path: join(shots, "04-initial-interest.png"), fullPage: true });

  await applyScenario(page, "공개 동의 거절");
  await page.screenshot({ path: join(shots, "05-disclosure-consent.png"), fullPage: true });

  await applyScenario(page, "공개 리소스 이용 불가");
  await page.screenshot({ path: join(shots, "06-limited-reveal.png"), fullPage: true });

  await applyScenario(page, "최종: 다음 음성 없음");
  await page.screenshot({ path: join(shots, "07-common-result.png"), fullPage: true });

  await applyScenario(page, "재연결 성공");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: join(shots, "08-reconnect.png"), fullPage: true });
  await page.getByRole("button", { name: "대화상자 닫기" }).click();

  await applyScenario(page, "최소 신고 시작");
  await expect(page.getByLabel("맥락")).toBeVisible();
  await page.screenshot({ path: join(shots, "09-safety-entry.png"), fullPage: true });

  await page.getByRole("button", { name: "대화상자 닫기" }).click();
  await page.setViewportSize({ width: 360, height: 780 });
  await applyScenario(page, "연결 약함");
  await page.screenshot({ path: join(shots, "10-mobile-narrow.png"), fullPage: true });

  await page.setViewportSize({ width: 320, height: 720 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  await page.screenshot({ path: join(shots, "11-reflow-200.png"), fullPage: true });
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(horizontalOverflow).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("keyboard path and modal focus behavior", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "본문으로 건너뛰기" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await applyScenario(page, "사용자 나가기");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "대화상자 닫기" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("p10-shell")).toBeVisible();
  await expect(page.getByRole("button", { name: "시나리오 적용" })).toBeFocused();

  await applyScenario(page, "재연결 성공");
  await page.getByRole("button", { name: "안전하게 나가기" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "대화상자 닫기" })).toBeFocused();
});

test("P16 recovers a submitted person only through explicit none withdrawal", async ({ page }) => {
  await page.goto("/");
  await applyScenario(page, "Happy path");
  await page.getByRole("button", { name: "점검 완료" }).click();
  await page.getByRole("button", { name: "준비됐어요" }).click();
  await page.getByRole("button", { name: "입장하기" }).click();
  await page.getByRole("button", { name: "이해했어요" }).click();
  await page.getByRole("button", { name: "대표 게임 검토 완료" }).click();
  await page.getByRole("button", { name: "초기 관심 단계 보기" }).click();
  await page.getByRole("checkbox", { name: /한별님/ }).check();
  await page.getByRole("button", { name: "내 선택 제출" }).click();
  await page.getByRole("button", { name: "검토용 다음 단계" }).click();
  await page.getByRole("button", { name: "공개하지 않기" }).click();

  await page.getByRole("radio", { name: "한별님" }).check();
  await page.getByRole("button", { name: "내 선택 제출" }).click();

  await expect(page.getByRole("radio", { name: "한별님" })).toBeDisabled();
  await expect(page.getByRole("radio", { name: "다온님" })).toBeDisabled();
  await page.getByRole("button", { name: "전체 철회해 없음으로" }).click();

  await expect(page.getByRole("radio", { name: "아무도 선택하지 않기" })).toBeChecked();
  await expect(page.getByText("내 최종 선택을 철회했어요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "전체 철회해 없음으로" })).toHaveCount(0);

  await page.getByRole("button", { name: "내 다음 단계 확인" }).click();
  await expect(page.getByText("이번에는 다음 음성 대화가 열리지 않았어요.")).toBeVisible();
  await expect(page.getByText("P18 전환")).toHaveCount(0);
});

test("automated accessibility smoke check", async ({ page }) => {
  await page.goto("/");
  await applyScenario(page, "공개 동의 거절");
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await applyScenario(page, "최종: 10분 음성 가능");
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await applyScenario(page, "최소 신고 시작");
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
