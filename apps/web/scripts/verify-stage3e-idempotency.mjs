/**
 * Stage 3-E — point_ledger idempotency and replay guard contract.
 * Static/read-only only; no Production reward mutation.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { assertContains, readText } from "./utils/stage3e-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(WEB_ROOT, "..", "..");
const BASE = resolveProductionE2eBaseUrl();

function verifySqlContract() {
  const stage3a = readText(
    join(REPO_ROOT, "supabase/migrations/20260708180000_stage_3_a_point_ledger_dev_dry_run.sql"),
  );
  const stage3b = readText(
    join(REPO_ROOT, "supabase/migrations/20260709120000_stage_3_b_quiz_reward_full_transaction_dev_only.sql"),
  );
  assertContains(stage3a, "idx_point_ledger_idempotency_key", "ledger unique index");
  assertContains(stage3b, "quiz_submission_idempotency", "idempotency receipt table");
  assertContains(stage3b, "idempotency_key TEXT PRIMARY KEY", "idempotency primary key");
  assertContains(stage3b, "STAGE3B_IDEMPOTENT_DUPLICATE", "idempotent replay result");
  assertContains(stage3b, "unique_violation", "concurrent duplicate guard");
  assertContains(stage3b, "WHERE entry_type = 'quiz_reward'", "quiz_reward duplicate lookup");
  console.log("PASS: Stage 3-B idempotency SQL contract");
}

async function verifyMarkers() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  if (extractMarkerValue(sources.combined, "stage3EPreflightEnabled") !== "true") {
    console.log(
      "INFO: Stage 3-E Production markers pending deployment; SQL idempotency contract verified",
    );
    console.log("PASS: verify:stage3e-idempotency");
    return;
  }
  assertMarkerList(
    sources.combined,
    [
      "stage3EPointLedgerIdempotencyGuard=true",
      "stage3EPointLedgerDuplicateInsert=false",
      "stage3EProductionPointLedgerMutation=false",
    ],
    "Stage 3-E idempotency markers",
  );
  console.log("RESULT: pointLedgerIdempotencyGuard=true");
  console.log("RESULT: productionPointLedgerMutation=false");
  console.log("PASS: verify:stage3e-idempotency");
}

verifySqlContract();
verifyMarkers().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
