import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";

export const STAGE30_BUILD =
  "stage3-0-supabase-ledger-safety-readiness-production";

export const STAGE30_KNOWN_SINGLE_PROJECT_REF = "ogncvdxrrsjnwsuvgoyh";

export const STAGE30_TRANSACTION_CONTRACT_VERSION = "stage3-0-v1";

export type Stage30VercelEnv =
  | "production"
  | "preview"
  | "development"
  | "unknown";

export type Stage30ReadinessStatus =
  | "READY_FOR_STAGE3_DESIGN_ONLY"
  | "BLOCKED_DEV_PROD_NOT_SEPARATED"
  | "BLOCKED_ENV_UNKNOWN";

export type Stage30EnvMatch = "true" | "false" | "unknown";

export type Stage30ReadinessState = {
  stage30Build: string;
  stage30CurrentSupabaseProjectRef: string;
  stage30KnownSingleProjectRef: string;
  stage30VercelEnv: Stage30VercelEnv;
  stage30DeployCommit: string;
  stage30ExpectedProdSupabaseRefConfigured: boolean;
  stage30ExpectedDevSupabaseRefConfigured: boolean;
  stage30DevProdSupabaseSeparated: boolean;
  stage30CurrentEnvMatchesExpectedRef: Stage30EnvMatch;
  stage30ReadinessStatus: Stage30ReadinessStatus;
  stage30PointLedgerActualMutationEnabled: false;
  stage30QuizRewardActualMutationEnabled: false;
  stage30PointLedgerMutation: false;
  stage30CampaignBudgetMutation: false;
  stage30UsersBalanceMutation: false;
  stage30PartnerSettlementsMutation: false;
  stage30CashOutMutation: false;
  stage30KakaoActualSend: false;
  stage30ServiceRoleClientExposed: false;
  stage30RlsDisabled: false;
  stage30AnonWritePolicyAdded: false;
  stage30PublicMarkerExposed: false;
  stage30QuizAnswerClientExposure: false;
  stage30TransactionContractVersion: string;
};

/** Extract Supabase project-ref from URL — never returns keys or secrets. */
export function extractSupabaseProjectRef(
  url: string | undefined,
): string {
  if (!url) {
    return "";
  }

  try {
    const hostname = new URL(url).hostname;
    const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/i);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

export function getStage30VercelEnv(): Stage30VercelEnv {
  const vercelEnv = process.env.VERCEL_ENV;
  if (
    vercelEnv === "production" ||
    vercelEnv === "preview" ||
    vercelEnv === "development"
  ) {
    return vercelEnv;
  }

  if (process.env.VERCEL === "1") {
    return "unknown";
  }

  if (process.env.NODE_ENV === "development") {
    return "development";
  }

  return "unknown";
}

function resolveCurrentEnvMatchesExpectedRef(
  currentRef: string,
  expectedProdRef: string,
  expectedDevRef: string,
  devProdSeparated: boolean,
  vercelEnv: Stage30VercelEnv,
): Stage30EnvMatch {
  if (!devProdSeparated) {
    return "unknown";
  }

  if (vercelEnv === "production") {
    return currentRef === expectedProdRef ? "true" : "false";
  }

  if (vercelEnv === "preview" || vercelEnv === "development") {
    return currentRef === expectedDevRef ? "true" : "false";
  }

  return "unknown";
}

function resolveReadinessStatus(
  devProdSeparated: boolean,
  vercelEnv: Stage30VercelEnv,
): Stage30ReadinessStatus {
  if (vercelEnv === "unknown" && process.env.VERCEL === "1") {
    return "BLOCKED_ENV_UNKNOWN";
  }

  if (devProdSeparated) {
    return "READY_FOR_STAGE3_DESIGN_ONLY";
  }

  return "BLOCKED_DEV_PROD_NOT_SEPARATED";
}

export function getStage30ReadinessState(): Stage30ReadinessState {
  const currentRef = extractSupabaseProjectRef(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const expectedProdRef =
    process.env.ADME_EXPECTED_PROD_SUPABASE_REF?.trim() ?? "";
  const expectedDevRef =
    process.env.ADME_EXPECTED_DEV_SUPABASE_REF?.trim() ?? "";
  const expectedProdConfigured = expectedProdRef.length > 0;
  const expectedDevConfigured = expectedDevRef.length > 0;
  const devProdSeparated =
    expectedProdConfigured &&
    expectedDevConfigured &&
    expectedProdRef !== expectedDevRef;
  const vercelEnv = getStage30VercelEnv();

  return {
    stage30Build: STAGE30_BUILD,
    stage30CurrentSupabaseProjectRef: currentRef || "unknown",
    stage30KnownSingleProjectRef: STAGE30_KNOWN_SINGLE_PROJECT_REF,
    stage30VercelEnv: vercelEnv,
    stage30DeployCommit: getDeployCommit(),
    stage30ExpectedProdSupabaseRefConfigured: expectedProdConfigured,
    stage30ExpectedDevSupabaseRefConfigured: expectedDevConfigured,
    stage30DevProdSupabaseSeparated: devProdSeparated,
    stage30CurrentEnvMatchesExpectedRef: resolveCurrentEnvMatchesExpectedRef(
      currentRef,
      expectedProdRef,
      expectedDevRef,
      devProdSeparated,
      vercelEnv,
    ),
    stage30ReadinessStatus: resolveReadinessStatus(
      devProdSeparated,
      vercelEnv,
    ),
    stage30PointLedgerActualMutationEnabled: false,
    stage30QuizRewardActualMutationEnabled: false,
    stage30PointLedgerMutation: false,
    stage30CampaignBudgetMutation: false,
    stage30UsersBalanceMutation: false,
    stage30PartnerSettlementsMutation: false,
    stage30CashOutMutation: false,
    stage30KakaoActualSend: false,
    stage30ServiceRoleClientExposed: false,
    stage30RlsDisabled: false,
    stage30AnonWritePolicyAdded: false,
    stage30PublicMarkerExposed: false,
    stage30QuizAnswerClientExposure: false,
    stage30TransactionContractVersion: STAGE30_TRANSACTION_CONTRACT_VERSION,
  };
}
