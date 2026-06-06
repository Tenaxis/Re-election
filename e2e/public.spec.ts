import { test, expect } from "@playwright/test";

test.describe("비로그인 조회", () => {
  test("피드를 조회할 수 있다", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "피드" })).toBeVisible();
  });

  test("집회 일정을 조회할 수 있다", async ({ page }) => {
    await page.goto("/schedule");
    // 페이지가 정상 렌더(에러 없음)
    await expect(page.locator("body")).toBeVisible();
    await expect(page).toHaveURL(/\/schedule$/);
  });

  test("글 작성은 로그인으로 유도된다", async ({ page }) => {
    await page.goto("/post/new");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("#email")).toBeVisible();
  });

  test("일정 등록은 로그인으로 유도된다", async ({ page }) => {
    await page.goto("/schedule/new");
    await expect(page).toHaveURL(/\/login/);
  });
});
