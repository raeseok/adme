import Link from "next/link";
import { ShellCard } from "@/components/ShellCard";
import { getSessionSnapshot } from "@/lib/auth/session";
import { computeProfileCompletion } from "@/lib/consumer-profile/completion";
import { loadConsumerProfileSummary } from "@/lib/consumer-profile/page-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConsumerPage() {
  const supabase = await createClient();
  const { user, snapshot } = await getSessionSnapshot();
  const isAuthenticated = snapshot.sessionStatus === "authenticated";

  let completionPercent: number | null = null;
  let profileExists = false;

  if (isAuthenticated && supabase && user) {
    const { draft, pageData } = await loadConsumerProfileSummary(supabase, user.id);
    if (draft) {
      profileExists = true;
      const validRegionIds = new Set(pageData.regions.map((r) => r.id));
      completionPercent = computeProfileCompletion({
        birthYear: draft.birthYear,
        gender: draft.gender,
        residenceRegionId: draft.residenceRegionId,
        validRegionIds,
        interestScope: draft.interestScope,
        categoryIds: draft.categoryIds,
      }).percent;
    }
  }

  return (
    <ShellCard title="AdMe 소비자 홈">
      <section className="space-y-3 text-sm text-zinc-800">
        <p className="font-semibold text-zinc-900">소비 의향 프로필</p>
        {!isAuthenticated ? (
          <p>
            소비 의향 프로필을 설정하면 맞춤 지역 소비 정보를 받을 수 있습니다.{" "}
            <Link href="/auth/login" className="font-medium text-violet-700 underline">
              로그인
            </Link>
            후 프로필을 작성해 주세요.
          </p>
        ) : (
          <>
            {completionPercent != null ? (
              <p>
                프로필 완성도: <strong>{completionPercent}%</strong>
              </p>
            ) : (
              <p>아직 소비 의향 프로필이 없습니다.</p>
            )}
            <Link
              href="/consumer/profile"
              className="inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 transition hover:bg-blue-100"
            >
              {profileExists ? "프로필 수정하기" : "프로필 작성하기"}
            </Link>
          </>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">준비 중인 기능</p>
        <p className="mt-1">
          광고 카드, 퀴즈, 포인트 적립 기능은 아직 준비 중입니다. Stage 1-D-B에서는
          소비 의향 프로필 입력과 완성도 안내만 제공합니다.
        </p>
      </section>
    </ShellCard>
  );
}
