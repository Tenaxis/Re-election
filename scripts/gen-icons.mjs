// PWA 아이콘 생성: 청록 라운드 사각 + 흰 투표(선거) 아이콘. playwright로 렌더 후 캡처.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

mkdirSync("public", { recursive: true });
const browser = await chromium.launch();

function html(size) {
  const r = Math.round(size * 0.22);
  const ic = Math.round(size * 0.55);
  return `<!doctype html><html><body style="margin:0">
  <div style="width:${size}px;height:${size}px;background:#0d9488;border-radius:${r}px;display:flex;align-items:center;justify-content:center">
    <svg width="${ic}" height="${ic}" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/>
    </svg>
  </div></body></html>`;
}

for (const size of [192, 512]) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(html(size));
  await page.locator("div").screenshot({ path: `public/icon-${size}.png` });
  await ctx.close();
}
await browser.close();
console.log("icons generated");
