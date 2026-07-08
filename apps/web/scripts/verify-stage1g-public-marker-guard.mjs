/**
 * Stage 1-G — stage1G machine markers only on /admin/diagnostics
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_FORBIDDEN = [
  "stage1GBuild=",
  "stage1GChildBirthYearFields=",
  "stage1GPetConditionFields=",
  "stage1GProfileActiveRequestCopy=",
  "stage1GPointLedgerMutation=",
  "stage1GPublicMarkerExposed=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage1GBuild=stage1g-child-pet-profile-ux-production",
  "stage1GChildBirthYearFields=true",
  "stage1GPetConditionFields=true",
  "stage1GProfileActiveRequestCopy=true",
  "stage1GPointLedgerMutation=false",
  "stage1GPublicMarkerExposed=false",
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

    await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
    const diag = await page.locator("body").innerText();
    for (const marker of DIAGNOSTICS_REQUIRED) {
      assertContains(diag, marker, "diagnostics");
    }

    console.log("PASS: verify:stage1g-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
