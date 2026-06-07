import { test, expect } from "@playwright/test";
import { signUpAndOnboard, uniq, dtLocal } from "./helpers";

test("집회 일정 등록 → 목록 노출", async ({ page }) => {
  await signUpAndOnboard(page);

  const name = `E2E 집회 ${uniq()}`;

  await page.goto("/schedule/new");
  await page.locator("#name").fill(name);
  await page.locator("#starts_at").fill(dtLocal(3, 18, 30));
  await page.locator("#loc-address").fill("서울특별시 중구 세종대로 110");
  // 지도 picker가 중앙 핀 좌표를 자동 커밋할 때까지 대기
  await expect(page.locator('input[name="lat"]')).not.toHaveValue("");
  await page.locator("#is_reported").check();
  await page.getByRole("button", { name: "일정 등록" }).click();

  // 등록 후 /schedule/new 를 벗어남
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 20_000,
  });

  // 목록에서 확인
  await page.goto("/schedule");
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible({
    timeout: 15_000,
  });
});
