import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default function PartnerDashboardPage() {
  return (
    <ShellCard title="Partner Dashboard">
      <PartnerDemoConsole view="dashboard" />
    </ShellCard>
  );
}
