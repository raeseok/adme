/**
 * Stage 3-E-Controlled-Open-Approval — no actual mutation contract.
 * Read-only/static + Production marker verification only.
 */
import {
  assertMarkerList,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import { assertContains, assertNotContains, readText } from "./utils/stage3e-helpers.mjs";
import {
  WEB_ROOT,
  verifyApprovalSourceContract,
} from "./utils/stage3e-controlled-open-approval-helpers.mjs";
import { join } from "node:path";

const BASE = resolveProductionE2eBaseUrl();

const NO_MUTATION_MARKERS = [
  "stage3EProductionRewardMutation=false",
  "stage3EProductionPointLedgerMutation=false",
  "stage3EProductionCampaignBudgetMutation=false",
  "stage3EProductionUsersBalanceMutation=false",
  "stage3EProductionAdViewsMutation=false",
  "stage3EProductionPartnerSettlementsMutation=false",
  "stage3EProductionCashOutMutation=false",
  "stage3ECashOutProcessing=false",
  "stage3EPartnerSettlementProcessing=false",
];

function verifySourceNoExecutionPath() {
  const approval = readText(
    join(WEB_ROOT, "src/lib/rewards/stage3e-controlled-open-approval.ts"),
  );
  assertContains(
    approval,
    "stage3EActualOpenExecuted: false",
    "actual open not executed source",
  );
  assertNotContains(approval, ".insert(", "approval SSOT insert-free");
  assertNotContains(approval, ".update(", "approval SSOT update-free");
  assertNotContains(approval, ".delete(", "approval SSOT delete-free");
  assertNotContains(approval, ".rpc(", "approval SSOT rpc-free");
}

async function main() {
  verifyApprovalSourceContract();
  verifySourceNoExecutionPath();
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(sources.combined, NO_MUTATION_MARKERS, "no mutation markers");
  console.log("RESULT: productionPointLedgerActualMutation=false");
  console.log("RESULT: productionCampaignBudgetMutation=false");
  console.log("RESULT: productionUsersBalanceMutation=false");
  console.log("RESULT: productionAdViewsRewardResultMutation=false");
  console.log("RESULT: productionPartnerSettlementsMutation=false");
  console.log("RESULT: productionCashOutMutation=false");
  console.log("PASS: verify:stage3e-controlled-open-no-mutation");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
