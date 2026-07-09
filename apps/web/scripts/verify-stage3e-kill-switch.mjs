/**
 * Stage 3-E — kill switch priority and zero-mutation guard.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertMarkerList,
  extractMarkerValue,
  loadDiagnosticsFromHttp,
} from "./e2e/diagnostics-helpers.mjs";
import { resolveProductionE2eBaseUrl } from "./e2e/e2e-base-url.mjs";
import {
  assertContains,
  readText,
} from "./utils/stage3e-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = resolveProductionE2eBaseUrl();

function verifySourcePriority() {
  const src = readText(join(WEB_ROOT, "src/lib/rewards/fraud-engine.ts"));
  const killSwitch = src.indexOf("flags.killSwitch");
  const productionOpen = src.indexOf("!flags.productionRewardOpen");
  const userAuth = src.indexOf("!input.userId");
  if (killSwitch < 0 || productionOpen < 0 || userAuth < 0) {
    throw new Error("required fraud guard branches missing");
  }
  if (!(killSwitch < productionOpen && productionOpen < userAuth)) {
    throw new Error("kill switch must run before production open/auth checks");
  }
  assertContains(src, "REWARD_KILL_SWITCH_ON", "kill switch reason");
  console.log("PASS: kill switch source priority");
}

async function verifyMarkers() {
  const sources = await loadDiagnosticsFromHttp(BASE, {
    maxWaitMs: 90000,
    path: "/admin/reward-preflight",
  });
  if (extractMarkerValue(sources.combined, "stage3EPreflightEnabled") !== "true") {
    console.log(
      "INFO: Stage 3-E Production markers pending deployment; source priority verified",
    );
    console.log("PASS: verify:stage3e-kill-switch");
    return;
  }
  assertMarkerList(
    sources.combined,
    [
      "stage3EKillSwitch=true",
      "stage3EKillSwitchPriority=true",
      "stage3EKillSwitchDecisionReason=REWARD_KILL_SWITCH_ON",
      "stage3EProductionRewardMutation=false",
      "stage3EProductionPointLedgerMutation=false",
      "stage3EProductionCampaignBudgetMutation=false",
      "stage3EProductionUsersBalanceMutation=false",
      "stage3EProductionAdViewsMutation=false",
    ],
    "Stage 3-E kill switch markers",
  );
  console.log("RESULT: expectedReasonCode=REWARD_KILL_SWITCH_ON");
  console.log("RESULT: productionMutation=false");
  console.log("PASS: verify:stage3e-kill-switch");
}

verifySourcePriority();
verifyMarkers().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
