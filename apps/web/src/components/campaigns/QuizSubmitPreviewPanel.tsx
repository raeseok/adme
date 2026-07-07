"use client";

import { useCallback, useState, useTransition } from "react";
import { submitQuizPreviewAction } from "@/app/consumer/ads/[campaignId]/actions";
import type { ConsumerAdCardDto, QuizSubmitPreviewResult } from "@/lib/consumer-ads/types";
import { MinViewTimer } from "./MinViewTimer";

type QuizSubmitPreviewPanelProps = {
  card: ConsumerAdCardDto;
};

export function QuizSubmitPreviewPanel({ card }: QuizSubmitPreviewPanelProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timerComplete, setTimerComplete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [previewResult, setPreviewResult] = useState<QuizSubmitPreviewResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedLabel =
    card.quizOptions.find((o) => o.optionId === selectedOptionId)?.label ?? null;

  const canSubmit =
    timerComplete && selectedOptionId != null && selectedLabel != null && !isPending;

  const handleTimerComplete = useCallback((ms: number) => {
    setElapsedMs(ms);
    setTimerComplete(true);
  }, []);

  function handleSubmit() {
    if (!canSubmit || !selectedLabel) return;

    startTransition(async () => {
      const result = await submitQuizPreviewAction(
        {
          campaignId: card.campaignId,
          quizId: card.quizId,
          selectedOption: selectedLabel,
          clientElapsedMs: elapsedMs,
        },
        card.minViewSecondsPreview,
        card.rewardPointsPreview,
      );
      setPreviewResult(result);
    });
  }

  return (
    <section
      data-testid="quiz-submit-preview-panel"
      aria-label="퀴즈 제출 미리보기"
      className="mt-6 space-y-4"
    >
      <MinViewTimer
        key={`${card.campaignId}-${card.minViewSecondsPreview}`}
        requiredSeconds={card.minViewSecondsPreview}
        onComplete={handleTimerComplete}
      />

      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
        <h3 className="text-sm font-semibold text-violet-900">퀴즈</h3>
        <p className="mt-2 text-sm font-medium text-zinc-900">{card.quizQuestion}</p>
        <ul className="mt-3 space-y-2" role="list">
          {card.quizOptions.map((option) => (
            <li key={option.optionId}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-violet-100 bg-white px-3 py-2 text-sm text-zinc-800">
                <input
                  type="radio"
                  name={`quiz-submit-${card.campaignId}`}
                  value={option.optionId}
                  checked={selectedOptionId === option.optionId}
                  onChange={() => setSelectedOptionId(option.optionId)}
                  className="mt-0.5"
                  aria-label={option.label}
                />
                <span>{option.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <button
          type="button"
          data-testid="quiz-submit-preview-button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="mt-4 w-full rounded-lg border border-violet-300 bg-violet-600 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-violet-700 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500"
        >
          {isPending ? "제출 중…" : "퀴즈 제출"}
        </button>
      </div>

      {previewResult && (
        <div
          data-testid="quiz-preview-result"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800"
        >
          {previewResult.result === "correct" && (
            <>
              <p className="font-medium text-emerald-800">정답입니다.</p>
              <p className="mt-1">포인트 적립은 다음 단계에서 처리됩니다.</p>
              {previewResult.rewardPointsPreview != null && (
                <p className="mt-1 text-violet-900">
                  리워드 미리보기: {previewResult.rewardPointsPreview}P (preview)
                </p>
              )}
            </>
          )}
          {previewResult.result === "incorrect" && (
            <>
              <p className="font-medium text-rose-800">오답입니다.</p>
              <p className="mt-1">이번 단계에서는 정답을 공개하지 않습니다.</p>
            </>
          )}
          {previewResult.result === "not_allowed" && (
            <p>{previewResult.nextAllowedAction}</p>
          )}
          {previewResult.result === "invalid" && (
            <p>{previewResult.nextAllowedAction}</p>
          )}
        </div>
      )}

      <p className="text-xs text-zinc-600">
        Stage 2-B preview에서는 클라이언트 타이머 기준으로만 제출 가능 여부를 확인합니다.
        실제 지급 검증은 다음 단계에서 서버 기록 기반으로 처리됩니다.
      </p>
    </section>
  );
}
