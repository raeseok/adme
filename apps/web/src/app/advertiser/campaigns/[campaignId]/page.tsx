import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default async function AdvertiserCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  return (
    <ShellCard title="캠페인 상세">
      <AdvertiserDemoConsole view="detail" campaignId={campaignId} />
    </ShellCard>
  );
}
