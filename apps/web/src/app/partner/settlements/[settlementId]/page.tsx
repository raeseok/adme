import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default async function PartnerSettlementDetailPage({
  params,
}: {
  params: Promise<{ settlementId: string }>;
}) {
  const { settlementId } = await params;
  return (
    <ShellCard title="정산 상세">
      <PartnerDemoConsole view="settlement-detail" settlementId={settlementId} />
    </ShellCard>
  );
}
