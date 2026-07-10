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
      const savableRegionIds = new Set(pageData.savableRegionIds);
      completionPercent = computeProfileCompletion({
        birthYear: draft.birthYear,
        gender: draft.gender,
        residenceRegionId: draft.residenceRegionId,
        savableRegionIds,
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

      <section className="mt-6 space-y-3">
        <p className="text-sm font-semibold text-zinc-900">맞춤 소비정보</p>
        <p className="text-sm text-zinc-600">
          관심 지역·분야에 맞는 광고 카드와 퀴즈 미리보기를 확인할 수 있습니다.
          현재는 읽기 전용 미리보기이며 포인트 적립은 Stage 2-B 이후에 제공됩니다.
        </p>
        <Link
          href="/consumer/ads"
          className="inline-block rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800 transition hover:bg-violet-100"
        >
          광고 카드 · 퀴즈 미리보기 보기
        </Link>
      </section>

      <section className="mt-6 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
        <p className="text-sm font-semibold text-emerald-950">현금전환 시연</p>
        <p className="text-sm text-emerald-900">
          투자자 시연용 Sandbox에서 포인트 현금전환 신청과 상태 흐름을 확인할 수
          있습니다. 실제 포인트는 차감되지 않습니다.
        </p>
        <Link
          href="/consumer/cash-redemption"
          className="inline-block rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          현금전환 시연 보기
        </Link>
      </section>
    </ShellCard>
  );
}
