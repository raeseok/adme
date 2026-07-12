import { ShellCard } from "@/components/ShellCard";
import { PartnerDemoConsole } from "@/components/stage4b/PartnerDemoConsole";

export default function AdminPartnerSettlementsPage() {
  return (
    <ShellCard title="관리자 파트너 정산 검토 Demo">
      <PartnerDemoConsole view="admin-settlements" />
    </ShellCard>
  );
}
