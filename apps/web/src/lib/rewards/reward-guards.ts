import "server-only";

import {
  evaluateRewardFraudDecision,
  type Stage3EFraudDecision,
  type Stage3EFraudInput,
} from "./fraud-engine";

export type Stage3ERewardGuardResult = Stage3EFraudDecision & {
  pointLedgerMutation: false;
  campaignBudgetMutation: false;
  usersBalanceMutation: false;
  adViewsRewardMutation: false;
  partnerSettlementsMutation: false;
  cashOutMutation: false;
};

export function evaluateStage3ERewardGuard(
  input: Stage3EFraudInput,
): Stage3ERewardGuardResult {
  return {
    ...evaluateRewardFraudDecision(input),
    pointLedgerMutation: false,
    campaignBudgetMutation: false,
    usersBalanceMutation: false,
    adViewsRewardMutation: false,
    partnerSettlementsMutation: false,
    cashOutMutation: false,
  };
}
