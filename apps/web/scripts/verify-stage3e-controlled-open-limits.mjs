/**
 * Stage 3-E-Controlled-Open-Approval — controlled open limit guard.
 */
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  STAGE3E_APPROVAL_REQUIRED_MARKERS,
  verifyApprovalSourceContract,
} from "./utils/stage3e-controlled-open-approval-helpers.mjs";

const BASE = resolveProductionE2eBaseUrl();

const LIMITS = {
  stage3EControlledMaxUsers: 2,
  stage3EControlledMaxCampaigns: 1,
  stage3EControlledMaxRewardCountPerUser: 1,
  stage3EControlledMaxRewardAmountPerUser: 500,
  stage3EControlledMaxTotalRewardAmount: 1000,
};

function assertLimit(combined, markerName, max) {
  const raw = extractMarkerValue(combined, markerName);
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) {
    throw new Error(`${markerName}: not numeric (${raw})`);
  }
  if (value > max) {
    throw new Error(`${markerName}: expected <= ${max}, got ${value}`);
  }
  console.log(`PASS: ${markerName}=${value} <= ${max}`);
}

async function main() {
  verifyApprovalSourceContract();
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  assertMarkerList(
    sources.combined,
    STAGE3E_APPROVAL_REQUIRED_MARKERS,
    "controlled limits markers",
  );
  for (const [markerName, max] of Object.entries(LIMITS)) {
    assertLimit(sources.combined, markerName, max);
  }
  console.log("RESULT: controlledOpenMaxUsers=2");
  console.log("RESULT: controlledOpenMaxCampaigns=1");
  console.log("RESULT: controlledOpenMaxRewardCountPerUser=1");
  console.log("RESULT: controlledOpenMaxRewardAmountPerUser=500");
  console.log("RESULT: controlledOpenMaxTotalRewardAmount=1000");
  console.log("PASS: verify:stage3e-controlled-open-limits");
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
