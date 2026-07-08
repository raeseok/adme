/** Stage 3-C consumer quiz reward submit — sanitized DTOs only. */

export const STAGE3C_RESULT_CODES = [
  "STAGE3B_REWARDED",
  "STAGE3B_WRONG_RETRY_ALLOWED",
  "STAGE3B_WRONG_FINAL_NO_REWARD",
  "STAGE3B_DUPLICATE_SUBMISSION_BLOCKED",
  "STAGE3B_IDEMPOTENT_DUPLICATE",
  "STAGE3B_MIN_VIEW_SECONDS_NOT_MET",
  "STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT",
  "STAGE3B_CONSUMER_ROLE_REQUIRED",
  "STAGE3B_PRODUCTION_BLOCKED",
  "STAGE3C_PRODUCTION_REWARD_BLOCKED",
  "STAGE3C_CONSUMER_ROLE_REQUIRED",
  "STAGE3C_AUTH_REQUIRED",
  "STAGE3C_UNCONTROLLED_CAMPAIGN",
  "STAGE3C_AD_VIEW_NOT_FOUND",
  "STAGE3C_INVALID_INPUT",
  "STAGE3C_UNKNOWN_ERROR",
  "STAGE3C_ENV_UNKNOWN",
] as const;

export type Stage3CResultCode = (typeof STAGE3C_RESULT_CODES)[number];

export type SubmitConsumerQuizForRewardInput = {
  campaignId: string;
  quizId: string;
  selectedOptionId: string;
  submitIntentId?: string;
};

export type Stage3CSubmitResult = {
  accepted: boolean;
  resultCode: Stage3CResultCode;
  message: string;
  rewarded: boolean;
  rewardAmount: number | null;
  remainingAttempts: number | null;
  attemptNo: number | null;
  idempotencyReplay: boolean;
  productionRewardBlocked: boolean;
  pointLedgerMutation: boolean;
  adViewsMutation: boolean;
  quizAnswerExposed: false;
  controlledCampaign: boolean;
};
