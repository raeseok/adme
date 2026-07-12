import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default async function PartnerAdvertiserDetailPage({
  params,
}: {
  params: Promise<{ advertiserId: string }>;
}) {
  const { advertiserId } = await params;
  return (
    <ShellCard title="광고주 상세">
      <PartnerDemoConsole view="advertiser-detail" advertiserId={advertiserId} />
    </ShellCard>
  );
}
