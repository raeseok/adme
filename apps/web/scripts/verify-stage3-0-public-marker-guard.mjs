/**
 * Stage 3-0 — stage30 machine markers only on /admin/diagnostics, not public routes
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_ROUTES = [
  "/",
  "/consumer",
  "/consumer/profile",
  "/consumer/ads",
  "/advertiser",
  "/partner",
  "/admin",
  "/auth/login",
];

const PUBLIC_FORBIDDEN = [
  "stage30",
  "stage3-0-supabase-ledger-safety-readiness-production",
  "stage30PointLedgerActualMutationEnabled",
  "stage30CurrentSupabaseProjectRef",
  "stage30ReadinessStatus",
];

const DIAGNOSTICS_REQUIRED = [
  "stage30Build=stage3-0-supabase-ledger-safety-readiness-production",
  "stage30CurrentSupabaseProjectRef=",
  "stage30DevProdSupabaseSeparated=",
  "stage30ReadinessStatus=",
  "stage30PointLedgerActualMutationEnabled=false",
  "stage30PointLedgerMutation=false",
  "stage30CampaignBudgetMutation=false",
  "stage30QuizAnswerClientExposure=false",
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
  console.log(`PASS: ${label} — contains "${needle}"`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();

    for (const route of PUBLIC_ROUTES) {
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

    console.log("PASS: verify:stage3-0-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
