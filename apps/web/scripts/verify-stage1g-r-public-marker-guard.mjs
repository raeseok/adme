/**
 * Stage 1-G-R — stage1GR machine markers only on /admin/diagnostics
 */
import { chromium } from "playwright";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

const PUBLIC_FORBIDDEN = [
  "stage1GRBuild=",
  "stage1GRProductionCommitMatchesRepoHead=",
  "stage1GRBasicProfileFields=",
  "stage1GROptionalProfileFields=",
  "stage1GRBasicFields=",
  "stage1GROptionalFields=",
  "stage1GROptionalCopyVisible=",
  "stage1GROptionalCopyLocation=",
  "stage1GRPointLedgerMutation=",
  "stage1GRPublicMarkerExposed=",
  "stage1GRDeployCommit=",
];

const DIAGNOSTICS_REQUIRED = [
  "stage1GRBuild=stage1g-r-profile-basic-optional-sections-production",
  "stage1GRProductionCommitMatchesRepoHead=true",
  "stage1GRBasicProfileFields=true",
  "stage1GROptionalProfileFields=true",
  "stage1GRBasicFields=birth_year,gender,residential_region",
  "stage1GROptionalFields=child_birth_years,pet_types,activity_regions,interest_categories",
  "stage1GROptionalCopyVisible=true",
  "stage1GROptionalCopyLocation=optional_profile_section",
  "stage1GRPointLedgerMutation=false",
  "stage1GRPublicMarkerExposed=false",
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

    console.log("PASS: verify:stage1g-r-public-marker-guard");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
