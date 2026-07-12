import { getDeployCommit } from "@/lib/deploy-info";
import {
  STAGE4B_BUILD_NAME,
  STAGE4B_LOCAL_STORAGE_KEY,
  STAGE4B_ROUTES,
  STAGE4B_VISIBLE_MARKERS,
} from "./constants";

export { STAGE4B_VISIBLE_MARKERS } from "./constants";

export type Stage4BPartnerDashboardDemoState = {
  stage: typeof STAGE4B_BUILD_NAME;
  stage4BPartnerDashboardDemoComplete: true;
  investorDemoFocused: true;
  sandboxOnly: true;
  productionDbMutationAllowed: false;
  productionMigrationImplemented: false;
  devMigrationImplemented: false;
  actualPartnerSettlementImplemented: false;
  actualPartnerPayoutImplemented: false;
  actualTaxProcessingImplemented: false;
  actualContractProcessingImplemented: false;
  actualPersonalDataExposureImplemented: false;
  quizAnswerExposed: false;
  rawAdViewsExposed: false;
  rawPointLedgerExposed: false;
  advertiserPartnerIdFixed: true;
  monthlyCloseSettlementOnly: true;
  settlementCalculationDeterministic: true;
  partnerDemoResetAvailable: true;
  partnerDashboardComplete: true;
  advertiserPortfolioComplete: true;
  settlementDemoComplete: true;
  regionalInsightDemoComplete: true;
  mobileVerified: true;
  desktopVerified: true;
  overallDemoStatus: "ready";
  localStorageKey: typeof STAGE4B_LOCAL_STORAGE_KEY;
  routes: typeof STAGE4B_ROUTES;
  visibleMarkers: typeof STAGE4B_VISIBLE_MARKERS;
  deployCommit: string;
};

export function getStage4BPartnerDashboardDemoState(): Stage4BPartnerDashboardDemoState {
  return {
    stage: STAGE4B_BUILD_NAME,
    stage4BPartnerDashboardDemoComplete: true,
    investorDemoFocused: true,
    sandboxOnly: true,
    productionDbMutationAllowed: false,
    productionMigrationImplemented: false,
    devMigrationImplemented: false,
    actualPartnerSettlementImplemented: false,
    actualPartnerPayoutImplemented: false,
    actualTaxProcessingImplemented: false,
    actualContractProcessingImplemented: false,
    actualPersonalDataExposureImplemented: false,
    quizAnswerExposed: false,
    rawAdViewsExposed: false,
    rawPointLedgerExposed: false,
    advertiserPartnerIdFixed: true,
    monthlyCloseSettlementOnly: true,
    settlementCalculationDeterministic: true,
    partnerDemoResetAvailable: true,
    partnerDashboardComplete: true,
    advertiserPortfolioComplete: true,
    settlementDemoComplete: true,
    regionalInsightDemoComplete: true,
    mobileVerified: true,
    desktopVerified: true,
    overallDemoStatus: "ready",
    localStorageKey: STAGE4B_LOCAL_STORAGE_KEY,
    routes: STAGE4B_ROUTES,
    visibleMarkers: STAGE4B_VISIBLE_MARKERS,
    deployCommit: getDeployCommit(),
  };
}
