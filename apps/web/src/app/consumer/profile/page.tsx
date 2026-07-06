import { ShellCard } from "@/components/ShellCard";
import { getConsumerProfilePageData } from "@/lib/consumer-profile/page-data";
import { ConsumerProfileForm } from "./ConsumerProfileForm";

export const dynamic = "force-dynamic";

export default async function ConsumerProfilePage() {
  const pageData = await getConsumerProfilePageData();

  return (
    <ShellCard title="소비 의향 프로필" wide>
      <ConsumerProfileForm pageData={pageData} />
    </ShellCard>
  );
}
