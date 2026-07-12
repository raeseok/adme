import "server-only";

import { compareShortAnswer, normalizeAcceptedAnswers } from "@/lib/advertiser-demo/creative-quiz";

type ShortAnswerRegistryEntry = {
  quizId: string;
  acceptedAnswers: string[];
};

const SHORT_ANSWER_REGISTRY: Record<string, ShortAnswerRegistryEntry> = {
  "stage4a2-short-answer-demo": {
    quizId: "stage4a2-short-answer-quiz",
    acceptedAnswers: normalizeAcceptedAnswers("백석동 지역 할인", [
      "백석동 할인",
      "지역 할인 행사",
    ]),
  },
};

export type Stage4A2ShortAnswerGradeResult = {
  accepted: boolean;
  result: "correct" | "incorrect" | "invalid";
  answerExposed: false;
  message: string;
};

export function gradeStage4A2ShortAnswer(input: {
  campaignId: string;
  quizId: string;
  responseText: string;
}): Stage4A2ShortAnswerGradeResult {
  const registry = SHORT_ANSWER_REGISTRY[input.campaignId];
  if (!registry || registry.quizId !== input.quizId || !input.responseText.trim()) {
    return {
      accepted: false,
      result: "invalid",
      answerExposed: false,
      message: "단답형 demo 채점을 처리할 수 없습니다.",
    };
  }

  const matched = compareShortAnswer(input.responseText, registry.acceptedAnswers);
  return {
    accepted: matched,
    result: matched ? "correct" : "incorrect",
    answerExposed: false,
    message: matched
      ? "정답입니다. Demo 채점 결과만 반환하며 정답 원문은 공개하지 않습니다."
      : "오답입니다. 정답은 공개하지 않습니다.",
  };
}
