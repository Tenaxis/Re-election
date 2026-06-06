import { test, expect } from "@playwright/test";
import { signUpAndOnboard, uniq } from "./helpers";

test("글 작성 → 피드/상세 노출 → 좋아요 → 댓글", async ({ page }) => {
  await signUpAndOnboard(page);

  const body = `E2E 현장 기록 ${uniq()}`;
  const tag = `태그${uniq().slice(-4)}`;

  // 글 작성
  await page.goto("/post/new");
  await page.locator("#body").fill(body);
  await page.locator("#loc-address").fill("서울 종로구 세종대로");
  const tagInput = page.locator("#tag-input");
  await tagInput.fill(tag);
  await tagInput.press("Enter");
  await page.getByRole("button", { name: "등록", exact: true }).click();

  // 상세로 이동, 본문 확인
  await page.waitForURL("**/post/**", { timeout: 20_000 });
  await expect(page.getByText(body, { exact: false }).first()).toBeVisible();

  // 좋아요 토글
  const likeBtn = page.getByRole("button", { name: "좋아요", exact: true });
  await expect(likeBtn).toBeVisible();
  await likeBtn.click();
  await expect(
    page.getByRole("button", { name: "좋아요 취소" }),
  ).toBeVisible();

  // 댓글 작성
  const comment = `E2E 댓글 ${uniq()}`;
  await page.getByPlaceholder("댓글을 입력하세요.").fill(comment);
  await page
    .getByRole("button", { name: "등록", exact: true })
    .last()
    .click();
  await expect(page.getByText(comment, { exact: false })).toBeVisible({
    timeout: 15_000,
  });

  // 피드에서도 글이 보인다
  await page.goto("/");
  await expect(page.getByText(body, { exact: false }).first()).toBeVisible();
});
