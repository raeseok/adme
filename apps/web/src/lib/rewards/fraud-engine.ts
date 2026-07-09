import "server-only";

import {
  getRewardReleaseFlags,
  type RewardReleaseFlags,
} from "./release-flags";

export const STAGE3E_FRAUD_ENGINE_BUILD =
  "stage3e-runtime-fraud-engine-controlled-open-preflight";

export const STAGE3E_FRAUD_REASON_CODES = [
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
] as const;

export type Stage3EFraudReasonCode =
  (typeof STAGE3E_FRAUD_REASON_CODES)[number];

export type Stage3EFraudSeverity = "block" | "flag" | "allow";

export type Stage3EFraudDecision = {
  allowed: boolean;
  reason_code: Stage3EFraudReasonCode;
  severity: Stage3EFraudSeverity;
  safe_message: string;
  internal_detail?: string;
  decision_id: string;
  checked_at: string;
};

export type Stage3EFraudInput = {
  userId: string | null;
  userRole?: string | null;
  campaignId: string | null;
  campaignStatus?: string | null;
  campaignBudgetTotal?: number | null;
  campaignBudgetSpent?: number | null;
  rewardAmount?: number | null;
  adViewId?: string | null;
  viewedSeconds?: number | null;
  minViewedSeconds?: number | null;
  attemptCount?: number | null;
  attemptLimit?: number | null;
  quizAnswerCorrect?: boolean | null;
  duplicateReward?: boolean;
  sameUserCampaignReplay?: boolean;
  rapidRepeatAttempt?: boolean;
  controlledRewardCountSoFar?: number | null;
  controlledRewardAmountForUser?: number | null;
  controlledTotalRewardAmount?: number | null;
  controlledCampaignSpend?: number | null;
  now?: Date;
};

const SAFE_MESSAGES: Record<Stage3EFraudReasonCode, string> = {
  REWARD_KILL_SWITCH_ON:
    "현재 리워드 지급은 운영 안전 스위치로 차단되어 있습니다.",
  PRODUCTION_REWARD_CLOSED:
    "현재 운영 환경에서는 리워드 지급이 아직 열려 있지 않습니다.",
  USER_NOT_AUTHENTICATED: "리워드 확인을 위해 로그인이 필요합니다.",
  USER_NOT_CONSUMER: "소비자 계정만 리워드를 받을 수 있습니다.",
  CAMPAIGN_NOT_ACTIVE: "현재 참여할 수 없는 캠페인입니다.",
  CAMPAIGN_BUDGET_INSUFFICIENT:
    "캠페인 리워드 예산이 부족해 지급할 수 없습니다.",
  AD_VIEW_NOT_FOUND: "광고 열람 기록이 확인되지 않았습니다.",
  MIN_VIEW_SECONDS_NOT_MET: "필수 열람 시간이 충족되지 않았습니다.",
  QUIZ_ATTEMPT_LIMIT_EXCEEDED: "퀴즈 제출 가능 횟수를 초과했습니다.",
  QUIZ_ANSWER_INCORRECT: "정답이 아니어서 리워드가 지급되지 않습니다.",
  REWARD_DUPLICATE_REPLAY: "이미 처리된 리워드 요청입니다.",
  USER_CAMPAIGN_REPLAY_BLOCKED:
    "동일 캠페인에 대한 반복 리워드 요청이 차단되었습니다.",
  USER_NOT_IN_CONTROLLED_ALLOWLIST:
    "controlled open 승인 대상 사용자만 참여할 수 있습니다.",
  CAMPAIGN_NOT_IN_CONTROLLED_ALLOWLIST:
    "controlled open 승인 대상 캠페인만 참여할 수 있습니다.",
  CONTROLLED_REWARD_LIMIT_EXCEEDED:
    "controlled open 리워드 한도를 초과했습니다.",
  CONTROLLED_REWARD_WINDOW_CLOSED:
    "controlled open 승인 시간이 아닙니다.",
  FRAUD_SIGNAL_RAPID_REPEAT:
    "비정상적으로 빠른 반복 요청이 감지되어 차단되었습니다.",
  FRAUD_ENGINE_INTERNAL_ERROR:
    "리워드 안전 검증 중 문제가 발생했습니다.",
  REWARD_ALLOWED: "리워드 안전 검증을 통과했습니다.",
};

function decisionId(reason: Stage3EFraudReasonCode, checkedAt: string): string {
  return `stage3e:${reason}:${checkedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
}

function buildDecision(
  reason_code: Stage3EFraudReasonCode,
  checkedAt: Date,
  severity: Stage3EFraudSeverity = "block",
  internal_detail?: string,
): Stage3EFraudDecision {
  const checked_at = checkedAt.toISOString();
  return {
    allowed: severity === "allow",
    reason_code,
    severity,
    safe_message: SAFE_MESSAGES[reason_code],
    internal_detail,
    decision_id: decisionId(reason_code, checked_at),
    checked_at,
  };
}

function withinControlledWindow(flags: RewardReleaseFlags, now: Date): boolean {
  const start = flags.controlledWindowStart
    ? Date.parse(flags.controlledWindowStart)
    : null;
  const end = flags.controlledWindowEnd
    ? Date.parse(flags.controlledWindowEnd)
    : null;
  const current = now.getTime();

  if (start != null && Number.isFinite(start) && current < start) return false;
  if (end != null && Number.isFinite(end) && current > end) return false;
  return true;
}

function remainingBudget(input: Stage3EFraudInput): number | null {
  if (
    input.campaignBudgetTotal == null ||
    input.campaignBudgetSpent == null ||
    input.rewardAmount == null
  ) {
    return null;
  }
  return input.campaignBudgetTotal - input.campaignBudgetSpent;
}

export function evaluateRewardFraudDecision(
  input: Stage3EFraudInput,
  flags: RewardReleaseFlags = getRewardReleaseFlags(),
): Stage3EFraudDecision {
  const now = input.now ?? new Date();

  try {
    if (flags.killSwitch) {
      return buildDecision("REWARD_KILL_SWITCH_ON", now, "block");
    }
    if (!flags.productionRewardOpen || flags.productionRewardPreflightOnly) {
      return buildDecision("PRODUCTION_REWARD_CLOSED", now, "block");
    }
    if (!input.userId) {
      return buildDecision("USER_NOT_AUTHENTICATED", now, "block");
    }
    if (input.userRole !== "consumer") {
      return buildDecision("USER_NOT_CONSUMER", now, "block");
    }
    if (input.campaignStatus && input.campaignStatus !== "active") {
      return buildDecision("CAMPAIGN_NOT_ACTIVE", now, "block");
    }

    const budgetRemaining = remainingBudget(input);
    if (
      budgetRemaining != null &&
      input.rewardAmount != null &&
      budgetRemaining < input.rewardAmount
    ) {
      return buildDecision("CAMPAIGN_BUDGET_INSUFFICIENT", now, "block");
    }
    if (!input.adViewId) {
      return buildDecision("AD_VIEW_NOT_FOUND", now, "block");
    }
    if (
      input.viewedSeconds != null &&
      input.minViewedSeconds != null &&
      input.viewedSeconds < input.minViewedSeconds
    ) {
      return buildDecision("MIN_VIEW_SECONDS_NOT_MET", now, "block");
    }
    if (
      input.attemptCount != null &&
      input.attemptLimit != null &&
      input.attemptCount >= input.attemptLimit
    ) {
      return buildDecision("QUIZ_ATTEMPT_LIMIT_EXCEEDED", now, "block");
    }
    if (input.quizAnswerCorrect === false) {
      return buildDecision("QUIZ_ANSWER_INCORRECT", now, "block");
    }
    if (input.duplicateReward) {
      return buildDecision("REWARD_DUPLICATE_REPLAY", now, "block");
    }
    if (input.sameUserCampaignReplay) {
      return buildDecision("USER_CAMPAIGN_REPLAY_BLOCKED", now, "block");
    }
    if (input.rapidRepeatAttempt) {
      return buildDecision("FRAUD_SIGNAL_RAPID_REPEAT", now, "block");
    }

    if (flags.allowlistEnabled) {
      if (!input.userId || !flags.allowlistUserIds.includes(input.userId)) {
        return buildDecision("USER_NOT_IN_CONTROLLED_ALLOWLIST", now, "block");
      }
      if (
        !input.campaignId ||
        !flags.allowlistCampaignIds.includes(input.campaignId)
      ) {
        return buildDecision(
          "CAMPAIGN_NOT_IN_CONTROLLED_ALLOWLIST",
          now,
          "block",
        );
      }
      if (!withinControlledWindow(flags, now)) {
        return buildDecision("CONTROLLED_REWARD_WINDOW_CLOSED", now, "block");
      }
      if (
        (flags.controlledMaxRewardCount != null &&
          (input.controlledRewardCountSoFar ?? 0) >=
            flags.controlledMaxRewardCount) ||
        (flags.controlledMaxRewardAmountPerUser != null &&
          (input.controlledRewardAmountForUser ?? 0) >=
            flags.controlledMaxRewardAmountPerUser) ||
        (flags.controlledMaxTotalRewardAmount != null &&
          (input.controlledTotalRewardAmount ?? 0) >=
            flags.controlledMaxTotalRewardAmount) ||
        (flags.controlledMaxCampaignSpend != null &&
          (input.controlledCampaignSpend ?? 0) >=
            flags.controlledMaxCampaignSpend)
      ) {
        return buildDecision("CONTROLLED_REWARD_LIMIT_EXCEEDED", now, "block");
      }
    }

    return buildDecision("REWARD_ALLOWED", now, "allow");
  } catch {
    return buildDecision("FRAUD_ENGINE_INTERNAL_ERROR", now, "block");
  }
}
