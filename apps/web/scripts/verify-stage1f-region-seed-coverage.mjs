/**
 * Stage 1-F — region seed coverage verification (Production diagnostics + counts)
 */
import { chromium } from "playwright";
import { assertNoStageMarkers } from "./e2e/region-hierarchy-helpers.mjs";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const { combined } = await loadDiagnosticsFromHttp(BASE);

  const markers = [
    "Stage 1-F-R MOIS Region Source Alignment",
    "stage-1-f-r-mois-region-source-alignment",
    "stage1FCanonicalRegionSource=mois-admin-dong",
    "stage1FRegionTreeStructure=parent-id",
    "stage1FSourceKind=mois-kikcd-h",
    "stage1FSourceEffectiveDate=2026-07-01",
    "stage1FExistingRegionIdsPreserved=true",
    "stage1FConsumerRegionReferencesValid=true",
    "stage1FOrphanRegionCount=0",
    "stage1FDuplicateSiblingPathCount=0",
    "stage1FPublicDebugMarker=false",
    "stage1FServiceRoleUsed=false",
    "stage1FPointLedgerMutation=false",
    "stage1FQuizAnswerAccess=false",
    "stage1FDbResetExecuted=false",
    "stage1FDestructiveReset=false",
  ];

  assertMarkerList(combined, markers, "diagnostics");

  const coverage = extractMarkerValue(combined, "stage1FRegionSeedCoverage");
  if (!["full", "adequate"].includes(coverage)) {
    throw new Error(`coverage expected full|adequate, got ${coverage || "missing"}`);
  }
  console.log(`PASS: stage1FRegionSeedCoverage=${coverage}`);

  const sido = Number(extractMarkerValue(combined, "stage1FSidoCount") || 0);
  const sigungu = Number(extractMarkerValue(combined, "stage1FSigunguCount") || 0);
  const dong = Number(extractMarkerValue(combined, "stage1FDongCount") || 0);

  if (sido < 16) throw new Error(`sido count low: ${sido}`);
  if (sigungu < 250) throw new Error(`sigungu count low: ${sigungu}`);
  if (dong < 3000) throw new Error(`dong count low: ${dong}`);
  console.log(`PASS: counts sido=${sido} sigungu=${sigungu} dong=${dong}`);

  for (const route of ["/", "/consumer", "/consumer/profile", "/auth/login"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    await assertNoStageMarkers(page, `public ${route}`);
    const pub = await page.locator("body").innerText();
    if (pub.includes("stage1F")) {
      throw new Error(`public ${route} exposes stage1F marker`);
    }
  }
  console.log("PASS: public stage1F marker not exposed");

  await browser.close();
  console.log("PASS: verify:stage1f-region-seed-coverage");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
