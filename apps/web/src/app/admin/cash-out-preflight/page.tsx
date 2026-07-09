import { ShellCard } from "@/components/ShellCard";
import { getStage3FCashOutManualApprovalState } from "@/lib/rewards/stage3f-cash-out-manual-approval";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CashOutPreflightPage() {
  const cashOut = getStage3FCashOutManualApprovalState();

  return (
    <ShellCard title="Cash-out Manual Approval Design">
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
        Actual cash-out processing is blocked
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        This admin-only page is a read-only preflight marker view. It does not
        create cash-out requests, approve decisions, reject requests, complete
        transfers, or write recovery ledger entries.
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
          <p className="font-medium text-zinc-900">Minimum cash-out amount</p>
          <p className="mt-1 font-mono text-zinc-700">
            {cashOut.stage3FCashOutMinAmount}P
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Manual approval required</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(cashOut.stage3FCashOutManualApprovalRequired)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Auto transfer disabled</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(!cashOut.stage3FCashOutAutoTransfer)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Delete rollback disabled</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(!cashOut.stage3FCashOutDeleteRollbackAllowed)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Adjustment/reversal required</p>
          <p className="mt-1 font-mono text-zinc-700">
            {String(cashOut.stage3FCashOutAdjustmentReversalRequired)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
          <p className="font-medium text-zinc-900">Production reward open unchanged</p>
          <p className="mt-1 font-mono text-zinc-700">
            flag={String(cashOut.stage3FProductionRewardOpenFlag)} · killSwitch=
            {String(cashOut.stage3FRewardKillSwitch)}
          </p>
        </div>
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
    </ShellCard>
  );
}
