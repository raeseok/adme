import "server-only";

import { getStage30ReadinessState } from "./readiness";

export const STAGE3_0_PREFLIGHT_REASON = "STAGE3_0_PREFLIGHT_ONLY";

export type Stage30PointLedgerSafetyState = {
  actualMutationAllowed: false;
  pointLedgerInsertAllowed: false;
  campaignBudgetMutationAllowed: false;
  usersBalanceMutationAllowed: false;
  partnerSettlementMutationAllowed: false;
  cashOutMutationAllowed: false;
  reason: typeof STAGE3_0_PREFLIGHT_REASON;
};

export type Stage3ActualMutationGateResult =
  | { allowed: false; reason: "STAGE3_ACTUAL_MUTATION_DISABLED" }
  | { allowed: false; reason: "ENV_NOT_SEPARATED" }
  | { allowed: false; reason: "REWARD_MUTATION_DISABLED" };

export function getStage30PointLedgerSafetyState(): Stage30PointLedgerSafetyState {
  return {
    actualMutationAllowed: false,
    pointLedgerInsertAllowed: false,
    campaignBudgetMutationAllowed: false,
    usersBalanceMutationAllowed: false,
    partnerSettlementMutationAllowed: false,
    cashOutMutationAllowed: false,
    reason: STAGE3_0_PREFLIGHT_REASON,
  };
}

/** Stage 3-0 preflight gate — always blocks actual mutation. */
export function assertStage3ActualMutationAllowed(): Stage3ActualMutationGateResult {
  const readiness = getStage30ReadinessState();

  if (!readiness.stage30DevProdSupabaseSeparated) {
    return { allowed: false, reason: "ENV_NOT_SEPARATED" };
  }

  if (
    readiness.stage30PointLedgerActualMutationEnabled ||
    readiness.stage30QuizRewardActualMutationEnabled
  ) {
    return { allowed: false, reason: "REWARD_MUTATION_DISABLED" };
  }

  return { allowed: false, reason: "STAGE3_ACTUAL_MUTATION_DISABLED" };
}
