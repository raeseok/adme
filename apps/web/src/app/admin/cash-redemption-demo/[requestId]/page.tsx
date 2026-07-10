import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";
import { AdminCashRedemptionDemo } from "@/components/stage3q/AdminCashRedemptionDemo";

export const dynamic = "force-dynamic";

export default async function AdminCashRedemptionDemoDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <ShellCard title="Cash Redemption Demo Request Detail" wide>
      <AdminCashRedemptionDemo initialScenarioId={requestId} />
      <Link
        href="/admin/cash-redemption-demo"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← demo operations 목록으로
      </Link>
    </ShellCard>
  );
}
