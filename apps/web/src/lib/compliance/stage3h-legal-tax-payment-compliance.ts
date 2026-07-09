import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3H_LEGAL_TAX_PAYMENT_COMPLIANCE_BUILD =
  "stage3h-legal-tax-payment-compliance-review";

export type Stage3HLegalTaxPaymentComplianceState = {
  stage3HLegalTaxPaymentComplianceReview: true;
  stage3HExternalLegalTaxReviewRequired: true;
  stage3HElectronicFinancialTransactionActReviewRequired: true;
  stage3HPrepaidPaymentInstrumentRiskStatus: "requires_counsel";
  stage3HPrepaidRegistrationDecisionStatus: "undetermined";
  stage3HPrepaidFloatSafeguardingReviewRequired: true;
  stage3HConsumerRewardTaxReviewRequired: true;
  stage3HConsumerWithholdingDecisionStatus: "undetermined";
  stage3HPartnerSettlementTaxReviewRequired: true;
  stage3HPartnerSettlementInvoiceOrEvidenceReviewRequired: true;
  stage3HPrivacyPolicyReviewRequired: true;
  stage3HBankAccountDataSeparationRequired: true;
  stage3HCommercialAdConsentReviewRequired: true;
  stage3HPointTermsReviewRequired: true;
  stage3HAdvertiserTermsReviewRequired: true;
  stage3HPartnerAgreementReviewRequired: true;
  stage3HActualRewardOpenAllowed: false;
  stage3HControlledOpenExecutionAllowed: false;
  stage3HCashOutActualImplementationAllowed: false;
  stage3HPartnerSettlementActualImplementationAllowed: false;
  stage3HDbMigrationAllowed: false;
  stage3HProductionRewardMutation: false;
  stage3HProductionPointLedgerMutation: false;
  stage3HProductionCampaignBudgetMutation: false;
  stage3HProductionUsersBalanceMutation: false;
  stage3HProductionAdViewsMutation: false;
  stage3HProductionCashRedemptionRequestsMutation: false;
  stage3HProductionPartnerSettlementsMutation: false;
  stage3HDeployCommit: string;
};

/**
 * Stage 3-H records review gates only. Legal and tax conclusions remain
 * pending external counsel, while every actual open and mutation gate is false.
 */
export function getStage3HLegalTaxPaymentComplianceState(): Stage3HLegalTaxPaymentComplianceState {
  return {
    stage3HLegalTaxPaymentComplianceReview: true,
    stage3HExternalLegalTaxReviewRequired: true,
    stage3HElectronicFinancialTransactionActReviewRequired: true,
    stage3HPrepaidPaymentInstrumentRiskStatus: "requires_counsel",
    stage3HPrepaidRegistrationDecisionStatus: "undetermined",
    stage3HPrepaidFloatSafeguardingReviewRequired: true,
    stage3HConsumerRewardTaxReviewRequired: true,
    stage3HConsumerWithholdingDecisionStatus: "undetermined",
    stage3HPartnerSettlementTaxReviewRequired: true,
    stage3HPartnerSettlementInvoiceOrEvidenceReviewRequired: true,
    stage3HPrivacyPolicyReviewRequired: true,
    stage3HBankAccountDataSeparationRequired: true,
    stage3HCommercialAdConsentReviewRequired: true,
    stage3HPointTermsReviewRequired: true,
    stage3HAdvertiserTermsReviewRequired: true,
    stage3HPartnerAgreementReviewRequired: true,
    stage3HActualRewardOpenAllowed: false,
    stage3HControlledOpenExecutionAllowed: false,
    stage3HCashOutActualImplementationAllowed: false,
    stage3HPartnerSettlementActualImplementationAllowed: false,
    stage3HDbMigrationAllowed: false,
    stage3HProductionRewardMutation: false,
    stage3HProductionPointLedgerMutation: false,
    stage3HProductionCampaignBudgetMutation: false,
    stage3HProductionUsersBalanceMutation: false,
    stage3HProductionAdViewsMutation: false,
    stage3HProductionCashRedemptionRequestsMutation: false,
    stage3HProductionPartnerSettlementsMutation: false,
    stage3HDeployCommit: getDeployCommit(),
  };
}
