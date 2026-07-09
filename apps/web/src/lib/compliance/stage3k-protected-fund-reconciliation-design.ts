import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3K_PROTECTED_FUND_RECONCILIATION_DESIGN_BUILD =
  "stage3k-protected-fund-reconciliation-design";

export type Stage3KProtectedFundReconciliationDesignState = {
  stage3KProtectedFundPreflight: true;
  stage3KProtectedFundReconciliationDesign: true;
  stage3KProtectedFundReconciliationDesigned: true;
  stage3KProtectedFundStatusTaxonomyAligned: true;
  stage3KProtectedFundStatusUnknown: "unknown_blocked";
  stage3KProtectedFundStatusDeficit: "deficit_blocked";
  stage3KProtectedFundStatusMinimumCovered: "minimum_covered_warning";
  stage3KProtectedFundStatusBelowTargetBuffer: "covered_below_target_buffer";
  stage3KProtectedFundStatusTargetBufferOk: "target_buffer_ok";
  stage3KProtectedFundStatusNoLiability: "no_liability_observed";
  stage3KProtectedFundStatusSet: "unknown_blocked,deficit_blocked,minimum_covered_warning,covered_below_target_buffer,target_buffer_ok,no_liability_observed";
  stage3KProtectedFundRuntimeReconciliationImplemented: false;
  stage3KRuntimeReconciliationImplemented: false;
  stage3KProtectedFundDbMigrationImplemented: false;
  stage3KSupabaseDbPushExecuted: false;
  stage3KProtectedFundBankApiIntegrated: false;
  stage3KActualProtectedFundBalanceAvailable: false;
  stage3KProtectedFundCalculationSourceFinalized: false;
  stage3KCalculationSourceFinalized: false;
  stage3KReadOnlyDesignOnly: true;
  stage3KConsumerRedeemablePointLiabilityMustBeCovered: true;
  stage3KCoverageMinimumRatio: 1;
  stage3KCoverageWarningRatio: 1.05;
  stage3KCoverageTargetBufferRatio: 1.1;
  stage3KMinimumCoverageRatioBps: 10000;
  stage3KWarningCoverageRatioBps: 10500;
  stage3KTargetBufferCoverageRatioBps: 11000;
  stage3KCoverageUnknownBlocksCashOut: true;
  stage3KCoverageDeficitBlocksCashOut: true;
  stage3KCoverageUnknownBlocksRewardOpen: true;
  stage3KCoverageDeficitBlocksRewardOpen: true;
  stage3KDailyReconciliationRequired: true;
  stage3KManualReconciliationRequiredBeforeCashOut: true;
  stage3KManualReconciliationRequiredBeforeRewardOpen: true;
  stage3KSourceDigestRequired: true;
  stage3KIdempotencyRequired: true;
  stage3KAuditLogRequired: true;
  stage3KAdminReadOnlyPreflightRequired: true;
  stage3KServiceRoleOrSecurityDefinerWriteOnlyRecommended: true;
  stage3KConsumerAdvertiserPartnerDirectAccessBlocked: true;
  stage3KBankAccountRawExposureAllowed: false;
  stage3KBreakageRecognitionBlockedUntilPolicyApproved: true;
  stage3KActualRewardOpenAllowed: false;
  stage3KRewardOpenAllowed: false;
  stage3KControlledOpenExecutionAllowed: false;
  stage3KCashOutActualImplementationAllowed: false;
  stage3KCashOutActualProcessingAllowed: false;
  stage3KPartnerSettlementActualImplementationAllowed: false;
  stage3KDbMigrationAllowed: false;
  stage3KProductionMutation: false;
  stage3KProductionRewardMutation: false;
  stage3KProductionPointLedgerMutation: false;
  stage3KProductionCampaignBudgetMutation: false;
  stage3KProductionUsersBalanceMutation: false;
  stage3KProductionAdViewsMutation: false;
  stage3KProductionCashRedemptionRequestsMutation: false;
  stage3KProductionPartnerSettlementsMutation: false;
  stage3KDeployCommit: string;
};

/**
 * Stage 3-K is a conservative protected fund reconciliation design marker.
 * It is not a legal conclusion and does not read live balances or enable open.
 */
export function getStage3KProtectedFundReconciliationDesignState(): Stage3KProtectedFundReconciliationDesignState {
  return {
    stage3KProtectedFundPreflight: true,
    stage3KProtectedFundReconciliationDesign: true,
    stage3KProtectedFundReconciliationDesigned: true,
    stage3KProtectedFundStatusTaxonomyAligned: true,
    stage3KProtectedFundStatusUnknown: "unknown_blocked",
    stage3KProtectedFundStatusDeficit: "deficit_blocked",
    stage3KProtectedFundStatusMinimumCovered: "minimum_covered_warning",
    stage3KProtectedFundStatusBelowTargetBuffer: "covered_below_target_buffer",
    stage3KProtectedFundStatusTargetBufferOk: "target_buffer_ok",
    stage3KProtectedFundStatusNoLiability: "no_liability_observed",
    stage3KProtectedFundStatusSet:
      "unknown_blocked,deficit_blocked,minimum_covered_warning,covered_below_target_buffer,target_buffer_ok,no_liability_observed",
    stage3KProtectedFundRuntimeReconciliationImplemented: false,
    stage3KRuntimeReconciliationImplemented: false,
    stage3KProtectedFundDbMigrationImplemented: false,
    stage3KSupabaseDbPushExecuted: false,
    stage3KProtectedFundBankApiIntegrated: false,
    stage3KActualProtectedFundBalanceAvailable: false,
    stage3KProtectedFundCalculationSourceFinalized: false,
    stage3KCalculationSourceFinalized: false,
    stage3KReadOnlyDesignOnly: true,
    stage3KConsumerRedeemablePointLiabilityMustBeCovered: true,
    stage3KCoverageMinimumRatio: 1,
    stage3KCoverageWarningRatio: 1.05,
    stage3KCoverageTargetBufferRatio: 1.1,
    stage3KMinimumCoverageRatioBps: 10000,
    stage3KWarningCoverageRatioBps: 10500,
    stage3KTargetBufferCoverageRatioBps: 11000,
    stage3KCoverageUnknownBlocksCashOut: true,
    stage3KCoverageDeficitBlocksCashOut: true,
    stage3KCoverageUnknownBlocksRewardOpen: true,
    stage3KCoverageDeficitBlocksRewardOpen: true,
    stage3KDailyReconciliationRequired: true,
    stage3KManualReconciliationRequiredBeforeCashOut: true,
    stage3KManualReconciliationRequiredBeforeRewardOpen: true,
    stage3KSourceDigestRequired: true,
    stage3KIdempotencyRequired: true,
    stage3KAuditLogRequired: true,
    stage3KAdminReadOnlyPreflightRequired: true,
    stage3KServiceRoleOrSecurityDefinerWriteOnlyRecommended: true,
    stage3KConsumerAdvertiserPartnerDirectAccessBlocked: true,
    stage3KBankAccountRawExposureAllowed: false,
    stage3KBreakageRecognitionBlockedUntilPolicyApproved: true,
    stage3KActualRewardOpenAllowed: false,
    stage3KRewardOpenAllowed: false,
    stage3KControlledOpenExecutionAllowed: false,
    stage3KCashOutActualImplementationAllowed: false,
    stage3KCashOutActualProcessingAllowed: false,
    stage3KPartnerSettlementActualImplementationAllowed: false,
    stage3KDbMigrationAllowed: false,
    stage3KProductionMutation: false,
    stage3KProductionRewardMutation: false,
    stage3KProductionPointLedgerMutation: false,
    stage3KProductionCampaignBudgetMutation: false,
    stage3KProductionUsersBalanceMutation: false,
    stage3KProductionAdViewsMutation: false,
    stage3KProductionCashRedemptionRequestsMutation: false,
    stage3KProductionPartnerSettlementsMutation: false,
    stage3KDeployCommit: getDeployCommit(),
  };
}
