import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3G_PARTNER_SETTLEMENT_MANUAL_APPROVAL_BUILD =
  "stage3g-partner-settlement-manual-approval-design";

export type Stage3GPartnerSettlementManualApprovalState = {
  stage3GPartnerSettlementManualApprovalDesign: true;
  stage3GPartnerSettlementActualProcessing: false;
  stage3GPartnerSettlementMutation: false;
  stage3GMonthlyCloseBatch: false;
  stage3GPartnerSettlementAutoPayout: false;
  stage3GAdvertiserPartnerAttributionLocked: true;
  stage3GDynamicPartnerLookupAllowed: false;
  stage3GQuizPassPartnerShareCalculation: false;
  stage3GMonthlyCloseRequired: true;
  stage3GNextMonthPayoutDay: 15;
  stage3GShareRateSnapshotRequired: true;
  stage3GSettlementIdempotencyRequired: true;
  stage3GSettlementUniqueKeyRequired: true;
  stage3GSettlementStatusMachineRequired: true;
  stage3GPaidUpdateBlockedRequired: true;
  stage3GChargebackNextMonthRequired: true;
  stage3GPartnerTerminationStatusRequired: true;
  stage3GAdvertiserPartnerIdNullAllowed: false;
  stage3GProductionRewardOpenFlag: false;
  stage3GRewardKillSwitch: true;
  stage3GControlledAllowlistActive: false;
  stage3GProductionRewardMutation: false;
  stage3GPointLedgerMutation: false;
  stage3GCampaignBudgetMutation: false;
  stage3GUsersBalanceMutation: false;
  stage3GAdViewsMutation: false;
  stage3GPartnerSettlementsMutation: false;
  stage3GCashRedemptionRequestsMutation: false;
  stage3GDeployCommit: string;
};

/**
 * Stage 3-G is design/preflight only. It must not derive mutable settlement
 * or payout state from environment variables.
 */
export function getStage3GPartnerSettlementManualApprovalState(): Stage3GPartnerSettlementManualApprovalState {
  return {
    stage3GPartnerSettlementManualApprovalDesign: true,
    stage3GPartnerSettlementActualProcessing: false,
    stage3GPartnerSettlementMutation: false,
    stage3GMonthlyCloseBatch: false,
    stage3GPartnerSettlementAutoPayout: false,
    stage3GAdvertiserPartnerAttributionLocked: true,
    stage3GDynamicPartnerLookupAllowed: false,
    stage3GQuizPassPartnerShareCalculation: false,
    stage3GMonthlyCloseRequired: true,
    stage3GNextMonthPayoutDay: 15,
    stage3GShareRateSnapshotRequired: true,
    stage3GSettlementIdempotencyRequired: true,
    stage3GSettlementUniqueKeyRequired: true,
    stage3GSettlementStatusMachineRequired: true,
    stage3GPaidUpdateBlockedRequired: true,
    stage3GChargebackNextMonthRequired: true,
    stage3GPartnerTerminationStatusRequired: true,
    stage3GAdvertiserPartnerIdNullAllowed: false,
    stage3GProductionRewardOpenFlag: false,
    stage3GRewardKillSwitch: true,
    stage3GControlledAllowlistActive: false,
    stage3GProductionRewardMutation: false,
    stage3GPointLedgerMutation: false,
    stage3GCampaignBudgetMutation: false,
    stage3GUsersBalanceMutation: false,
    stage3GAdViewsMutation: false,
    stage3GPartnerSettlementsMutation: false,
    stage3GCashRedemptionRequestsMutation: false,
    stage3GDeployCommit: getDeployCommit(),
  };
}
