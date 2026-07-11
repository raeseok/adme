import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default async function AdvertiserCampaignPreviewPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  return (
    <ShellCard title="캠페인 Preview">
      <AdvertiserDemoConsole view="preview" campaignId={campaignId} />
    </ShellCard>
  );
}
