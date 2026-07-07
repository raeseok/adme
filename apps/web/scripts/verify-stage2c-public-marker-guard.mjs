/**
 * Stage 2-C — stage2C machine markers only on /admin/diagnostics, not public routes
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";

const PUBLIC_FORBIDDEN = [
  "stage2CBuild=",
  "stage2CAdViewsMutation=",
  "stage2CPointLedgerMutation=",
  "stage2CServerAuthoritativeMinView=",
  "stage2CQuizAnswerClientExposure=",
  "stage2CRewardPreviewOnly=",
  "stage2CAttemptLimit=",
  "stage2CBudgetMutation=",
  "stage2CKakaoActualSend=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage2CBuild=stage2c-ad-views-server-min-view-production",
  "stage2CAdViewsMutation=true",
  "stage2CPointLedgerMutation=false",
  "stage2CServerAuthoritativeMinView=true",
  "stage2CQuizAnswerClientExposure=false",
  "stage2CRewardPreviewOnly=true",
  "stage2CAttemptLimit=2",
  "stage2CBudgetMutation=false",
  "stage2CKakaoActualSend=false",
  "stage2CPublicMarkerExposed=false",
];

function assertNotContains(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: should not contain "${needle}"`);
  }
  console.log(`PASS: ${label} — no "${needle}"`);
}

function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    for (const route of [
      "/",
      "/consumer",
      "/consumer/ads",
      `/consumer/ads/${FIXTURE_CAMPAIGN}`,
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      for (const marker of PUBLIC_FORBIDDEN) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
    }

    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const diag = await page.locator("body").innerText();
    for (const marker of DIAGNOSTICS_REQUIRED) {
      assertContains(diag, marker, "diagnostics");
    }

    console.log("PASS: verify:stage2c-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
