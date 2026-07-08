/**
 * Stage 3-B — machine markers only on /admin/diagnostics
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_FORBIDDEN = [
  "stage3BFullTransactionDevOnly=",
  "stage3BRpcName=",
  "stage3BEntryTypeCanonical=",
  "stage3BLegacyStage3AEntryType=",
  "stage3BProductionMutationBlocked=",
  "stage3BProdPointLedgerMutation=",
  "stage3BProdCampaignBudgetMutation=",
  "stage3BProdUsersBalanceMutation=",
  "stage3BProdAdViewsMutation=",
  "stage3BQuizAnswerExposure=",
  "stage3BConsumerRoleOnly=",
  "stage3BAdvertiserRpcBlocked=",
  "stage3BPartnerRpcBlocked=",
  "stage3BAdminRpcBlocked=",
  "stage3BAdvertiserPartnerRawLedgerBlocked=",
  "stage3BPublicMarkerExposed=",
  "stage3BDeployCommit=",
  "stage3BCurrentSupabaseProjectRef=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage3BFullTransactionDevOnly=true",
  "stage3BRpcName=rpc_stage3b_dev_submit_quiz_reward_transaction",
  "stage3BEntryTypeCanonical=quiz_reward",
  "stage3BLegacyStage3AEntryType=ad_reward",
  "stage3BProductionMutationBlocked=true",
  "stage3BProdPointLedgerMutation=false",
  "stage3BProdCampaignBudgetMutation=false",
  "stage3BProdUsersBalanceMutation=false",
  "stage3BProdAdViewsMutation=false",
  "stage3BQuizAnswerExposure=false",
  "stage3BConsumerRoleOnly=true",
  "stage3BAdvertiserPartnerRawLedgerBlocked=true",
  "stage3BPublicMarkerExposed=false",
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
      "/consumer/profile",
      "/consumer/ads",
      "/auth/login",
    ]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();
      for (const marker of PUBLIC_FORBIDDEN) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const mobileDiag = await page.locator("body").innerText();
    for (const marker of DIAGNOSTICS_REQUIRED) {
      assertContains(mobileDiag, marker, "diagnostics mobile");
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const desktopDiag = await page.locator("body").innerText();
    for (const marker of DIAGNOSTICS_REQUIRED) {
      assertContains(desktopDiag, marker, "diagnostics desktop");
    }

    console.log("PASS: verify:stage3b-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
