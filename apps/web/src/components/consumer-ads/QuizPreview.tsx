"use client";

import type { QuizOptionDto } from "@/lib/consumer-ads/types";

type QuizPreviewProps = {
  question: string;
  options: QuizOptionDto[];
  groupName?: string;
};

export function QuizPreview({ question, options, groupName = "quiz-preview" }: QuizPreviewProps) {
  return (
    <section
      aria-label="퀴즈 미리보기"
      className="mt-4 rounded-lg border border-violet-200 bg-violet-50/60 p-4"
    >
      <h3 className="text-sm font-semibold text-violet-900">퀴즈 미리보기</h3>
      <p className="mt-2 text-sm font-medium text-zinc-900">{question}</p>
      <ul className="mt-3 space-y-2" role="list">
        {options.map((option) => (
          <li key={option.optionId}>
            <label className="flex cursor-default items-start gap-2 rounded-md border border-violet-100 bg-white px-3 py-2 text-sm text-zinc-800">
              <input
                type="radio"
                name={groupName}
                value={option.optionId}
                disabled
                className="mt-0.5"
                aria-label={option.label}
              />
              <span>{option.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-1 text-xs text-violet-900/90">
        <p>정답 제출은 Stage 2-B에서 서버 채점으로 구현됩니다.</p>
        <p>현재 단계에서는 포인트가 적립되지 않습니다.</p>
        <p>
          카카오톡 알림은 실제 발송되지 않으며, 향후 수신 동의 기반 기능으로 분리
          검토 중입니다.
        </p>
      </div>
      <button
        type="button"
        disabled
        className="mt-3 w-full cursor-not-allowed rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500"
        aria-disabled="true"
      >
        정답 제출 (Stage 2-B 예정)
      </button>
    </section>
  );
}
