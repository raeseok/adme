import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default function AdminCampaignReviewPage() {
  return (
    <ShellCard title="캠페인 검토">
      <AdvertiserDemoConsole view="admin-list" />
    </ShellCard>
  );
}
