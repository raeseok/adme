import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3J_PREPAID_THRESHOLD_MONITORING_ARCHITECTURE_BUILD =
  "stage3j-prepaid-threshold-monitoring-architecture";

export type Stage3JPrepaidThresholdMonitoringArchitectureState = {
  stage3JPrepaidThresholdMonitoringArchitectureDesign: true;
  stage3JThresholdMonitoringArchitectureDesigned: true;
  stage3JThresholdRuntimeMonitoringImplemented: false;
  stage3JThresholdDbMigrationImplemented: false;
  stage3JThresholdAdminDashboardActualDataImplemented: false;
  stage3JThresholdPreflightPlaceholderImplemented: true;
  stage3JQuarterEndOutstandingBalanceLimitKrw: 3000000000;
  stage3JAnnualTotalIssuedLimitKrw: 50000000000;
  stage3JBothLimitsMustRemainBelow: true;
  stage3JWarningRatio: 0.8;
  stage3JHardStopRatio: 0.95;
  stage3JQuarterEndOutstandingBalanceWarningKrw: 2400000000;
  stage3JQuarterEndOutstandingBalanceHardStopKrw: 2850000000;
  stage3JAnnualTotalIssuedWarningKrw: 40000000000;
  stage3JAnnualTotalIssuedHardStopKrw: 47500000000;
  stage3JThresholdUnknownBlocksIssuance: true;
  stage3JThresholdExceededBlocksIssuance: true;
  stage3JHardStopBlocksIssuance: true;
  stage3JWarningRequiresRegistrationPreparation: true;
  stage3JExceededRequiresRegistrationTrack: true;
  stage3JDailyAggregationRequired: true;
  stage3JQuarterEndSnapshotRequired: true;
  stage3JAnnualIssuedAggregationRequired: true;
  stage3JReconciliationRequiredBeforeActualOpen: true;
  stage3JCalculationSourceFinalized: false;
  stage3JActualProductionThresholdValuesAvailable: false;
  stage3JActualRewardOpenAllowed: false;
  stage3JControlledOpenExecutionAllowed: false;
  stage3JCashOutActualImplementationAllowed: false;
  stage3JPartnerSettlementActualImplementationAllowed: false;
  stage3JDbMigrationAllowed: false;
  stage3JProductionRewardMutation: false;
  stage3JProductionPointLedgerMutation: false;
  stage3JProductionCampaignBudgetMutation: false;
  stage3JProductionUsersBalanceMutation: false;
  stage3JProductionAdViewsMutation: false;
  stage3JProductionCashRedemptionRequestsMutation: false;
  stage3JProductionPartnerSettlementsMutation: false;
  stage3JDeployCommit: string;
};

/**
 * Stage 3-J is architecture/read-only preflight only. It records threshold
 * monitoring design constants without calculating production threshold values.
 */
export function getStage3JPrepaidThresholdMonitoringArchitectureState(): Stage3JPrepaidThresholdMonitoringArchitectureState {
  return {
    stage3JPrepaidThresholdMonitoringArchitectureDesign: true,
    stage3JThresholdMonitoringArchitectureDesigned: true,
    stage3JThresholdRuntimeMonitoringImplemented: false,
    stage3JThresholdDbMigrationImplemented: false,
    stage3JThresholdAdminDashboardActualDataImplemented: false,
    stage3JThresholdPreflightPlaceholderImplemented: true,
    stage3JQuarterEndOutstandingBalanceLimitKrw: 3000000000,
    stage3JAnnualTotalIssuedLimitKrw: 50000000000,
    stage3JBothLimitsMustRemainBelow: true,
    stage3JWarningRatio: 0.8,
    stage3JHardStopRatio: 0.95,
    stage3JQuarterEndOutstandingBalanceWarningKrw: 2400000000,
    stage3JQuarterEndOutstandingBalanceHardStopKrw: 2850000000,
    stage3JAnnualTotalIssuedWarningKrw: 40000000000,
    stage3JAnnualTotalIssuedHardStopKrw: 47500000000,
    stage3JThresholdUnknownBlocksIssuance: true,
    stage3JThresholdExceededBlocksIssuance: true,
    stage3JHardStopBlocksIssuance: true,
    stage3JWarningRequiresRegistrationPreparation: true,
    stage3JExceededRequiresRegistrationTrack: true,
    stage3JDailyAggregationRequired: true,
    stage3JQuarterEndSnapshotRequired: true,
    stage3JAnnualIssuedAggregationRequired: true,
    stage3JReconciliationRequiredBeforeActualOpen: true,
    stage3JCalculationSourceFinalized: false,
    stage3JActualProductionThresholdValuesAvailable: false,
    stage3JActualRewardOpenAllowed: false,
    stage3JControlledOpenExecutionAllowed: false,
    stage3JCashOutActualImplementationAllowed: false,
    stage3JPartnerSettlementActualImplementationAllowed: false,
    stage3JDbMigrationAllowed: false,
    stage3JProductionRewardMutation: false,
    stage3JProductionPointLedgerMutation: false,
    stage3JProductionCampaignBudgetMutation: false,
    stage3JProductionUsersBalanceMutation: false,
    stage3JProductionAdViewsMutation: false,
    stage3JProductionCashRedemptionRequestsMutation: false,
    stage3JProductionPartnerSettlementsMutation: false,
    stage3JDeployCommit: getDeployCommit(),
  };
}
