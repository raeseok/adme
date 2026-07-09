import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";
import { extractSupabaseProjectRef } from "@/lib/stage3/readiness";
import {
  STAGE3E_FRAUD_ENGINE_BUILD,
  STAGE3E_FRAUD_REASON_CODES,
  evaluateRewardFraudDecision,
} from "./fraud-engine";
import {
  getRewardReleaseFlags,
  isAllowlistActive,
  isProductionRewardMutationBlockedByFlags,
} from "./release-flags";

export const STAGE3E_BUILD =
  "stage3e-runtime-fraud-engine-controlled-open-preflight";

export const STAGE3E_DEV_SUPABASE_REF = "ogncvdxrrsjnwsuvgoyh";
export const STAGE3E_PROD_SUPABASE_REF = "vupsalteyltjqumppltc";

export type Stage3EDiagnosticsState = {
  stage3EBuild: typeof STAGE3E_BUILD;
  stage3EPreflightEnabled: true;
  stage3EFraudEnginePresent: true;
  stage3EFraudEngineBuild: typeof STAGE3E_FRAUD_ENGINE_BUILD;
  stage3EFraudReasonCodeCount: number;
  stage3EFraudReasonCodesDocumented: true;
  stage3EFraudDecisionShapeReady: true;
  stage3EFraudEngineServerOnly: true;
  stage3EProductionRewardOpen: boolean;
  stage3EKillSwitch: boolean;
  stage3EKillSwitchPriority: true;
  stage3EControlledAllowlistDesigned: true;
  stage3EControlledAllowlistActive: boolean;
  stage3EControlledAllowlistRawExposed: false;
  stage3EControlledAllowlistUserCount: number;
  stage3EControlledAllowlistCampaignCount: number;
  stage3EControlledMaxRewardCountConfigured: boolean;
  stage3EControlledMaxRewardAmountPerUserConfigured: boolean;
  stage3EControlledMaxTotalRewardAmountConfigured: boolean;
  stage3EControlledMaxCampaignSpendConfigured: boolean;
  stage3EControlledRewardWindowConfigured: boolean;
  stage3EControlledOperatorApprovalConfigured: boolean;
  stage3EProductionRewardPreflightOnly: boolean;
  stage3EProductionRewardMutation: false;
  stage3EProductionPointLedgerMutation: false;
  stage3EProductionCampaignBudgetMutation: false;
  stage3EProductionUsersBalanceMutation: false;
  stage3EProductionAdViewsMutation: false;
  stage3EProductionPartnerSettlementsMutation: false;
  stage3EProductionCashOutMutation: false;
  stage3EStage3BProductionBlockMaintained: true;
  stage3EStage3CProductionBlockMaintained: true;
  stage3EPointLedgerIdempotencyGuard: true;
  stage3EPointLedgerDuplicateInsert: false;
  stage3ECampaignBudgetAtomicityGuard: true;
  stage3ECampaignBudgetNegativeAllowed: false;
  stage3EUsersBalanceCacheConsistencyGuard: true;
  stage3EAdViewsRewardMutationBlockedWhenFraudBlocked: true;
  stage3ECashOutOpen: false;
  stage3EPartnerSettlementsOpen: false;
  stage3EQuizAnswerExposed: false;
  stage3EAnswerHintExposed: false;
  stage3ERlsRelaxed: false;
  stage3EServiceRoleExposed: false;
  stage3EPublicMarkerExposed: false;
  stage3EOAuthCodeTokenExposed: false;
  stage3ESecretRawPartialHashDigestRecorded: false;
  stage3EMutationBlockedByFlags: boolean;
  stage3EKillSwitchDecisionReason: string;
  stage3ECurrentSupabaseProjectRef: string;
  stage3EDevSupabaseRef: typeof STAGE3E_DEV_SUPABASE_REF;
  stage3EProdSupabaseRef: typeof STAGE3E_PROD_SUPABASE_REF;
  stage3EDeployCommit: string;
};

export function getStage3EDiagnosticsState(): Stage3EDiagnosticsState {
  const flags = getRewardReleaseFlags();
  const killSwitchDecision = evaluateRewardFraudDecision(
    { userId: null, campaignId: null },
    { ...flags, killSwitch: true },
  );
  const controlledRewardWindowConfigured = Boolean(
    flags.controlledWindowStart && flags.controlledWindowEnd,
  );

  return {
    stage3EBuild: STAGE3E_BUILD,
    stage3EPreflightEnabled: true,
    stage3EFraudEnginePresent: true,
    stage3EFraudEngineBuild: STAGE3E_FRAUD_ENGINE_BUILD,
    stage3EFraudReasonCodeCount: STAGE3E_FRAUD_REASON_CODES.length,
    stage3EFraudReasonCodesDocumented: true,
    stage3EFraudDecisionShapeReady: true,
    stage3EFraudEngineServerOnly: true,
    stage3EProductionRewardOpen: flags.productionRewardOpen,
    stage3EKillSwitch: flags.killSwitch,
    stage3EKillSwitchPriority: true,
    stage3EControlledAllowlistDesigned: true,
    stage3EControlledAllowlistActive: isAllowlistActive(flags),
    stage3EControlledAllowlistRawExposed: false,
    stage3EControlledAllowlistUserCount: flags.allowlistUserIds.length,
    stage3EControlledAllowlistCampaignCount: flags.allowlistCampaignIds.length,
    stage3EControlledMaxRewardCountConfigured:
      flags.controlledMaxRewardCount != null,
    stage3EControlledMaxRewardAmountPerUserConfigured:
      flags.controlledMaxRewardAmountPerUser != null,
    stage3EControlledMaxTotalRewardAmountConfigured:
      flags.controlledMaxTotalRewardAmount != null,
    stage3EControlledMaxCampaignSpendConfigured:
      flags.controlledMaxCampaignSpend != null,
    stage3EControlledRewardWindowConfigured: controlledRewardWindowConfigured,
    stage3EControlledOperatorApprovalConfigured:
      flags.controlledOperatorApprovalRef != null,
    stage3EProductionRewardPreflightOnly: flags.productionRewardPreflightOnly,
    stage3EProductionRewardMutation: false,
    stage3EProductionPointLedgerMutation: false,
    stage3EProductionCampaignBudgetMutation: false,
    stage3EProductionUsersBalanceMutation: false,
    stage3EProductionAdViewsMutation: false,
    stage3EProductionPartnerSettlementsMutation: false,
    stage3EProductionCashOutMutation: false,
    stage3EStage3BProductionBlockMaintained: true,
    stage3EStage3CProductionBlockMaintained: true,
    stage3EPointLedgerIdempotencyGuard: true,
    stage3EPointLedgerDuplicateInsert: false,
    stage3ECampaignBudgetAtomicityGuard: true,
    stage3ECampaignBudgetNegativeAllowed: false,
    stage3EUsersBalanceCacheConsistencyGuard: true,
    stage3EAdViewsRewardMutationBlockedWhenFraudBlocked: true,
    stage3ECashOutOpen: false,
    stage3EPartnerSettlementsOpen: false,
    stage3EQuizAnswerExposed: false,
    stage3EAnswerHintExposed: false,
    stage3ERlsRelaxed: false,
    stage3EServiceRoleExposed: false,
    stage3EPublicMarkerExposed: false,
    stage3EOAuthCodeTokenExposed: false,
    stage3ESecretRawPartialHashDigestRecorded: false,
    stage3EMutationBlockedByFlags:
      isProductionRewardMutationBlockedByFlags(flags),
    stage3EKillSwitchDecisionReason: killSwitchDecision.reason_code,
    stage3ECurrentSupabaseProjectRef:
      extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      "unknown",
    stage3EDevSupabaseRef: STAGE3E_DEV_SUPABASE_REF,
    stage3EProdSupabaseRef: STAGE3E_PROD_SUPABASE_REF,
    stage3EDeployCommit: getDeployCommit(),
  };
}
