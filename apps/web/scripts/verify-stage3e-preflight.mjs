/**
 * Stage 3-E — runtime fraud engine controlled open preflight.
 * Read-only/static + diagnostics marker verification only.
 */
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3E_REASON_CODES,
  STAGE3E_REQUIRED_MARKERS,
  assertContains,
  readText,
} from "./utils/stage3e-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

function expectedDeployCommit() {
  return execSync("git rev-parse --short HEAD", {
    cwd: join(WEB_ROOT, "..", ".."),
    encoding: "utf8",
  }).trim();
}

function verifySource() {
  const fraud = readText(join(WEB_ROOT, "src/lib/rewards/fraud-engine.ts"));
  const guards = readText(join(WEB_ROOT, "src/lib/rewards/reward-guards.ts"));
  const diagnostics = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3e-diagnostics.ts"),
  );

  assertContains(fraud, 'import "server-only"', "fraud engine server-only");
  assertContains(guards, 'import "server-only"', "reward guards server-only");
  assertContains(diagnostics, 'import "server-only"', "stage3e diagnostics server-only");
  for (const code of STAGE3E_REASON_CODES) {
    assertContains(fraud, code, "fraud reason code source");
  }
  assertContains(guards, "pointLedgerMutation: false", "mutation guard");
  assertContains(guards, "campaignBudgetMutation: false", "budget mutation guard");
  assertContains(guards, "cashOutMutation: false", "cash_out blocked");
  assertContains(guards, "partnerSettlementsMutation: false", "settlements blocked");
}

async function verifyProductionMarkers() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, STAGE3E_REQUIRED_MARKERS, "Stage 3-E markers");

  const commit = extractMarkerValue(sources.combined, "stage3EDeployCommit");
  const expected = expectedDeployCommit();
  if (commit !== expected) {
    throw new Error(
      `Production deploy commit mismatch: expected ${expected}, got ${commit}`,
    );
  }
  console.log(`RESULT: productionDeployCommit=${commit}`);
  console.log("RESULT: productionSupabaseRef=vupsalteyltjqumppltc");
  console.log("RESULT: productionRewardOpen=false");
  console.log("RESULT: killSwitch=true");
  console.log("PASS: verify:stage3e-preflight");
}

verifySource();
verifyProductionMarkers().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
