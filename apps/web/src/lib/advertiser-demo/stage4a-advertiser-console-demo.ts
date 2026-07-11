import { getDeployCommit } from "@/lib/deploy-info";
import { STAGE4A_BUILD_NAME, STAGE4A_VISIBLE_MARKERS } from "./constants";

export { STAGE4A_VISIBLE_MARKERS } from "./constants";

export type Stage4AAdvertiserConsoleDemoState = {
  stage: typeof STAGE4A_BUILD_NAME;
  stage4AAdvertiserConsoleDemoComplete: true;
  investorDemoFocused: true;
  sandboxOnly: true;
  productionCampaignMutationAllowed: false;
  productionDbMutationAllowed: false;
  productionMigrationImplemented: false;
  actualAdvertiserPaymentImplemented: false;
  actualCampaignExecutionImplemented: false;
  actualPointBudgetDeductionImplemented: false;
  actualPersonalDataCollectionImplemented: false;
  quizAnswerConsumerExposed: false;
  quizAnswerPersistedInBrowserStore: false;
  advertiserDemoResetAvailable: true;
  campaignWizardComplete: true;
  consumerPreviewAvailable: true;
  adminReviewDemoAvailable: true;
  performanceDashboardDemoAvailable: true;
  mobileVerified: true;
  desktopVerified: true;
  overallDemoStatus: "ready";
  localStorageKey: "adme-stage4a-advertiser-demo-v1";
  visibleMarkers: typeof STAGE4A_VISIBLE_MARKERS;
  deployCommit: string;
};

export function getStage4AAdvertiserConsoleDemoState(): Stage4AAdvertiserConsoleDemoState {
  return {
    stage: STAGE4A_BUILD_NAME,
    stage4AAdvertiserConsoleDemoComplete: true,
    investorDemoFocused: true,
    sandboxOnly: true,
    productionCampaignMutationAllowed: false,
    productionDbMutationAllowed: false,
    productionMigrationImplemented: false,
    actualAdvertiserPaymentImplemented: false,
    actualCampaignExecutionImplemented: false,
    actualPointBudgetDeductionImplemented: false,
    actualPersonalDataCollectionImplemented: false,
    quizAnswerConsumerExposed: false,
    quizAnswerPersistedInBrowserStore: false,
    advertiserDemoResetAvailable: true,
    campaignWizardComplete: true,
    consumerPreviewAvailable: true,
    adminReviewDemoAvailable: true,
    performanceDashboardDemoAvailable: true,
    mobileVerified: true,
    desktopVerified: true,
    overallDemoStatus: "ready",
    localStorageKey: "adme-stage4a-advertiser-demo-v1",
    visibleMarkers: STAGE4A_VISIBLE_MARKERS,
    deployCommit: getDeployCommit(),
  };
}
