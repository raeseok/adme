import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3JR_PREPAID_THRESHOLD_DB_MIGRATION_DESIGN_REVIEW_BUILD =
  "stage3jr-prepaid-threshold-db-migration-design-review";

export type Stage3JRPrepaidThresholdDbMigrationDesignReviewState = {
  stage3JRPrepaidThresholdDbMigrationDesignReview: true;
  stage3JRDbMigrationDesignReviewed: true;
  stage3JRActualDbMigrationImplemented: false;
  stage3JRSupabaseDbPushExecuted: false;
  stage3JRRuntimeThresholdMonitoringImplemented: false;
  stage3JRCalculationSourceFinalized: false;
  stage3JRActualProductionThresholdValuesAvailable: false;
  stage3JRPointLedgerMutationImplemented: false;
  stage3JRThresholdGuardRpcImplemented: false;
  stage3JRReadOnlyDesignOnly: true;
  stage3JRRecommendedTablesDesigned: true;
  stage3JRRecommendedRlsDesigned: true;
  stage3JRRecommendedRpcDesigned: true;
  stage3JRRecommendedIndexesDesigned: true;
  stage3JRRecommendedAuditLogsDesigned: true;
  stage3JRRecommendedAdminPreflightDesigned: true;
  stage3JRThresholdUnknownBlocksIssuance: true;
  stage3JRHardStopBlocksIssuance: true;
  stage3JRThresholdExceededBlocksIssuance: true;
  stage3JRWarningRequiresRegistrationPreparation: true;
  stage3JRExceededRequiresRegistrationTrack: true;
  stage3JRQuarterEndOutstandingBalanceLimitKrw: 3000000000;
  stage3JRAnnualTotalIssuedLimitKrw: 50000000000;
  stage3JRWarningRatio: 0.8;
  stage3JRHardStopRatio: 0.95;
  stage3JRActualRewardOpenAllowed: false;
  stage3JRControlledOpenExecutionAllowed: false;
  stage3JRCashOutActualImplementationAllowed: false;
  stage3JRPartnerSettlementActualImplementationAllowed: false;
  stage3JRDbMigrationAllowed: false;
  stage3JRProductionRewardMutation: false;
  stage3JRProductionPointLedgerMutation: false;
  stage3JRProductionCampaignBudgetMutation: false;
  stage3JRProductionUsersBalanceMutation: false;
  stage3JRProductionAdViewsMutation: false;
  stage3JRProductionCashRedemptionRequestsMutation: false;
  stage3JRProductionPartnerSettlementsMutation: false;
  stage3JRDeployCommit: string;
};

/**
 * Stage 3-J-R records only the migration design review contract. It does not
 * create DB objects, calculate live threshold values, or enable reward mutation.
 */
export function getStage3JRPrepaidThresholdDbMigrationDesignReviewState(): Stage3JRPrepaidThresholdDbMigrationDesignReviewState {
  return {
    stage3JRPrepaidThresholdDbMigrationDesignReview: true,
    stage3JRDbMigrationDesignReviewed: true,
    stage3JRActualDbMigrationImplemented: false,
    stage3JRSupabaseDbPushExecuted: false,
    stage3JRRuntimeThresholdMonitoringImplemented: false,
    stage3JRCalculationSourceFinalized: false,
    stage3JRActualProductionThresholdValuesAvailable: false,
    stage3JRPointLedgerMutationImplemented: false,
    stage3JRThresholdGuardRpcImplemented: false,
    stage3JRReadOnlyDesignOnly: true,
    stage3JRRecommendedTablesDesigned: true,
    stage3JRRecommendedRlsDesigned: true,
    stage3JRRecommendedRpcDesigned: true,
    stage3JRRecommendedIndexesDesigned: true,
    stage3JRRecommendedAuditLogsDesigned: true,
    stage3JRRecommendedAdminPreflightDesigned: true,
    stage3JRThresholdUnknownBlocksIssuance: true,
    stage3JRHardStopBlocksIssuance: true,
    stage3JRThresholdExceededBlocksIssuance: true,
    stage3JRWarningRequiresRegistrationPreparation: true,
    stage3JRExceededRequiresRegistrationTrack: true,
    stage3JRQuarterEndOutstandingBalanceLimitKrw: 3000000000,
    stage3JRAnnualTotalIssuedLimitKrw: 50000000000,
    stage3JRWarningRatio: 0.8,
    stage3JRHardStopRatio: 0.95,
    stage3JRActualRewardOpenAllowed: false,
    stage3JRControlledOpenExecutionAllowed: false,
    stage3JRCashOutActualImplementationAllowed: false,
    stage3JRPartnerSettlementActualImplementationAllowed: false,
    stage3JRDbMigrationAllowed: false,
    stage3JRProductionRewardMutation: false,
    stage3JRProductionPointLedgerMutation: false,
    stage3JRProductionCampaignBudgetMutation: false,
    stage3JRProductionUsersBalanceMutation: false,
    stage3JRProductionAdViewsMutation: false,
    stage3JRProductionCashRedemptionRequestsMutation: false,
    stage3JRProductionPartnerSettlementsMutation: false,
    stage3JRDeployCommit: getDeployCommit(),
  };
}
