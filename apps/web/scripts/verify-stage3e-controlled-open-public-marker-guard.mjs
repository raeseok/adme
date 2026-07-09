/**
 * Stage 3-E-Controlled-Open-Approval — public routes must not expose markers.
 */
import { chromium } from "playwright";
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { assertNotContains } from "./utils/stage3e-helpers.mjs";
import {
  STAGE3E_APPROVAL_PUBLIC_FORBIDDEN_MARKERS,
  STAGE3E_APPROVAL_PUBLIC_FORBIDDEN_VISIBLE_STRINGS,
  STAGE3E_APPROVAL_REQUIRED_MARKERS,
  verifyApprovalSourceContract,
} from "./utils/stage3e-controlled-open-approval-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_ROUTES = [
  "/",
  "/consumer",
  "/auth/login",
  "/auth/callback",
  "/consumer/ads",
  "/consumer/profile",
];

async function main() {
  verifyApprovalSourceContract();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    for (const route of PUBLIC_ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      for (const marker of STAGE3E_APPROVAL_PUBLIC_FORBIDDEN_MARKERS) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
      for (const marker of STAGE3E_APPROVAL_PUBLIC_FORBIDDEN_VISIBLE_STRINGS) {
        assertNotContains(body, marker, `public visible text ${route}`);
      }
    }

    const sources = await loadDiagnosticsFromHttp(BASE, {
      maxWaitMs: 90000,
      path: "/admin/reward-preflight",
    });
    assertMarkerList(
      sources.combined,
      STAGE3E_APPROVAL_REQUIRED_MARKERS,
      "admin approval markers",
    );
    console.log("RESULT: publicMarkerExposed=false");
    console.log("PASS: verify:stage3e-controlled-open-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
