import { ShellCard } from "@/components/ShellCard";
import { getStage3HLegalTaxPaymentComplianceState } from "@/lib/compliance/stage3h-legal-tax-payment-compliance";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CompliancePreflightPage() {
  const compliance = getStage3HLegalTaxPaymentComplianceState();

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
