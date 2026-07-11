import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default function AdvertiserNewCampaignPage() {
  return (
    <ShellCard title="새 캠페인 만들기">
      <AdvertiserDemoConsole view="wizard" />
    </ShellCard>
  );
}
