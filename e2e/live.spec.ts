import { test, expect } from "@playwright/test";
import { signUpAndOnboard, uniq, dtLocal } from "./helpers";

test("집회 라이브 추가 → 멀티뷰 노출 → 삭제", async ({ page }) => {
  page.on("dialog", (d) => d.accept()); // window.confirm 자동 수락

  await signUpAndOnboard(page);

  // 집회 생성 (좌표 자동 커밋)
  const name = `라이브집회 ${uniq()}`;
  await page.goto("/schedule/new");
  await page.locator("#name").fill(name);
  await page.locator("#starts_at").fill(dtLocal(1, 18, 0));
  await page.locator("#loc-address").fill("서울 중구 세종대로 110");
  await expect(page.locator('input[name="lat"]')).not.toHaveValue("");
  await page.getByRole("button", { name: "일정 등록" }).click();
  await page.waitForURL(/\/schedule\/[0-9a-f-]{36}$/, { timeout: 20_000 });

  // 라이브 페이지 진입
  await page.getByRole("link", { name: /실시간 라이브/ }).click();
  await page.waitForURL(/\/schedule\/[0-9a-f-]{36}\/live$/, { timeout: 15_000 });

  // 잘못된 링크 → 에러
  await page.getByRole("button", { name: "라이브 추가" }).click();
  await page.locator("#live-url").fill("https://example.com/not-youtube");
  await page.locator("#live-label").fill("본회장");
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(page.getByText(/유효한 유튜브/)).toBeVisible({ timeout: 10_000 });

  // 올바른 영상 링크 → 추가
  await page.locator("#live-url").fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  await page.getByRole("button", { name: "추가", exact: true }).click();

  // 멀티뷰에 임베드 노출
  const cell = page.locator('iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]');
  await expect(cell).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("본회장")).toBeVisible();

  // 삭제 → 사라짐
  await page.getByRole("button", { name: "라이브 삭제" }).click();
  await expect(cell).toHaveCount(0, { timeout: 15_000 });
});
