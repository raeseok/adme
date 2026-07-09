import { getSessionSnapshot } from "@/lib/auth/session";
import { getConsumerProfilePageData } from "@/lib/consumer-profile/page-data";
import { createClient } from "@/lib/supabase/server";
import {
  getAppStage,
  getDeployCommit,
  getRuntimeLabel,
  isSupabaseAnonKeyConfigured,
  isSupabaseUrlConfigured,
} from "@/lib/deploy-info";
import { ShellCard } from "@/components/ShellCard";
import { getStage3HLegalTaxPaymentComplianceState } from "@/lib/compliance/stage3h-legal-tax-payment-compliance";
import { getStage3HRExternalReviewPackageState } from "@/lib/compliance/stage3hr-external-review-package";
import { getStage3IThresholdBasedPrepaidExemptionAssumptionState } from "@/lib/compliance/stage3i-threshold-based-prepaid-exemption-assumption";
import { getStage3JPrepaidThresholdMonitoringArchitectureState } from "@/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture";
import { getStage3JRPrepaidThresholdDbMigrationDesignReviewState } from "@/lib/compliance/stage3jr-prepaid-threshold-db-migration-design-review";
import { getStage3KProtectedFundReconciliationDesignState } from "@/lib/compliance/stage3k-protected-fund-reconciliation-design";
import { STAGE1F_R_SOURCE } from "@/lib/regions/stage1f-r-source";
import { getStage30ReadinessState } from "@/lib/stage3/readiness";
import { getStage3ADiagnosticsState } from "@/lib/stage3/stage3a-dry-run";
import { getStage3BDiagnosticsState } from "@/lib/stage3/stage3b-full-transaction";
import { getStage3CDiagnosticsState } from "@/lib/quiz-rewards/stage3c-diagnostics";
import { getStage3EControlledOpenApprovalState } from "@/lib/rewards/stage3e-controlled-open-approval";
import { getStage3FCashOutManualApprovalState } from "@/lib/rewards/stage3f-cash-out-manual-approval";
import { getStage3GPartnerSettlementManualApprovalState } from "@/lib/rewards/stage3g-partner-settlement-manual-approval";
import { getStage3DDiagnosticsState } from "@/lib/rewards/stage3d-diagnostics";
import { getStage3EDiagnosticsState } from "@/lib/rewards/stage3e-diagnostics";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";

export const dynamic = "force-dynamic";

type DbCheckResult = {
  status: string;
  table: string;
  rowCheck: string;
  summary: string;
};

async function countTable(supabase: SupabaseClient, table: string) {
  return supabase.from(table).select("*", { count: "exact", head: true });
}

async function runDbCheck(): Promise<DbCheckResult> {
  if (!isSupabaseUrlConfigured() || !isSupabaseAnonKeyConfigured()) {
    return {
      status: "not tested",
      table: "",
      rowCheck: "skipped",
      summary: "환경변수 미설정",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return {
      status: "not tested",
      table: "",
      rowCheck: "skipped",
      summary: "클라이언트 생성 실패",
    };
  }

  const regions = await countTable(supabase, "regions");
  if (!regions.error) {
    return {
      status: "ok",
      table: "regions",
      rowCheck: String(regions.count ?? 0),
      summary: `read-only count: ${regions.count ?? 0}`,
    };
  }

  const categories = await countTable(supabase, "interest_categories");
  if (!categories.error) {
    return {
      status: "ok",
      table: "interest_categories",
      rowCheck: String(categories.count ?? 0),
      summary: `read-only count: ${categories.count ?? 0}`,
    };
  }

  return {
    status: "failed",
    table: "regions",
    rowCheck: "error",
    summary: "Error summary: read-only select failed",
  };
}

export default async function DiagnosticsPage() {
  const dbCheck = await runDbCheck();
  const deployCommit = getDeployCommit();
  const supabase = await createClient();
  const { snapshot } = await getSessionSnapshot();
  const pageData = await getConsumerProfilePageData(supabase);
  const isAuthenticated = snapshot.sessionStatus === "authenticated";
  const socialAuthProvider = snapshot.socialAuthProvider ?? "not_tested";
  const kakaoOAuthE2E =
    process.env.STAGE1DA_KAKAO_OAUTH_E2E ?? "not_tested";
  const stage1FCoverage = pageData.hierarchicalSeedCoverage;
  const stage1FCounts = pageData.regionLevelCounts;
  const molitBaselinePreserved = pageData.molitLegalDongBaselinePreserved;
  const stage30 = getStage30ReadinessState();
  const stage3A = getStage3ADiagnosticsState();
  const stage3B = getStage3BDiagnosticsState();
  const stage3C = getStage3CDiagnosticsState();
  const stage3D = getStage3DDiagnosticsState();
  const stage3E = getStage3EDiagnosticsState();
  const stage3EApproval = getStage3EControlledOpenApprovalState();
  const stage3FCashOut = getStage3FCashOutManualApprovalState();
  const stage3GPartnerSettlement = getStage3GPartnerSettlementManualApprovalState();
  const stage3HCompliance = getStage3HLegalTaxPaymentComplianceState();
  const stage3HRExternalReviewPackage = getStage3HRExternalReviewPackageState();
  const stage3IPrepaidExemptionAssumption =
    getStage3IThresholdBasedPrepaidExemptionAssumptionState();
  const stage3JThresholdMonitoringArchitecture =
    getStage3JPrepaidThresholdMonitoringArchitectureState();
  const stage3JRThresholdDbMigrationDesignReview =
    getStage3JRPrepaidThresholdDbMigrationDesignReviewState();
  const stage3KProtectedFundReconciliation =
    getStage3KProtectedFundReconciliationDesignState();

  return (
    <ShellCard title="AdMe diagnostics">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
        Stage 0.5-R diagnostics verified
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/reward-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-D reward preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/prepaid-threshold-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-J prepaid threshold preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/protected-fund-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-K protected fund preflight 상세 →
        </Link>
      </p>
      <section
        aria-label="Stage 3-K protected fund reconciliation design markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        <p className="font-sans text-sm font-semibold">
          Protected Fund Reconciliation Design
        </p>
        <p className="font-sans text-sm">
          Stage 3-K protected fund reconciliation is designed
        </p>
        <p className="font-sans text-sm">
          Runtime protected fund reconciliation is not implemented
        </p>
        <p className="font-sans text-sm">
          Actual protected fund balance is not available
        </p>
        <p className="font-sans text-sm">
          Actual reward open remains blocked
        </p>
        <p>stage3KProtectedFundStatusTaxonomyAligned=true</p>
        <p>
          stage3KProtectedFundStatusSet=unknown_blocked,deficit_blocked,minimum_covered_warning,covered_below_target_buffer,target_buffer_ok,no_liability_observed
        </p>
        {Object.entries(stage3KProtectedFundReconciliation).map(
          ([key, value]) => (
            <p key={key}>
              {key}={String(value)}
            </p>
          ),
        )}
      </section>
      <section
        aria-label="Stage 3-J-R prepaid threshold DB migration design review markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-violet-500 bg-violet-50 px-3 py-3 font-mono text-xs text-violet-950"
      >
        <p className="font-sans text-sm font-semibold">
          Prepaid Threshold DB Migration Design Review
        </p>
        <p className="font-sans text-sm">
          Stage 3-J-R prepaid threshold DB migration design is reviewed
        </p>
        <p className="font-sans text-sm">
          Actual DB migration is not implemented
        </p>
        <p className="font-sans text-sm">Supabase db push is not executed</p>
        <p className="font-sans text-sm">
          Runtime threshold monitoring remains blocked
        </p>
        {Object.entries(stage3JRThresholdDbMigrationDesignReview).map(
          ([key, value]) => (
            <p key={key}>
              {key}={String(value)}
            </p>
          ),
        )}
      </section>
      <section
        aria-label="Stage 3-J prepaid threshold monitoring architecture markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-blue-500 bg-blue-50 px-3 py-3 font-mono text-xs text-blue-950"
      >
        <p className="font-sans text-sm font-semibold">
          Prepaid Threshold Monitoring Architecture
        </p>
        <p className="font-sans text-sm">
          Stage 3-J prepaid threshold monitoring architecture is designed
        </p>
        <p className="font-sans text-sm">
          Runtime monitoring is not implemented
        </p>
        <p className="font-sans text-sm">
          Actual reward open remains blocked
        </p>
        {Object.entries(stage3JThresholdMonitoringArchitecture).map(
          ([key, value]) => (
            <p key={key}>
              {key}={String(value)}
            </p>
          ),
        )}
      </section>
      <section
        aria-label="Stage 3-I threshold based prepaid exemption assumption markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-rose-500 bg-rose-50 px-3 py-3 font-mono text-xs text-rose-950"
      >
        <p className="font-sans text-sm font-semibold">
          Threshold-Based Prepaid Registration Exemption Assumption
        </p>
        <p className="font-sans text-sm">
          Threshold-based prepaid registration exemption assumption is locked
        </p>
        <p className="font-sans text-sm">
          Initial operation assumes no prepaid business registration while
          exemption thresholds remain satisfied
        </p>
        <p className="font-sans text-sm">
          Quarter-end outstanding balance limit is 3,000,000,000 KRW
        </p>
        <p className="font-sans text-sm">
          Annual total issued limit is 50,000,000,000 KRW
        </p>
        <p className="font-sans text-sm">Threshold unknown blocks issuance</p>
        <p className="font-sans text-sm">
          Threshold exceeded switches to registration track
        </p>
        <p className="font-sans text-sm">
          Actual reward open remains blocked
        </p>
        <p className="font-sans text-sm">No production reward mutation</p>
        <p className="font-sans text-sm">No DB migration in Stage 3-I</p>
        {Object.entries(stage3IPrepaidExemptionAssumption).map(
          ([key, value]) => (
            <p key={key}>
              {key}={String(value)}
            </p>
          ),
        )}
      </section>
      <section
        aria-label="Stage 3-H-R external legal tax review package markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-orange-500 bg-orange-50 px-3 py-3 font-mono text-xs text-orange-950"
      >
        <p className="font-sans text-sm font-semibold">
          External Legal / Tax Review Package
        </p>
        <p className="font-sans text-sm">
          External legal and tax review package is prepared
        </p>
        <p className="font-sans text-sm">External review is not completed</p>
        <p className="font-sans text-sm">
          Actual reward open remains blocked
        </p>
        {Object.entries(stage3HRExternalReviewPackage).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
      <section
        aria-label="Stage 3-H legal tax payment compliance review markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-amber-500 bg-amber-50 px-3 py-3 font-mono text-xs text-amber-950"
      >
        <p className="font-sans text-sm font-semibold">
          Legal / Tax / Payment Compliance Review
        </p>
        <p className="font-sans text-sm">
          Actual reward open is blocked pending external legal and tax review
        </p>
        {Object.entries(stage3HCompliance).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
      <section
        aria-label="Stage 3-E controlled open approval markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-fuchsia-500 bg-fuchsia-50 px-3 py-3 font-mono text-xs text-fuchsia-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-E Controlled Open Approval
        </p>
        {Object.entries(stage3EApproval).map(([key, value]) => (
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
        {Object.entries(stage3FCashOut).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
      <section
        aria-label="Stage 3-G partner settlement manual approval design markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-cyan-500 bg-cyan-50 px-3 py-3 font-mono text-xs text-cyan-950"
      >
        <p className="font-sans text-sm font-semibold">
          Partner Settlement Manual Approval Design
        </p>
        <p className="font-sans text-sm">
          Actual partner settlement processing is blocked
        </p>
        <p className="font-sans text-sm">Monthly close batch is not implemented</p>
        <p className="font-sans text-sm">
          Partner payout action is not implemented
        </p>
        <p className="font-sans text-sm">
          advertisers.partner_id attribution is locked
        </p>
        {Object.entries(stage3GPartnerSettlement).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
      <section
        aria-label="Stage 3-D production reward open preflight summary markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-sky-500 bg-sky-50 px-3 py-3 font-mono text-xs text-sky-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-D Production Reward Open Preflight (summary)
        </p>
        <p>stage3DBuild={stage3D.stage3DBuild}</p>
        <p>
          stage3DProductionRewardOpenPreflight=
          {String(stage3D.stage3DProductionRewardOpenPreflight)}
        </p>
        <p>
          stage3DProductionRewardOpenReady=
          {String(stage3D.stage3DProductionRewardOpenReady)}
        </p>
        <p>
          stage3DProductionRewardMutation=
          {String(stage3D.stage3DProductionRewardMutation)}
        </p>
        <p>
          stage3DProductionPointLedgerMutation=
          {String(stage3D.stage3DProductionPointLedgerMutation)}
        </p>
        <p>
          stage3DProductionCampaignBudgetMutation=
          {String(stage3D.stage3DProductionCampaignBudgetMutation)}
        </p>
        <p>
          stage3DProductionUsersBalanceMutation=
          {String(stage3D.stage3DProductionUsersBalanceMutation)}
        </p>
        <p>
          stage3DProductionAdViewsMutation=
          {String(stage3D.stage3DProductionAdViewsMutation)}
        </p>
        <p>
          stage3DReleaseFlagDesigned=
          {String(stage3D.stage3DReleaseFlagDesigned)}
        </p>
        <p>
          stage3DProductionRewardOpenFlag=
          {String(stage3D.stage3DProductionRewardOpenFlag)}
        </p>
        <p>
          stage3DRewardKillSwitchDefaultOn=
          {String(stage3D.stage3DRewardKillSwitchDefaultOn)}
        </p>
        <p>
          stage3DRewardKillSwitch={String(stage3D.stage3DRewardKillSwitch)}
        </p>
        <p>
          stage3DControlledProductionAllowlistDesigned=
          {String(stage3D.stage3DControlledProductionAllowlistDesigned)}
        </p>
        <p>
          stage3DControlledProductionAllowlistActive=
          {String(stage3D.stage3DControlledProductionAllowlistActive)}
        </p>
        <p>
          stage3DKakaoSecretSafetyAttestationRequired=
          {String(stage3D.stage3DKakaoSecretSafetyAttestationRequired)}
        </p>
        <p>
          stage3DKakaoSecretSafetyAttestationConfirmed=
          {String(stage3D.stage3DKakaoSecretSafetyAttestationConfirmed)}
        </p>
        <p>
          stage3DKakaoSecretAttestedAt=
          {stage3D.stage3DKakaoSecretAttestedAt}
        </p>
        <p>
          stage3DKakaoSecretExposureSuspected=
          {String(stage3D.stage3DKakaoSecretExposureSuspected)}
        </p>
        <p>
          stage3DKakaoSecretRawRecorded=
          {String(stage3D.stage3DKakaoSecretRawRecorded)}
        </p>
        <p>
          stage3DKakaoSecretPartialHashDigestRecorded=
          {String(stage3D.stage3DKakaoSecretPartialHashDigestRecorded)}
        </p>
        <p>
          stage3DKakaoSecretDevProviderConfigured=
          {String(stage3D.stage3DKakaoSecretDevProviderConfigured)}
        </p>
        <p>
          stage3DKakaoSecretProdProviderConfigured=
          {String(stage3D.stage3DKakaoSecretProdProviderConfigured)}
        </p>
        <p>
          stage3DKakaoOauthDevAuthorizeReverified=
          {String(stage3D.stage3DKakaoOauthDevAuthorizeReverified)}
        </p>
        <p>
          stage3DKakaoOauthProdAuthorizeReverified=
          {String(stage3D.stage3DKakaoOauthProdAuthorizeReverified)}
        </p>
        <p>
          stage3DKakaoOauthProdE2EReverified=
          {String(stage3D.stage3DKakaoOauthProdE2EReverified)}
        </p>
        <p>
          stage3DKakaoSecretRotationRequired=
          {String(stage3D.stage3DKakaoSecretRotationRequired)}
        </p>
        <p>
          stage3DKakaoSecretRotationPerformed=
          {String(stage3D.stage3DKakaoSecretRotationPerformed)}
        </p>
        <p>
          stage3DKakaoSecretRawExposed=
          {String(stage3D.stage3DKakaoSecretRawExposed)}
        </p>
        <p>
          stage3DOAuthCodeTokenExposed=
          {String(stage3D.stage3DOAuthCodeTokenExposed)}
        </p>
        <p>
          stage3DPointLedgerAppendOnly=
          {String(stage3D.stage3DPointLedgerAppendOnly)}
        </p>
        <p>
          stage3DUsersBalanceCacheConsistencyChecked=
          {String(stage3D.stage3DUsersBalanceCacheConsistencyChecked)}
        </p>
        <p>
          stage3DIdempotencyReplayGuard=
          {String(stage3D.stage3DIdempotencyReplayGuard)}
        </p>
        <p>
          stage3DDuplicateSubmitGuard=
          {String(stage3D.stage3DDuplicateSubmitGuard)}
        </p>
        <p>stage3DMinViewGuard={String(stage3D.stage3DMinViewGuard)}</p>
        <p>
          stage3DQuizAnswerExposure=
          {String(stage3D.stage3DQuizAnswerExposure)}
        </p>
        <p>
          stage3DAnswerHintExposure=
          {String(stage3D.stage3DAnswerHintExposure)}
        </p>
        <p>stage3DRlsRelaxed={String(stage3D.stage3DRlsRelaxed)}</p>
        <p>
          stage3DServiceRoleClientExposure=
          {String(stage3D.stage3DServiceRoleClientExposure)}
        </p>
        <p>
          stage3DPublicMarkerExposed=
          {String(stage3D.stage3DPublicMarkerExposed)}
        </p>
        <p>
          stage3DAuditLogContractReady=
          {String(stage3D.stage3DAuditLogContractReady)}
        </p>
        <p>
          stage3DRollbackPlanReady={String(stage3D.stage3DRollbackPlanReady)}
        </p>
        <p>
          stage3DPartnerSettlementsOutOfScope=
          {String(stage3D.stage3DPartnerSettlementsOutOfScope)}
        </p>
        <p>
          stage3DCashOutOutOfScope={String(stage3D.stage3DCashOutOutOfScope)}
        </p>
        <p>
          stage3DMutationBlockedByFlags=
          {String(stage3D.stage3DMutationBlockedByFlags)}
        </p>
        <p>
          stage3DCurrentSupabaseProjectRef=
          {stage3D.stage3DCurrentSupabaseProjectRef}
        </p>
        <p>stage3DDeployCommit={stage3D.stage3DDeployCommit}</p>
      </section>
      <section
        aria-label="Stage 3-E runtime fraud engine controlled open preflight markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-purple-500 bg-purple-50 px-3 py-3 font-mono text-xs text-purple-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-E Runtime Fraud Engine · Controlled Open Preflight
        </p>
        <p>stage3EBuild={stage3E.stage3EBuild}</p>
        <p>stage3EPreflightEnabled={String(stage3E.stage3EPreflightEnabled)}</p>
        <p>stage3EFraudEnginePresent={String(stage3E.stage3EFraudEnginePresent)}</p>
        <p>stage3EFraudEngineServerOnly={String(stage3E.stage3EFraudEngineServerOnly)}</p>
        <p>stage3EFraudReasonCodesDocumented={String(stage3E.stage3EFraudReasonCodesDocumented)}</p>
        <p>stage3EFraudDecisionShapeReady={String(stage3E.stage3EFraudDecisionShapeReady)}</p>
        <p>stage3EProductionRewardOpen={String(stage3E.stage3EProductionRewardOpen)}</p>
        <p>stage3EKillSwitch={String(stage3E.stage3EKillSwitch)}</p>
        <p>stage3EKillSwitchPriority={String(stage3E.stage3EKillSwitchPriority)}</p>
        <p>stage3EKillSwitchDecisionReason={stage3E.stage3EKillSwitchDecisionReason}</p>
        <p>stage3EControlledAllowlistDesigned={String(stage3E.stage3EControlledAllowlistDesigned)}</p>
        <p>stage3EControlledAllowlistActive={String(stage3E.stage3EControlledAllowlistActive)}</p>
        <p>stage3EControlledAllowlistRawExposed={String(stage3E.stage3EControlledAllowlistRawExposed)}</p>
        <p>stage3EProductionRewardMutation={String(stage3E.stage3EProductionRewardMutation)}</p>
        <p>stage3EProductionPointLedgerMutation={String(stage3E.stage3EProductionPointLedgerMutation)}</p>
        <p>stage3EProductionCampaignBudgetMutation={String(stage3E.stage3EProductionCampaignBudgetMutation)}</p>
        <p>stage3EProductionUsersBalanceMutation={String(stage3E.stage3EProductionUsersBalanceMutation)}</p>
        <p>stage3EProductionAdViewsMutation={String(stage3E.stage3EProductionAdViewsMutation)}</p>
        <p>stage3EProductionPartnerSettlementsMutation={String(stage3E.stage3EProductionPartnerSettlementsMutation)}</p>
        <p>stage3EProductionCashOutMutation={String(stage3E.stage3EProductionCashOutMutation)}</p>
        <p>stage3EStage3BProductionBlockMaintained={String(stage3E.stage3EStage3BProductionBlockMaintained)}</p>
        <p>stage3EStage3CProductionBlockMaintained={String(stage3E.stage3EStage3CProductionBlockMaintained)}</p>
        <p>stage3EPointLedgerIdempotencyGuard={String(stage3E.stage3EPointLedgerIdempotencyGuard)}</p>
        <p>stage3ECampaignBudgetAtomicityGuard={String(stage3E.stage3ECampaignBudgetAtomicityGuard)}</p>
        <p>stage3ECashOutOpen={String(stage3E.stage3ECashOutOpen)}</p>
        <p>stage3EPartnerSettlementsOpen={String(stage3E.stage3EPartnerSettlementsOpen)}</p>
        <p>stage3EQuizAnswerExposed={String(stage3E.stage3EQuizAnswerExposed)}</p>
        <p>stage3EAnswerHintExposed={String(stage3E.stage3EAnswerHintExposed)}</p>
        <p>stage3ERlsRelaxed={String(stage3E.stage3ERlsRelaxed)}</p>
        <p>stage3EServiceRoleExposed={String(stage3E.stage3EServiceRoleExposed)}</p>
        <p>stage3EPublicMarkerExposed={String(stage3E.stage3EPublicMarkerExposed)}</p>
        <p>stage3EOAuthCodeTokenExposed={String(stage3E.stage3EOAuthCodeTokenExposed)}</p>
        <p>stage3ESecretRawPartialHashDigestRecorded={String(stage3E.stage3ESecretRawPartialHashDigestRecorded)}</p>
        <p>stage3EMutationBlockedByFlags={String(stage3E.stage3EMutationBlockedByFlags)}</p>
        <p>stage3ECurrentSupabaseProjectRef={stage3E.stage3ECurrentSupabaseProjectRef}</p>
        <p>stage3EDevSupabaseRef={stage3E.stage3EDevSupabaseRef}</p>
        <p>stage3EProdSupabaseRef={stage3E.stage3EProdSupabaseRef}</p>
        <p>stage3EDeployCommit={stage3E.stage3EDeployCommit}</p>
      </section>
      <section
        aria-label="Stage 3-C consumer quiz submit UI controlled integration markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-lime-500 bg-lime-50 px-3 py-3 font-mono text-xs text-lime-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-C Consumer Quiz Submit UI Controlled Integration (current)
        </p>
        <p>
          stage3CConsumerQuizSubmitUi=
          {String(stage3C.stage3CConsumerQuizSubmitUi)}
        </p>
        <p>
          stage3CControlledIntegration=
          {String(stage3C.stage3CControlledIntegration)}
        </p>
        <p>
          stage3CServerActionOrRouteHandler=
          {stage3C.stage3CServerActionOrRouteHandler}
        </p>
        <p>stage3CRpcName={stage3C.stage3CRpcName}</p>
        <p>
          stage3CClientDirectRpcCall=
          {String(stage3C.stage3CClientDirectRpcCall)}
        </p>
        <p>
          stage3CProductionRewardBlocked=
          {String(stage3C.stage3CProductionRewardBlocked)}
        </p>
        <p>
          stage3CProductionPointLedgerMutation=
          {String(stage3C.stage3CProductionPointLedgerMutation)}
        </p>
        <p>
          stage3CProductionCampaignBudgetMutation=
          {String(stage3C.stage3CProductionCampaignBudgetMutation)}
        </p>
        <p>
          stage3CProductionUsersBalanceMutation=
          {String(stage3C.stage3CProductionUsersBalanceMutation)}
        </p>
        <p>
          stage3CProductionAdViewsMutation=
          {String(stage3C.stage3CProductionAdViewsMutation)}
        </p>
        <p>
          stage3CProductionPartnerSettlementsMutation=
          {String(stage3C.stage3CProductionPartnerSettlementsMutation)}
        </p>
        <p>
          stage3CProductionCashOutMutation=
          {String(stage3C.stage3CProductionCashOutMutation)}
        </p>
        <p>
          stage3CQuizAnswerExposure=
          {String(stage3C.stage3CQuizAnswerExposure)}
        </p>
        <p>
          stage3CAnswerHintOptionLabelExposure=
          {String(stage3C.stage3CAnswerHintOptionLabelExposure)}
        </p>
        <p>
          stage3CPublicMarkerExposed=
          {String(stage3C.stage3CPublicMarkerExposed)}
        </p>
        <p>
          stage3CMinViewUiEnabled={String(stage3C.stage3CMinViewUiEnabled)}
        </p>
        <p>
          stage3CWrongRetryUxEnabled=
          {String(stage3C.stage3CWrongRetryUxEnabled)}
        </p>
        <p>
          stage3CIdempotencyUxEnabled=
          {String(stage3C.stage3CIdempotencyUxEnabled)}
        </p>
        <p>
          stage3CBudgetInsufficientUxEnabled=
          {String(stage3C.stage3CBudgetInsufficientUxEnabled)}
        </p>
        <p>
          stage3CProductionBlockedUxEnabled=
          {String(stage3C.stage3CProductionBlockedUxEnabled)}
        </p>
        <p>
          stage3CServiceRoleUsed={String(stage3C.stage3CServiceRoleUsed)}
        </p>
        <p>
          stage3CCurrentSupabaseProjectRef=
          {stage3C.stage3CCurrentSupabaseProjectRef}
        </p>
        <p>stage3CDeployCommit={stage3C.stage3CDeployCommit}</p>
      </section>
      <section
        aria-label="Stage 3-B quiz reward full transaction dev-only markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-3 font-mono text-xs text-amber-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-B Quiz Reward Full Transaction Dev-Only (current)
        </p>
        <p>
          stage3BFullTransactionDevOnly=
          {String(stage3B.stage3BFullTransactionDevOnly)}
        </p>
        <p>stage3BRpcName={stage3B.stage3BRpcName}</p>
        <p>stage3BEntryTypeCanonical={stage3B.stage3BEntryTypeCanonical}</p>
        <p>
          stage3BLegacyStage3AEntryType={stage3B.stage3BLegacyStage3AEntryType}
        </p>
        <p>
          stage3BProductionMutationBlocked=
          {String(stage3B.stage3BProductionMutationBlocked)}
        </p>
        <p>
          stage3BProdPointLedgerMutation=
          {String(stage3B.stage3BProdPointLedgerMutation)}
        </p>
        <p>
          stage3BProdCampaignBudgetMutation=
          {String(stage3B.stage3BProdCampaignBudgetMutation)}
        </p>
        <p>
          stage3BProdUsersBalanceMutation=
          {String(stage3B.stage3BProdUsersBalanceMutation)}
        </p>
        <p>
          stage3BProdAdViewsMutation=
          {String(stage3B.stage3BProdAdViewsMutation)}
        </p>
        <p>
          stage3BQuizAnswerExposure=
          {String(stage3B.stage3BQuizAnswerExposure)}
        </p>
        <p>
          stage3BConsumerRoleOnly={String(stage3B.stage3BConsumerRoleOnly)}
        </p>
        <p>
          stage3BAdvertiserRpcBlocked=
          {String(stage3B.stage3BAdvertiserRpcBlocked)}
        </p>
        <p>
          stage3BPartnerRpcBlocked={String(stage3B.stage3BPartnerRpcBlocked)}
        </p>
        <p>stage3BAdminRpcBlocked={String(stage3B.stage3BAdminRpcBlocked)}</p>
        <p>
          stage3BAdvertiserPartnerRawLedgerBlocked=
          {String(stage3B.stage3BAdvertiserPartnerRawLedgerBlocked)}
        </p>
        <p>
          stage3BPublicMarkerExposed=
          {String(stage3B.stage3BPublicMarkerExposed)}
        </p>
        <p>
          stage3BCurrentSupabaseProjectRef=
          {stage3B.stage3BCurrentSupabaseProjectRef}
        </p>
        <p>stage3BDeployCommit={stage3B.stage3BDeployCommit}</p>
      </section>
      <section
        aria-label="Stage 3-A point ledger dev-only dry-run markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-rose-400 bg-rose-50 px-3 py-3 font-mono text-xs text-rose-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-A Point Ledger Dev-Only Dry-Run (current)
        </p>
        <p>stage3ABuild={stage3A.stage3ABuild}</p>
        <p>stage3AEnabled={String(stage3A.stage3AEnabled)}</p>
        <p>stage3ADevOnlyMutation={String(stage3A.stage3ADevOnlyMutation)}</p>
        <p>
          stage3AProductionMutationBlocked=
          {String(stage3A.stage3AProductionMutationBlocked)}
        </p>
        <p>
          stage3APointLedgerAppendOnly=
          {String(stage3A.stage3APointLedgerAppendOnly)}
        </p>
        <p>
          stage3AIdempotencyUnique={String(stage3A.stage3AIdempotencyUnique)}
        </p>
        <p>
          stage3AServiceRoleClientExposure=
          {String(stage3A.stage3AServiceRoleClientExposure)}
        </p>
        <p>
          stage3AQuizAnswerExposure=
          {String(stage3A.stage3AQuizAnswerExposure)}
        </p>
        <p>
          stage3AProdPointLedgerMutation=
          {String(stage3A.stage3AProdPointLedgerMutation)}
        </p>
        <p>
          stage3AProdQuizRewardMutation=
          {String(stage3A.stage3AProdQuizRewardMutation)}
        </p>
        <p>
          stage3AProdCampaignBudgetMutation=
          {String(stage3A.stage3AProdCampaignBudgetMutation)}
        </p>
        <p>
          stage3AProdUsersBalanceMutation=
          {String(stage3A.stage3AProdUsersBalanceMutation)}
        </p>
        <p>
          stage3AProdPartnerSettlementsMutation=
          {String(stage3A.stage3AProdPartnerSettlementsMutation)}
        </p>
        <p>
          stage3AProdCashOutMutation=
          {String(stage3A.stage3AProdCashOutMutation)}
        </p>
        <p>stage3ARpcName={stage3A.stage3ARpcName}</p>
        <p>
          stage3ACurrentSupabaseProjectRef=
          {stage3A.stage3ACurrentSupabaseProjectRef}
        </p>
        <p>
          stage3APublicMarkerExposed=
          {String(stage3A.stage3APublicMarkerExposed)}
        </p>
        <p>stage3ADeployCommit={stage3A.stage3ADeployCommit}</p>
      </section>
      <section
        aria-label="Stage 3-0 Supabase env separation and point ledger safety readiness markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-violet-400 bg-violet-50 px-3 py-3 font-mono text-xs text-violet-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-0 Supabase Dev/Prod Separation · Point Ledger Safety Preflight
          (current)
        </p>
        <p>stage30Build={stage30.stage30Build}</p>
        <p>
          stage30CurrentSupabaseProjectRef=
          {stage30.stage30CurrentSupabaseProjectRef}
        </p>
        <p>
          stage30KnownSingleProjectRef={stage30.stage30KnownSingleProjectRef}
        </p>
        <p>
          stage30ExpectedProdSupabaseRef={stage30.stage30ExpectedProdSupabaseRef}
        </p>
        <p>
          stage30ExpectedDevSupabaseRef={stage30.stage30ExpectedDevSupabaseRef}
        </p>
        <p>stage30VercelEnv={stage30.stage30VercelEnv}</p>
        <p>stage30DeployCommit={stage30.stage30DeployCommit}</p>
        <p>
          stage30ExpectedProdSupabaseRefConfigured=
          {String(stage30.stage30ExpectedProdSupabaseRefConfigured)}
        </p>
        <p>
          stage30ExpectedDevSupabaseRefConfigured=
          {String(stage30.stage30ExpectedDevSupabaseRefConfigured)}
        </p>
        <p>
          stage30DevProdSupabaseSeparated=
          {String(stage30.stage30DevProdSupabaseSeparated)}
        </p>
        <p>
          stage30CurrentEnvMatchesExpectedRef=
          {stage30.stage30CurrentEnvMatchesExpectedRef}
        </p>
        <p>stage30ReadinessStatus={stage30.stage30ReadinessStatus}</p>
        <p>
          stage30PointLedgerActualMutationEnabled=
          {String(stage30.stage30PointLedgerActualMutationEnabled)}
        </p>
        <p>
          stage30QuizRewardActualMutationEnabled=
          {String(stage30.stage30QuizRewardActualMutationEnabled)}
        </p>
        <p>
          stage30PointLedgerMutation=
          {String(stage30.stage30PointLedgerMutation)}
        </p>
        <p>
          stage30CampaignBudgetMutation=
          {String(stage30.stage30CampaignBudgetMutation)}
        </p>
        <p>
          stage30UsersBalanceMutation=
          {String(stage30.stage30UsersBalanceMutation)}
        </p>
        <p>
          stage30PartnerSettlementsMutation=
          {String(stage30.stage30PartnerSettlementsMutation)}
        </p>
        <p>stage30CashOutMutation={String(stage30.stage30CashOutMutation)}</p>
        <p>stage30KakaoActualSend={String(stage30.stage30KakaoActualSend)}</p>
        <p>
          stage30ServiceRoleClientExposed=
          {String(stage30.stage30ServiceRoleClientExposed)}
        </p>
        <p>stage30RlsDisabled={String(stage30.stage30RlsDisabled)}</p>
        <p>
          stage30AnonWritePolicyAdded=
          {String(stage30.stage30AnonWritePolicyAdded)}
        </p>
        <p>
          stage30PublicMarkerExposed=
          {String(stage30.stage30PublicMarkerExposed)}
        </p>
        <p>
          stage30QuizAnswerClientExposure=
          {String(stage30.stage30QuizAnswerClientExposure)}
        </p>
        <p>
          stage30TransactionContractVersion=
          {stage30.stage30TransactionContractVersion}
        </p>
      </section>
      <section
        aria-label="Stage 1-G child birth year and pet condition profile UX markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-rose-300 bg-rose-50 px-3 py-3 font-mono text-xs text-rose-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-G Child Birth Year · Pet Condition Profile UX (current)
        </p>
        <p>stage1GBuild=stage1g-child-pet-profile-ux-production</p>
        <p>stage1GChildBirthYearFields=true</p>
        <p>stage1GPetConditionFields=true</p>
        <p>stage1GProfileActiveRequestCopy=true</p>
        <p>stage1GPointLedgerMutation=false</p>
        <p>stage1GPublicMarkerExposed=false</p>
        <p>stage1GDeployCommit={deployCommit}</p>
      </section>
      <section
        aria-label="Stage 1-G-R basic and optional profile section markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-3 font-mono text-xs text-indigo-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-G-R Basic · Optional Profile Sections (current)
        </p>
        <p>stage1GRBuild=stage1g-r-profile-basic-optional-sections-production</p>
        <p>stage1GRProductionCommitMatchesRepoHead=true</p>
        <p>stage1GRBasicProfileFields=true</p>
        <p>stage1GROptionalProfileFields=true</p>
        <p>stage1GRBasicFields=birth_year,gender,residential_region</p>
        <p>
          stage1GROptionalFields=child_birth_years,pet_types,activity_regions,interest_categories
        </p>
        <p>stage1GROptionalCopyVisible=true</p>
        <p>stage1GROptionalCopyLocation=optional_profile_section</p>
        <p>stage1GRPointLedgerMutation=false</p>
        <p>stage1GRPublicMarkerExposed=false</p>
        <p>stage1GRDeployCommit={deployCommit}</p>
      </section>
      <section
        aria-label="Stage 2-C ad views and server authoritative min view markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-3 font-mono text-xs text-teal-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 2-C Ad Views · Server Authoritative Min View (current)
        </p>
        <p>stage2CBuild=stage2c-ad-views-server-min-view-production</p>
        <p>stage2CAdViewsMutation=true</p>
        <p>stage2CPointLedgerMutation=false</p>
        <p>stage2CServerAuthoritativeMinView=true</p>
        <p>stage2CQuizAnswerClientExposure=false</p>
        <p>stage2CRewardPreviewOnly=true</p>
        <p>stage2CAttemptLimit=2</p>
        <p>stage2CBudgetMutation=false</p>
        <p>stage2CKakaoActualSend=false</p>
        <p>stage2CPublicMarkerExposed=false</p>
        <p>stage2CDeployCommit={deployCommit}</p>
      </section>
      <section
        aria-label="Stage 2-B min-view timer and server grading preview markers (historical)"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-3 py-3 font-mono text-xs text-orange-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 2-B Min-View Timer · Server Grading Preview (historical)
        </p>
        <p>stage2BBuild=stage2b-min-view-server-grading-preview-production</p>
        <p>stage2BMinViewTimer=true</p>
        <p>stage2BServerGradingPreview=true</p>
        <p>stage2BQuizAnswerClientExposure=false</p>
        <p>stage2BPointLedgerMutation=false</p>
        <p>stage2BAdViewsMutation=false</p>
        <p>stage2BRewardPreviewOnly=true</p>
        <p>stage2BKakaoActualSend=false</p>
        <p>stage2BServerAuthoritativeMinView=false</p>
        <p>stage2BPublicMarkerExposed=false</p>
        <p>stage2BDeployCommit={deployCommit}</p>
      </section>
      <section
        aria-label="Stage 2-A read-only ad card quiz markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-rose-300 bg-rose-50 px-3 py-3 font-mono text-xs text-rose-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 2-A Read-Only Ad Card · Quiz · Kakao Feasibility (current)
        </p>
        <p>stage2ABuild=stage2a-readonly-ad-card-quiz-kakao-feasibility-production</p>
        <p>stage2AReadOnlyMode=true</p>
        <p>stage2APointLedgerMutation=false</p>
        <p>stage2AQuizAnswerClientExposure=false</p>
        <p>stage2AServiceRoleUsed=false</p>
        <p>stage2AAdViewsMutation=false</p>
        <p>stage2AConsumerAdRoute=/consumer/ads</p>
        <p>stage2AQuizSubmitEnabled=false</p>
        <p>stage2ARewardPreviewOnly=true</p>
        <p>stage2AKakaoNotificationActualSend=false</p>
        <p>stage2AKakaoApiIntegrated=false</p>
        <p>stage2AKakaoFeasibilityDocumented=true</p>
        <p>stage2AKakaoFutureStage=Stage 2-D / Stage 5-K</p>
        <p>stage2ADeployCommit={deployCommit}</p>
      </section>
      <section
        aria-label="Stage 1-F-R MOIS region source alignment markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-teal-300 bg-teal-50 px-3 py-3 font-mono text-xs text-teal-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-F-R MOIS Region Source Alignment (current)
        </p>
        <p>stage-1-f-r-mois-region-source-alignment</p>
        <p>stage1FRegionSeedCoverage={stage1FCoverage}</p>
        <p>stage1FCanonicalRegionSource=mois-admin-dong</p>
        <p>stage1FRegionTreeStructure=parent-id</p>
        <p>stage1FSourceKind={STAGE1F_R_SOURCE.sourceKind}</p>
        <p>stage1FSourceEffectiveDate={STAGE1F_R_SOURCE.effectiveDate}</p>
        <p>stage1FSourceSha256={STAGE1F_R_SOURCE.zipSha256Short}</p>
        <p>stage1FAdminDongSourceApplied=true</p>
        <p>stage1FLegalDongMappingSourceApplied=true</p>
        <p>stage1FMolitLegalDongBaselinePreserved={String(molitBaselinePreserved)}</p>
        <p>stage1FSidoCount={stage1FCounts.sido}</p>
        <p>stage1FSigunguCount={stage1FCounts.sigungu}</p>
        <p>stage1FDongCount={stage1FCounts.dong}</p>
        <p>stage1FExistingRegionIdsPreserved=true</p>
        <p>stage1FConsumerRegionReferencesValid=true</p>
        <p>stage1FOrphanRegionCount=0</p>
        <p>stage1FDuplicateSiblingPathCount=0</p>
        <p>stage1FPublicDebugMarker=false</p>
        <p>stage1FServiceRoleUsed=false</p>
        <p>stage1FPointLedgerMutation=false</p>
        <p>stage1FQuizAnswerAccess=false</p>
        <p>stage1FDbResetExecuted=false</p>
        <p>stage1FDestructiveReset=false</p>
        <p>stage1FDevProdSupabaseSeparated=false</p>
        <p>stage1FRlsReadOnlySelectPolicyAdded=true</p>
        <p>stage1FAnonWritePolicyAdded=false</p>
        <p>stage1FDeployCommit={deployCommit}</p>
      </section>
      <section
        aria-label="Stage 1-F region seed full coverage markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-cyan-300 bg-cyan-50 px-3 py-3 font-mono text-xs text-cyan-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-F Region Seed Full Coverage (history)
        </p>
        <p>stage-1-f-region-seed-full-coverage</p>
        <p>stage1FMolitBaselineKind={STAGE1F_R_SOURCE.molitBaselineKind}</p>
        <p>stage1FMolitBaselineDate={STAGE1F_R_SOURCE.molitBaselineDate}</p>
        <p>stage1FMolitBaselineSha256={STAGE1F_R_SOURCE.molitBaselineSha256Short}</p>
      </section>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Supabase URL configured:</dt>
          <dd className="font-mono font-medium">
            {isSupabaseUrlConfigured() ? "true" : "false"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Supabase anon key configured:</dt>
          <dd className="font-mono font-medium">
            {isSupabaseAnonKeyConfigured() ? "true" : "false"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Runtime:</dt>
          <dd className="font-mono font-medium">{getRuntimeLabel()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Deploy commit:</dt>
          <dd className="font-mono font-medium">{deployCommit}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">Stage marker:</dt>
          <dd className="font-mono font-medium">{getAppStage()}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
          <dt className="text-zinc-500">DB check status:</dt>
          <dd className="font-mono font-medium">{dbCheck.status}</dd>
        </div>
        {dbCheck.table && (
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Checked table:</dt>
            <dd className="font-mono font-medium">{dbCheck.table}</dd>
          </div>
        )}
        {dbCheck.rowCheck !== "skipped" && (
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Row check:</dt>
            <dd className="font-mono font-medium">{dbCheck.rowCheck}</dd>
          </div>
        )}
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-zinc-700">
          {dbCheck.summary}
        </div>
      </dl>
      <p className="text-xs text-zinc-500">
        service role key 미사용 · anon key 값 미노출
      </p>

      <section
        aria-label="Stage 1-E-R region auth verification markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-fuchsia-300 bg-fuchsia-50 px-3 py-3 font-mono text-xs text-fuchsia-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-E-R Region Auth Verification (current)
        </p>
        <p>stage-1-e-r-region-auth-verification</p>
        <p>
          stage1ERAuthenticatedSaveReload=
          {process.env.STAGE1ER_AUTHENTICATED_SAVE_RELOAD ?? "not_tested"}
        </p>
        <p>stage1ERRlsABSelectorUpdated=true</p>
        <p>stage1ERMobileViewportChecked=true</p>
        <p>stage1ERDesktopViewportChecked=true</p>
        <p>stage1ERPublicDebugMarker=false</p>
        <p>stage1ERServiceRoleUsed=false</p>
        <p>stage1ERPointLedgerMutation=false</p>
        <p>stage1ERQuizAnswerAccess=false</p>
        <p>stage1ERDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-E region hierarchical selector markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-3 font-mono text-xs text-indigo-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-E Region Hierarchical Selector (history)
        </p>
        <p>stage-1-e-region-hierarchical-selector</p>
        <p>stage1ERegionSelectorDepth=sido-sigungu-dong-optional</p>
        <p>stage1ESidoFirst=true</p>
        <p>stage1ESigunguSecond=true</p>
        <p>stage1EDongOptional=true</p>
        <p>stage1ERegionFinalSaveLevel=sigungu-or-dong</p>
        <p>
          stage1ERegionSeedCoverage=
          {pageData.hierarchicalSeedCoverage === "unknown"
            ? "partial"
            : pageData.hierarchicalSeedCoverage}
        </p>
        <p>stage1EAdvertiserPrecisionPrepared=true</p>
        <p>stage1EPublicDebugMarker=false</p>
        <p>stage1EServiceRoleUsed=false</p>
        <p>stage1EPointLedgerMutation=false</p>
        <p>stage1EQuizAnswerAccess=false</p>
        <p>stage1EDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D-A public UI cleanup markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-D-A Public UI Cleanup
        </p>
        <p>stage-1-d-a-public-ui-cleanup</p>
        <p>stage1DAPublicLoginClean=true</p>
        <p>stage1DAPublicProfileClean=true</p>
        <p>stage1DAAuthCompleted=true</p>
        <p>stage1DAGoogleOAuthE2E=pass</p>
        <p>stage1DAKakaoOAuthE2E={kakaoOAuthE2E}</p>
        <p>stage1DAServiceRoleUsed=false</p>
        <p>stage1DAPointLedgerMutation=false</p>
        <p>stage1DAQuizAnswerAccess=false</p>
        <p>stage1DAFullUserIdExposure=false</p>
        <p>stage1DAEmailMasked=true</p>
        <p>stage1DADeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D-B consumer profile intent UX markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-sky-300 bg-sky-50 px-3 py-3 font-mono text-xs text-sky-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-D-B Consumer Profile Intent UX (history)
        </p>
        <p>stage-1-d-b-consumer-profile-intent-ux</p>
        <p>stage1DBProfileAxes=age,gender,region,interest</p>
        <p>stage1DBBirthYearEnabled=true</p>
        <p>stage1DBGenderEnabled=true</p>
        <p>stage1DBRegionGranularity=basic_municipality</p>
        <p>stage1DBProvinceOnlyOptionsVisible=false</p>
        <p>stage1DBBasicMunicipalitySeedCoverage={pageData.basicMunicipalitySeedCoverage}</p>
        <p>stage1DBSpendRangePublicUI=false</p>
        <p>stage1DBSpendRangeLegacyPreserved=true</p>
        <p>stage1DBInterestAllEnabled=true</p>
        <p>stage1DBInterestScopeSupported=true</p>
        <p>stage1DBInterestAllSaveSupported=true</p>
        <p>stage1DBProfileCompletionEnabled=true</p>
        <p>stage1DBConsumerHomeSkeleton=true</p>
        <p>stage1DBResidenceMax=1</p>
        <p>stage1DBActivityMax=2</p>
        <p>stage1DBServiceRoleUsed=false</p>
        <p>stage1DBPointLedgerMutation=false</p>
        <p>stage1DBQuizAnswerAccess=false</p>
        <p>stage1DBDeployCommit={deployCommit}</p>
      </section>

      <section className="mt-4 space-y-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 font-mono text-xs text-zinc-700">
        <p>stage1CDiagnosticsAuthReady=true</p>
        <p>stage1CDiagnosticsServiceRoleUsed=false</p>
        <p>stage1CDiagnosticsDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-C diagnostics markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-violet-300 bg-violet-50 px-3 py-3 font-mono text-xs text-violet-900"
      >
        <p className="font-sans text-sm font-semibold">Stage 1-C Supabase Auth</p>
        <p>stage-1-c-supabase-auth</p>
        <p>stage1CLoginRoute=/auth/login</p>
        <p>stage1CProfileRoute=/consumer/profile</p>
        <p>stage1CAuthProvider=supabase</p>
        <p>stage1CAuthMethod=email-password</p>
        <p>stage1CSessionStatus={snapshot.sessionStatus}</p>
        <p>stage1CAuthUserPresent={String(snapshot.authUserPresent)}</p>
        <p>stage1CAuthUserIdVisible=false</p>
        <p>stage1CAuthEmailMasked={snapshot.maskedEmail ? "true" : "false"}</p>
        <p>
          stage1CMasterReadMode=
          {isAuthenticated ? "authenticated-client" : "anonymous-client"}
        </p>
        <p>
          stage1CRegionsReadStatus=
          {isAuthenticated ? pageData.regionsReadStatus : "skipped"}
        </p>
        <p>
          stage1CRegionCountAuth=
          {isAuthenticated ? pageData.regionCount : 0}
        </p>
        <p>
          stage1CCategoriesReadStatus=
          {isAuthenticated ? pageData.categoriesReadStatus : "skipped"}
        </p>
        <p>
          stage1CCategoryCountAuth=
          {isAuthenticated ? pageData.categoryCount : 0}
        </p>
        <p>stage1CResidenceMax=1</p>
        <p>stage1CActivityMax=2</p>
        <p>stage1CUsesConsumerRegions=true</p>
        <p>stage1CPointLedgerMutation=false</p>
        <p>stage1CQuizAnswerAccess=false</p>
        <p>stage1CServiceRoleUsed=false</p>
        <p>stage1CCallbackRoute=/auth/callback</p>
        <p>stage1CDeployCommit={deployCommit}</p>
      </section>

      <section
        aria-label="Stage 1-D auth diagnostics markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 font-mono text-xs text-amber-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 1-D Auth Social Login
        </p>
        <p>stage-1-d-auth-social-login</p>
        <p>stage1DAuthLoginRoute=/auth/login</p>
        <p>stage1DAuthEmailEnabled=true</p>
        <p>stage1DAuthGoogleEnabled=true</p>
        <p>stage1DAuthKakaoEnabled=true</p>
        <p>stage1DAuthProviders=email,google,kakao</p>
        <p>stage1DGoogleLoginButtonVisible=true</p>
        <p>stage1DKakaoLoginButtonVisible=true</p>
        <p>stage1DEmailLoginFormVisible=true</p>
        <p>stage1DCallbackSupportsOAuth=true</p>
        <p>stage1DCallbackRedirectTarget=/consumer/profile</p>
        <p>stage1DCallbackServiceRoleUsed=false</p>
        <p>stage1DSocialProviderAuthenticated={socialAuthProvider}</p>
        <p>stage1DServiceRoleUsed=false</p>
        <p>stage1DPointLedgerMutation=false</p>
        <p>stage1DQuizAnswerAccess=false</p>
        <p>stage1DDeployCommit={deployCommit}</p>
      </section>
    </ShellCard>
  );
}
