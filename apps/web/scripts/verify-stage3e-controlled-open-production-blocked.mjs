/**
 * Stage 3-E-Controlled-Open-Approval — Production remains blocked.
 * This script is read-only and does not call reward mutation endpoints.
 */
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { verifyApprovalSourceContract } from "./utils/stage3e-controlled-open-approval-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const BLOCKED_MARKERS = [
  "stage3EActualOpenExecuted=false",
  "stage3EProductionRewardOpenFlag=false",
  "stage3ERewardKillSwitch=true",
  "stage3EControlledAllowlistActive=false",
  "stage3ECashOutProcessing=false",
  "stage3EPartnerSettlementProcessing=false",
  "stage3EStage3BProductionBlockPreserved=true",
  "stage3EStage3CProductionRewardBlockPreserved=true",
  "stage3EProductionRewardMutation=false",
  "stage3EProductionPointLedgerMutation=false",
  "stage3EProductionCampaignBudgetMutation=false",
  "stage3EProductionUsersBalanceMutation=false",
  "stage3EProductionAdViewsMutation=false",
  "stage3EProductionPartnerSettlementsMutation=false",
  "stage3EProductionCashOutMutation=false",
  "stage3EMutationBlockedByFlags=true",
];

async function main() {
  verifyApprovalSourceContract();
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, BLOCKED_MARKERS, "controlled open blocked");
  console.log("RESULT: productionRewardOpenFlag=false");
  console.log("RESULT: rewardKillSwitch=true");
  console.log("RESULT: controlledAllowlistActive=false");
  console.log("RESULT: productionRewardMutation=false");
  console.log("PASS: verify:stage3e-controlled-open-production-blocked");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
