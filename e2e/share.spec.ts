import { test, expect } from "@playwright/test";
import { signUpAndOnboard, createPost, uniq } from "./helpers";

test("글 상세에서 공유(링크 복사)가 동작한다", async ({ browser }) => {
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await ctx.newPage();
  await signUpAndOnboard(page);
  await createPost(page, `공유 테스트 ${uniq()}`);

  // navigator.share 제거 → 클립보드 복사 폴백 강제
  await page.addInitScript(() => {
    // @ts-expect-error 테스트용 강제 제거
    delete window.navigator.share;
  });
  await page.reload();

  await page.getByRole("button", { name: "공유" }).click();
  await expect(page.getByText("링크가 복사되었습니다.")).toBeVisible({
    timeout: 10_000,
  });
});
