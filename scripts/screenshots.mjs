// 주요 화면 스크린샷 캡처 (UI/UX 육안 검토용). dev 서버(3000) 실행 중이어야 함.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "scripts/shots";
mkdirSync(OUT, { recursive: true });

const uniq = () => `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

async function signUp(page) {
  const id = uniq();
  await page.goto(`${BASE}/signup`);
  await page.locator("#email").fill(`shot_${id}@example.com`);
  await page.locator("#password").fill("password1234");
  await page.getByRole("button", { name: "회원가입" }).click();
  await page.waitForURL("**/onboarding", { timeout: 20000 });
  await page.locator("#nickname").fill(`재선거지기_${id}`.slice(0, 20));
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/onboarding"), { timeout: 20000 });
}

async function createPost(page, body, address, tags) {
  await page.goto(`${BASE}/post/new`);
  await page.locator("#body").fill(body);
  if (address) await page.locator("#loc-address").fill(address);
  for (const t of tags) {
    await page.locator("#tag-input").fill(t);
    await page.locator("#tag-input").press("Enter");
  }
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await page.waitForURL(/\/post\/[0-9a-f-]{36}/, { timeout: 20000 });
  return page.url();
}

async function createSchedule(page, name, addr) {
  const d = new Date(Date.now() + 5 * 86400000);
  const p = (n) => String(n).padStart(2, "0");
  const dt = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T18:00`;
  await page.goto(`${BASE}/schedule/new`);
  await page.locator("#name").fill(name);
  await page.locator("#starts_at").fill(dt);
  await page.locator("#address").fill(addr);
  await page.locator("#is_reported").check();
  await page.getByRole("button", { name: "일정 등록" }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/new"), { timeout: 20000 });
}

async function shoot(browser, { theme, viewport, name, path, setup }) {
  const ctx = await browser.newContext({
    viewport,
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  const page = await ctx.newPage();
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  if (setup) await setup(page);
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}

const browser = await chromium.launch();

// 콘텐츠 시드(로그인 컨텍스트)
const seedCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seed = await seedCtx.newPage();
await signUp(seed);
const postUrl = await createPost(
  seed,
  "오늘 시청 앞 집회 현장입니다. 평화롭게 진행되고 있고 참가자들이 질서를 지키며 행진 중입니다. 경찰과의 충돌 없이 마무리되길 바랍니다.",
  "서울 중구 세종대로 110",
  ["시청", "평화집회", "현장기록"],
);
await createPost(
  seed,
  "물과 간식 지원이 필요합니다. 정문 쪽에 인원이 몰려 있어요.",
  "서울 종로구 종로1가",
  ["지원요청", "종로"],
);
await createSchedule(seed, "6월 민주항쟁 기념 집회", "서울특별시 중구 세종대로 110");
const postPath = new URL(postUrl).pathname;
await seedCtx.close();

const desktop = { width: 1280, height: 900 };
const mobile = { width: 390, height: 844 };

for (const theme of ["light", "dark"]) {
  await shoot(browser, { theme, viewport: desktop, name: `feed-${theme}`, path: "/" });
  await shoot(browser, { theme, viewport: desktop, name: `post-${theme}`, path: postPath });
  await shoot(browser, { theme, viewport: desktop, name: `schedule-${theme}`, path: "/schedule" });
  await shoot(browser, { theme, viewport: desktop, name: `login-${theme}`, path: "/login" });
  await shoot(browser, { theme, viewport: desktop, name: `compose-${theme}`, path: "/post/new", setup: signUp });
  await shoot(browser, { theme, viewport: mobile, name: `feed-mobile-${theme}`, path: "/" });
}

await browser.close();
console.log("done");
