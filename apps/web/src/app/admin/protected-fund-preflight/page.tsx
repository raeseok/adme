import { ShellCard } from "@/components/ShellCard";
import { getStage3KProtectedFundReconciliationDesignState } from "@/lib/compliance/stage3k-protected-fund-reconciliation-design";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProtectedFundPreflightPage() {
  const protectedFundReconciliation =
    getStage3KProtectedFundReconciliationDesignState();

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
          <p className="font-medium text-zinc-900">Minimum coverage ratio</p>
          <p className="mt-1 font-mono text-zinc-700">
            {protectedFundReconciliation.stage3KCoverageMinimumRatio}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Warning coverage ratio</p>
          <p className="mt-1 font-mono text-zinc-700">
            {protectedFundReconciliation.stage3KCoverageWarningRatio}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Target buffer ratio</p>
          <p className="mt-1 font-mono text-zinc-700">
            {protectedFundReconciliation.stage3KCoverageTargetBufferRatio}
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
        {Object.entries(protectedFundReconciliation).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
    </ShellCard>
  );
}
