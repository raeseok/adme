import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default function AdvertiserCampaignsPage() {
  return (
    <ShellCard title="광고주 캠페인">
      <AdvertiserDemoConsole view="campaigns" />
    </ShellCard>
  );
}
