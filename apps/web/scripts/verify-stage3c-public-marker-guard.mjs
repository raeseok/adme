/**
 * Stage 3-C — machine markers only on /admin/diagnostics
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { STAGE3C_PUBLIC_FORBIDDEN_MARKERS } from "./utils/stage3c-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const DIAGNOSTICS_REQUIRED = [
  "stage3CConsumerQuizSubmitUi=true",
  "stage3CControlledIntegration=true",
  "stage3CRpcName=rpc_stage3b_dev_submit_quiz_reward_transaction",
  "stage3CClientDirectRpcCall=false",
  "stage3CQuizAnswerExposure=false",
  "stage3CPublicMarkerExposed=false",
  "stage3CMinViewUiEnabled=true",
  "stage3CProductionBlockedUxEnabled=true",
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
      "/consumer/ads/e2e00002-0000-4000-8000-000000000002",
      "/auth/login",
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      for (const marker of STAGE3C_PUBLIC_FORBIDDEN_MARKERS) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
    }

    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const diag = await page.locator("body").innerText();
    for (const marker of DIAGNOSTICS_REQUIRED) {
      assertContains(diag, marker, "diagnostics");
    }

    console.log("RESULT: publicMarkerExposed=false");
    console.log("PASS: verify:stage3c-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
