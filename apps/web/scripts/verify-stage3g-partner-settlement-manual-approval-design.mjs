/**
 * Stage 3-G Partner Settlement Manual Approval Design verification.
 * Read-only Production marker/public guard verification only.
 */
import { chromium } from "playwright";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { assertNotContains } from "./utils/stage3e-helpers.mjs";
import {
  STAGE3G_PUBLIC_FORBIDDEN_MARKERS,
  STAGE3G_PUBLIC_FORBIDDEN_VISIBLE_STRINGS,
  STAGE3G_REQUIRED_MARKERS,
  STAGE3G_REQUIRED_VISIBLE_STRINGS,
  expectedDeployCommit,
  verifyStage3GSourceContract,
} from "./utils/stage3g-partner-settlement-design-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const ADMIN_MARKER_ROUTES = [
  "/admin/reward-preflight",
  "/admin/diagnostics",
  "/admin/partner-settlement-preflight",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer",
  "/consumer/profile",
  "/consumer/ads",
];

async function loadRouteHtml(path, maxWaitMs = 90000) {
  const deadline = Date.now() + maxWaitMs;
  let lastHtml = "";

  while (Date.now() < deadline) {
    const response = await fetch(`${BASE}${path}`);
    if (!response.ok) {
      throw new Error(`${path} HTTP ${response.status}`);
    }
    lastHtml = (await response.text()).replace(/<!--\s*-->/g, "");
    if (lastHtml.includes("stage3GPartnerSettlementManualApprovalDesign")) {
      return { combined: lastHtml };
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return { combined: lastHtml };
}

async function loadAdminMarkers(path) {
  if (path === "/admin/partner-settlement-preflight") {
    return loadRouteHtml(path);
  }
  return loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path,
  });
}

async function verifyAdminPath(path) {
  const sources = await loadAdminMarkers(path);
  assertMarkerList(
    sources.combined,
    STAGE3G_REQUIRED_MARKERS,
    `${path} Stage 3-G markers`,
  );
  assertMarkerList(
    sources.combined,
    STAGE3G_REQUIRED_VISIBLE_STRINGS,
    `${path} Stage 3-G visible strings`,
  );

  const commit = extractMarkerValue(sources.combined, "stage3GDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3GDeployCommit=${commit}`);
}

async function verifyPublicRoutes() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const route of PUBLIC_ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();

      for (const marker of STAGE3G_PUBLIC_FORBIDDEN_MARKERS) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
      for (const marker of STAGE3G_PUBLIC_FORBIDDEN_VISIBLE_STRINGS) {
        assertNotContains(body, marker, `public visible text ${route}`);
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  verifyStage3GSourceContract();

  for (const path of ADMIN_MARKER_ROUTES) {
    await verifyAdminPath(path);
  }

  await verifyPublicRoutes();

  console.log("RESULT: stage3GPartnerSettlementManualApprovalDesign=true");
  console.log("RESULT: stage3GPartnerSettlementActualProcessing=false");
  console.log("RESULT: stage3GPartnerSettlementMutation=false");
  console.log("RESULT: stage3GMonthlyCloseBatch=false");
  console.log("RESULT: stage3GPartnerSettlementAutoPayout=false");
  console.log("RESULT: stage3GAdvertiserPartnerAttributionLocked=true");
  console.log("RESULT: stage3GDynamicPartnerLookupAllowed=false");
  console.log("RESULT: stage3GQuizPassPartnerShareCalculation=false");
  console.log("RESULT: stage3GMonthlyCloseRequired=true");
  console.log("RESULT: stage3GNextMonthPayoutDay=15");
  console.log("RESULT: stage3GShareRateSnapshotRequired=true");
  console.log("RESULT: stage3GSettlementUniqueKeyRequired=true");
  console.log("RESULT: stage3GSettlementStatusMachineRequired=true");
  console.log("RESULT: stage3GPaidUpdateBlockedRequired=true");
  console.log("RESULT: stage3GChargebackNextMonthRequired=true");
  console.log("RESULT: stage3GPartnerTerminationStatusRequired=true");
  console.log("RESULT: stage3GAdvertiserPartnerIdNullAllowed=false");
  console.log("RESULT: productionRewardOpenFlag=false");
  console.log("RESULT: rewardKillSwitch=true");
  console.log("RESULT: controlledAllowlistActive=false");
  console.log("RESULT: productionRewardMutation=false");
  console.log("RESULT: productionPointLedgerMutation=false");
  console.log("RESULT: productionCampaignBudgetMutation=false");
  console.log("RESULT: productionUsersBalanceMutation=false");
  console.log("RESULT: productionAdViewsMutation=false");
  console.log("RESULT: productionPartnerSettlementsMutation=false");
  console.log("RESULT: productionCashRedemptionRequestsMutation=false");
  console.log("RESULT: monthlyCloseBatch=false");
  console.log("RESULT: partnerPayoutAction=false");
  console.log("RESULT: dbMigration=false");
  console.log("RESULT: actualSettlementRpc=false");
  console.log("RESULT: paidUpdateTriggerMigration=false");
  console.log("RESULT: publicMarkerExposed=false");
  console.log("PASS: verify:stage3g-partner-settlement-design");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
