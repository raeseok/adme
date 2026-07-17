import { getDeployCommit } from "@/lib/deploy-info";
import {
  STAGE4A2_BUILD_NAME,
  STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ROUTE,
  STAGE4A2_VISIBLE_MARKERS,
  STAGE4A_BUILD_NAME,
  STAGE4A_VISIBLE_MARKERS,
} from "./constants";

export { STAGE4A_VISIBLE_MARKERS } from "./constants";
export { STAGE4A2_VISIBLE_MARKERS } from "./constants";

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

export type Stage4A2AdCreativeLinkDualQuizDemoState = {
  stage: typeof STAGE4A2_BUILD_NAME;
  stage4A2AdCreativeLinkDualQuizDemoComplete: true;
  creativeTypes: "text/image/video";
  landingLinkSafety: "safe https external link";
  quizTypes: "multiple choice / short answer";
  answerExposureGuardActive: true;
  advertiserBrowserStoreContainsNoAnswerValue: true;
  linkClickDoesNotGrantReward: true;
  productionDbMutationAllowed: false;
  productionMigrationImplemented: false;
  storageBucketCreated: false;
  actualCampaignMutationImplemented: false;
  consumerImageShortAnswerDemoRoute: typeof STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ROUTE;
  visibleMarkers: typeof STAGE4A2_VISIBLE_MARKERS;
  deployCommit: string;
};

export function getStage4A2AdCreativeLinkDualQuizDemoState(): Stage4A2AdCreativeLinkDualQuizDemoState {
  return {
    stage: STAGE4A2_BUILD_NAME,
    stage4A2AdCreativeLinkDualQuizDemoComplete: true,
    creativeTypes: "text/image/video",
    landingLinkSafety: "safe https external link",
    quizTypes: "multiple choice / short answer",
    answerExposureGuardActive: true,
    advertiserBrowserStoreContainsNoAnswerValue: true,
    linkClickDoesNotGrantReward: true,
    productionDbMutationAllowed: false,
    productionMigrationImplemented: false,
    storageBucketCreated: false,
    actualCampaignMutationImplemented: false,
    consumerImageShortAnswerDemoRoute: STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ROUTE,
    visibleMarkers: STAGE4A2_VISIBLE_MARKERS,
    deployCommit: getDeployCommit(),
  };
}
