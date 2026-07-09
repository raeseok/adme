/**
 * Stage 3-E — fraud engine source contract.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE3E_REASON_CODES,
  assertContains,
  readText,
} from "./utils/stage3e-helpers.mjs";

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const fraud = readText(join(WEB_ROOT, "src/lib/rewards/fraud-engine.ts"));
const guards = readText(join(WEB_ROOT, "src/lib/rewards/reward-guards.ts"));
const docs = readText(
  join(
    WEB_ROOT,
    "../../docs/adme/stage-3-e-runtime-fraud-engine-controlled-open-preflight.md",
  ),
);

assertContains(fraud, 'import "server-only"', "fraud engine server-only");
assertContains(guards, 'import "server-only"', "reward guard server-only");
assertContains(fraud, "allowed: boolean", "decision allowed field");
assertContains(fraud, "reason_code", "decision reason_code field");
assertContains(fraud, "severity", "decision severity field");
assertContains(fraud, "safe_message", "decision safe_message field");
assertContains(fraud, "decision_id", "decision_id field");
assertContains(fraud, "checked_at", "checked_at field");

for (const code of STAGE3E_REASON_CODES) {
  assertContains(fraud, code, "fraud reason source");
  assertContains(docs, code, "fraud reason docs");
}

for (const signal of [
  "USER_NOT_AUTHENTICATED",
  "USER_NOT_CONSUMER",
  "CAMPAIGN_NOT_ACTIVE",
  "CAMPAIGN_BUDGET_INSUFFICIENT",
  "AD_VIEW_NOT_FOUND",
  "MIN_VIEW_SECONDS_NOT_MET",
  "QUIZ_ATTEMPT_LIMIT_EXCEEDED",
  "QUIZ_ANSWER_INCORRECT",
  "REWARD_DUPLICATE_REPLAY",
  "USER_CAMPAIGN_REPLAY_BLOCKED",
  "FRAUD_SIGNAL_RAPID_REPEAT",
]) {
  assertContains(fraud, signal, "minimum fraud signal");
}

console.log("RESULT: stage3EFraudEnginePresent=true");
console.log("RESULT: stage3EFraudReasonCodesDocumented=true");
console.log("PASS: verify:stage3e-fraud-engine");
