import { type Page, expect } from "@playwright/test";

export function uniq(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** 신규 유저 회원가입 + 닉네임 온보딩. 로그인 상태로 만든 뒤 정보 반환. */
export async function signUpAndOnboard(page: Page) {
  const id = uniq();
  const email = `e2e_${id}@example.com`;
  const password = "password1234";
  const nickname = `테스터_${id}`.slice(0, 20);

  await page.goto("/signup");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "회원가입" }).click();

  // 가입 직후 닉네임 온보딩으로 이동
  await page.waitForURL("**/onboarding", { timeout: 20_000 });
  await page.locator("#nickname").fill(nickname);
  await page.getByRole("button", { name: "시작하기" }).click();

  // 온보딩 완료 후 온보딩이 아닌 페이지로 이동
  await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), {
    timeout: 20_000,
  });

  return { email, password, nickname };
}

/** 로그인 상태 page로 글 작성 후 상세 URL 반환. */
export async function createPost(page: Page, body: string, tag?: string) {
  await page.goto("/post/new");
  await page.locator("#body").fill(body);
  if (tag) {
    await page.locator("#tag-input").fill(tag);
    await page.locator("#tag-input").press("Enter");
  }
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await page.waitForURL(/\/post\/[0-9a-f-]{36}/, { timeout: 20_000 });
  return page.url();
}

/** 로컬 Supabase(service_role) REST로 닉네임 유저를 admin 으로 승격. */
export async function promoteToAdmin(nickname: string) {
  const SERVICE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  const res = await fetch(
    `http://127.0.0.1:54321/rest/v1/profiles?nickname=eq.${encodeURIComponent(nickname)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ role: "admin" }),
    },
  );
  if (!res.ok) throw new Error(`promoteToAdmin 실패: ${res.status}`);
}

/** datetime-local 입력값 포맷 (YYYY-MM-DDTHH:MM) */
export function dtLocal(daysFromNow: number, hour = 18, minute = 0): string {
  const d = new Date(Date.now() + daysFromNow * 86_400_000);
  d.setHours(hour, minute, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export { expect };
