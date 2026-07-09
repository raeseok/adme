import { ShellCard } from "@/components/ShellCard";
import { getStage3HLegalTaxPaymentComplianceState } from "@/lib/compliance/stage3h-legal-tax-payment-compliance";
import { getStage3HRExternalReviewPackageState } from "@/lib/compliance/stage3hr-external-review-package";
import { getStage3IThresholdBasedPrepaidExemptionAssumptionState } from "@/lib/compliance/stage3i-threshold-based-prepaid-exemption-assumption";
import { getStage3JPrepaidThresholdMonitoringArchitectureState } from "@/lib/compliance/stage3j-prepaid-threshold-monitoring-architecture";
import { getStage3JRPrepaidThresholdDbMigrationDesignReviewState } from "@/lib/compliance/stage3jr-prepaid-threshold-db-migration-design-review";
import { getStage3KProtectedFundReconciliationDesignState } from "@/lib/compliance/stage3k-protected-fund-reconciliation-design";
import { getStage3LKycTaxTermsDesignState } from "@/lib/compliance/stage3l-kyc-tax-terms-design";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CompliancePreflightPage() {
  const compliance = getStage3HLegalTaxPaymentComplianceState();
  const externalReviewPackage = getStage3HRExternalReviewPackageState();
  const prepaidExemptionAssumption =
    getStage3IThresholdBasedPrepaidExemptionAssumptionState();
  const thresholdMonitoringArchitecture =
    getStage3JPrepaidThresholdMonitoringArchitectureState();
  const thresholdDbMigrationDesignReview =
    getStage3JRPrepaidThresholdDbMigrationDesignReviewState();
  const protectedFundReconciliation =
    getStage3KProtectedFundReconciliationDesignState();
  const kycTaxTermsDesign = getStage3LKycTaxTermsDesignState();

  return (
    <ShellCard title="Legal / Tax / Payment Compliance Review">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
        Actual reward open is blocked pending external legal and tax review
      </p>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          No production reward mutation
        </p>
        <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          No cash-out actual processing
        </p>
        <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          No partner settlement actual processing
        </p>
        <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          No DB migration in Stage 3-H
        </p>
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        This admin-only preflight marker page records required external review
        gates. It does not execute reward open, cash-out processing, partner
        settlement processing, or database migration.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/reward-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Reward preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/prepaid-threshold-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Prepaid threshold preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/protected-fund-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Protected fund preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/kyc-tax-terms-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          KYC / Tax / Terms preflight 상세 →
        </Link>
      </p>

      <section
        aria-label="Stage 3-L KYC tax terms data model design markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-slate-500 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-950"
      >
        <p className="font-sans text-sm font-semibold">
          KYC / Tax / Terms Data Model Design
        </p>
        <p className="font-sans text-sm">
          Stage 3-L KYC tax terms data model is designed
        </p>
        <p className="font-sans text-sm">
          Reward open gate and user-level cash-out gate are separated
        </p>
        <p className="font-sans text-sm">
          Actual cash-out remains blocked
        </p>
        <p>stage3LKycTaxTermsDesignComplete=true</p>
        <p>stage3LCashOutGateSeparated=true</p>
        <p>stage3LActualCashOutStillBlocked=true</p>
        <p>stage3LLegalTaxExternalReviewStillRequired=true</p>
        <p>stage3LNoDbMigration=true</p>
        <p>stage3LNoSupabaseDbPush=true</p>
        <p>stage3LNoProductionMutation=true</p>
        {Object.entries(kycTaxTermsDesign).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

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
        {Object.entries(protectedFundReconciliation).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
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
        {Object.entries(thresholdDbMigrationDesignReview).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
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
        {Object.entries(thresholdMonitoringArchitecture).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
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
        {Object.entries(prepaidExemptionAssumption).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
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
        {Object.entries(externalReviewPackage).map(([key, value]) => (
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
        <p className="font-sans text-sm">No production reward mutation</p>
        <p className="font-sans text-sm">No cash-out actual processing</p>
        <p className="font-sans text-sm">
          No partner settlement actual processing
        </p>
        <p className="font-sans text-sm">No DB migration in Stage 3-H</p>
        {Object.entries(compliance).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
    </ShellCard>
  );
}
