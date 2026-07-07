/**
 * Stage 1-F-R — MOIS 2026.7.1 source alignment verification
 */
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertNoStageMarkers } from "./e2e/region-hierarchy-helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.ADME_E2E_BASE_URL ?? "https://web-ashen-xi-52.vercel.app";

function assertContains(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`${label}: missing "${needle}"`);
  console.log(`PASS: ${label} — ${needle}`);
}

async function main() {
  const moisManifest = JSON.parse(
    await readFile(path.join(__dirname, "regions/source/mois-source-manifest.json"), "utf8"),
  );
  const testManifest = JSON.parse(
    await readFile(path.join(__dirname, "regions/source/stage1f-r-test-manifest.json"), "utf8"),
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();

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

  for (const m of markers) assertContains(body, m, "diagnostics");

  const coverage = body.match(/stage1FRegionSeedCoverage=(\w+)/)?.[1] ?? "";
  if (coverage !== "full") {
    throw new Error(`stage1FRegionSeedCoverage expected full, got ${coverage}`);
  }
  console.log("PASS: stage1FRegionSeedCoverage=full");

  const sido = Number(body.match(/stage1FSidoCount=(\d+)/)?.[1] ?? 0);
  const sigungu = Number(body.match(/stage1FSigunguCount=(\d+)/)?.[1] ?? 0);
  const dong = Number(body.match(/stage1FDongCount=(\d+)/)?.[1] ?? 0);
  if (sido < 16) throw new Error(`canonical sido low: ${sido}`);
  if (sigungu < 250) throw new Error(`canonical sigungu low: ${sigungu}`);
  if (dong < 3000) throw new Error(`canonical dong low: ${dong}`);
  console.log(`PASS: canonical counts sido=${sido} sigungu=${sigungu} dong=${dong}`);

  if (!testManifest.changeChecks?.jeonnamGwangjuUnified?.applied) {
    throw new Error("parser manifest: 전남광주통합특별시 not applied");
  }
  console.log("PASS: change check — 전남광주통합특별시");

  for (const route of ["/", "/consumer", "/consumer/profile", "/auth/login"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
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
