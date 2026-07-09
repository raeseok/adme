import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3I_THRESHOLD_BASED_PREPAID_EXEMPTION_ASSUMPTION_BUILD =
  "stage3i-threshold-based-prepaid-exemption-assumption";

export type Stage3IThresholdBasedPrepaidExemptionAssumptionState = {
  stage3IThresholdBasedPrepaidExemptionAssumption: true;
  stage3IPrepaidBusinessInitialRegistrationRequired: false;
  stage3IPrepaidBusinessInitialRegistrationExemptionAssumed: true;
  stage3IPrepaidBusinessRegistrationStatus: "not_registered";
  stage3IPrepaidExemptionConditionQuarterEndOutstandingBalanceLimitKrw: 3000000000;
  stage3IPrepaidExemptionConditionAnnualTotalIssuedLimitKrw: 50000000000;
  stage3IPrepaidExemptionRequiresBothLimitsBelow: true;
  stage3IPrepaidQuarterEndOutstandingBalanceMustRemainBelowLimit: true;
  stage3IPrepaidAnnualTotalIssuedMustRemainBelowLimit: true;
  stage3IPrepaidThresholdMonitoringRequired: true;
  stage3IPrepaidDailyInternalMonitoringRequired: true;
  stage3IPrepaidQuarterEndSnapshotRequired: true;
  stage3IPrepaidAnnualIssuedAggregationRequired: true;
  stage3IPrepaidThresholdWarningRatio: 0.8;
  stage3IPrepaidThresholdHardStopRatio: 0.95;
  stage3IPrepaidRegistrationPreparationRequiredAtWarning: true;
  stage3IPrepaidRegistrationRequiredWhenThresholdExceeded: true;
  stage3IPrepaidIssuanceBlockedWhenThresholdUnknown: true;
  stage3IPrepaidIssuanceBlockedWhenThresholdExceeded: true;
  stage3IPrepaidIssuanceBlockedWhenHardStopReached: true;
  stage3IPrepaidRegistrationConversionPlanRequired: true;
  stage3IProtectedFundsSegregationRecommendedEvenIfExempt: true;
  stage3IProtectedFundsComminglingRiskAcknowledged: true;
  stage3IProtectedFundsDailyReconciliationRecommended: true;
  stage3IConsumerCashOutKycAssumedRequired: true;
  stage3IConsumerWithholdingReadyDesignRequired: true;
  stage3IPaymentStatementPreparationRequired: true;
  stage3IBankAccountRawExposureAllowed: false;
  stage3IPrivacySeparateStorageRequired: true;
  stage3ICommercialAdExplicitConsentRequired: true;
  stage3ICommercialAdWithdrawalRequired: true;
  stage3IPointTermsRequiredBeforeOpen: true;
  stage3IPartnerAgreementRequiredBeforeSettlement: true;
  stage3IAdvertiserPrepaidTermsRequiredBeforeCharge: true;
  stage3IBreakageRevenueRecognitionBlockedUntilPolicyApproved: true;
  stage3IActualRewardOpenAllowed: false;
  stage3IControlledOpenExecutionAllowed: false;
  stage3ICashOutActualImplementationAllowed: false;
  stage3IPartnerSettlementActualImplementationAllowed: false;
  stage3IDbMigrationAllowed: false;
  stage3IProductionRewardMutation: false;
  stage3IProductionPointLedgerMutation: false;
  stage3IProductionCampaignBudgetMutation: false;
  stage3IProductionUsersBalanceMutation: false;
  stage3IProductionAdViewsMutation: false;
  stage3IProductionCashRedemptionRequestsMutation: false;
  stage3IProductionPartnerSettlementsMutation: false;
  stage3IDeployCommit: string;
};

/**
 * Stage 3-I locks the internal development assumption only: initial operation
 * assumes not-registered status while threshold monitoring keeps both prepaid
 * exemption limits below the internal risk boundary. Actual open stays blocked.
 */
export function getStage3IThresholdBasedPrepaidExemptionAssumptionState(): Stage3IThresholdBasedPrepaidExemptionAssumptionState {
  return {
    stage3IThresholdBasedPrepaidExemptionAssumption: true,
    stage3IPrepaidBusinessInitialRegistrationRequired: false,
    stage3IPrepaidBusinessInitialRegistrationExemptionAssumed: true,
    stage3IPrepaidBusinessRegistrationStatus: "not_registered",
    stage3IPrepaidExemptionConditionQuarterEndOutstandingBalanceLimitKrw: 3000000000,
    stage3IPrepaidExemptionConditionAnnualTotalIssuedLimitKrw: 50000000000,
    stage3IPrepaidExemptionRequiresBothLimitsBelow: true,
    stage3IPrepaidQuarterEndOutstandingBalanceMustRemainBelowLimit: true,
    stage3IPrepaidAnnualTotalIssuedMustRemainBelowLimit: true,
    stage3IPrepaidThresholdMonitoringRequired: true,
    stage3IPrepaidDailyInternalMonitoringRequired: true,
    stage3IPrepaidQuarterEndSnapshotRequired: true,
    stage3IPrepaidAnnualIssuedAggregationRequired: true,
    stage3IPrepaidThresholdWarningRatio: 0.8,
    stage3IPrepaidThresholdHardStopRatio: 0.95,
    stage3IPrepaidRegistrationPreparationRequiredAtWarning: true,
    stage3IPrepaidRegistrationRequiredWhenThresholdExceeded: true,
    stage3IPrepaidIssuanceBlockedWhenThresholdUnknown: true,
    stage3IPrepaidIssuanceBlockedWhenThresholdExceeded: true,
    stage3IPrepaidIssuanceBlockedWhenHardStopReached: true,
    stage3IPrepaidRegistrationConversionPlanRequired: true,
    stage3IProtectedFundsSegregationRecommendedEvenIfExempt: true,
    stage3IProtectedFundsComminglingRiskAcknowledged: true,
    stage3IProtectedFundsDailyReconciliationRecommended: true,
    stage3IConsumerCashOutKycAssumedRequired: true,
    stage3IConsumerWithholdingReadyDesignRequired: true,
    stage3IPaymentStatementPreparationRequired: true,
    stage3IBankAccountRawExposureAllowed: false,
    stage3IPrivacySeparateStorageRequired: true,
    stage3ICommercialAdExplicitConsentRequired: true,
    stage3ICommercialAdWithdrawalRequired: true,
    stage3IPointTermsRequiredBeforeOpen: true,
    stage3IPartnerAgreementRequiredBeforeSettlement: true,
    stage3IAdvertiserPrepaidTermsRequiredBeforeCharge: true,
    stage3IBreakageRevenueRecognitionBlockedUntilPolicyApproved: true,
    stage3IActualRewardOpenAllowed: false,
    stage3IControlledOpenExecutionAllowed: false,
    stage3ICashOutActualImplementationAllowed: false,
    stage3IPartnerSettlementActualImplementationAllowed: false,
    stage3IDbMigrationAllowed: false,
    stage3IProductionRewardMutation: false,
    stage3IProductionPointLedgerMutation: false,
    stage3IProductionCampaignBudgetMutation: false,
    stage3IProductionUsersBalanceMutation: false,
    stage3IProductionAdViewsMutation: false,
    stage3IProductionCashRedemptionRequestsMutation: false,
    stage3IProductionPartnerSettlementsMutation: false,
    stage3IDeployCommit: getDeployCommit(),
  };
}
