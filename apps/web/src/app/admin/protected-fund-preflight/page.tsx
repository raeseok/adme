import { ShellCard } from "@/components/ShellCard";
import { evaluateProtectedFundReconciliationGate } from "@/lib/compliance/protected-fund-reconciliation-evaluator";
import { getStage3KProtectedFundReconciliationDesignState } from "@/lib/compliance/stage3k-protected-fund-reconciliation-design";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProtectedFundPreflightPage() {
  const protectedFundReconciliation =
    getStage3KProtectedFundReconciliationDesignState();
  const sampleEvaluations = [
    ["null/null", null, null],
    ["0/0", 0, 0],
    ["10000/9000", 10000, 9000],
    ["10000/10000", 10000, 10000],
    ["10000/10499", 10000, 10499],
    ["10000/10500", 10000, 10500],
    ["10000/10999", 10000, 10999],
    ["10000/11000", 10000, 11000],
  ] as const;

  return (
    <ShellCard title="Protected Fund Reconciliation Design">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
        Protected fund reconciliation is designed
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page is a read-only placeholder. It does not read DB
        protected fund values, call bank APIs, execute reward open, process
        cash-out, or create database migrations.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/compliance-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Compliance preflight 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Minimum coverage ratio bps</p>
          <p className="mt-1 font-mono text-zinc-700">
            {protectedFundReconciliation.stage3KMinimumCoverageRatioBps}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Warning coverage ratio bps</p>
          <p className="mt-1 font-mono text-zinc-700">
            {protectedFundReconciliation.stage3KWarningCoverageRatioBps}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Target buffer ratio bps</p>
          <p className="mt-1 font-mono text-zinc-700">
            {protectedFundReconciliation.stage3KTargetBufferCoverageRatioBps}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Read-only design only</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(protectedFundReconciliation.stage3KReadOnlyDesignOnly)}
          </p>
        </div>
      </section>

      <section
        aria-label="Stage 3-K protected fund reconciliation design markers"
        className="mt-4 space-y-1 rounded-lg border border-dashed border-emerald-500 bg-emerald-50 px-3 py-3 font-mono text-xs text-emerald-950"
      >
        <p className="font-sans text-sm font-semibold">
          Protected Fund Reconciliation Design
        </p>
        <p className="font-sans text-sm">
          Protected fund reconciliation is designed
        </p>
        <p className="font-sans text-sm">
          Runtime protected fund reconciliation is not implemented
        </p>
        <p className="font-sans text-sm">
          Actual protected fund balance is not available
        </p>
        <p className="font-sans text-sm">Calculation source is not finalized</p>
        <p className="font-sans text-sm">Coverage unknown blocks cash-out</p>
        <p className="font-sans text-sm">Coverage deficit blocks cash-out</p>
        <p className="font-sans text-sm">Coverage unknown blocks reward open</p>
        <p className="font-sans text-sm">Coverage deficit blocks reward open</p>
        <p className="font-sans text-sm">Actual reward open remains blocked</p>
        <p className="font-sans text-sm">No production mutation</p>
        <p className="font-sans text-sm">No DB migration in Stage 3-K</p>
        <p>stage3KProtectedFundStatusTaxonomyAligned=true</p>
        <p>stage3KProtectedFundStatusUnknown=unknown_blocked</p>
        <p>stage3KProtectedFundStatusDeficit=deficit_blocked</p>
        <p>
          stage3KProtectedFundStatusMinimumCovered=minimum_covered_warning
        </p>
        <p>
          stage3KProtectedFundStatusBelowTargetBuffer=covered_below_target_buffer
        </p>
        <p>stage3KProtectedFundStatusTargetBufferOk=target_buffer_ok</p>
        <p>stage3KProtectedFundStatusNoLiability=no_liability_observed</p>
        <p>0/0 =&gt; no_liability_observed</p>
        <p>10000/10000 =&gt; minimum_covered_warning</p>
        <p>10000/10500 =&gt; covered_below_target_buffer</p>
        <p>10000/11000 =&gt; target_buffer_ok</p>
        {sampleEvaluations.map(([label, liability, available]) => {
          const evaluation = evaluateProtectedFundReconciliationGate({
            liabilitySourceAvailable: true,
            protectedFundBalanceAvailable: true,
            calculationSourceFinalized: true,
            consumerUnconvertedPointsLiabilityWon: liability,
            protectedFundAvailableWon: available,
          });

          return (
            <p key={label}>
              {label} =&gt; {evaluation.status}
            </p>
          );
        })}
        {Object.entries(protectedFundReconciliation).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
    </ShellCard>
  );
}
