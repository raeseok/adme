import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default async function AdminPartnerSettlementDetailPage({
  params,
}: {
  params: Promise<{ settlementId: string }>;
}) {
  const { settlementId } = await params;
  return (
    <ShellCard title="관리자 파트너 정산 상세 Demo">
      <PartnerDemoConsole
        view="admin-settlement-detail"
        settlementId={settlementId}
      />
    </ShellCard>
  );
}
