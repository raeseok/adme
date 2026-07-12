import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default function PartnerAdvertisersPage() {
  return (
    <ShellCard title="담당 광고주">
      <PartnerDemoConsole view="advertisers" />
    </ShellCard>
  );
}
