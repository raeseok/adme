/**
 * Stage 2-B — stage2B machine markers only on /admin/diagnostics, not public routes
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();
const FIXTURE_CAMPAIGN = "stage2a-fixture-campaign-2";

const PUBLIC_FORBIDDEN = [
  "stage2BBuild=",
  "stage2BMinViewTimer=",
  "stage2BServerGradingPreview=",
  "stage2BQuizAnswerClientExposure=",
  "stage2BPointLedgerMutation=",
  "stage2BAdViewsMutation=",
  "stage2BRewardPreviewOnly=",
  "stage2BKakaoActualSend=",
  "stage2BServerAuthoritativeMinView=",
  "stage2BPublicMarkerExposed=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage2BBuild=stage2b-min-view-server-grading-preview-production",
  "stage2BMinViewTimer=true",
  "stage2BServerGradingPreview=true",
  "stage2BQuizAnswerClientExposure=false",
  "stage2BPointLedgerMutation=false",
  "stage2BAdViewsMutation=false",
  "stage2BRewardPreviewOnly=true",
  "stage2BKakaoActualSend=false",
  "stage2BServerAuthoritativeMinView=false",
  "stage2BPublicMarkerExposed=false",
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

    console.log("PASS: verify:stage2b-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
