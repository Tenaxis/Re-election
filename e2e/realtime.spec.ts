import { test, expect } from "@playwright/test";
import { signUpAndOnboard, uniq } from "./helpers";

test("다른 세션의 새 지원요청이 실시간 배너로 표시된다", async ({ browser }) => {
  // 관전자(A): 지원요청 목록을 비로그인으로 본다
  const viewerCtx = await browser.newContext();
  const viewer = await viewerCtx.newPage();
  await viewer.goto("/support");
  await viewer.waitForLoadState("networkidle");
  // realtime 구독이 자리잡도록 잠시 대기
  await viewer.waitForTimeout(2500);

  // 작성자(B): 새 지원요청 등록
  const authorCtx = await browser.newContext();
  const author = await authorCtx.newPage();
  await signUpAndOnboard(author);
  await author.goto("/support/new");
  await author.locator("#type").selectOption("manpower");
  await author.locator("#body").fill(`실시간 테스트 ${uniq()}`);
  await author.getByRole("button", { name: "지원 요청하기" }).click();
  await author.waitForURL((url) => !url.pathname.endsWith("/new"), { timeout: 20_000 });

  // A 화면에 실시간 배너 등장
  await expect(viewer.getByText(/새 지원요청/)).toBeVisible({ timeout: 20_000 });

  await viewerCtx.close();
  await authorCtx.close();
});
