import Link from "next/link";
import { AdCardPreview } from "@/components/consumer-ads/AdCardPreview";
import { ShellCard } from "@/components/ShellCard";
import { fetchConsumerAdCards } from "@/lib/consumer-ads/fetch-consumer-ads.server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConsumerAdsPage() {
  const supabase = await createClient();
  const { cards, dataSource } = await fetchConsumerAdCards(supabase);

  return (
    <ShellCard title="맞춤 소비정보 · 광고 카드" wide>
      <section
        aria-label="Stage 2-A 안내"
        className="space-y-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-3 text-sm text-violet-950"
      >
        <p className="font-semibold">Stage 2-A: 광고 카드·퀴즈 안전 골격</p>
        <p>읽기 전용 광고 카드 미리보기</p>
        <p>포인트 원장 변경 없음</p>
        <p>퀴즈 정답은 화면과 네트워크 응답에 포함하지 않습니다</p>
        <p>카카오톡 광고 도착 알림은 향후 선택 동의 기반 기능으로 검토 중입니다</p>
      </section>

      {dataSource === "fixture" && (
        <p className="mt-4 text-xs text-zinc-500">
          현재 활성 캠페인이 없어 Stage 2-A 미리보기 데이터를 표시합니다.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {cards.map((card) => (
          <AdCardPreview key={card.campaignId} card={card} showQuizInline />
        ))}
      </div>

      <Link
        href="/consumer"
        className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← 소비자 홈으로
      </Link>
    </ShellCard>
  );
}
