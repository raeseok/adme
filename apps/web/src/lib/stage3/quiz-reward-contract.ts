import "server-only";

import {
  STAGE30_TRANSACTION_CONTRACT_VERSION,
  getStage30ReadinessState,
} from "./readiness";

export { STAGE30_TRANSACTION_CONTRACT_VERSION as STAGE3_0_TRANSACTION_CONTRACT_VERSION };

export const QUIZ_REWARD_RPC_NAME_CANDIDATES = [
  "record_quiz_reward_actual",
  "submit_quiz_reward_transaction",
] as const;

export const QUIZ_REWARD_FAILURE_CODES = [
  "MIN_VIEW_NOT_MET",
  "ATTEMPT_LIMIT_REACHED",
  "ALREADY_REWARDED",
  "INCORRECT_RETRY_AVAILABLE",
  "INCORRECT_FINAL",
  "CAMPAIGN_BUDGET_EXHAUSTED",
  "REWARD_MUTATION_DISABLED",
  "ENV_NOT_SEPARATED",
] as const;

export type QuizRewardFailureCode = (typeof QUIZ_REWARD_FAILURE_CODES)[number];

export type QuizRewardTransactionInput = {
  campaignId: string;
  quizId: string;
  selectedOptionId?: string;
  selectedOptionValue?: string;
  adViewId: string;
  idempotencyKey: string;
};

export type QuizRewardSuccessResponse = {
  status: "rewarded";
  rewardAmount: number;
  balanceAfter?: number;
};

export type QuizRewardFailureResponse = {
  status: "failed";
  code: QuizRewardFailureCode;
};

export type QuizRewardTransactionContract = {
  version: string;
  rpcNameCandidates: readonly string[];
  input: QuizRewardTransactionInput;
  failureCodes: readonly QuizRewardFailureCode[];
  successFields: readonly (keyof QuizRewardSuccessResponse)[];
  forbiddenResponseFields: readonly string[];
  actualMutationAllowed: false;
  processingSteps: readonly string[];
};

const FORBIDDEN_RESPONSE_FIELDS = [
  "answer",
  "correctAnswer",
  "correctOption",
  "correctIndex",
  "answerIndex",
  "solution",
] as const;

const PROCESSING_STEPS = [
  "authenticated consumer 확인",
  "ad_views row lock (consumer_user_id + campaign_id + ad_view_id)",
  "server-side view_started_at 기준 최소 열람 시간 검증",
  "attempt_no와 reward 상태 검증",
  "quizzes 원본 테이블에서 서버가 정답 대조",
  "정답 원문은 어떤 응답에도 포함하지 않음",
  "campaign budget 또는 reward budget row lock",
  "campaign remaining budget >= point_per_pass 확인",
  "point_ledger quiz_reward insert",
  "campaign budget 차감",
  "ad_views quiz_result/pass 상태 update",
  "users balance cache가 있다면 ledger 합계와 함께 update",
  "모든 작업은 하나의 transaction으로 처리",
] as const;

export function getQuizRewardTransactionContract(): QuizRewardTransactionContract {
  return {
    version: STAGE30_TRANSACTION_CONTRACT_VERSION,
    rpcNameCandidates: QUIZ_REWARD_RPC_NAME_CANDIDATES,
    input: {
      campaignId: "",
      quizId: "",
      adViewId: "",
      idempotencyKey: "",
    },
    failureCodes: QUIZ_REWARD_FAILURE_CODES,
    successFields: ["status", "rewardAmount", "balanceAfter"],
    forbiddenResponseFields: [...FORBIDDEN_RESPONSE_FIELDS],
    actualMutationAllowed: false,
    processingSteps: PROCESSING_STEPS,
  };
}

export function buildQuizRewardTransactionContract(): QuizRewardTransactionContract {
  return getQuizRewardTransactionContract();
}

/** Placeholder for future RPC wiring — Stage 3-0 never executes DB mutation. */
export function assertQuizRewardActualMutationBlocked(): {
  allowed: false;
  reason: "STAGE3_0_PREFLIGHT_ONLY" | "ENV_NOT_SEPARATED";
} {
  const readiness = getStage30ReadinessState();

  if (!readiness.stage30DevProdSupabaseSeparated) {
    return { allowed: false, reason: "ENV_NOT_SEPARATED" };
  }

  return { allowed: false, reason: "STAGE3_0_PREFLIGHT_ONLY" };
}
