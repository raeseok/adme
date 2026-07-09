/**
 * Stage 3-E — Production reward actual mutation remains blocked.
 * This check is diagnostics/read-only and does not submit reward RPC calls.
 */
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";

const BASE = resolveProductionE2eBaseUrl();

async function main() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(
    sources.combined,
    [
      "stage3EProductionRewardOpen=false",
      "stage3EKillSwitch=true",
      "stage3EControlledAllowlistActive=false",
      "stage3EProductionRewardMutation=false",
      "stage3EProductionPointLedgerMutation=false",
      "stage3EProductionCampaignBudgetMutation=false",
      "stage3EProductionUsersBalanceMutation=false",
      "stage3EProductionAdViewsMutation=false",
      "stage3EProductionPartnerSettlementsMutation=false",
      "stage3EProductionCashOutMutation=false",
      "stage3EStage3BProductionBlockMaintained=true",
      "stage3EStage3CProductionBlockMaintained=true",
      "stage3EMutationBlockedByFlags=true",
    ],
    "Stage 3-E Production blocked markers",
  );

  const ref = extractMarkerValue(sources.combined, "stage3ECurrentSupabaseProjectRef");
  if (ref !== "vupsalteyltjqumppltc") {
    throw new Error(`Production Supabase ref mismatch: ${ref}`);
  }

  console.log("RESULT: productionRewardMutation=false");
  console.log("RESULT: productionPointLedgerMutation=false");
  console.log("RESULT: productionCampaignBudgetMutation=false");
  console.log("RESULT: productionUsersBalanceMutation=false");
  console.log("RESULT: productionAdViewsMutation=false");
  console.log("RESULT: productionPartnerSettlementsMutation=false");
  console.log("RESULT: productionCashOutMutation=false");
  console.log("PASS: verify:stage3e-production-blocked");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
