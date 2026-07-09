import { ShellCard } from "@/components/ShellCard";
import { getStage3GPartnerSettlementManualApprovalState } from "@/lib/rewards/stage3g-partner-settlement-manual-approval";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PartnerSettlementPreflightPage() {
  const partnerSettlement = getStage3GPartnerSettlementManualApprovalState();

  return (
    <ShellCard title="Partner Settlement Manual Approval Design">
      <p className="rounded-lg bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-900">
        Actual partner settlement processing is blocked
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page is a read-only preflight marker view. It does not
        create settlements, run monthly close, confirm settlements, mark payouts
        paid, or write chargebacks.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        advertisers.partner_id attribution is locked. Partner lookup at campaign,
        ad view, quiz pass, or settlement time remains blocked.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        <Link
          href="/admin/reward-preflight"
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          Reward preflight 상세 →
        </Link>
      </p>

      <section className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Monthly close batch</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(partnerSettlement.stage3GMonthlyCloseBatch)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Partner payout action</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(partnerSettlement.stage3GPartnerSettlementAutoPayout)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Next-month payout day</p>
          <p className="mt-1 font-mono text-zinc-700">
            {partnerSettlement.stage3GNextMonthPayoutDay}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Settlement mutation</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(partnerSettlement.stage3GPartnerSettlementsMutation)}
          </p>
        </div>
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
        {Object.entries(partnerSettlement).map(([key, value]) => (
          <p key={key}>
            {key}={String(value)}
          </p>
        ))}
      </section>
    </ShellCard>
  );
}
