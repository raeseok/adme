import "server-only";

import { extractSupabaseProjectRef, getStage30VercelEnv } from "@/lib/stage3/readiness";

export const STAGE3C_DEV_SUPABASE_REF = "ogncvdxrrsjnwsuvgoyh";
export const STAGE3C_PROD_SUPABASE_REF = "vupsalteyltjqumppltc";

export type Stage3CEnvGateResult =
  | { allowed: true; reason: "STAGE3C_DEV_PREVIEW_ONLY" }
  | { allowed: false; reason: "STAGE3C_PRODUCTION_REWARD_BLOCKED" }
  | { allowed: false; reason: "STAGE3C_ENV_UNKNOWN" };

/** App-layer gate — Production must never attempt reward mutation. */
export function assertStage3CRewardMutationAllowed(): Stage3CEnvGateResult {
  const vercelEnv = getStage30VercelEnv();
  const currentRef = extractSupabaseProjectRef(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  if (vercelEnv === "production") {
    return { allowed: false, reason: "STAGE3C_PRODUCTION_REWARD_BLOCKED" };
  }

  if (currentRef === STAGE3C_PROD_SUPABASE_REF) {
    return { allowed: false, reason: "STAGE3C_PRODUCTION_REWARD_BLOCKED" };
  }

  if (currentRef === STAGE3C_DEV_SUPABASE_REF) {
    return { allowed: true, reason: "STAGE3C_DEV_PREVIEW_ONLY" };
  }

  return { allowed: false, reason: "STAGE3C_ENV_UNKNOWN" };
}

export function isStage3CProductionRewardBlocked(): boolean {
  return !assertStage3CRewardMutationAllowed().allowed;
}
