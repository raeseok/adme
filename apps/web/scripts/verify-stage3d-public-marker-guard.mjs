/**
 * Stage 3-D — public routes must not expose stage3D markers
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3D_DIAGNOSTICS_REQUIRED,
  STAGE3D_PREFLIGHT_REQUIRED,
  STAGE3D_PUBLIC_FORBIDDEN_MARKERS,
  assertContains,
  assertNotContains,
} from "./utils/stage3d-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_ROUTES = [
  "/",
  "/consumer",
  "/consumer/ads",
  "/consumer/ads/e2e00002-0000-4000-8000-000000000002",
  "/auth/login",
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    for (const route of PUBLIC_ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      for (const marker of STAGE3D_PUBLIC_FORBIDDEN_MARKERS) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
    }

    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const diag = await page.locator("body").innerText();
    for (const marker of STAGE3D_DIAGNOSTICS_REQUIRED) {
      assertContains(diag, marker, "diagnostics");
    }

    await page.goto(`${BASE}/admin/reward-preflight`, {
      waitUntil: "networkidle",
    });
    const preflight = await page.locator("body").innerText();
    for (const marker of STAGE3D_PREFLIGHT_REQUIRED) {
      assertContains(preflight, marker, "reward-preflight");
    }

    console.log("RESULT: stage3DPublicMarkerExposed=false");
    console.log("PASS: verify:stage3d-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
