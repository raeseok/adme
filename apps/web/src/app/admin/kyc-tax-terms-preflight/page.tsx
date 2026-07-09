import { ShellCard } from "@/components/ShellCard";
import { evaluateKycTaxTermsCashOutGate } from "@/lib/compliance/kyc-tax-terms-gate-evaluator";
import {
  getStage3LKycTaxTermsDesignState,
  type BankAccountVerificationStatus,
  type IdentityVerificationStatus,
  type TaxProfileStatus,
  type TermsAcceptanceStatus,
} from "@/lib/compliance/stage3l-kyc-tax-terms-design";
import { getStage3MKycTaxTermsDbMigrationDesignReviewState } from "@/lib/compliance/stage3m-kyc-tax-terms-db-migration-design-review";
import type { ProtectedFundReconciliationStatus } from "@/lib/compliance/protected-fund-reconciliation-evaluator";
import Link from "next/link";

export const dynamic = "force-dynamic";

const baseGateInput = {
  rewardOpenFlag: true,
  killSwitchOn: false,
  pointBalanceWon: 10000,
  minimumCashOutWon: 10000,
  identityVerificationStatus: "verified" as IdentityVerificationStatus,
  bankAccountVerificationStatus: "verified" as BankAccountVerificationStatus,
  requiredTermsAcceptanceStatus:
    "accepted_current_versions" as TermsAcceptanceStatus,
  taxProfileStatus: "ready_for_manual_processing" as TaxProfileStatus,
  protectedFundStatus: "target_buffer_ok" as ProtectedFundReconciliationStatus,
  manualReviewRequired: false,
};

const gateCases = {
  stage3LGateCaseRewardDisabled: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    rewardOpenFlag: false,
  }),
  stage3LGateCaseLowBalance: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    pointBalanceWon: 9999,
  }),
  stage3LGateCaseMissingIdentity: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    identityVerificationStatus: "not_started",
  }),
  stage3LGateCaseMissingBank: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    bankAccountVerificationStatus: "not_registered",
  }),
  stage3LGateCaseMissingTerms: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    requiredTermsAcceptanceStatus: "missing_required_acceptance",
  }),
  stage3LGateCaseLegacyTerms: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    requiredTermsAcceptanceStatus:
      "accepted_legacy_versions_reacceptance_required",
  }),
  stage3LGateCaseTaxIncomplete: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    taxProfileStatus: "not_collected",
  }),
  stage3LGateCaseTaxExternalReview: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    taxProfileStatus: "external_review_required",
  }),
  stage3LGateCaseProtectedFundUnknown: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    protectedFundStatus: "unknown_blocked",
  }),
  stage3LGateCaseProtectedFundDeficit: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    protectedFundStatus: "deficit_blocked",
  }),
  stage3LGateCaseManualReview: evaluateKycTaxTermsCashOutGate({
    ...baseGateInput,
    manualReviewRequired: true,
  }),
  stage3LGateCaseDesignClearButDisabled: evaluateKycTaxTermsCashOutGate(
    baseGateInput,
  ),
};

export default function KycTaxTermsPreflightPage() {
  const design = getStage3LKycTaxTermsDesignState();
  const migrationDesignReview =
    getStage3MKycTaxTermsDbMigrationDesignReviewState();

  return (
    <ShellCard title="KYC / Tax / Terms Data Model Design">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
        Stage 3-L KYC, tax, terms, and consent data model is designed only
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page does not collect personal data, call identity or
        bank providers, create database migrations, push Supabase changes,
        calculate withholding, or process cash-out.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/compliance-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Compliance preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/kyc-tax-terms-db-migration-review"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          DB migration design review 상세 →
        </Link>
      </p>

      <section
        aria-label="Stage 3-M KYC tax terms DB migration design review markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-slate-500 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-950"
      >
        <p className="font-sans text-sm font-semibold">
          KYC / Tax / Terms DB Migration Design Review
        </p>
        <p className="font-sans text-sm">
          Stage 3-M design review is complete
        </p>
        <p className="font-sans text-sm">
          Actual migration is not implemented
        </p>
        <p className="font-sans text-sm">Supabase db push is not executed</p>
        <p className="font-sans text-sm">
          Actual cash-out processing remains disabled
        </p>
        <p>stage3MDesignReviewComplete=true</p>
        <p>stage3MMigrationImplemented=false</p>
        <p>stage3MSupabaseDbPushExecuted=false</p>
        <p>stage3MActualCashOutProcessingAllowed=false</p>
        <p>stage3MLegalConclusionDeclared=false</p>
        {Object.entries(migrationDesignReview).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Data model design</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(design.stage3LKycTaxTermsDataModelDesigned)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Actual cash-out processing</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(design.stage3LCashOutActualProcessing)}
          </p>
        </div>
      </section>

      <section
        aria-label="Stage 3-L KYC tax terms data model design markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-slate-500 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-950"
      >
        <p className="font-sans text-sm font-semibold">
          KYC / Tax / Terms Data Model Design
        </p>
        <p className="font-sans text-sm">Stage 3-L design only</p>
        <p className="font-sans text-sm">No DB migration in Stage 3-L</p>
        <p className="font-sans text-sm">Supabase db push is not executed</p>
        <p className="font-sans text-sm">Actual cash-out remains disabled</p>
        <p className="font-sans text-sm">No raw sensitive data exposure</p>
        {Object.entries(design).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
        {Object.entries(gateCases).map(([key, value]) => (
          <p key={key}>
            {key}={value.status}
          </p>
        ))}
        <p>
          stage3LGateActualCashOutAllowed=
          {String(
            gateCases.stage3LGateCaseDesignClearButDisabled
              .actualCashOutProcessingAllowed,
          )}
        </p>
      </section>
    </ShellCard>
  );
}
