import { ShellCard } from "@/components/ShellCard";
import { getStage3EControlledOpenApprovalState } from "@/lib/rewards/stage3e-controlled-open-approval";
import { getStage3FCashOutManualApprovalState } from "@/lib/rewards/stage3f-cash-out-manual-approval";
import { getStage3DDiagnosticsState } from "@/lib/rewards/stage3d-diagnostics";
import { getStage3EDiagnosticsState } from "@/lib/rewards/stage3e-diagnostics";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function RewardPreflightPage() {
  const s = getStage3DDiagnosticsState();
  const e = getStage3EDiagnosticsState();
  const approval = getStage3EControlledOpenApprovalState();
  const cashOut = getStage3FCashOutManualApprovalState();

  return (
    <ShellCard title="AdMe Stage 3-D reward preflight">
      <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm font-medium text-sky-900">
        Production reward open preflight — actual mutation remains blocked
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/diagnostics"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          ← diagnostics 요약
        </Link>
      </p>

      <section
        aria-label="Stage 3-E controlled open approval markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-fuchsia-500 bg-fuchsia-50 px-3 py-3 font-mono text-xs text-fuchsia-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-E Controlled Open Approval
        </p>
        {Object.entries(approval).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section
        aria-label="Stage 3-F cash-out manual approval design markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-F Cash-out Manual Approval Design
        </p>
        {Object.entries(cashOut).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section
        aria-label="Stage 3-D production reward open preflight markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-sky-500 bg-sky-50 px-3 py-3 font-mono text-xs text-sky-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-D Production Reward Open Preflight
        </p>
        <p>stage3DBuild={s.stage3DBuild}</p>
        <p>
          stage3DProductionRewardOpenPreflight=
          {String(s.stage3DProductionRewardOpenPreflight)}
        </p>
        <p>
          stage3DProductionRewardOpenReady=
          {String(s.stage3DProductionRewardOpenReady)}
        </p>
        <p>
          stage3DProductionRewardMutation=
          {String(s.stage3DProductionRewardMutation)}
        </p>
        <p>
          stage3DProductionPointLedgerMutation=
          {String(s.stage3DProductionPointLedgerMutation)}
        </p>
        <p>
          stage3DProductionCampaignBudgetMutation=
          {String(s.stage3DProductionCampaignBudgetMutation)}
        </p>
        <p>
          stage3DProductionUsersBalanceMutation=
          {String(s.stage3DProductionUsersBalanceMutation)}
        </p>
        <p>
          stage3DProductionAdViewsMutation=
          {String(s.stage3DProductionAdViewsMutation)}
        </p>
        <p>
          stage3DProductionPartnerSettlementsMutation=
          {String(s.stage3DProductionPartnerSettlementsMutation)}
        </p>
        <p>
          stage3DProductionCashOutMutation=
          {String(s.stage3DProductionCashOutMutation)}
        </p>
        <p>
          stage3DReleaseFlagDesigned={String(s.stage3DReleaseFlagDesigned)}
        </p>
        <p>
          stage3DProductionRewardOpenFlag=
          {String(s.stage3DProductionRewardOpenFlag)}
        </p>
        <p>stage3DRewardKillSwitch={String(s.stage3DRewardKillSwitch)}</p>
        <p>
          stage3DRewardKillSwitchDefaultOn=
          {String(s.stage3DRewardKillSwitchDefaultOn)}
        </p>
        <p>
          stage3DProductionRewardPreflightOnly=
          {String(s.stage3DProductionRewardPreflightOnly)}
        </p>
        <p>
          stage3DControlledProductionAllowlistDesigned=
          {String(s.stage3DControlledProductionAllowlistDesigned)}
        </p>
        <p>
          stage3DControlledProductionAllowlistActive=
          {String(s.stage3DControlledProductionAllowlistActive)}
        </p>
        <p>
          stage3DControlledProductionAllowlistMutationEnabled=
          {String(s.stage3DControlledProductionAllowlistMutationEnabled)}
        </p>
        <p>
          stage3DKakaoSecretSafetyAttestationRequired=
          {String(s.stage3DKakaoSecretSafetyAttestationRequired)}
        </p>
        <p>
          stage3DKakaoSecretSafetyAttestationConfirmed=
          {String(s.stage3DKakaoSecretSafetyAttestationConfirmed)}
        </p>
        <p>stage3DKakaoSecretAttestedAt={s.stage3DKakaoSecretAttestedAt}</p>
        <p>
          stage3DKakaoSecretExposureSuspected=
          {String(s.stage3DKakaoSecretExposureSuspected)}
        </p>
        <p>
          stage3DKakaoSecretRawRecorded=
          {String(s.stage3DKakaoSecretRawRecorded)}
        </p>
        <p>
          stage3DKakaoSecretPartialHashDigestRecorded=
          {String(s.stage3DKakaoSecretPartialHashDigestRecorded)}
        </p>
        <p>
          stage3DKakaoSecretDevProviderConfigured=
          {String(s.stage3DKakaoSecretDevProviderConfigured)}
        </p>
        <p>
          stage3DKakaoSecretProdProviderConfigured=
          {String(s.stage3DKakaoSecretProdProviderConfigured)}
        </p>
        <p>
          stage3DKakaoOauthDevAuthorizeReverified=
          {String(s.stage3DKakaoOauthDevAuthorizeReverified)}
        </p>
        <p>
          stage3DKakaoOauthProdAuthorizeReverified=
          {String(s.stage3DKakaoOauthProdAuthorizeReverified)}
        </p>
        <p>
          stage3DKakaoOauthProdE2EReverified=
          {String(s.stage3DKakaoOauthProdE2EReverified)}
        </p>
        <p>
          stage3DKakaoSecretRotationRequired=
          {String(s.stage3DKakaoSecretRotationRequired)}
        </p>
        <p>
          stage3DKakaoSecretRotationPerformed=
          {String(s.stage3DKakaoSecretRotationPerformed)}
        </p>
        <p>
          stage3DKakaoSecretRawExposed=
          {String(s.stage3DKakaoSecretRawExposed)}
        </p>
        <p>
          stage3DOAuthCodeTokenExposed=
          {String(s.stage3DOAuthCodeTokenExposed)}
        </p>
        <p>
          stage3DKakaoSecretSafetyAttestationComplete=
          {String(s.stage3DKakaoSecretSafetyAttestationComplete)}
        </p>
        <p>
          stage3DCampaignBudgetSafetyCheckReady=
          {String(s.stage3DCampaignBudgetSafetyCheckReady)}
        </p>
        <p>
          stage3DCampaignBudgetReadOnly=
          {String(s.stage3DCampaignBudgetReadOnly)}
        </p>
        <p>
          stage3DPointLedgerAppendOnly=
          {String(s.stage3DPointLedgerAppendOnly)}
        </p>
        <p>
          stage3DPointLedgerDirectInsertPolicy=
          {String(s.stage3DPointLedgerDirectInsertPolicy)}
        </p>
        <p>
          stage3DPointLedgerUpdateDeleteAllowed=
          {String(s.stage3DPointLedgerUpdateDeleteAllowed)}
        </p>
        <p>
          stage3DUsersBalanceCacheConsistencyChecked=
          {String(s.stage3DUsersBalanceCacheConsistencyChecked)}
        </p>
        <p>
          stage3DUsersBalanceMutation=
          {String(s.stage3DUsersBalanceMutation)}
        </p>
        <p>
          stage3DIdempotencyReplayGuard=
          {String(s.stage3DIdempotencyReplayGuard)}
        </p>
        <p>
          stage3DIdempotencyReplayMutationInProduction=
          {String(s.stage3DIdempotencyReplayMutationInProduction)}
        </p>
        <p>
          stage3DDuplicateSubmitGuard=
          {String(s.stage3DDuplicateSubmitGuard)}
        </p>
        <p>
          stage3DDuplicateSubmitProductionMutation=
          {String(s.stage3DDuplicateSubmitProductionMutation)}
        </p>
        <p>stage3DMinViewGuard={String(s.stage3DMinViewGuard)}</p>
        <p>
          stage3DMinViewProductionMutation=
          {String(s.stage3DMinViewProductionMutation)}
        </p>
        <p>
          stage3DQuizAnswerExposure={String(s.stage3DQuizAnswerExposure)}
        </p>
        <p>
          stage3DAnswerHintExposure={String(s.stage3DAnswerHintExposure)}
        </p>
        <p>
          stage3DAnswerHintOptionLabelExposure=
          {String(s.stage3DAnswerHintOptionLabelExposure)}
        </p>
        <p>
          stage3DAbuseFraudPreflightPolicyReady=
          {String(s.stage3DAbuseFraudPreflightPolicyReady)}
        </p>
        <p>
          stage3DAbuseFraudRuntimeEngineReady=
          {String(s.stage3DAbuseFraudRuntimeEngineReady)}
        </p>
        <p>stage3DRlsRelaxed={String(s.stage3DRlsRelaxed)}</p>
        <p>
          stage3DAnonWritePolicyAdded=
          {String(s.stage3DAnonWritePolicyAdded)}
        </p>
        <p>
          stage3DServiceRoleClientExposure=
          {String(s.stage3DServiceRoleClientExposure)}
        </p>
        <p>
          stage3DQuizRawTableClientSelectable=
          {String(s.stage3DQuizRawTableClientSelectable)}
        </p>
        <p>
          stage3DAdvertiserPartnerRawAdViewsBlocked=
          {String(s.stage3DAdvertiserPartnerRawAdViewsBlocked)}
        </p>
        <p>
          stage3DPartnerSettlementsOutOfScope=
          {String(s.stage3DPartnerSettlementsOutOfScope)}
        </p>
        <p>
          stage3DCashOutOutOfScope={String(s.stage3DCashOutOutOfScope)}
        </p>
        <p>
          stage3DPartnerSettlementsMutation=
          {String(s.stage3DPartnerSettlementsMutation)}
        </p>
        <p>
          stage3DCashOutMutation={String(s.stage3DCashOutMutation)}
        </p>
        <p>
          stage3DKillSwitchDesigned={String(s.stage3DKillSwitchDesigned)}
        </p>
        <p>
          stage3DRollbackPlanReady={String(s.stage3DRollbackPlanReady)}
        </p>
        <p>
          stage3DAdjustMutationExecuted=
          {String(s.stage3DAdjustMutationExecuted)}
        </p>
        <p>
          stage3DAuditLogContractReady=
          {String(s.stage3DAuditLogContractReady)}
        </p>
        <p>
          stage3DAuditLogProductionInsert=
          {String(s.stage3DAuditLogProductionInsert)}
        </p>
        <p>
          stage3DAuditRedactionRequired=
          {String(s.stage3DAuditRedactionRequired)}
        </p>
        <p>
          stage3DPublicMarkerExposed={String(s.stage3DPublicMarkerExposed)}
        </p>
        <p>
          stage3DMutationBlockedByFlags=
          {String(s.stage3DMutationBlockedByFlags)}
        </p>
        <p>
          stage3DCurrentSupabaseProjectRef=
          {s.stage3DCurrentSupabaseProjectRef}
        </p>
        <p>stage3DDevSupabaseRef={s.stage3DDevSupabaseRef}</p>
        <p>stage3DProdSupabaseRef={s.stage3DProdSupabaseRef}</p>
        <p>stage3DDeployCommit={s.stage3DDeployCommit}</p>
      </section>
      <section
        aria-label="Stage 3-E runtime fraud engine controlled open preflight markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-purple-500 bg-purple-50 px-3 py-3 font-mono text-xs text-purple-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-E Runtime Fraud Engine Controlled Open Preflight
        </p>
        <p>stage3EBuild={e.stage3EBuild}</p>
        <p>stage3EPreflightEnabled={String(e.stage3EPreflightEnabled)}</p>
        <p>stage3EFraudEnginePresent={String(e.stage3EFraudEnginePresent)}</p>
        <p>stage3EFraudEngineBuild={e.stage3EFraudEngineBuild}</p>
        <p>stage3EFraudEngineServerOnly={String(e.stage3EFraudEngineServerOnly)}</p>
        <p>stage3EFraudReasonCodeCount={e.stage3EFraudReasonCodeCount}</p>
        <p>stage3EFraudReasonCodesDocumented={String(e.stage3EFraudReasonCodesDocumented)}</p>
        <p>stage3EFraudDecisionShapeReady={String(e.stage3EFraudDecisionShapeReady)}</p>
        <p>stage3EProductionRewardOpen={String(e.stage3EProductionRewardOpen)}</p>
        <p>stage3EKillSwitch={String(e.stage3EKillSwitch)}</p>
        <p>stage3EKillSwitchPriority={String(e.stage3EKillSwitchPriority)}</p>
        <p>stage3EKillSwitchDecisionReason={e.stage3EKillSwitchDecisionReason}</p>
        <p>stage3EControlledAllowlistDesigned={String(e.stage3EControlledAllowlistDesigned)}</p>
        <p>stage3EControlledAllowlistActive={String(e.stage3EControlledAllowlistActive)}</p>
        <p>stage3EControlledAllowlistRawExposed={String(e.stage3EControlledAllowlistRawExposed)}</p>
        <p>stage3EControlledAllowlistUserCount={e.stage3EControlledAllowlistUserCount}</p>
        <p>stage3EControlledAllowlistCampaignCount={e.stage3EControlledAllowlistCampaignCount}</p>
        <p>stage3EControlledMaxRewardCountConfigured={String(e.stage3EControlledMaxRewardCountConfigured)}</p>
        <p>stage3EControlledMaxRewardAmountPerUserConfigured={String(e.stage3EControlledMaxRewardAmountPerUserConfigured)}</p>
        <p>stage3EControlledMaxTotalRewardAmountConfigured={String(e.stage3EControlledMaxTotalRewardAmountConfigured)}</p>
        <p>stage3EControlledMaxCampaignSpendConfigured={String(e.stage3EControlledMaxCampaignSpendConfigured)}</p>
        <p>stage3EControlledRewardWindowConfigured={String(e.stage3EControlledRewardWindowConfigured)}</p>
        <p>stage3EControlledOperatorApprovalConfigured={String(e.stage3EControlledOperatorApprovalConfigured)}</p>
        <p>stage3EProductionRewardPreflightOnly={String(e.stage3EProductionRewardPreflightOnly)}</p>
        <p>stage3EProductionRewardMutation={String(e.stage3EProductionRewardMutation)}</p>
        <p>stage3EProductionPointLedgerMutation={String(e.stage3EProductionPointLedgerMutation)}</p>
        <p>stage3EProductionCampaignBudgetMutation={String(e.stage3EProductionCampaignBudgetMutation)}</p>
        <p>stage3EProductionUsersBalanceMutation={String(e.stage3EProductionUsersBalanceMutation)}</p>
        <p>stage3EProductionAdViewsMutation={String(e.stage3EProductionAdViewsMutation)}</p>
        <p>stage3EProductionPartnerSettlementsMutation={String(e.stage3EProductionPartnerSettlementsMutation)}</p>
        <p>stage3EProductionCashOutMutation={String(e.stage3EProductionCashOutMutation)}</p>
        <p>stage3EStage3BProductionBlockMaintained={String(e.stage3EStage3BProductionBlockMaintained)}</p>
        <p>stage3EStage3CProductionBlockMaintained={String(e.stage3EStage3CProductionBlockMaintained)}</p>
        <p>stage3EPointLedgerIdempotencyGuard={String(e.stage3EPointLedgerIdempotencyGuard)}</p>
        <p>stage3EPointLedgerDuplicateInsert={String(e.stage3EPointLedgerDuplicateInsert)}</p>
        <p>stage3ECampaignBudgetAtomicityGuard={String(e.stage3ECampaignBudgetAtomicityGuard)}</p>
        <p>stage3ECampaignBudgetNegativeAllowed={String(e.stage3ECampaignBudgetNegativeAllowed)}</p>
        <p>stage3EUsersBalanceCacheConsistencyGuard={String(e.stage3EUsersBalanceCacheConsistencyGuard)}</p>
        <p>stage3EAdViewsRewardMutationBlockedWhenFraudBlocked={String(e.stage3EAdViewsRewardMutationBlockedWhenFraudBlocked)}</p>
        <p>stage3ECashOutOpen={String(e.stage3ECashOutOpen)}</p>
        <p>stage3EPartnerSettlementsOpen={String(e.stage3EPartnerSettlementsOpen)}</p>
        <p>stage3EQuizAnswerExposed={String(e.stage3EQuizAnswerExposed)}</p>
        <p>stage3EAnswerHintExposed={String(e.stage3EAnswerHintExposed)}</p>
        <p>stage3ERlsRelaxed={String(e.stage3ERlsRelaxed)}</p>
        <p>stage3EServiceRoleExposed={String(e.stage3EServiceRoleExposed)}</p>
        <p>stage3EPublicMarkerExposed={String(e.stage3EPublicMarkerExposed)}</p>
        <p>stage3EOAuthCodeTokenExposed={String(e.stage3EOAuthCodeTokenExposed)}</p>
        <p>stage3ESecretRawPartialHashDigestRecorded={String(e.stage3ESecretRawPartialHashDigestRecorded)}</p>
        <p>stage3EMutationBlockedByFlags={String(e.stage3EMutationBlockedByFlags)}</p>
        <p>stage3ECurrentSupabaseProjectRef={e.stage3ECurrentSupabaseProjectRef}</p>
        <p>stage3EDevSupabaseRef={e.stage3EDevSupabaseRef}</p>
        <p>stage3EProdSupabaseRef={e.stage3EProdSupabaseRef}</p>
        <p>stage3EDeployCommit={e.stage3EDeployCommit}</p>
      </section>
    </ShellCard>
  );
}
