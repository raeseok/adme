import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default function PartnerSettlementsPage() {
  return (
    <ShellCard title="정산 내역">
      <PartnerDemoConsole view="settlements" />
    </ShellCard>
  );
}
