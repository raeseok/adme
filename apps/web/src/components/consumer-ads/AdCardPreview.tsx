import Link from "next/link";
import type { ConsumerAdCardDto } from "@/lib/consumer-ads/types";
import { QuizPreview } from "./QuizPreview";

type AdCardPreviewProps = {
  card: ConsumerAdCardDto;
  showQuizInline?: boolean;
};

export function AdCardPreview({ card, showQuizInline = false }: AdCardPreviewProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-blue-700">{card.advertiserDisplayName}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-900">{card.title}</h2>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
          {card.pointPreviewLabel}
        </span>
      </div>
      <dl className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
        <div className="rounded-md bg-zinc-100 px-2 py-1">
          <dt className="sr-only">지역</dt>
          <dd>{card.regionLabel}</dd>
        </div>
        <div className="rounded-md bg-zinc-100 px-2 py-1">
          <dt className="sr-only">분야</dt>
          <dd>{card.categoryLabel}</dd>
        </div>
        <div className="rounded-md bg-zinc-100 px-2 py-1">
          <dt className="sr-only">최소 열람</dt>
          <dd>최소 열람 {card.minViewSecondsPreview}초 (미리보기)</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">{card.bodyExcerpt}</p>
      {!showQuizInline && (
        <Link
          href={`/consumer/ads/${card.campaignId}`}
          className="mt-4 inline-block rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 transition hover:bg-violet-100"
        >
          광고 보기 · 퀴즈 미리보기
        </Link>
      )}
      {showQuizInline && (
        <QuizPreview
          question={card.quizQuestion}
          options={card.quizOptions}
          groupName={`quiz-${card.campaignId}`}
        />
      )}
    </article>
  );
}
