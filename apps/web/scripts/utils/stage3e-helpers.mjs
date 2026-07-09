/**
 * Stage 3-E shared verify helpers.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const STAGE3E_PUBLIC_FORBIDDEN_MARKERS = [
  "stage3E",
  "stage3e",
  "STAGE3E",
];

export const STAGE3E_REQUIRED_MARKERS = [
  "stage3EPreflightEnabled=true",
  "stage3EFraudEnginePresent=true",
  "stage3EFraudEngineServerOnly=true",
  "stage3EFraudReasonCodesDocumented=true",
  "stage3EFraudDecisionShapeReady=true",
  "stage3EProductionRewardOpen=false",
  "stage3EKillSwitch=true",
  "stage3EKillSwitchPriority=true",
  "stage3EKillSwitchDecisionReason=REWARD_KILL_SWITCH_ON",
  "stage3EControlledAllowlistDesigned=true",
  "stage3EControlledAllowlistActive=false",
  "stage3EControlledAllowlistRawExposed=false",
  "stage3EProductionRewardMutation=false",
  "stage3EProductionPointLedgerMutation=false",
  "stage3EProductionCampaignBudgetMutation=false",
  "stage3EProductionUsersBalanceMutation=false",
  "stage3EProductionAdViewsMutation=false",
  "stage3EProductionPartnerSettlementsMutation=false",
  "stage3EProductionCashOutMutation=false",
  "stage3EStage3BProductionBlockMaintained=true",
  "stage3EStage3CProductionBlockMaintained=true",
  "stage3EPointLedgerIdempotencyGuard=true",
  "stage3EPointLedgerDuplicateInsert=false",
  "stage3ECampaignBudgetAtomicityGuard=true",
  "stage3ECampaignBudgetNegativeAllowed=false",
  "stage3EUsersBalanceCacheConsistencyGuard=true",
  "stage3EAdViewsRewardMutationBlockedWhenFraudBlocked=true",
  "stage3ECashOutOpen=false",
  "stage3EPartnerSettlementsOpen=false",
  "stage3EQuizAnswerExposed=false",
  "stage3EAnswerHintExposed=false",
  "stage3ERlsRelaxed=false",
  "stage3EServiceRoleExposed=false",
  "stage3EPublicMarkerExposed=false",
  "stage3EOAuthCodeTokenExposed=false",
  "stage3ESecretRawPartialHashDigestRecorded=false",
  "stage3EMutationBlockedByFlags=true",
  "stage3ECurrentSupabaseProjectRef=vupsalteyltjqumppltc",
  "stage3EDevSupabaseRef=ogncvdxrrsjnwsuvgoyh",
  "stage3EProdSupabaseRef=vupsalteyltjqumppltc",
];

export const STAGE3E_REASON_CODES = [
  "REWARD_KILL_SWITCH_ON",
  "PRODUCTION_REWARD_CLOSED",
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
  "USER_NOT_IN_CONTROLLED_ALLOWLIST",
  "CAMPAIGN_NOT_IN_CONTROLLED_ALLOWLIST",
  "CONTROLLED_REWARD_LIMIT_EXCEEDED",
  "CONTROLLED_REWARD_WINDOW_CLOSED",
  "FRAUD_SIGNAL_RAPID_REPEAT",
  "FRAUD_ENGINE_INTERNAL_ERROR",
  "REWARD_ALLOWED",
];

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(full, acc);
    } else if (/\.(tsx|ts|jsx|js|mjs|sql|md)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

export function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} - ${needle}`);
}

export function assertNotContains(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: should not contain "${needle}"`);
  }
  console.log(`PASS: ${label} - no "${needle}"`);
}
