import { test, expect } from "@playwright/test";
import { signUpAndOnboard, uniq } from "./helpers";

test("지원요청 등록 → 목록 노출 → 상태 변경", async ({ page }) => {
  await signUpAndOnboard(page);

  const body = `E2E 지원요청 ${uniq()} 물과 간식이 필요합니다.`;

  await page.goto("/support/new");
  await page.locator("#type").selectOption("food");
  await page.locator("#body").fill(body);
  await page.locator("#loc-address").fill("서울 중구 세종대로 110 인근");
  await page.getByRole("button", { name: "지원 요청하기" }).click();

  // 등록 후 /support/new 를 벗어남
  await page.waitForURL((url) => !url.pathname.endsWith("/new"), {
    timeout: 20_000,
  });

  // 목록에서 확인
  await page.goto("/support");
  const card = page.getByText(body, { exact: false }).first();
  await expect(card).toBeVisible({ timeout: 15_000 });

  // 상세로 이동 후 상태 변경 (작성자)
  await card.click();
  await page.waitForURL("**/support/**");
  const statusSelect = page.locator("select").first();
  await statusSelect.selectOption("in_progress");
  await expect(page.getByText("진행중").first()).toBeVisible({ timeout: 15_000 });
});

test("지원요청은 비로그인 조회 가능, 등록은 로그인 유도", async ({ page }) => {
  await page.goto("/support");
  await expect(page.getByRole("heading", { name: "지원요청" })).toBeVisible();

  await page.goto("/support/new");
  await expect(page).toHaveURL(/\/login/);
});
