import { test, expect } from "@playwright/test";
import { signUpAndOnboard, uniq, dtLocal } from "./helpers";

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

const LAT = 37.5665;
const LNG = 126.978;

test("참여 인증: 위치+코드+사진+휴대폰 → 오늘 인증 카운트 증가", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    geolocation: { latitude: LAT, longitude: LNG },
    permissions: ["geolocation"],
  });
  const page = await ctx.newPage();
  await signUpAndOnboard(page);

  const code = `CODE${uniq().slice(-4)}`.toUpperCase();
  const name = `인증집회 ${uniq()}`;

  // 좌표·인증코드가 있는 집회 생성
  await page.goto("/schedule/new");
  await page.locator("#name").fill(name);
  await page.locator("#starts_at").fill(dtLocal(1, 18, 0));
  await page.locator("#address").fill("서울특별시 중구 세종대로 110");
  await page.locator("#lat").fill(String(LAT));
  await page.locator("#lng").fill(String(LNG));
  await page.locator("#verify_code").fill(code);
  await page.getByRole("button", { name: "일정 등록" }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/new"), { timeout: 20_000 });

  // 상세로 이동
  await page.goto("/schedule");
  await page.getByText(name, { exact: false }).first().click();
  await page.waitForURL(/\/schedule\/[0-9a-f-]{36}$/, { timeout: 15_000 });
  await expect(page.getByText("오늘 인증 0명")).toBeVisible();

  // 인증 페이지
  await page.getByRole("link", { name: "참여 인증하기" }).click();
  await page.waitForURL("**/verify");

  await page.getByRole("button", { name: "현재 위치 확인" }).click();
  await expect(page.getByText(/위치 확인됨/)).toBeVisible({ timeout: 15_000 });
  await page.locator("#verify-code").fill(code);
  await page.locator("#verify-photo").setInputFiles({
    name: "proof.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.locator("#verify-phone").fill("01012345678");
  await page.getByRole("button", { name: "참여 인증 완료" }).click();

  await expect(page.getByText("참여 인증이 완료되었습니다.")).toBeVisible({
    timeout: 20_000,
  });

  // 카운트 증가 확인
  await page.goto("/schedule");
  await page.getByText(name, { exact: false }).first().click();
  await expect(page.getByText("오늘 인증 1명")).toBeVisible({ timeout: 15_000 });

  await ctx.close();
});
