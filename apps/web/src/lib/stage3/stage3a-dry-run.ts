import "server-only";

import { extractSupabaseProjectRef, getStage30VercelEnv } from "./readiness";
import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE3A_BUILD =
  "stage3a-point-ledger-dev-dry-run-production";

export const STAGE3A_RPC_NAME =
  "rpc_stage3a_dev_record_quiz_reward_dry_run" as const;

export const STAGE3A_DEV_SUPABASE_REF = "ogncvdxrrsjnwsuvgoyh";
export const STAGE3A_PROD_SUPABASE_REF = "vupsalteyltjqumppltc";

/** Fixed dry-run reward amount (BIGINT integer) — server authoritative. */
export const STAGE3A_DRY_RUN_REWARD_AMOUNT = 100;

export type Stage3ADiagnosticsState = {
  stage3ABuild: string;
  stage3AEnabled: true;
  stage3ADevOnlyMutation: true;
  stage3AProductionMutationBlocked: true;
  stage3APointLedgerAppendOnly: true;
  stage3AIdempotencyUnique: true;
  stage3AServiceRoleClientExposure: false;
  stage3AQuizAnswerExposure: false;
  stage3AProdPointLedgerMutation: false;
  stage3AProdQuizRewardMutation: false;
  stage3AProdCampaignBudgetMutation: false;
  stage3AProdUsersBalanceMutation: false;
  stage3AProdPartnerSettlementsMutation: false;
  stage3AProdCashOutMutation: false;
  stage3ARpcName: typeof STAGE3A_RPC_NAME;
  stage3ADeployCommit: string;
  stage3ACurrentSupabaseProjectRef: string;
  stage3APublicMarkerExposed: false;
};

export type Stage3AServerGateResult =
  | { allowed: true; reason: "STAGE3A_DEV_ONLY" }
  | { allowed: false; reason: "STAGE3A_PRODUCTION_BLOCKED" }
  | { allowed: false; reason: "STAGE3A_ENV_UNKNOWN" };

/**
 * App-layer gate: Production Vercel / prod Supabase ref must never call Stage 3-A mutation.
 * DB function also rejects prod JWT iss — dual boundary.
 */
export function assertStage3ADevOnlyMutationAllowed(): Stage3AServerGateResult {
  const vercelEnv = getStage30VercelEnv();
  const currentRef = extractSupabaseProjectRef(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  if (vercelEnv === "production") {
    return { allowed: false, reason: "STAGE3A_PRODUCTION_BLOCKED" };
  }

  if (currentRef === STAGE3A_PROD_SUPABASE_REF) {
    return { allowed: false, reason: "STAGE3A_PRODUCTION_BLOCKED" };
  }

  if (currentRef === STAGE3A_DEV_SUPABASE_REF) {
    return { allowed: true, reason: "STAGE3A_DEV_ONLY" };
  }

  return { allowed: false, reason: "STAGE3A_ENV_UNKNOWN" };
}

export function buildStage3AIdempotencyKey(params: {
  userId: string;
  campaignId: string;
  adViewId: string;
}): string {
  return `stage3a:${params.userId}:${params.campaignId}:quiz_reward:${params.adViewId}`;
}

export function getStage3ADiagnosticsState(): Stage3ADiagnosticsState {
  return {
    stage3ABuild: STAGE3A_BUILD,
    stage3AEnabled: true,
    stage3ADevOnlyMutation: true,
    stage3AProductionMutationBlocked: true,
    stage3APointLedgerAppendOnly: true,
    stage3AIdempotencyUnique: true,
    stage3AServiceRoleClientExposure: false,
    stage3AQuizAnswerExposure: false,
    stage3AProdPointLedgerMutation: false,
    stage3AProdQuizRewardMutation: false,
    stage3AProdCampaignBudgetMutation: false,
    stage3AProdUsersBalanceMutation: false,
    stage3AProdPartnerSettlementsMutation: false,
    stage3AProdCashOutMutation: false,
    stage3ARpcName: STAGE3A_RPC_NAME,
    stage3ADeployCommit: getDeployCommit(),
    stage3ACurrentSupabaseProjectRef:
      extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      "unknown",
    stage3APublicMarkerExposed: false,
  };
}
