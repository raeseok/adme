/**
 * Stage 3-F Cash-out Manual Approval Design verification.
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
  STAGE3F_PUBLIC_FORBIDDEN_MARKERS,
  STAGE3F_PUBLIC_FORBIDDEN_VISIBLE_STRINGS,
  STAGE3F_REQUIRED_MARKERS,
  expectedDeployCommit,
  verifyStage3FSourceContract,
} from "./utils/stage3f-cash-out-design-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const ADMIN_MARKER_ROUTES = [
  "/admin/reward-preflight",
  "/admin/diagnostics",
  "/admin/cash-out-preflight",
];

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/consumer/profile",
  "/consumer/ads",
  "/consumer",
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
    if (lastHtml.includes("stage3FCashOutManualApprovalDesign")) {
      return { combined: lastHtml };
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return { combined: lastHtml };
}

async function loadAdminMarkers(path) {
  if (path === "/admin/cash-out-preflight") {
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
    STAGE3F_REQUIRED_MARKERS,
    `${path} Stage 3-F markers`,
  );

  const commit = extractMarkerValue(sources.combined, "stage3FDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(`${path} deploy commit mismatch: expected ${expected}, got ${commit}`);
  }
  console.log(`RESULT: ${path} stage3FDeployCommit=${commit}`);
}

async function verifyPublicRoutes() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    for (const route of PUBLIC_ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      const html = await page.content();
      const body = await page.locator("body").innerText();

      for (const marker of STAGE3F_PUBLIC_FORBIDDEN_MARKERS) {
        assertNotContains(body, marker, `public body ${route}`);
        assertNotContains(html, marker, `public html ${route}`);
      }
      for (const marker of STAGE3F_PUBLIC_FORBIDDEN_VISIBLE_STRINGS) {
        assertNotContains(body, marker, `public visible text ${route}`);
      }
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  verifyStage3FSourceContract();

  for (const path of ADMIN_MARKER_ROUTES) {
    await verifyAdminPath(path);
  }

  await verifyPublicRoutes();

  console.log("RESULT: stage3FCashOutManualApprovalDesign=true");
  console.log("RESULT: stage3FCashOutActualProcessing=false");
  console.log("RESULT: stage3FCashOutMutation=false");
  console.log("RESULT: stage3FCashOutAutoTransfer=false");
  console.log("RESULT: stage3FCashOutDeleteRollbackAllowed=false");
  console.log("RESULT: stage3FCashOutAdjustmentReversalRequired=true");
  console.log("RESULT: stage3FCashOutMinAmount=10000");
  console.log("RESULT: productionRewardOpenFlag=false");
  console.log("RESULT: rewardKillSwitch=true");
  console.log("RESULT: controlledAllowlistActive=false");
  console.log("RESULT: productionRewardMutation=false");
  console.log("RESULT: productionPointLedgerMutation=false");
  console.log("RESULT: productionCampaignBudgetMutation=false");
  console.log("RESULT: productionUsersBalanceMutation=false");
  console.log("RESULT: productionAdViewsMutation=false");
  console.log("RESULT: productionPartnerSettlementsMutation=false");
  console.log("RESULT: productionCashOutMutation=false");
  console.log("RESULT: productionCashRedemptionRequestsMutation=false");
  console.log("RESULT: publicMarkerExposed=false");
  console.log("PASS: verify:stage3f-cash-out-design");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exitCode = 1;
});
