export type ProtectedFundReconciliationStatus =
  | "unknown_blocked"
  | "normal"
  | "warning"
  | "deficit_blocked";

export type ProtectedFundReconciliationInput = {
  consumerRedeemablePointLiabilityKrw: number | null;
  protectedFundBalanceKrw: number | null;
};

export type ProtectedFundReconciliationEvaluation = {
  status: ProtectedFundReconciliationStatus;
  coverageRatio: number | null;
  coverageGateAllowsCashOut: boolean;
  coverageGateAllowsRewardOpen: boolean;
  requiresManualReconciliation: boolean;
  requiresFundTopUp: boolean;
  consumerRedeemablePointLiabilityKrw: number | null;
  protectedFundBalanceKrw: number | null;
  coverageMinimumRatio: 1;
  coverageWarningRatio: 1.05;
  coverageTargetBufferRatio: 1.1;
  reasonCodes: string[];
};

const COVERAGE_MINIMUM_RATIO = 1;
const COVERAGE_WARNING_RATIO = 1.05;
const COVERAGE_TARGET_BUFFER_RATIO = 1.1;

function buildEvaluation(
  input: ProtectedFundReconciliationInput,
  status: ProtectedFundReconciliationStatus,
  coverageRatio: number | null,
  reasonCodes: string[],
): ProtectedFundReconciliationEvaluation {
  const gateAllowed = status === "normal" || status === "warning";

  return {
    status,
    coverageRatio,
    coverageGateAllowsCashOut: gateAllowed,
    coverageGateAllowsRewardOpen: gateAllowed,
    requiresManualReconciliation: status === "unknown_blocked",
    requiresFundTopUp: status === "deficit_blocked",
    consumerRedeemablePointLiabilityKrw:
      input.consumerRedeemablePointLiabilityKrw,
    protectedFundBalanceKrw: input.protectedFundBalanceKrw,
    coverageMinimumRatio: COVERAGE_MINIMUM_RATIO,
    coverageWarningRatio: COVERAGE_WARNING_RATIO,
    coverageTargetBufferRatio: COVERAGE_TARGET_BUFFER_RATIO,
    reasonCodes,
  };
}

export function evaluateProtectedFundReconciliationGate(
  input: ProtectedFundReconciliationInput,
): ProtectedFundReconciliationEvaluation {
  const { consumerRedeemablePointLiabilityKrw, protectedFundBalanceKrw } = input;

  if (
    consumerRedeemablePointLiabilityKrw === null ||
    protectedFundBalanceKrw === null
  ) {
    return buildEvaluation(input, "unknown_blocked", null, [
      "PROTECTED_FUND_COVERAGE_UNKNOWN",
    ]);
  }

  if (
    consumerRedeemablePointLiabilityKrw < 0 ||
    protectedFundBalanceKrw < 0
  ) {
    return buildEvaluation(input, "unknown_blocked", null, [
      "PROTECTED_FUND_NEGATIVE_INPUT",
    ]);
  }

  if (consumerRedeemablePointLiabilityKrw === 0) {
    return buildEvaluation(input, "normal", null, [
      "NO_CONSUMER_REDEEMABLE_POINT_LIABILITY",
    ]);
  }

  if (protectedFundBalanceKrw < consumerRedeemablePointLiabilityKrw) {
    return buildEvaluation(
      input,
      "deficit_blocked",
      protectedFundBalanceKrw / consumerRedeemablePointLiabilityKrw,
      ["PROTECTED_FUND_COVERAGE_DEFICIT"],
    );
  }

  const coverageRatio =
    protectedFundBalanceKrw / consumerRedeemablePointLiabilityKrw;

  if (coverageRatio < COVERAGE_MINIMUM_RATIO) {
    return buildEvaluation(input, "deficit_blocked", coverageRatio, [
      "PROTECTED_FUND_COVERAGE_BELOW_MINIMUM",
    ]);
  }

  if (coverageRatio < COVERAGE_WARNING_RATIO) {
    return buildEvaluation(input, "warning", coverageRatio, [
      "PROTECTED_FUND_COVERAGE_BELOW_WARNING_BUFFER",
    ]);
  }

  return buildEvaluation(input, "normal", coverageRatio, [
    coverageRatio >= COVERAGE_TARGET_BUFFER_RATIO
      ? "PROTECTED_FUND_COVERAGE_TARGET_BUFFER_MET"
      : "PROTECTED_FUND_COVERAGE_WITHIN_POLICY",
  ]);
}
