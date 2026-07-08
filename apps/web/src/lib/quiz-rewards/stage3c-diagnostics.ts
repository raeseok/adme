import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";
import { STAGE3B_RPC_NAME } from "@/lib/stage3/stage3b-full-transaction";
import { extractSupabaseProjectRef } from "@/lib/stage3/readiness";
import {
  isStage3CProductionRewardBlocked,
  STAGE3C_DEV_SUPABASE_REF,
  STAGE3C_PROD_SUPABASE_REF,
} from "./stage3c-env-gate";

export const STAGE3C_BUILD =
  "stage3c-consumer-quiz-submit-ui-controlled-integration-production";

export const STAGE3C_SERVER_ACTION_PATH =
  "apps/web/src/app/consumer/ads/[campaignId]/actions.ts";

export type Stage3CDiagnosticsState = {
  stage3CConsumerQuizSubmitUi: true;
  stage3CControlledIntegration: true;
  stage3CServerActionOrRouteHandler: typeof STAGE3C_SERVER_ACTION_PATH;
  stage3CRpcName: typeof STAGE3B_RPC_NAME;
  stage3CClientDirectRpcCall: false;
  stage3CProductionRewardBlocked: boolean;
  stage3CProductionPointLedgerMutation: false;
  stage3CProductionCampaignBudgetMutation: false;
  stage3CProductionUsersBalanceMutation: false;
  stage3CProductionAdViewsMutation: false;
  stage3CProductionPartnerSettlementsMutation: false;
  stage3CProductionCashOutMutation: false;
  stage3CQuizAnswerExposure: false;
  stage3CAnswerHintOptionLabelExposure: false;
  stage3CPublicMarkerExposed: false;
  stage3CMinViewUiEnabled: true;
  stage3CWrongRetryUxEnabled: true;
  stage3CIdempotencyUxEnabled: true;
  stage3CBudgetInsufficientUxEnabled: true;
  stage3CProductionBlockedUxEnabled: true;
  stage3CServiceRoleUsed: false;
  stage3CDeployCommit: string;
  stage3CCurrentSupabaseProjectRef: string;
  stage3CDevSupabaseRef: typeof STAGE3C_DEV_SUPABASE_REF;
  stage3CProdSupabaseRef: typeof STAGE3C_PROD_SUPABASE_REF;
};

export function getStage3CDiagnosticsState(): Stage3CDiagnosticsState {
  return {
    stage3CConsumerQuizSubmitUi: true,
    stage3CControlledIntegration: true,
    stage3CServerActionOrRouteHandler: STAGE3C_SERVER_ACTION_PATH,
    stage3CRpcName: STAGE3B_RPC_NAME,
    stage3CClientDirectRpcCall: false,
    stage3CProductionRewardBlocked: isStage3CProductionRewardBlocked(),
    stage3CProductionPointLedgerMutation: false,
    stage3CProductionCampaignBudgetMutation: false,
    stage3CProductionUsersBalanceMutation: false,
    stage3CProductionAdViewsMutation: false,
    stage3CProductionPartnerSettlementsMutation: false,
    stage3CProductionCashOutMutation: false,
    stage3CQuizAnswerExposure: false,
    stage3CAnswerHintOptionLabelExposure: false,
    stage3CPublicMarkerExposed: false,
    stage3CMinViewUiEnabled: true,
    stage3CWrongRetryUxEnabled: true,
    stage3CIdempotencyUxEnabled: true,
    stage3CBudgetInsufficientUxEnabled: true,
    stage3CProductionBlockedUxEnabled: true,
    stage3CServiceRoleUsed: false,
    stage3CDeployCommit: getDeployCommit(),
    stage3CCurrentSupabaseProjectRef:
      extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      "unknown",
    stage3CDevSupabaseRef: STAGE3C_DEV_SUPABASE_REF,
    stage3CProdSupabaseRef: STAGE3C_PROD_SUPABASE_REF,
  };
}
