export type PrepaidThresholdStatus =
  | "unknown_blocked"
  | "normal"
  | "warning"
  | "hard_stop_blocked"
  | "exceeded_blocked";

export type PrepaidThresholdInput = {
  quarterEndOutstandingBalanceKrw: number | null;
  annualTotalIssuedKrw: number | null;
};

export type PrepaidThresholdEvaluation = {
  status: PrepaidThresholdStatus;
  thresholdGateAllowsIssuance: boolean;
  requiresRegistrationPreparation: boolean;
  requiresRegistrationTrack: boolean;
  quarterEndOutstandingBalanceLimitKrw: 3000000000;
  annualTotalIssuedLimitKrw: 50000000000;
  warningRatio: 0.8;
  hardStopRatio: 0.95;
  reasonCodes: string[];
};

const QUARTER_END_OUTSTANDING_BALANCE_LIMIT_KRW = 3000000000;
const ANNUAL_TOTAL_ISSUED_LIMIT_KRW = 50000000000;
const WARNING_RATIO = 0.8;
const HARD_STOP_RATIO = 0.95;
const QUARTER_END_OUTSTANDING_BALANCE_WARNING_KRW = 2400000000;
const QUARTER_END_OUTSTANDING_BALANCE_HARD_STOP_KRW = 2850000000;
const ANNUAL_TOTAL_ISSUED_WARNING_KRW = 40000000000;
const ANNUAL_TOTAL_ISSUED_HARD_STOP_KRW = 47500000000;

function buildEvaluation(
  status: PrepaidThresholdStatus,
  reasonCodes: string[],
): PrepaidThresholdEvaluation {
  return {
    status,
    thresholdGateAllowsIssuance: status === "normal" || status === "warning",
    requiresRegistrationPreparation:
      status === "warning" || status === "hard_stop_blocked",
    requiresRegistrationTrack: status === "exceeded_blocked",
    quarterEndOutstandingBalanceLimitKrw:
      QUARTER_END_OUTSTANDING_BALANCE_LIMIT_KRW,
    annualTotalIssuedLimitKrw: ANNUAL_TOTAL_ISSUED_LIMIT_KRW,
    warningRatio: WARNING_RATIO,
    hardStopRatio: HARD_STOP_RATIO,
    reasonCodes,
  };
}

export function evaluatePrepaidThresholdGate(
  input: PrepaidThresholdInput,
): PrepaidThresholdEvaluation {
  const { quarterEndOutstandingBalanceKrw, annualTotalIssuedKrw } = input;

  if (
    quarterEndOutstandingBalanceKrw === null ||
    annualTotalIssuedKrw === null
  ) {
    return buildEvaluation("unknown_blocked", ["THRESHOLD_UNKNOWN"]);
  }

  if (
    quarterEndOutstandingBalanceKrw >=
    QUARTER_END_OUTSTANDING_BALANCE_LIMIT_KRW
  ) {
    return buildEvaluation("exceeded_blocked", [
      "QUARTER_END_OUTSTANDING_BALANCE_LIMIT_EXCEEDED",
    ]);
  }

  if (annualTotalIssuedKrw >= ANNUAL_TOTAL_ISSUED_LIMIT_KRW) {
    return buildEvaluation("exceeded_blocked", [
      "ANNUAL_TOTAL_ISSUED_LIMIT_EXCEEDED",
    ]);
  }

  if (
    quarterEndOutstandingBalanceKrw >=
    QUARTER_END_OUTSTANDING_BALANCE_HARD_STOP_KRW
  ) {
    return buildEvaluation("hard_stop_blocked", [
      "QUARTER_END_OUTSTANDING_BALANCE_HARD_STOP",
    ]);
  }

  if (annualTotalIssuedKrw >= ANNUAL_TOTAL_ISSUED_HARD_STOP_KRW) {
    return buildEvaluation("hard_stop_blocked", [
      "ANNUAL_TOTAL_ISSUED_HARD_STOP",
    ]);
  }

  if (
    quarterEndOutstandingBalanceKrw >=
    QUARTER_END_OUTSTANDING_BALANCE_WARNING_KRW
  ) {
    return buildEvaluation("warning", [
      "QUARTER_END_OUTSTANDING_BALANCE_WARNING",
    ]);
  }

  if (annualTotalIssuedKrw >= ANNUAL_TOTAL_ISSUED_WARNING_KRW) {
    return buildEvaluation("warning", ["ANNUAL_TOTAL_ISSUED_WARNING"]);
  }

  return buildEvaluation("normal", ["THRESHOLD_WITHIN_LIMITS"]);
}
