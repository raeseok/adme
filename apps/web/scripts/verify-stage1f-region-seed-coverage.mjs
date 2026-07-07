/**
 * Stage 1-F — region seed coverage verification (Production diagnostics + counts)
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
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/admin/diagnostics`, { waitUntil: "networkidle" });
  const body = await page.locator("body").innerText();

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

  for (const m of markers) assertContains(body, m, "diagnostics");

  const coverageMatch = body.match(/stage1FRegionSeedCoverage=(\w+)/);
  const coverage = coverageMatch?.[1] ?? "";
  if (!["full", "adequate"].includes(coverage)) {
    throw new Error(`coverage expected full|adequate, got ${coverage}`);
  }
  console.log(`PASS: stage1FRegionSeedCoverage=${coverage}`);

  const sido = Number(body.match(/stage1FSidoCount=(\d+)/)?.[1] ?? 0);
  const sigungu = Number(body.match(/stage1FSigunguCount=(\d+)/)?.[1] ?? 0);
  const dong = Number(body.match(/stage1FDongCount=(\d+)/)?.[1] ?? 0);

  if (sido < 16) throw new Error(`sido count low: ${sido}`);
  if (sigungu < 250) throw new Error(`sigungu count low: ${sigungu}`);
  if (dong < 3000) throw new Error(`dong count low: ${dong}`);
  console.log(`PASS: counts sido=${sido} sigungu=${sigungu} dong=${dong}`);

  for (const route of ["/", "/consumer", "/consumer/profile", "/auth/login"]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
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
