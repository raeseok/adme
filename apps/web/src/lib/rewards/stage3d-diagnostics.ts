import "server-only";

import { getDeployCommit } from "@/lib/deploy-info";
import { extractSupabaseProjectRef } from "@/lib/stage3/readiness";
import {
  getKakaoSecretRotationAttestation,
  isKakaoSecretRotationPreflightComplete,
} from "./kakao-secret-attestation";
import {
  getRewardReleaseFlags,
  isAllowlistActive,
  isProductionRewardMutationBlockedByFlags,
} from "./release-flags";

export const STAGE3D_BUILD =
  "stage3d-production-reward-open-preflight";

export const STAGE3D_DEV_SUPABASE_REF = "ogncvdxrrsjnwsuvgoyh";
export const STAGE3D_PROD_SUPABASE_REF = "vupsalteyltjqumppltc";

export type Stage3DDiagnosticsState = {
  stage3DBuild: typeof STAGE3D_BUILD;
  stage3DProductionRewardOpenPreflight: true;
  stage3DProductionRewardOpenReady: false;
  stage3DProductionRewardMutation: false;
  stage3DProductionPointLedgerMutation: false;
  stage3DProductionCampaignBudgetMutation: false;
  stage3DProductionUsersBalanceMutation: false;
  stage3DProductionAdViewsMutation: false;
  stage3DProductionPartnerSettlementsMutation: false;
  stage3DProductionCashOutMutation: false;
  stage3DReleaseFlagDesigned: true;
  stage3DProductionRewardOpenFlag: boolean;
  stage3DRewardKillSwitch: boolean;
  stage3DRewardKillSwitchDefaultOn: true;
  stage3DProductionRewardPreflightOnly: boolean;
  stage3DControlledProductionAllowlistDesigned: true;
  stage3DControlledProductionAllowlistActive: boolean;
  stage3DControlledProductionAllowlistMutationEnabled: false;
  stage3DKakaoSecretRotationRequired: boolean;
  stage3DKakaoSecretRotationConfirmed: boolean;
  stage3DKakaoSecretDevReapplied: boolean;
  stage3DKakaoSecretProdReapplied: boolean;
  stage3DKakaoOauthProdE2EReverified: boolean;
  stage3DKakaoSecretRawExposed: false;
  stage3DOAuthCodeTokenExposed: false;
  stage3DKakaoSecretRotationPreflightComplete: boolean;
  stage3DCampaignBudgetSafetyCheckReady: true;
  stage3DCampaignBudgetReadOnly: true;
  stage3DPointLedgerAppendOnly: true;
  stage3DPointLedgerDirectInsertPolicy: false;
  stage3DPointLedgerUpdateDeleteAllowed: false;
  stage3DUsersBalanceCacheConsistencyChecked: true;
  stage3DUsersBalanceMutation: false;
  stage3DIdempotencyReplayGuard: true;
  stage3DIdempotencyReplayMutationInProduction: false;
  stage3DDuplicateSubmitGuard: true;
  stage3DDuplicateSubmitProductionMutation: false;
  stage3DMinViewGuard: true;
  stage3DMinViewProductionMutation: false;
  stage3DQuizAnswerExposure: false;
  stage3DAnswerHintExposure: false;
  stage3DAnswerHintOptionLabelExposure: false;
  stage3DAbuseFraudPreflightPolicyReady: true;
  stage3DAbuseFraudRuntimeEngineReady: false;
  stage3DRlsRelaxed: false;
  stage3DAnonWritePolicyAdded: false;
  stage3DServiceRoleClientExposure: false;
  stage3DQuizRawTableClientSelectable: false;
  stage3DAdvertiserPartnerRawAdViewsBlocked: true;
  stage3DPartnerSettlementsOutOfScope: true;
  stage3DCashOutOutOfScope: true;
  stage3DPartnerSettlementsMutation: false;
  stage3DCashOutMutation: false;
  stage3DKillSwitchDesigned: true;
  stage3DRollbackPlanReady: true;
  stage3DAdjustMutationExecuted: false;
  stage3DAuditLogContractReady: true;
  stage3DAuditLogProductionInsert: false;
  stage3DAuditRedactionRequired: true;
  stage3DPublicMarkerExposed: false;
  stage3DMutationBlockedByFlags: boolean;
  stage3DDeployCommit: string;
  stage3DCurrentSupabaseProjectRef: string;
  stage3DDevSupabaseRef: typeof STAGE3D_DEV_SUPABASE_REF;
  stage3DProdSupabaseRef: typeof STAGE3D_PROD_SUPABASE_REF;
};

export function getStage3DDiagnosticsState(): Stage3DDiagnosticsState {
  const flags = getRewardReleaseFlags();
  const kakao = getKakaoSecretRotationAttestation();
  const allowlistActive = isAllowlistActive(flags);

  return {
    stage3DBuild: STAGE3D_BUILD,
    stage3DProductionRewardOpenPreflight: true,
    stage3DProductionRewardOpenReady: false,
    stage3DProductionRewardMutation: false,
    stage3DProductionPointLedgerMutation: false,
    stage3DProductionCampaignBudgetMutation: false,
    stage3DProductionUsersBalanceMutation: false,
    stage3DProductionAdViewsMutation: false,
    stage3DProductionPartnerSettlementsMutation: false,
    stage3DProductionCashOutMutation: false,
    stage3DReleaseFlagDesigned: true,
    stage3DProductionRewardOpenFlag: flags.productionRewardOpen,
    stage3DRewardKillSwitch: flags.killSwitch,
    stage3DRewardKillSwitchDefaultOn: true,
    stage3DProductionRewardPreflightOnly: flags.productionRewardPreflightOnly,
    stage3DControlledProductionAllowlistDesigned: true,
    stage3DControlledProductionAllowlistActive: allowlistActive,
    stage3DControlledProductionAllowlistMutationEnabled: false,
    stage3DKakaoSecretRotationRequired: kakao.rotationRequired,
    stage3DKakaoSecretRotationConfirmed: kakao.rotationConfirmed,
    stage3DKakaoSecretDevReapplied: kakao.devReapplied,
    stage3DKakaoSecretProdReapplied: kakao.prodReapplied,
    stage3DKakaoOauthProdE2EReverified: kakao.oauthProdE2EReverified,
    stage3DKakaoSecretRawExposed: false,
    stage3DOAuthCodeTokenExposed: false,
    stage3DKakaoSecretRotationPreflightComplete:
      isKakaoSecretRotationPreflightComplete(kakao),
    stage3DCampaignBudgetSafetyCheckReady: true,
    stage3DCampaignBudgetReadOnly: true,
    stage3DPointLedgerAppendOnly: true,
    stage3DPointLedgerDirectInsertPolicy: false,
    stage3DPointLedgerUpdateDeleteAllowed: false,
    stage3DUsersBalanceCacheConsistencyChecked: true,
    stage3DUsersBalanceMutation: false,
    stage3DIdempotencyReplayGuard: true,
    stage3DIdempotencyReplayMutationInProduction: false,
    stage3DDuplicateSubmitGuard: true,
    stage3DDuplicateSubmitProductionMutation: false,
    stage3DMinViewGuard: true,
    stage3DMinViewProductionMutation: false,
    stage3DQuizAnswerExposure: false,
    stage3DAnswerHintExposure: false,
    stage3DAnswerHintOptionLabelExposure: false,
    stage3DAbuseFraudPreflightPolicyReady: true,
    stage3DAbuseFraudRuntimeEngineReady: false,
    stage3DRlsRelaxed: false,
    stage3DAnonWritePolicyAdded: false,
    stage3DServiceRoleClientExposure: false,
    stage3DQuizRawTableClientSelectable: false,
    stage3DAdvertiserPartnerRawAdViewsBlocked: true,
    stage3DPartnerSettlementsOutOfScope: true,
    stage3DCashOutOutOfScope: true,
    stage3DPartnerSettlementsMutation: false,
    stage3DCashOutMutation: false,
    stage3DKillSwitchDesigned: true,
    stage3DRollbackPlanReady: true,
    stage3DAdjustMutationExecuted: false,
    stage3DAuditLogContractReady: true,
    stage3DAuditLogProductionInsert: false,
    stage3DAuditRedactionRequired: true,
    stage3DPublicMarkerExposed: false,
    stage3DMutationBlockedByFlags:
      isProductionRewardMutationBlockedByFlags(flags),
    stage3DDeployCommit: getDeployCommit(),
    stage3DCurrentSupabaseProjectRef:
      extractSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
      "unknown",
    stage3DDevSupabaseRef: STAGE3D_DEV_SUPABASE_REF,
    stage3DProdSupabaseRef: STAGE3D_PROD_SUPABASE_REF,
  };
}
