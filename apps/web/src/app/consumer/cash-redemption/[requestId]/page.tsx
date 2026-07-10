import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";
import { ConsumerCashRedemptionDemo } from "@/components/stage3q/ConsumerCashRedemptionDemo";

export const dynamic = "force-dynamic";

export default async function ConsumerCashRedemptionDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;

  return (
    <ShellCard title="현금전환 시연 상세" wide>
      <ConsumerCashRedemptionDemo initialScenarioId={requestId} />
      <Link
        href="/consumer/cash-redemption"
        className="inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← 현금전환 시연 목록으로
      </Link>
    </ShellCard>
  );
}
