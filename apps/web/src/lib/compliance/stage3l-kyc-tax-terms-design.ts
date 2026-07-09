import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3L_KYC_TAX_TERMS_DESIGN_BUILD =
  "stage3l-kyc-tax-terms-data-model-design";

export const IDENTITY_VERIFICATION_STATUSES = [
  "not_started",
  "pending_verification",
  "verified",
  "failed",
  "expired",
  "manual_review_required",
  "revoked",
] as const;

export const BANK_ACCOUNT_VERIFICATION_STATUSES = [
  "not_registered",
  "pending_verification",
  "verified",
  "failed",
  "expired",
  "manual_review_required",
  "revoked",
] as const;

export const TAX_PROFILE_STATUSES = [
  "not_collected",
  "collection_required_before_cash_out",
  "pending_review",
  "ready_for_manual_processing",
  "external_review_required",
  "blocked_missing_required_data",
  "blocked_policy_unresolved",
] as const;

export const TERMS_ACCEPTANCE_STATUSES = [
  "missing_required_acceptance",
  "accepted_current_versions",
  "accepted_legacy_versions_reacceptance_required",
  "revoked_or_withdrawn",
  "version_unknown_blocked",
] as const;

export const MARKETING_CONSENT_STATUSES = [
  "not_asked",
  "opt_in_active",
  "opt_out_active",
  "withdrawn",
  "version_mismatch_reconfirm_required",
] as const;

export const CASH_OUT_GATE_DESIGN_STATUSES = [
  "blocked_reward_open_disabled",
  "blocked_balance_below_minimum",
  "blocked_missing_identity_verification",
  "blocked_missing_bank_account_verification",
  "blocked_missing_required_terms",
  "blocked_terms_reacceptance_required",
  "blocked_tax_profile_incomplete",
  "blocked_tax_external_review_required",
  "blocked_protected_fund_unknown",
  "blocked_protected_fund_deficit",
  "manual_review_required",
  "design_gate_clear_but_actual_cash_out_disabled",
] as const;

export const STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS = {
  stage: "3-L",
  kycTaxTermsDataModelDesigned: true,
  readOnlyDesignOnly: true,
  dbMigrationImplemented: false,
  supabaseDbPushExecuted: false,
  actualPersonalDataCollectionImplemented: false,
  identityProviderIntegrated: false,
  bankApiIntegrated: false,
  taxFilingImplemented: false,
  withholdingCalculationImplemented: false,
  cashOutActualProcessing: false,
  productionMutation: false,
  rewardOpenGateSeparated: true,
  cashOutGateUserLevelDesigned: true,
  termsVersioningDesigned: true,
  marketingConsentWithdrawalDesigned: true,
  sensitiveDataBoundaryDesigned: true,
  legalConclusionDeclared: false,
  externalLegalTaxReviewStillRequired: true,
} as const;

export type IdentityVerificationStatus =
  (typeof IDENTITY_VERIFICATION_STATUSES)[number];
export type BankAccountVerificationStatus =
  (typeof BANK_ACCOUNT_VERIFICATION_STATUSES)[number];
export type TaxProfileStatus = (typeof TAX_PROFILE_STATUSES)[number];
export type TermsAcceptanceStatus = (typeof TERMS_ACCEPTANCE_STATUSES)[number];
export type MarketingConsentStatus = (typeof MARKETING_CONSENT_STATUSES)[number];
export type CashOutGateDesignStatus =
  (typeof CASH_OUT_GATE_DESIGN_STATUSES)[number];

export type Stage3LKycTaxTermsDesignState = {
  stage3LKycTaxTermsDataModelDesigned: true;
  stage3LReadOnlyDesignOnly: true;
  stage3LDbMigrationImplemented: false;
  stage3LSupabaseDbPushExecuted: false;
  stage3LActualPersonalDataCollectionImplemented: false;
  stage3LIdentityProviderIntegrated: false;
  stage3LBankApiIntegrated: false;
  stage3LTaxFilingImplemented: false;
  stage3LWithholdingCalculationImplemented: false;
  stage3LCashOutActualProcessing: false;
  stage3LProductionMutation: false;
  stage3LRewardOpenGateSeparated: true;
  stage3LCashOutGateUserLevelDesigned: true;
  stage3LTermsVersioningDesigned: true;
  stage3LMarketingConsentWithdrawalDesigned: true;
  stage3LSensitiveDataBoundaryDesigned: true;
  stage3LLegalConclusionDeclared: false;
  stage3LExternalLegalTaxReviewStillRequired: true;
  stage3LBankAccountRawExposure: false;
  stage3LFullIdentityRawExposure: false;
  stage3LProviderRawResponseExposure: false;
  stage3LPublicMarkerExposure: false;
  stage3LIdentityVerificationStatusEnum: string;
  stage3LBankAccountVerificationStatusEnum: string;
  stage3LTaxProfileStatusEnum: string;
  stage3LTermsAcceptanceStatusEnum: string;
  stage3LMarketingConsentStatusEnum: string;
  stage3LCashOutGateStatusEnum: string;
  stage3LDeployCommit: string;
};

export function getStage3LKycTaxTermsDesignState(): Stage3LKycTaxTermsDesignState {
  return {
    stage3LKycTaxTermsDataModelDesigned:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.kycTaxTermsDataModelDesigned,
    stage3LReadOnlyDesignOnly:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.readOnlyDesignOnly,
    stage3LDbMigrationImplemented:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.dbMigrationImplemented,
    stage3LSupabaseDbPushExecuted:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.supabaseDbPushExecuted,
    stage3LActualPersonalDataCollectionImplemented:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.actualPersonalDataCollectionImplemented,
    stage3LIdentityProviderIntegrated:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.identityProviderIntegrated,
    stage3LBankApiIntegrated:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.bankApiIntegrated,
    stage3LTaxFilingImplemented:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.taxFilingImplemented,
    stage3LWithholdingCalculationImplemented:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.withholdingCalculationImplemented,
    stage3LCashOutActualProcessing:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.cashOutActualProcessing,
    stage3LProductionMutation:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.productionMutation,
    stage3LRewardOpenGateSeparated:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.rewardOpenGateSeparated,
    stage3LCashOutGateUserLevelDesigned:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.cashOutGateUserLevelDesigned,
    stage3LTermsVersioningDesigned:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.termsVersioningDesigned,
    stage3LMarketingConsentWithdrawalDesigned:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.marketingConsentWithdrawalDesigned,
    stage3LSensitiveDataBoundaryDesigned:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.sensitiveDataBoundaryDesigned,
    stage3LLegalConclusionDeclared:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.legalConclusionDeclared,
    stage3LExternalLegalTaxReviewStillRequired:
      STAGE3L_KYC_TAX_TERMS_DESIGN_STATUS.externalLegalTaxReviewStillRequired,
    stage3LBankAccountRawExposure: false,
    stage3LFullIdentityRawExposure: false,
    stage3LProviderRawResponseExposure: false,
    stage3LPublicMarkerExposure: false,
    stage3LIdentityVerificationStatusEnum:
      IDENTITY_VERIFICATION_STATUSES.join(","),
    stage3LBankAccountVerificationStatusEnum:
      BANK_ACCOUNT_VERIFICATION_STATUSES.join(","),
    stage3LTaxProfileStatusEnum: TAX_PROFILE_STATUSES.join(","),
    stage3LTermsAcceptanceStatusEnum: TERMS_ACCEPTANCE_STATUSES.join(","),
    stage3LMarketingConsentStatusEnum: MARKETING_CONSENT_STATUSES.join(","),
    stage3LCashOutGateStatusEnum: CASH_OUT_GATE_DESIGN_STATUSES.join(","),
    stage3LDeployCommit: getDeployCommit(),
  };
}
