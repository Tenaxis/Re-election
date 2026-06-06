import { test, expect } from "@playwright/test";
import { signUpAndOnboard, createPost, promoteToAdmin, uniq } from "./helpers";

test("비admin은 관리자 대시보드에 접근할 수 없다", async ({ page }) => {
  await signUpAndOnboard(page);
  await page.goto("/admin");
  // 일반 유저는 홈으로 리다이렉트
  await expect(page).toHaveURL(/\/$/);
});

test("신고 → 관리자 대시보드에서 확인·처리", async ({ browser }) => {
  // 작성자: 글 작성
  const authorCtx = await browser.newContext();
  const authorPage = await authorCtx.newPage();
  await signUpAndOnboard(authorPage);
  const postUrl = await createPost(authorPage, `신고대상 글 ${uniq()}`);

  // 신고자: 해당 글 신고
  const reporterCtx = await browser.newContext();
  const reporter = await reporterCtx.newPage();
  await signUpAndOnboard(reporter);
  await reporter.goto(postUrl);
  await reporter.getByRole("button", { name: "게시글 신고" }).click();
  const reason = `부적절한 내용 ${uniq()}`;
  await reporter.locator("#report-reason").fill(reason);
  await reporter.getByRole("button", { name: "신고하기" }).click();
  await expect(reporter.getByText("신고가 접수되었습니다.")).toBeVisible({
    timeout: 15_000,
  });

  // 관리자: 승격 후 대시보드에서 신고 확인
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { nickname } = await signUpAndOnboard(admin);
  await promoteToAdmin(nickname);
  await admin.goto("/admin");
  await expect(admin.getByRole("heading", { name: "관리자 대시보드" })).toBeVisible();
  await expect(admin.getByText(reason, { exact: false })).toBeVisible({
    timeout: 15_000,
  });

  await authorCtx.close();
  await reporterCtx.close();
  await adminCtx.close();
});
