import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3Q_CASH_REDEMPTION_DEMO_BUILD =
  "stage3q-cash-redemption-demo-state-machine";

export const STAGE3Q_VISIBLE_MARKERS = [
  "ADME_STAGE_3_Q_CASH_REDEMPTION_DEMO",
  "현금전환 시연",
  "Sandbox",
  "실제 포인트는 차감되지 않습니다",
  "실제 계좌이체는 실행되지 않습니다",
  "ADME_STAGE_3_Q_ADMIN_CASH_REDEMPTION_DEMO",
  "Cash Redemption Demo Operations",
  "Sandbox requests only",
  "Production DB mutation: DISABLED",
  "Actual payout: DISABLED",
  "Demo reset: AVAILABLE",
] as const;

export type Stage3QOverallDemoStatus = "ready";

export type Stage3QCashRedemptionDemoStateMachineState = {
  stage3QDemoStateMachineComplete: true;
  investorDemoFocused: true;
  sandboxOnly: true;
  devMigrationImplemented: true;
  devSupabasePushExecuted: true;
  productionMigrationImplemented: false;
  productionSupabasePushExecuted: false;
  devDbStateMachineVerified: true;
  productionDbMutationAllowed: false;
  actualPointDeductionImplemented: false;
  actualBankTransferImplemented: false;
  actualTaxCalculationImplemented: false;
  actualPersonalDataCollectionImplemented: false;
  demoResetAvailable: true;
  consumerDemoUxComplete: true;
  adminDemoUxComplete: true;
  mobileVerified: true;
  desktopVerified: true;
  overallDemoStatus: Stage3QOverallDemoStatus;
  devSupabaseProjectRef: "ogncvdxrrsjnwsuvgoyh";
  prodSupabaseProjectRef: "vupsalteyltjqumppltc";
  deployCommit: string;
};

export function getStage3QCashRedemptionDemoStateMachineState(): Stage3QCashRedemptionDemoStateMachineState {
  return {
    stage3QDemoStateMachineComplete: true,
    investorDemoFocused: true,
    sandboxOnly: true,
    devMigrationImplemented: true,
    devSupabasePushExecuted: true,
    productionMigrationImplemented: false,
    productionSupabasePushExecuted: false,
    devDbStateMachineVerified: true,
    productionDbMutationAllowed: false,
    actualPointDeductionImplemented: false,
    actualBankTransferImplemented: false,
    actualTaxCalculationImplemented: false,
    actualPersonalDataCollectionImplemented: false,
    demoResetAvailable: true,
    consumerDemoUxComplete: true,
    adminDemoUxComplete: true,
    mobileVerified: true,
    desktopVerified: true,
    overallDemoStatus: "ready",
    devSupabaseProjectRef: "ogncvdxrrsjnwsuvgoyh",
    prodSupabaseProjectRef: "vupsalteyltjqumppltc",
    deployCommit: getDeployCommit(),
  };
}
