import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";
import { AdminCashRedemptionDemo } from "@/components/stage3q/AdminCashRedemptionDemo";
import { getStage3QCashRedemptionDemoStateMachineState } from "@/lib/rewards/stage3q-cash-redemption-demo-state-machine";

export const dynamic = "force-dynamic";

export default function AdminCashRedemptionDemoPage() {
  const state = getStage3QCashRedemptionDemoStateMachineState();

  return (
    <ShellCard title="Cash Redemption Demo Operations" wide>
      <AdminCashRedemptionDemo />
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-xs text-zinc-600">
        <p>stage3QDemoStateMachineComplete={String(state.stage3QDemoStateMachineComplete)}</p>
        <p>sandboxOnly={String(state.sandboxOnly)}</p>
        <p>productionDbMutationAllowed={String(state.productionDbMutationAllowed)}</p>
        <p>actualPointDeductionImplemented={String(state.actualPointDeductionImplemented)}</p>
        <p>actualBankTransferImplemented={String(state.actualBankTransferImplemented)}</p>
        <p>overallDemoStatus={state.overallDemoStatus}</p>
      </section>
      <Link
        href="/admin"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← 관리자 홈으로
      </Link>
    </ShellCard>
  );
}
