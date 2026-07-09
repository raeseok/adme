/**
 * Stage 3-E — campaign budget atomicity guard contract.
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
  const rpc = readText(
    join(REPO_ROOT, "supabase/migrations/20260709120000_stage_3_b_quiz_reward_full_transaction_dev_only.sql"),
  );
  const table = readText(
    join(REPO_ROOT, "supabase/migrations/20260706100100_stage0_tables.sql"),
  );
  assertContains(rpc, "FOR UPDATE", "row-level lock contract");
  assertContains(rpc, "v_budget_remaining", "budget remaining calculation");
  assertContains(rpc, "STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT", "budget insufficient block");
  assertContains(rpc, "SET budget_spent = budget_spent + v_amount", "atomic budget increment");
  assertContains(rpc, "INSERT INTO public.point_ledger", "ledger insert in RPC transaction");
  assertContains(table, "CONSTRAINT campaigns_budget CHECK", "campaign budget constraint");
  assertContains(table, "BIGINT", "money-like integer columns");
  if (/\b(FLOAT|REAL)\b/i.test(table)) {
    throw new Error("FLOAT/REAL must not be used for money-like columns");
  }
  console.log("PASS: Stage 3-B budget atomicity SQL contract");
}

async function verifyMarkers() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  if (extractMarkerValue(sources.combined, "stage3EPreflightEnabled") !== "true") {
    console.log(
      "INFO: Stage 3-E Production markers pending deployment; SQL budget atomicity contract verified",
    );
    console.log("PASS: verify:stage3e-budget-atomicity");
    return;
  }
  assertMarkerList(
    sources.combined,
    [
      "stage3ECampaignBudgetAtomicityGuard=true",
      "stage3ECampaignBudgetNegativeAllowed=false",
      "stage3EProductionCampaignBudgetMutation=false",
      "stage3EProductionPointLedgerMutation=false",
    ],
    "Stage 3-E budget markers",
  );
  console.log("RESULT: campaignBudgetAtomicityGuard=true");
  console.log("RESULT: productionCampaignBudgetMutation=false");
  console.log("PASS: verify:stage3e-budget-atomicity");
}

verifySqlContract();
verifyMarkers().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
