import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default async function AdvertiserCampaignPerformancePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  return (
    <ShellCard title="캠페인 성과">
      <AdvertiserDemoConsole view="performance" campaignId={campaignId} />
    </ShellCard>
  );
}
