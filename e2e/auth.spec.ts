import { test, expect } from "@playwright/test";
import { signUpAndOnboard } from "./helpers";

test("회원가입 → 닉네임 온보딩 → 로그인 상태", async ({ page }) => {
  const { nickname } = await signUpAndOnboard(page);

  // 로그인 상태: 내정보 접근 가능(로그인으로 안 튕김)
  await page.goto("/me");
  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByText(nickname, { exact: false }).first()).toBeVisible();
});
