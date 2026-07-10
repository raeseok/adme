import { ShellCard } from "@/components/ShellCard";
import {
  STAGE3M_AUDIT_APPEND_ONLY_REVIEW,
  STAGE3M_BANK_ACCOUNT_STORAGE_OPTIONS,
  STAGE3M_CASH_REDEMPTION_REQUEST_LINKAGE_REVIEW,
  STAGE3M_LEGAL_DOCUMENT_VERSIONING_REVIEW,
  STAGE3M_MARKETING_CONSENT_HISTORY_REVIEW,
  STAGE3M_MIGRATION_DEPENDENCY_ORDER,
  STAGE3M_PROPOSED_DB_OBJECT_INVENTORY,
  STAGE3M_RETENTION_DELETION_REVIEW,
  STAGE3M_RLS_MATRIX,
  STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW,
  STAGE3M_STATUS_TAXONOMY_REVIEW,
  getStage3MKycTaxTermsDbMigrationDesignReviewState,
} from "@/lib/compliance/stage3m-kyc-tax-terms-db-migration-design-review";
import { getStage3NKycTaxTermsImplementationApprovalGateState } from "@/lib/compliance/stage3n-kyc-tax-terms-implementation-approval-gate";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function KycTaxTermsDbMigrationReviewPage() {
  const review = getStage3MKycTaxTermsDbMigrationDesignReviewState();
  const approvalGate = getStage3NKycTaxTermsImplementationApprovalGateState();

  return (
    <ShellCard title="KYC / Tax / Terms DB Migration Design Review">
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
        Stage 3-M design review only: no DB migration, no Supabase db push, no
        personal data collection, no provider integration, no actual cash-out.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page renders static Stage 3-M SSOT markers. It does not
        query operational KYC, bank, tax, terms, consent, or cash-out data.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/kyc-tax-terms-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          KYC / Tax / Terms data model preflight 상세 →
        </Link>
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/kyc-tax-terms-implementation-approval"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Implementation approval gate 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Design review complete</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(review.stage3MDesignReviewComplete)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Migration implemented</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(review.migrationImplemented)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Actual cash-out processing</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(review.actualCashOutProcessingAllowed)}
          </p>
        </div>
      </section>

      <section
        aria-label="Stage 3-M KYC tax terms DB migration design review markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-slate-500 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-950"
      >
        <p className="font-sans text-sm font-semibold">
          KYC / Tax / Terms DB Migration Design Review
        </p>
        <p className="font-sans text-sm">DESIGN REVIEW ONLY</p>
        <p className="font-sans text-sm">NO DB MIGRATION IMPLEMENTED</p>
        <p className="font-sans text-sm">NO SUPABASE DB PUSH</p>
        <p className="font-sans text-sm">NO PERSONAL DATA COLLECTION</p>
        <p className="font-sans text-sm">
          NO BANK API OR IDENTITY PROVIDER INTEGRATION
        </p>
        <p className="font-sans text-sm">
          NO TAX FILING OR WITHHOLDING IMPLEMENTATION
        </p>
        <p className="font-sans text-sm">NO ACTUAL CASH-OUT PROCESSING</p>
        <p className="font-sans text-sm">LEGAL CONCLUSION NOT DECLARED</p>
        {Object.entries(review).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section
        aria-label="Stage 3-N KYC tax terms implementation approval gate summary markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-red-500 bg-red-50 px-3 py-3 font-mono text-xs text-red-950"
      >
        <p className="font-sans text-sm font-semibold">
          Stage 3-N KYC/Tax/Terms Implementation Approval Gate
        </p>
        <p className="font-sans text-sm">
          Stage 3-M design completion is not implementation approval
        </p>
        <p className="font-sans text-sm">Migration implementation: BLOCKED</p>
        <p>stage3NApprovalGateComplete=true</p>
        <p>stage3NOverallApprovalStatus=blocked</p>
        <p>stage3NDevMigrationApprovalGranted=false</p>
        <p>stage3NProductionMigrationApprovalGranted=false</p>
        <p>stage3NActualCashOutProcessingAllowed=false</p>
        <p>stage3NLegalConclusionDeclared=false</p>
        {Object.entries(approvalGate).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">Proposed DB objects reviewed</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          {STAGE3M_PROPOSED_DB_OBJECT_INVENTORY.map((object) => (
            <li key={object.objectName}>
              <span className="font-mono">{object.objectName}</span>:{" "}
              {object.implementationStatus}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">RLS matrix reviewed</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          {STAGE3M_RLS_MATRIX.map((row) => (
            <li key={row.role}>
              <span className="font-mono">{row.role}</span>: {row.access}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">
          SECURITY DEFINER write path reviewed
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          {STAGE3M_SECURITY_DEFINER_WRITE_PATH_REVIEW.map((path) => (
            <li key={path.functionName}>
              <span className="font-mono">{path.functionName}</span>: production
              implementation status={String(path.productionImplementationStatus)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">Storage and history review</p>
        <div className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
          <p>
            stage3MStatusStorageRecommendation=
            {STAGE3M_STATUS_TAXONOMY_REVIEW.recommendedStrategy}
          </p>
          <p>
            stage3MBankStorageRecommended=
            {STAGE3M_BANK_ACCOUNT_STORAGE_OPTIONS[0].option}
          </p>
          <p>
            stage3MLegalDocumentVersioningReviewed=
            {String(
              STAGE3M_LEGAL_DOCUMENT_VERSIONING_REVIEW
                .historicalDocumentImmutabilityRequired,
            )}
          </p>
          <p>
            stage3MMarketingConsentHistoryReviewed=
            {String(
              STAGE3M_MARKETING_CONSENT_HISTORY_REVIEW
                .marketingConsentNotRequiredForCashOut,
            )}
          </p>
          <p>
            stage3MCashRedemptionRequestLinkageReviewed=
            {String(
              STAGE3M_CASH_REDEMPTION_REQUEST_LINKAGE_REVIEW
                .immutableRequestTimeDecisionEvidence,
            )}
          </p>
          <p>
            stage3MAuditAppendOnlyReviewed=
            {String(STAGE3M_AUDIT_APPEND_ONLY_REVIEW.appendOnlyPreferred)}
          </p>
          <p>
            stage3MRetentionDeletionPolicyStatus=
            {STAGE3M_RETENTION_DELETION_REVIEW.legalRetentionPeriod}
          </p>
          <p>
            stage3MMigrationDependencyOrder=
            {STAGE3M_MIGRATION_DEPENDENCY_ORDER.join(" > ")}
          </p>
        </div>
      </section>
    </ShellCard>
  );
}
