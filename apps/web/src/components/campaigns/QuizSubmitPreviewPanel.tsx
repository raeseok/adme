"use client";

import { useCallback, useState, useTransition } from "react";
import { submitQuizAttemptAction } from "@/app/consumer/ads/[campaignId]/actions";
import type { ConsumerAdCardDto, QuizSubmitAttemptResult } from "@/lib/consumer-ads/types";
import { AdViewSessionStarter } from "./AdViewSessionStarter";
import { MinViewTimer } from "./MinViewTimer";

type QuizSubmitPreviewPanelProps = {
  card: ConsumerAdCardDto;
};

export function QuizSubmitPreviewPanel({ card }: QuizSubmitPreviewPanelProps) {
  const [viewSessionReady, setViewSessionReady] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [timerComplete, setTimerComplete] = useState(false);
  const [attemptResult, setAttemptResult] = useState<QuizSubmitAttemptResult | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const selectedLabel =
    card.quizOptions.find((o) => o.optionId === selectedOptionId)?.label ?? null;

  const canSubmit =
    viewSessionReady &&
    timerComplete &&
    selectedOptionId != null &&
    selectedLabel != null &&
    !isPending &&
    attemptsRemaining > 0 &&
    attemptResult?.result !== "already_completed" &&
    attemptResult?.result !== "attempt_limit_reached";

  const handleViewReady = useCallback(
    (payload: { started: boolean; attemptsRemaining: number }) => {
      setViewSessionReady(payload.started);
      setAttemptsRemaining(payload.attemptsRemaining);
    },
    [],
  );

  const handleTimerComplete = useCallback(() => {
    setTimerComplete(true);
  }, []);

  function handleSubmit() {
    if (!canSubmit || !selectedLabel) return;

    startTransition(async () => {
      const result = await submitQuizAttemptAction(
        {
          campaignId: card.campaignId,
          quizId: card.quizId,
          selectedOption: selectedLabel,
        },
        card.minViewSecondsPreview,
        card.rewardPointsPreview,
      );
      setAttemptResult(result);
      setAttemptsRemaining(result.attemptsRemaining);
    });
  }

  return (
    <section
      data-testid="quiz-attempt-panel"
      aria-label="퀴즈 제출"
      className="mt-6 space-y-4"
    >
      <div data-testid="quiz-submit-preview-panel">
        <AdViewSessionStarter
          campaignId={card.campaignId}
          quizId={card.quizId}
          onReady={handleViewReady}
        />

        {viewSessionReady && (
          <div className="mt-4">
            <MinViewTimer
              key={`${card.campaignId}-${card.minViewSecondsPreview}`}
              requiredSeconds={card.minViewSecondsPreview}
              onComplete={handleTimerComplete}
            />
          </div>
        )}

        <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/60 p-4">
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

          <p
            data-testid="attempts-remaining"
            className="mt-3 text-xs text-zinc-600"
          >
            남은 도전 횟수: {attemptsRemaining}회
          </p>

          <div data-testid="quiz-attempt-submit-button">
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
        </div>

        {attemptResult && (
          <div
            data-testid="quiz-attempt-result"
            className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800"
          >
            <div data-testid="quiz-preview-result">
              {attemptResult.result === "correct" && (
                <>
                  <p className="font-medium text-emerald-800">정답입니다.</p>
                  <p className="mt-1">
                    리워드 미리보기 대상입니다. 실제 포인트 적립은 다음 단계에서
                    처리됩니다.
                  </p>
                  {attemptResult.rewardPointsPreview != null && (
                    <p className="mt-1 text-violet-900">
                      리워드 미리보기: {attemptResult.rewardPointsPreview}P (preview)
                    </p>
                  )}
                </>
              )}
              {attemptResult.result === "incorrect" && (
                <>
                  <p className="font-medium text-rose-800">오답입니다.</p>
                  <p className="mt-1">{attemptResult.nextAllowedAction}</p>
                  <p className="mt-1">이번 단계에서는 정답을 공개하지 않습니다.</p>
                </>
              )}
              {attemptResult.result === "not_allowed" && (
                <p>{attemptResult.nextAllowedAction}</p>
              )}
              {attemptResult.result === "already_completed" && (
                <p>{attemptResult.nextAllowedAction}</p>
              )}
              {attemptResult.result === "attempt_limit_reached" && (
                <p>{attemptResult.nextAllowedAction}</p>
              )}
              {attemptResult.result === "invalid" && (
                <p>{attemptResult.nextAllowedAction}</p>
              )}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-600">
          최소 열람 시간은 서버 기록 기준으로 검증합니다. 클라이언트 타이머는 UX
          표시용이며, 제출 가능 여부의 최종 판정은 서버 결과를 따릅니다.
        </p>
      </div>
    </section>
  );
}
