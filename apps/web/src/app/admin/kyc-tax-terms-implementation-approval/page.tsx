import { ShellCard } from "@/components/ShellCard";
import {
  STAGE3N_APPROVAL_GATE_ITEMS,
  STAGE3N_APPROVAL_PRINCIPLES,
  STAGE3N_EVIDENCE_STATUSES,
  STAGE3N_ITEM_DECISIONS,
  STAGE3N_OVERALL_APPROVAL_STATUSES,
  STAGE3N_STAGE3M_REVIEW_INPUTS,
  getStage3NKycTaxTermsImplementationApprovalGateState,
} from "@/lib/compliance/stage3n-kyc-tax-terms-implementation-approval-gate";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function KycTaxTermsImplementationApprovalPage() {
  const gate = getStage3NKycTaxTermsImplementationApprovalGateState();

  return (
    <ShellCard title="Stage 3-N KYC / Tax / Terms Implementation Approval Gate">
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
        Migration implementation: BLOCKED. This is a read-only approval gate,
        not a migration implementation stage.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        Stage 3-M completed the DB migration design review. Stage 3-N separates
        that design completion from implementation approval and keeps dev
        migration, Production migration, personal data collection, provider
        integration, tax implementation, and actual cash-out execution unapproved.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/kyc-tax-terms-db-migration-review"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Stage 3-M DB migration design review 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Overall approval status</p>
          <p className="mt-1 font-mono text-red-700">
            {gate.overallApprovalStatus}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Blocker count</p>
          <p className="mt-1 font-mono text-zinc-700">{gate.blockerCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Unresolved count</p>
          <p className="mt-1 font-mono text-zinc-700">{gate.unresolvedCount}</p>
        </div>
      </section>

      <section
        aria-label="Stage 3-N KYC tax terms implementation approval gate markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-red-500 bg-red-50 px-3 py-3 font-mono text-xs text-red-950"
      >
        <p className="font-sans text-sm font-semibold">
          ADME_STAGE_3_N_KYC_TAX_TERMS_IMPLEMENTATION_APPROVAL_GATE
        </p>
        <p className="font-sans text-sm">
          Stage 3-N KYC/Tax/Terms Implementation Approval Gate
        </p>
        <p className="font-sans text-sm">Read-only approval gate</p>
        <p className="font-sans text-sm">Migration implementation: BLOCKED</p>
        <p className="font-sans text-sm">Production mutation: DISABLED</p>
        <p className="font-sans text-sm">External legal review required</p>
        <p className="font-sans text-sm">External tax review required</p>
        <p className="font-sans text-sm">External privacy review required</p>
        <p className="font-sans text-sm">Provider selection required</p>
        <p className="font-sans text-sm">No personal data collection</p>
        <p className="font-sans text-sm">No bank account storage</p>
        <p className="font-sans text-sm">No tax filing</p>
        <p className="font-sans text-sm">No actual cash-out processing</p>
        {Object.entries(gate).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">Approval taxonomy</p>
        <div className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
          <p>
            stage3NOverallApprovalStatuses=
            {STAGE3N_OVERALL_APPROVAL_STATUSES.join(",")}
          </p>
          <p>stage3NItemDecisions={STAGE3N_ITEM_DECISIONS.join(",")}</p>
          <p>
            stage3NEvidenceStatuses={STAGE3N_EVIDENCE_STATUSES.join(",")}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">
          Stage 3-M inputs converted to approval gates
        </p>
        <div className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
          {Object.entries(STAGE3N_STAGE3M_REVIEW_INPUTS).map(([key, value]) => (
            <p key={key}>
              {key}={String(value)}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">Approval principles</p>
        <div className="mt-2 space-y-1 font-mono text-xs text-zinc-700">
          {Object.entries(STAGE3N_APPROVAL_PRINCIPLES).map(([key, value]) => (
            <p key={key}>
              {key}={String(value)}
            </p>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm">
        <p className="font-semibold text-zinc-900">Approval gate items</p>
        <div className="mt-3 space-y-3">
          {STAGE3N_APPROVAL_GATE_ITEMS.map((item) => (
            <article
              key={item.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3"
            >
              <p className="font-mono text-xs text-zinc-500">{item.id}</p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-900">
                {item.title}
              </h2>
              <div className="mt-2 grid gap-2 font-mono text-xs text-zinc-700 md:grid-cols-2">
                <p>itemDecision={item.itemDecision}</p>
                <p>evidenceStatus={item.evidenceStatus}</p>
                <p>blocker={String(item.blocker)}</p>
                <p>nextRequiredActor={item.nextRequiredActor}</p>
                <p>
                  requiredBeforeDevMigration=
                  {String(item.requiredBeforeDevMigration)}
                </p>
                <p>
                  requiredBeforeProduction=
                  {String(item.requiredBeforeProduction)}
                </p>
              </div>
              <p className="mt-2 text-zinc-700">
                Current conclusion: {item.currentConclusion}
              </p>
              <p className="mt-1 text-zinc-700">
                Blocker reason: {item.blockerReason}
              </p>
              <p className="mt-1 text-zinc-700">
                Next required action: {item.nextRequiredAction}
              </p>
            </article>
          ))}
        </div>
      </section>
    </ShellCard>
  );
}
