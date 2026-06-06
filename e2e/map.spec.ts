import { test, expect } from "@playwright/test";

test("지도 페이지가 Leaflet 지도를 렌더한다", async ({ page }) => {
  await page.goto("/map");
  // 클라이언트 전용 Leaflet 컨테이너가 마운트되는지
  await expect(page.locator(".leaflet-container")).toBeVisible({
    timeout: 20_000,
  });
  // 실제 OSM 타일 이미지가 DOM에 로드되는지
  await expect(page.locator("img.leaflet-tile").first()).toBeAttached({
    timeout: 15_000,
  });
});
