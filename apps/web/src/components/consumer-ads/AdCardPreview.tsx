import Link from "next/link";
import Image from "next/image";
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
      <section className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-xs font-semibold text-violet-700">
          광고 메인 콘텐츠 ·{" "}
          {card.creativeType === "text" ? "텍스트" : card.creativeType === "image" ? "이미지" : "동영상"}
        </p>
        <h3 className="mt-1 font-semibold text-zinc-900">{card.creativeTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">{card.creativeBody}</p>
        {card.creativeType === "image" && card.imageUrl && (
          <Image
            src={card.imageUrl}
            alt={card.imageAlt ?? "광고 이미지"}
            width={640}
            height={360}
            className="mt-3 h-auto max-h-64 w-full object-contain"
          />
        )}
        {card.creativeType === "video" && card.videoUrl && (
          <video
            src={card.videoUrl}
            poster={card.videoPosterUrl}
            controls
            playsInline
            preload="metadata"
            className="mt-3 w-full rounded-lg"
          >
            {card.videoCaption}
          </video>
        )}
        {card.linkEnabled && card.landingUrl && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
            <p>{card.externalLinkNotice}</p>
            <a
              href={card.landingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="mt-2 inline-block rounded-md bg-blue-600 px-3 py-2 font-semibold text-white"
            >
              {card.ctaLabel ?? "자세히 보기"}
            </a>
            <p className="mt-1">링크 클릭은 퀴즈 통과 또는 포인트 적립으로 인정되지 않습니다.</p>
          </div>
        )}
      </section>
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
