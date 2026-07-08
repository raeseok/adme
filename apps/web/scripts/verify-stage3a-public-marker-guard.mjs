/**
 * Stage 3-A — machine markers only on /admin/diagnostics
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_FORBIDDEN = [
  "stage3ABuild=",
  "stage3AEnabled=",
  "stage3ADevOnlyMutation=",
  "stage3AProductionMutationBlocked=",
  "stage3APointLedgerAppendOnly=",
  "stage3AIdempotencyUnique=",
  "stage3AServiceRoleClientExposure=",
  "stage3AQuizAnswerExposure=",
  "stage3AProdPointLedgerMutation=",
  "stage3ARpcName=",
  "stage3ADeployCommit=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage3ABuild=stage3a-point-ledger-dev-dry-run-production",
  "stage3AEnabled=true",
  "stage3ADevOnlyMutation=true",
  "stage3AProductionMutationBlocked=true",
  "stage3APointLedgerAppendOnly=true",
  "stage3AIdempotencyUnique=true",
  "stage3AServiceRoleClientExposure=false",
  "stage3AQuizAnswerExposure=false",
  "stage3AProdPointLedgerMutation=false",
  "stage3APublicMarkerExposed=false",
  "stage3ARpcName=rpc_stage3a_dev_record_quiz_reward_dry_run",
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

    console.log("PASS: verify:stage3a-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
