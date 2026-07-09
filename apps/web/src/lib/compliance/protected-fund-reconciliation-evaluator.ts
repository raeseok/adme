export type ProtectedFundReconciliationStatus =
  | "unknown_blocked"
  | "deficit_blocked"
  | "minimum_covered_warning"
  | "covered_below_target_buffer"
  | "target_buffer_ok"
  | "no_liability_observed";

export type ProtectedFundReconciliationInput = {
  liabilitySourceAvailable?: boolean;
  protectedFundBalanceAvailable?: boolean;
  calculationSourceFinalized?: boolean;
  consumerUnconvertedPointsLiabilityWon?: number | null;
  protectedFundAvailableWon?: number | null;
  consumerRedeemablePointLiabilityKrw?: number | null;
  protectedFundBalanceKrw?: number | null;
};

export type ProtectedFundReconciliationEvaluation = {
  status: ProtectedFundReconciliationStatus;
  coverageRatio: number | null;
  coverageRatioBps: number | null;
  coverageGateAllowsCashOut: boolean;
  coverageGateAllowsRewardOpen: boolean;
  requiresManualReconciliation: boolean;
  requiresFundTopUp: boolean;
  consumerRedeemablePointLiabilityKrw: number | null;
  protectedFundBalanceKrw: number | null;
  consumerUnconvertedPointsLiabilityWon: number | null;
  protectedFundAvailableWon: number | null;
  coverageMinimumRatio: 1;
  coverageWarningRatio: 1.05;
  coverageTargetBufferRatio: 1.1;
  coverageMinimumRatioBps: 10000;
  coverageWarningRatioBps: 10500;
  coverageTargetBufferRatioBps: 11000;
  reasonCodes: string[];
};

const COVERAGE_MINIMUM_RATIO = 1;
const COVERAGE_WARNING_RATIO = 1.05;
const COVERAGE_TARGET_BUFFER_RATIO = 1.1;
const COVERAGE_MINIMUM_RATIO_BPS = 10000;
const COVERAGE_WARNING_RATIO_BPS = 10500;
const COVERAGE_TARGET_BUFFER_RATIO_BPS = 11000;

function resolveAmounts(input: ProtectedFundReconciliationInput) {
  return {
    liability:
      input.consumerUnconvertedPointsLiabilityWon ??
      input.consumerRedeemablePointLiabilityKrw ??
      null,
    available:
      input.protectedFundAvailableWon ?? input.protectedFundBalanceKrw ?? null,
  };
}

function calculateCoverageRatioBps(
  protectedFundAvailableWon: number,
  consumerUnconvertedPointsLiabilityWon: number,
): number {
  return Number(
    (BigInt(protectedFundAvailableWon) * BigInt(10000)) /
      BigInt(consumerUnconvertedPointsLiabilityWon),
  );
}

function buildEvaluation(
  input: ProtectedFundReconciliationInput,
  status: ProtectedFundReconciliationStatus,
  coverageRatio: number | null,
  coverageRatioBps: number | null,
  reasonCodes: string[],
): ProtectedFundReconciliationEvaluation {
  const gateAllowed =
    status === "minimum_covered_warning" ||
    status === "covered_below_target_buffer" ||
    status === "target_buffer_ok" ||
    status === "no_liability_observed";
  const { liability, available } = resolveAmounts(input);

  return {
    status,
    coverageRatio,
    coverageRatioBps,
    coverageGateAllowsCashOut: gateAllowed,
    coverageGateAllowsRewardOpen: gateAllowed,
    requiresManualReconciliation: status === "unknown_blocked",
    requiresFundTopUp: status === "deficit_blocked",
    consumerRedeemablePointLiabilityKrw: liability,
    protectedFundBalanceKrw: available,
    consumerUnconvertedPointsLiabilityWon: liability,
    protectedFundAvailableWon: available,
    coverageMinimumRatio: COVERAGE_MINIMUM_RATIO,
    coverageWarningRatio: COVERAGE_WARNING_RATIO,
    coverageTargetBufferRatio: COVERAGE_TARGET_BUFFER_RATIO,
    coverageMinimumRatioBps: COVERAGE_MINIMUM_RATIO_BPS,
    coverageWarningRatioBps: COVERAGE_WARNING_RATIO_BPS,
    coverageTargetBufferRatioBps: COVERAGE_TARGET_BUFFER_RATIO_BPS,
    reasonCodes,
  };
}

export function evaluateProtectedFundReconciliationGate(
  input: ProtectedFundReconciliationInput,
): ProtectedFundReconciliationEvaluation {
  const { liability, available } = resolveAmounts(input);

  if (
    input.liabilitySourceAvailable === false ||
    input.protectedFundBalanceAvailable === false ||
    input.calculationSourceFinalized === false
  ) {
    return buildEvaluation(input, "unknown_blocked", null, null, [
      "PROTECTED_FUND_SOURCE_NOT_READY",
    ]);
  }

  if (liability === null || available === null) {
    return buildEvaluation(input, "unknown_blocked", null, null, [
      "PROTECTED_FUND_COVERAGE_UNKNOWN",
    ]);
  }

  if (liability < 0 || available < 0) {
    return buildEvaluation(input, "unknown_blocked", null, null, [
      "PROTECTED_FUND_NEGATIVE_INPUT",
    ]);
  }

  if (liability === 0) {
    return buildEvaluation(input, "no_liability_observed", null, null, [
      "NO_CONSUMER_REDEEMABLE_POINT_LIABILITY",
    ]);
  }

  if (available < liability) {
    const coverageRatioBps = calculateCoverageRatioBps(available, liability);
    return buildEvaluation(
      input,
      "deficit_blocked",
      coverageRatioBps / 10000,
      coverageRatioBps,
      ["PROTECTED_FUND_COVERAGE_DEFICIT"],
    );
  }

  const coverageRatioBps = calculateCoverageRatioBps(available, liability);
  const coverageRatio = coverageRatioBps / 10000;

  if (coverageRatioBps < COVERAGE_MINIMUM_RATIO_BPS) {
    return buildEvaluation(input, "deficit_blocked", coverageRatio, coverageRatioBps, [
      "PROTECTED_FUND_COVERAGE_BELOW_MINIMUM",
    ]);
  }

  if (coverageRatioBps < COVERAGE_WARNING_RATIO_BPS) {
    return buildEvaluation(input, "minimum_covered_warning", coverageRatio, coverageRatioBps, [
      "PROTECTED_FUND_MINIMUM_COVERED_BELOW_WARNING_BUFFER",
    ]);
  }

  if (coverageRatioBps < COVERAGE_TARGET_BUFFER_RATIO_BPS) {
    return buildEvaluation(
      input,
      "covered_below_target_buffer",
      coverageRatio,
      coverageRatioBps,
      ["PROTECTED_FUND_COVERED_BELOW_TARGET_BUFFER"],
    );
  }

  return buildEvaluation(input, "target_buffer_ok", coverageRatio, coverageRatioBps, [
    "PROTECTED_FUND_COVERAGE_TARGET_BUFFER_MET",
  ]);
}
