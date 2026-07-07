import Link from "next/link";
import { AdCardPreview } from "@/components/consumer-ads/AdCardPreview";
import { QuizSubmitPreviewPanel } from "@/components/campaigns/QuizSubmitPreviewPanel";
import { ShellCard } from "@/components/ShellCard";
import { fetchConsumerAdCards } from "@/lib/consumer-ads/fetch-consumer-ads.server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function ConsumerAdDetailPage({ params }: PageProps) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { cards } = await fetchConsumerAdCards(supabase);
  const card = cards.find((c) => c.campaignId === campaignId);

  if (!card) {
    return (
      <ShellCard title="광고를 찾을 수 없습니다" wide>
        <p className="text-sm text-zinc-700">
          요청하신 광고 카드를 찾을 수 없습니다.
        </p>
        <Link
          href="/consumer/ads"
          className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← 광고 목록으로
        </Link>
      </ShellCard>
    );
  }

  return (
    <ShellCard title={card.title} wide>
      <section className="space-y-2 text-sm text-zinc-800">
        <p>광고 본문을 확인한 뒤 퀴즈에 참여할 수 있습니다.</p>
        <p>퀴즈 정답은 화면과 네트워크 응답에 포함하지 않습니다.</p>
        <p>리워드는 미리보기(preview)만 표시하며, 포인트 적립은 다음 단계에서 처리됩니다.</p>
        <p>카카오톡 광고 도착 알림은 향후 선택 동의 기반 기능으로 검토 중입니다.</p>
      </section>

      <div className="mt-6">
        <AdCardPreview card={card} showQuizInline={false} />
      </div>

      <QuizSubmitPreviewPanel card={card} />

      <Link
        href="/consumer/ads"
        className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        ← 광고 목록으로
      </Link>
    </ShellCard>
  );
}
