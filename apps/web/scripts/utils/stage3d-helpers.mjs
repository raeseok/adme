/**
 * Stage 3-D shared verify helpers
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const STAGE3D_PUBLIC_FORBIDDEN_MARKERS = [
  "stage3D",
  "stage3d",
  "STAGE3D",
];

export const STAGE3D_DIAGNOSTICS_REQUIRED = [
  "stage3DProductionRewardOpenPreflight=true",
  "stage3DProductionRewardOpenReady=false",
  "stage3DProductionRewardMutation=false",
  "stage3DProductionPointLedgerMutation=false",
  "stage3DProductionCampaignBudgetMutation=false",
  "stage3DProductionUsersBalanceMutation=false",
  "stage3DProductionAdViewsMutation=false",
  "stage3DReleaseFlagDesigned=true",
  "stage3DProductionRewardOpenFlag=false",
  "stage3DRewardKillSwitchDefaultOn=true",
  "stage3DControlledProductionAllowlistDesigned=true",
  "stage3DControlledProductionAllowlistActive=false",
  "stage3DKakaoSecretRotationRequired=true",
  "stage3DKakaoSecretRawExposed=false",
  "stage3DOAuthCodeTokenExposed=false",
  "stage3DPointLedgerAppendOnly=true",
  "stage3DQuizAnswerExposure=false",
  "stage3DAnswerHintExposure=false",
  "stage3DRlsRelaxed=false",
  "stage3DServiceRoleClientExposure=false",
  "stage3DPublicMarkerExposed=false",
  "stage3DAuditLogContractReady=true",
  "stage3DRollbackPlanReady=true",
  "stage3DPartnerSettlementsOutOfScope=true",
  "stage3DCashOutOutOfScope=true",
  "stage3DMutationBlockedByFlags=true",
];

export const STAGE3D_PREFLIGHT_REQUIRED = [
  ...STAGE3D_DIAGNOSTICS_REQUIRED,
  "stage3DBuild=stage3d-production-reward-open-preflight",
  "stage3DIdempotencyReplayGuard=true",
  "stage3DDuplicateSubmitGuard=true",
  "stage3DMinViewGuard=true",
  "stage3DCampaignBudgetSafetyCheckReady=true",
  "stage3DCampaignBudgetReadOnly=true",
  "stage3DPointLedgerDirectInsertPolicy=false",
  "stage3DPointLedgerUpdateDeleteAllowed=false",
  "stage3DAbuseFraudPreflightPolicyReady=true",
  "stage3DAbuseFraudRuntimeEngineReady=false",
  "stage3DAdjustMutationExecuted=false",
  "stage3DAuditLogProductionInsert=false",
];

export const FORBIDDEN_ANSWER_KEYS = [
  "quiz_answer",
  "correct_answer",
  "correctAnswer",
  "correctOption",
  "correct_option",
  "correctIndex",
  "correct_index",
  "answerIndex",
  "answer_index",
  "solution",
  "answer_hint",
  "answerHint",
];

export const ANSWER_HINT_TOKENS = [
  "정답",
  "correct",
  "answer",
  "solution",
  "hint",
];

export const SECRET_EXPOSURE_PATTERNS = [
  "client_secret=",
  "clientSecret=",
  "access_token=",
  "refresh_token=",
  "authorization_code=",
  "oauthErrorDescription=",
];

export function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walkFiles(full, acc);
    } else if (/\.(tsx|ts|jsx|js|mjs)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

export function readText(path) {
  return readFileSync(path, "utf8");
}

export function assertContains(text, needle, label) {
  if (!text.includes(needle)) {
    throw new Error(`${label}: missing "${needle}"`);
  }
  console.log(`PASS: ${label} — ${needle}`);
}

export function assertNotContains(text, needle, label) {
  if (text.includes(needle)) {
    throw new Error(`${label}: should not contain "${needle}"`);
  }
  console.log(`PASS: ${label} — no "${needle}"`);
}

export function assertNoForbiddenKeys(text, label) {
  // Strip Stage 3-D diagnostic marker lines that legitimately contain
  // substrings like "AnswerHint" in names such as stage3DAnswerHintExposure.
  const scrubbed = text
    .split("\n")
    .filter((line) => !/\bstage3[A-Z]?\w*AnswerHint\w*=/.test(line))
    .filter((line) => !/\bstage3[A-Z]?\w*QuizAnswer\w*=/.test(line))
    .join("\n");

  for (const key of FORBIDDEN_ANSWER_KEYS) {
    if (scrubbed.includes(key)) {
      throw new Error(`${label} exposes forbidden key: ${key}`);
    }
  }
}
