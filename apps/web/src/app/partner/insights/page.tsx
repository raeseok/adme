import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default function PartnerInsightsPage() {
  return (
    <ShellCard title="지역 소비 수요 인사이트">
      <PartnerDemoConsole view="insights" />
    </ShellCard>
  );
}
