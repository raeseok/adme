/**
 * Stage 1-F-R — MOIS 2026.7.1 source alignment verification
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertNoStageMarkers } from "./e2e/region-hierarchy-helpers.mjs";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = resolveProductionE2eBaseUrl();

async function main() {
  const moisManifest = JSON.parse(
    await readFile(path.join(__dirname, "regions/source/mois-source-manifest.json"), "utf8"),
  );
  const testManifest = JSON.parse(
    await readFile(path.join(__dirname, "regions/source/stage1f-r-test-manifest.json"), "utf8"),
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const { combined } = await loadDiagnosticsFromHttp(BASE);

  const markers = [
    "Stage 1-F-R MOIS Region Source Alignment",
    "stage-1-f-r-mois-region-source-alignment",
    "stage1FCanonicalRegionSource=mois-admin-dong",
    "stage1FSourceKind=mois-kikcd-h",
    "stage1FSourceEffectiveDate=2026-07-01",
    `stage1FSourceSha256=${moisManifest.sha256.slice(0, 12)}`,
    "stage1FAdminDongSourceApplied=true",
    "stage1FLegalDongMappingSourceApplied=true",
    "stage1FMolitLegalDongBaselinePreserved=true",
    "stage1FExistingRegionIdsPreserved=true",
    "stage1FConsumerRegionReferencesValid=true",
    "stage1FOrphanRegionCount=0",
    "stage1FDuplicateSiblingPathCount=0",
    "stage1FDevProdSupabaseSeparated=false",
    "stage1FRlsReadOnlySelectPolicyAdded=true",
    "stage1FAnonWritePolicyAdded=false",
    "stage1FPublicDebugMarker=false",
    "stage1FServiceRoleUsed=false",
    "stage1FPointLedgerMutation=false",
    "stage1FQuizAnswerAccess=false",
    "stage1FDbResetExecuted=false",
    "stage1FDestructiveReset=false",
  ];

  assertMarkerList(combined, markers, "diagnostics");

  const coverage = extractMarkerValue(combined, "stage1FRegionSeedCoverage");
  if (coverage !== "full") {
    throw new Error(`stage1FRegionSeedCoverage expected full, got ${coverage || "missing"}`);
  }
  console.log("PASS: stage1FRegionSeedCoverage=full");

  const molitBaseline = extractMarkerValue(combined, "stage1FMolitLegalDongBaselinePreserved");
  if (molitBaseline !== "true") {
    throw new Error(
      `stage1FMolitLegalDongBaselinePreserved expected true, got ${molitBaseline || "missing"}`,
    );
  }
  console.log("PASS: stage1FMolitLegalDongBaselinePreserved=true");

  const sido = Number(extractMarkerValue(combined, "stage1FSidoCount") || 0);
  const sigungu = Number(extractMarkerValue(combined, "stage1FSigunguCount") || 0);
  const dong = Number(extractMarkerValue(combined, "stage1FDongCount") || 0);
  if (sido < 16) throw new Error(`canonical sido low: ${sido}`);
  if (sigungu < 250) throw new Error(`canonical sigungu low: ${sigungu}`);
  if (dong < 3000) throw new Error(`canonical dong low: ${dong}`);
  console.log(`PASS: canonical counts sido=${sido} sigungu=${sigungu} dong=${dong}`);

  if (!testManifest.changeChecks?.jeonnamGwangjuUnified?.applied) {
    throw new Error("parser manifest: 전남광주통합특별시 not applied");
  }
  console.log("PASS: change check — 전남광주통합특별시");

  for (const route of ["/", "/consumer", "/consumer/profile", "/auth/login"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    await assertNoStageMarkers(page, `public ${route}`);
    const pub = await page.locator("body").innerText();
    if (pub.includes("stage-1-f-r-mois-region-source-alignment")) {
      throw new Error(`public ${route} exposes stage1FR marker`);
    }
  }

  await browser.close();
  console.log("PASS: verify:stage1f-r-mois-source");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
