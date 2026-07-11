import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default async function AdminCampaignReviewDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  return (
    <ShellCard title="캠페인 검토 상세">
      <AdvertiserDemoConsole view="admin-detail" campaignId={campaignId} />
    </ShellCard>
  );
}
