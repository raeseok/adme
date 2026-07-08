import "server-only";

import { extractSupabaseProjectRef, getStage30VercelEnv } from "./readiness";
import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3B_BUILD =
  "stage3b-quiz-reward-full-transaction-dev-only-production";

export const STAGE3B_RPC_NAME =
  "rpc_stage3b_dev_submit_quiz_reward_transaction" as const;

export const STAGE3B_ENTRY_TYPE_CANONICAL = "quiz_reward" as const;
export const STAGE3B_LEGACY_STAGE3A_ENTRY_TYPE = "ad_reward" as const;

export const STAGE3B_DEV_SUPABASE_REF = "ogncvdxrrsjnwsuvgoyh";
export const STAGE3B_PROD_SUPABASE_REF = "vupsalteyltjqumppltc";

export type Stage3BDiagnosticsState = {
  stage3BFullTransactionDevOnly: true;
  stage3BRpcName: typeof STAGE3B_RPC_NAME;
  stage3BEntryTypeCanonical: typeof STAGE3B_ENTRY_TYPE_CANONICAL;
  stage3BLegacyStage3AEntryType: typeof STAGE3B_LEGACY_STAGE3A_ENTRY_TYPE;
  stage3BProductionMutationBlocked: true;
  stage3BProdPointLedgerMutation: false;
  stage3BProdCampaignBudgetMutation: false;
  stage3BProdUsersBalanceMutation: false;
  stage3BProdAdViewsMutation: false;
  stage3BQuizAnswerExposure: false;
  stage3BConsumerRoleOnly: true;
  stage3BAdvertiserRpcBlocked: true;
  stage3BPartnerRpcBlocked: true;
  stage3BAdminRpcBlocked: true;
  stage3BAdvertiserPartnerRawLedgerBlocked: true;
  stage3BPublicMarkerExposed: false;
  stage3BDeployCommit: string;
  stage3BCurrentSupabaseProjectRef: string;
};

export type Stage3BServerGateResult =
  | { allowed: true; reason: "STAGE3B_DEV_ONLY" }
  | { allowed: false; reason: "STAGE3B_PRODUCTION_BLOCKED" }
  | { allowed: false; reason: "STAGE3B_ENV_UNKNOWN" };

export function assertStage3BDevOnlyMutationAllowed(): Stage3BServerGateResult {
  const vercelEnv = getStage30VercelEnv();
  const currentRef = extractSupabaseProjectRef(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  if (vercelEnv === "production") {
    return { allowed: false, reason: "STAGE3B_PRODUCTION_BLOCKED" };
  }

  if (currentRef === STAGE3B_PROD_SUPABASE_REF) {
    return { allowed: false, reason: "STAGE3B_PRODUCTION_BLOCKED" };
  }

  if (currentRef === STAGE3B_DEV_SUPABASE_REF) {
    return { allowed: true, reason: "STAGE3B_DEV_ONLY" };
  }

  return { allowed: false, reason: "STAGE3B_ENV_UNKNOWN" };
}

export function buildStage3BIdempotencyKey(params: {
  userId: string;
  adViewId: string;
  campaignId: string;
  quizId: string;
}): string {
  return `stage3b:quiz_reward:${params.userId}:${params.adViewId}:${params.campaignId}:${params.quizId}`;
}

export function getStage3BDiagnosticsState(): Stage3BDiagnosticsState {
  return {
    stage3BFullTransactionDevOnly: true,
    stage3BRpcName: STAGE3B_RPC_NAME,
    stage3BEntryTypeCanonical: STAGE3B_ENTRY_TYPE_CANONICAL,
    stage3BLegacyStage3AEntryType: STAGE3B_LEGACY_STAGE3A_ENTRY_TYPE,
    stage3BProductionMutationBlocked: true,
    stage3BProdPointLedgerMutation: false,
    stage3BProdCampaignBudgetMutation: false,
    stage3BProdUsersBalanceMutation: false,
    stage3BProdAdViewsMutation: false,
    stage3BQuizAnswerExposure: false,
    stage3BConsumerRoleOnly: true,
    stage3BAdvertiserRpcBlocked: true,
    stage3BPartnerRpcBlocked: true,
    stage3BAdminRpcBlocked: true,
    stage3BAdvertiserPartnerRawLedgerBlocked: true,
    stage3BPublicMarkerExposed: false,
    stage3BDeployCommit: getDeployCommit(),
    stage3BCurrentSupabaseProjectRef:
      extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      "unknown",
  };
}
