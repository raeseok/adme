import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3E_CONTROLLED_OPEN_APPROVAL_BUILD =
  "stage3e-controlled-open-approval";

export type Stage3EControlledOpenApprovalState = {
  stage3EControlledOpenApproval: true;
  stage3EControlledOpenApprovalOnly: true;
  stage3EActualOpenExecuted: false;
  stage3EProductionRewardOpenFlag: false;
  stage3ERewardKillSwitch: true;
  stage3EControlledAllowlistActive: false;
  stage3EControlledMaxUsers: 2;
  stage3EControlledMaxCampaigns: 1;
  stage3EControlledMaxRewardCountPerUser: 1;
  stage3EControlledMaxRewardAmountPerUser: 500;
  stage3EControlledMaxTotalRewardAmount: 1000;
  stage3ECashOutProcessing: false;
  stage3EPartnerSettlementProcessing: false;
  stage3EStage3BProductionBlockPreserved: true;
  stage3EStage3CProductionRewardBlockPreserved: true;
  stage3EDeployCommit: string;
};

/**
 * Stage 3-E-Controlled-Open-Approval is an approval package only.
 * It never derives an open state from env and never activates allowlists.
 */
export function getStage3EControlledOpenApprovalState(): Stage3EControlledOpenApprovalState {
  return {
    stage3EControlledOpenApproval: true,
    stage3EControlledOpenApprovalOnly: true,
    stage3EActualOpenExecuted: false,
    stage3EProductionRewardOpenFlag: false,
    stage3ERewardKillSwitch: true,
    stage3EControlledAllowlistActive: false,
    stage3EControlledMaxUsers: 2,
    stage3EControlledMaxCampaigns: 1,
    stage3EControlledMaxRewardCountPerUser: 1,
    stage3EControlledMaxRewardAmountPerUser: 500,
    stage3EControlledMaxTotalRewardAmount: 1000,
    stage3ECashOutProcessing: false,
    stage3EPartnerSettlementProcessing: false,
    stage3EStage3BProductionBlockPreserved: true,
    stage3EStage3CProductionRewardBlockPreserved: true,
    stage3EDeployCommit: getDeployCommit(),
  };
}
