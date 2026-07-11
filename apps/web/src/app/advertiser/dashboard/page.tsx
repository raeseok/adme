import { ShellCard } from "@/components/ShellCard";
import { AdvertiserDemoConsole } from "@/components/stage4a/AdvertiserDemoConsole";

export default function AdvertiserDashboardPage() {
  return (
    <ShellCard title="광고주 콘솔">
      <AdvertiserDemoConsole view="dashboard" />
    </ShellCard>
  );
}
