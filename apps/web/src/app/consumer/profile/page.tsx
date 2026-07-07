import { ShellCard } from "@/components/ShellCard";
import { getSessionSnapshot } from "@/lib/auth/session";
import {
  getConsumerProfilePageData,
  loadConsumerProfileDraft,
} from "@/lib/consumer-profile/page-data";
import type { ConsumerProfileStage1CContext } from "@/lib/consumer-profile/types";
import { createClient } from "@/lib/supabase/server";
import { ConsumerProfileForm } from "./ConsumerProfileForm";

export const dynamic = "force-dynamic";

export default async function ConsumerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ stage1DSocialLogout?: string }>;
}) {
  const supabase = await createClient();
  const { user, snapshot } = await getSessionSnapshot();
  const params = await searchParams;
  const socialLogoutStatus =
    params.stage1DSocialLogout === "signed_out" ? "signed_out" : "not_tested";

  const pageData = await getConsumerProfilePageData(supabase);
  const isAuthenticated = snapshot.sessionStatus === "authenticated";

  let consumerProfileReadStatus: ConsumerProfileStage1CContext["consumerProfileReadStatus"] =
    isAuthenticated ? "not_found" : "skipped";

  let initialDraft = null;

  if (isAuthenticated && supabase && user) {
    const loaded = await loadConsumerProfileDraft(
      supabase,
      user.id,
      pageData.regionRows,
    );
    consumerProfileReadStatus = loaded.meta.consumerProfileReadStatus;
    initialDraft = loaded.draft;
  }

  const stage1C: ConsumerProfileStage1CContext = {
    session: snapshot,
    masterReadMode: isAuthenticated
      ? "authenticated-client"
      : "anonymous-client",
    regionsReadStatusAuth: isAuthenticated
      ? pageData.regionsReadStatus
      : "skipped",
    categoriesReadStatusAuth: isAuthenticated
      ? pageData.categoriesReadStatus
      : "skipped",
    regionCountAuth: isAuthenticated ? pageData.regionCount : 0,
    categoryCountAuth: isAuthenticated ? pageData.categoryCount : 0,
    consumerProfileReadStatus,
  };

  return (
    <ShellCard title="소비 의향 프로필" wide>
      <ConsumerProfileForm
        pageData={pageData}
        stage1C={stage1C}
        initialDraft={initialDraft}
        socialLogoutStatus={socialLogoutStatus}
      />
    </ShellCard>
  );
}
