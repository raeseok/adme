/**
 * Stage 3-E — public routes must not expose Stage 3-E markers.
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3E_PUBLIC_FORBIDDEN_MARKERS,
  STAGE3E_REQUIRED_MARKERS,
  assertNotContains,
} from "./utils/stage3e-helpers.mjs";
import {
  assertMarkerList,
  extractMarkerValue,
} from "./e2e/diagnostics-helpers.mjs";

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
      for (const marker of STAGE3E_PUBLIC_FORBIDDEN_MARKERS) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
    }

    await page.goto(`${BASE}/admin/reward-preflight`, {
      waitUntil: "networkidle",
    });
    const preflight = await page.locator("body").innerText();
    if (extractMarkerValue(preflight, "stage3EPreflightEnabled") !== "true") {
      console.log(
        "INFO: Stage 3-E Production markers pending deployment; public route exposure guard passed",
      );
      console.log("RESULT: stage3EPublicMarkerExposed=false");
      console.log("PASS: verify:stage3e-public-marker-guard");
      return;
    }
    assertMarkerList(preflight, STAGE3E_REQUIRED_MARKERS, "reward-preflight");

    console.log("RESULT: stage3EPublicMarkerExposed=false");
    console.log("PASS: verify:stage3e-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
