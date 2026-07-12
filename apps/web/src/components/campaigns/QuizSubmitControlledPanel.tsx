"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import {
  submitConsumerQuizForRewardAction,
  submitStage4A2ShortAnswerDemoAction,
} from "@/app/consumer/ads/[campaignId]/actions";
import type { ConsumerAdCardDto } from "@/lib/consumer-ads/types";
import type { Stage3CSubmitResult } from "@/lib/quiz-rewards/stage3c-types";
import { AdViewSessionStarter } from "./AdViewSessionStarter";
import { MinViewTimer } from "./MinViewTimer";

type QuizSubmitControlledPanelProps = {
  card: ConsumerAdCardDto;
  productionRewardBlocked: boolean;
};

export function QuizSubmitControlledPanel({
  card,
  productionRewardBlocked,
}: QuizSubmitControlledPanelProps) {
  const submitIntentSeed = useId();
  const [viewSessionReady, setViewSessionReady] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [timerComplete, setTimerComplete] = useState(false);
  const [submitResult, setSubmitResult] = useState<Stage3CSubmitResult | null>(
    null,
  );
  const [shortAnswerResult, setShortAnswerResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitDisabledByResult =
    submitResult?.resultCode === "STAGE3B_WRONG_FINAL_NO_REWARD" ||
    submitResult?.resultCode === "STAGE3B_DUPLICATE_SUBMISSION_BLOCKED" ||
    submitResult?.resultCode === "STAGE3B_IDEMPOTENT_DUPLICATE" ||
    submitResult?.resultCode === "STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT" ||
    submitResult?.resultCode === "STAGE3B_REWARDED" ||
    submitResult?.resultCode === "STAGE3C_PRODUCTION_REWARD_BLOCKED" ||
    submitResult?.resultCode === "STAGE3B_PRODUCTION_BLOCKED" ||
    (submitResult?.remainingAttempts === 0 &&
      submitResult.resultCode !== "STAGE3B_WRONG_RETRY_ALLOWED");

  const canSubmit =
    viewSessionReady &&
    timerComplete &&
    (card.quizType === "short_answer" ? Boolean(shortAnswer.trim()) : selectedOptionId != null) &&
    !isPending &&
    attemptsRemaining > 0 &&
    !submitDisabledByResult;

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

  const submitIntentId = useMemo(
    () => `${card.campaignId}:${submitIntentSeed}`,
    [card.campaignId, submitIntentSeed],
  );

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      if (card.quizType === "short_answer") {
        const result = await submitStage4A2ShortAnswerDemoAction({
          campaignId: card.campaignId,
          quizId: card.quizId,
          responseText: shortAnswer,
        });
        setShortAnswerResult(result.message);
        return;
      }
      if (!selectedOptionId) return;
      const result = await submitConsumerQuizForRewardAction({
        campaignId: card.campaignId,
        quizId: card.quizId,
        selectedOptionId,
        submitIntentId,
      });
      setSubmitResult(result);
      if (result.remainingAttempts != null) {
        setAttemptsRemaining(result.remainingAttempts);
      }
      if (
        result.resultCode === "STAGE3B_MIN_VIEW_SECONDS_NOT_MET" ||
        result.resultCode === "STAGE3C_PRODUCTION_REWARD_BLOCKED"
      ) {
        setTimerComplete(false);
      }
    });
  }

  return (
    <section
      data-testid="quiz-controlled-panel"
      aria-label="퀴즈 제출"
      className="mt-6 space-y-4"
    >
      {productionRewardBlocked && (
        <div
          data-testid="production-reward-blocked-notice"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p className="font-medium">
            현재 운영 환경에서는 포인트 적립 기능이 아직 열려 있지 않습니다.
          </p>
          <p className="mt-1">
            광고와 퀴즈 UI는 확인 가능하지만, 실제 포인트 적립은 운영 승인 후
            활성화됩니다.
          </p>
        </div>
      )}

      <div data-testid="quiz-submit-controlled-panel">
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
          <p className="mt-2 text-sm font-medium text-zinc-900">
            {card.quizQuestion}
          </p>
          {card.quizType === "multiple_choice" ? (
            <ul className="mt-3 space-y-2" role="list">
              {card.quizOptions.map((option) => (
                <li key={option.optionId}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border border-violet-100 bg-white px-3 py-2 text-sm text-zinc-800">
                    <input
                      type="radio"
                      name={`quiz-controlled-${card.campaignId}`}
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
          ) : (
            <div className="mt-3">
              <label className="text-sm font-medium text-zinc-700">
                단답형 답안
                <input
                  value={shortAnswer}
                  onChange={(event) => setShortAnswer(event.target.value)}
                  className="mt-1 w-full rounded-md border border-violet-100 bg-white px-3 py-2 text-sm"
                  placeholder="광고 내용을 보고 답안을 입력하세요"
                />
              </label>
              <p className="mt-2 text-xs text-zinc-600">
                단답형 demo는 서버 전용 registry로 채점하며 정답 원문을 응답에 포함하지 않습니다.
              </p>
            </div>
          )}

          <p
            data-testid="attempts-remaining"
            className="mt-3 text-xs text-zinc-600"
          >
            남은 도전 횟수: {attemptsRemaining}회
          </p>

          <div data-testid="quiz-controlled-submit-button">
            <button
              type="button"
              data-testid="quiz-submit-controlled-button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="mt-4 w-full rounded-lg border border-violet-300 bg-violet-600 px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-violet-700 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500"
            >
              {isPending ? "제출 중…" : "퀴즈 제출"}
            </button>
          </div>
        </div>

        {submitResult && (
          <div
            data-testid="quiz-controlled-result"
            className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800"
          >
            <p data-testid="quiz-controlled-result-message">{submitResult.message}</p>
            {submitResult.idempotencyReplay && (
              <p className="mt-1 text-xs text-zinc-600">
                중복 제출 보호가 적용되었습니다. 추가 적립은 없습니다.
              </p>
            )}
          </div>
        )}
        {shortAnswerResult && (
          <div
            data-testid="quiz-controlled-result"
            className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800"
          >
            <p data-testid="quiz-controlled-result-message">{shortAnswerResult}</p>
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
