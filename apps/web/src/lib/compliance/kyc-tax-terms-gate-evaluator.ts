import type {
  BankAccountVerificationStatus,
  CashOutGateDesignStatus,
  IdentityVerificationStatus,
  TaxProfileStatus,
  TermsAcceptanceStatus,
} from "./stage3l-kyc-tax-terms-design";
import type { ProtectedFundReconciliationStatus } from "./protected-fund-reconciliation-evaluator";

export const STAGE3L_ACCEPTED_PROTECTED_FUND_STATUSES = [
  "unknown_blocked",
  "deficit_blocked",
  "minimum_covered_warning",
  "covered_below_target_buffer",
  "target_buffer_ok",
  "no_liability_observed",
] as const satisfies readonly ProtectedFundReconciliationStatus[];

export type KycTaxTermsCashOutGateInput = {
  rewardOpenFlag: boolean;
  killSwitchOn: boolean;
  pointBalanceWon: number;
  minimumCashOutWon: number;
  identityVerificationStatus: IdentityVerificationStatus;
  bankAccountVerificationStatus: BankAccountVerificationStatus;
  requiredTermsAcceptanceStatus: TermsAcceptanceStatus;
  taxProfileStatus: TaxProfileStatus;
  protectedFundStatus: ProtectedFundReconciliationStatus;
  manualReviewRequired: boolean;
};

export type KycTaxTermsCashOutGateEvaluation = {
  status: CashOutGateDesignStatus;
  blockerCodes: string[];
  actualCashOutProcessingAllowed: false;
};

function buildEvaluation(
  status: CashOutGateDesignStatus,
  blockerCodes: string[],
): KycTaxTermsCashOutGateEvaluation {
  return {
    status,
    blockerCodes,
    actualCashOutProcessingAllowed: false,
  };
}

export function evaluateKycTaxTermsCashOutGate(
  input: KycTaxTermsCashOutGateInput,
): KycTaxTermsCashOutGateEvaluation {
  if (!input.rewardOpenFlag || input.killSwitchOn) {
    return buildEvaluation("blocked_reward_open_disabled", [
      "REWARD_OPEN_DISABLED_OR_KILL_SWITCH_ON",
    ]);
  }

  if (input.pointBalanceWon < input.minimumCashOutWon) {
    return buildEvaluation("blocked_balance_below_minimum", [
      "POINT_BALANCE_BELOW_MINIMUM_CASH_OUT",
    ]);
  }

  if (input.identityVerificationStatus !== "verified") {
    return buildEvaluation("blocked_missing_identity_verification", [
      "IDENTITY_VERIFICATION_NOT_VERIFIED",
    ]);
  }

  if (input.bankAccountVerificationStatus !== "verified") {
    return buildEvaluation("blocked_missing_bank_account_verification", [
      "BANK_ACCOUNT_VERIFICATION_NOT_VERIFIED",
    ]);
  }

  if (input.requiredTermsAcceptanceStatus === "missing_required_acceptance") {
    return buildEvaluation("blocked_missing_required_terms", [
      "REQUIRED_TERMS_ACCEPTANCE_MISSING",
    ]);
  }

  if (
    input.requiredTermsAcceptanceStatus ===
    "accepted_legacy_versions_reacceptance_required"
  ) {
    return buildEvaluation("blocked_terms_reacceptance_required", [
      "TERMS_REACCEPTANCE_REQUIRED",
    ]);
  }

  if (
    input.taxProfileStatus === "not_collected" ||
    input.taxProfileStatus === "blocked_missing_required_data"
  ) {
    return buildEvaluation("blocked_tax_profile_incomplete", [
      "TAX_PROFILE_INCOMPLETE",
    ]);
  }

  if (
    input.taxProfileStatus === "external_review_required" ||
    input.taxProfileStatus === "blocked_policy_unresolved"
  ) {
    return buildEvaluation("blocked_tax_external_review_required", [
      "TAX_EXTERNAL_REVIEW_REQUIRED",
    ]);
  }

  if (input.protectedFundStatus === "unknown_blocked") {
    return buildEvaluation("blocked_protected_fund_unknown", [
      "PROTECTED_FUND_STATUS_UNKNOWN",
    ]);
  }

  if (input.protectedFundStatus === "deficit_blocked") {
    return buildEvaluation("blocked_protected_fund_deficit", [
      "PROTECTED_FUND_DEFICIT",
    ]);
  }

  if (input.manualReviewRequired) {
    return buildEvaluation("manual_review_required", [
      "MANUAL_REVIEW_REQUIRED",
    ]);
  }

  return buildEvaluation("design_gate_clear_but_actual_cash_out_disabled", [
    "ACTUAL_CASH_OUT_PROCESSING_DISABLED_IN_STAGE_3_L",
  ]);
}
