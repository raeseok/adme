import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3HR_EXTERNAL_REVIEW_PACKAGE_BUILD =
  "stage3hr-external-review-package-attestation-prep";

export type Stage3HRExternalReviewPackageState = {
  stage3HRExternalReviewPackagePrepared: true;
  stage3HRLegalCounselQuestionnairePrepared: true;
  stage3HRTaxAccountantQuestionnairePrepared: true;
  stage3HRAttestationTemplatePrepared: true;
  stage3HRExternalReviewCompleted: false;
  stage3HRLegalApprovalRecorded: false;
  stage3HRTaxApprovalRecorded: false;
  stage3HRActualOpenAllowed: false;
  stage3HRDbMigrationAllowed: false;
  stage3HRProductionRewardMutation: false;
  stage3HRProductionPointLedgerMutation: false;
  stage3HRProductionCashRedemptionRequestsMutation: false;
  stage3HRProductionPartnerSettlementsMutation: false;
  stage3HRDeployCommit: string;
};

/**
 * Stage 3-H-R prepares external review materials only. External review
 * completion, approvals, actual open, migrations, and mutations stay false.
 */
export function getStage3HRExternalReviewPackageState(): Stage3HRExternalReviewPackageState {
  return {
    stage3HRExternalReviewPackagePrepared: true,
    stage3HRLegalCounselQuestionnairePrepared: true,
    stage3HRTaxAccountantQuestionnairePrepared: true,
    stage3HRAttestationTemplatePrepared: true,
    stage3HRExternalReviewCompleted: false,
    stage3HRLegalApprovalRecorded: false,
    stage3HRTaxApprovalRecorded: false,
    stage3HRActualOpenAllowed: false,
    stage3HRDbMigrationAllowed: false,
    stage3HRProductionRewardMutation: false,
    stage3HRProductionPointLedgerMutation: false,
    stage3HRProductionCashRedemptionRequestsMutation: false,
    stage3HRProductionPartnerSettlementsMutation: false,
    stage3HRDeployCommit: getDeployCommit(),
  };
}
