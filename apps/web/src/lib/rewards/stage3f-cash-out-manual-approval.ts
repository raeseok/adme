import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3F_CASH_OUT_MANUAL_APPROVAL_BUILD =
  "stage3f-cash-out-manual-approval-design";

export type Stage3FCashOutManualApprovalState = {
  stage3FCashOutManualApprovalDesign: true;
  stage3FCashOutActualProcessing: false;
  stage3FCashOutMutation: false;
  stage3FCashOutAutoTransfer: false;
  stage3FCashOutMinAmount: 10000;
  stage3FCashOutManualApprovalRequired: true;
  stage3FCashOutDeleteRollbackAllowed: false;
  stage3FCashOutAdjustmentReversalRequired: true;
  stage3FCashOutAccountRawRecorded: false;
  stage3FCashOutFullEmailRecorded: false;
  stage3FProductionRewardOpenFlag: false;
  stage3FRewardKillSwitch: true;
  stage3FControlledAllowlistActive: false;
  stage3FProductionRewardMutation: false;
  stage3FPointLedgerMutation: false;
  stage3FCampaignBudgetMutation: false;
  stage3FUsersBalanceMutation: false;
  stage3FAdViewsMutation: false;
  stage3FPartnerSettlementsMutation: false;
  stage3FCashOutProcessing: false;
  stage3FDeployCommit: string;
};

/**
 * Stage 3-F is design/preflight only. It must not derive any mutable cash-out,
 * allowlist, or reward-open state from environment variables.
 */
export function getStage3FCashOutManualApprovalState(): Stage3FCashOutManualApprovalState {
  return {
    stage3FCashOutManualApprovalDesign: true,
    stage3FCashOutActualProcessing: false,
    stage3FCashOutMutation: false,
    stage3FCashOutAutoTransfer: false,
    stage3FCashOutMinAmount: 10000,
    stage3FCashOutManualApprovalRequired: true,
    stage3FCashOutDeleteRollbackAllowed: false,
    stage3FCashOutAdjustmentReversalRequired: true,
    stage3FCashOutAccountRawRecorded: false,
    stage3FCashOutFullEmailRecorded: false,
    stage3FProductionRewardOpenFlag: false,
    stage3FRewardKillSwitch: true,
    stage3FControlledAllowlistActive: false,
    stage3FProductionRewardMutation: false,
    stage3FPointLedgerMutation: false,
    stage3FCampaignBudgetMutation: false,
    stage3FUsersBalanceMutation: false,
    stage3FAdViewsMutation: false,
    stage3FPartnerSettlementsMutation: false,
    stage3FCashOutProcessing: false,
    stage3FDeployCommit: getDeployCommit(),
  };
}
