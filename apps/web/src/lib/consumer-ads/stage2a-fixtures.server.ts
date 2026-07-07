import "server-only";

import type { ConsumerAdCardDto } from "./types";

/** Server-only sentinel — must never appear in client HTML, JS bundles, or API responses. */
export const STAGE2A_SECRET_ANSWER_DO_NOT_EXPOSE = "stage2a-fixture-answer-sentinel";

type FixtureQuiz = {
  question: string;
  options: Array<{ optionId: string; label: string }>;
  /** Server-only — never mapped to ConsumerAdCardDto */
  answer: string;
};

const FIXTURE_QUIZZES: Record<string, FixtureQuiz & { quizId: string }> = {
  "stage2a-fixture-campaign-1": {
    quizId: "stage2a-fixture-quiz-1",
    question: "이 광고에서 소개하는 매장의 주요 메뉴는 무엇인가요?",
    options: [
      { optionId: "opt-1a", label: "수제 버거 세트" },
      { optionId: "opt-1b", label: "아메리카노 원두" },
      { optionId: "opt-1c", label: "샐러드 보울" },
      { optionId: "opt-1d", label: "디저트 케이크" },
    ],
    answer: STAGE2A_SECRET_ANSWER_DO_NOT_EXPOSE,
  },
  "stage2a-fixture-campaign-2": {
    quizId: "stage2a-fixture-quiz-2",
    question: "광고 본문에 언급된 할인 혜택 적용 요일은?",
    options: [
      { optionId: "opt-2a", label: "월요일" },
      { optionId: "opt-2b", label: "수요일" },
      { optionId: "opt-2c", label: "금요일" },
      { optionId: "opt-2d", label: "일요일" },
    ],
    answer: "수요일",
  },
};

export function isFixtureCampaignId(campaignId: string): boolean {
  return campaignId in FIXTURE_QUIZZES;
}

/** Server-only fixture grading — never exposes answer text to client. */
export function gradeFixtureQuizAnswer(
  campaignId: string,
  selectedOption: string,
): boolean | null {
  const quiz = FIXTURE_QUIZZES[campaignId];
  if (!quiz) return null;
  return (
    selectedOption.trim().toLowerCase() === quiz.answer.trim().toLowerCase()
  );
}

function toCard(
  campaignId: string,
  meta: Omit<
    ConsumerAdCardDto,
    "campaignId" | "quizId" | "quizQuestion" | "quizOptions" | "readOnlyMode"
  >,
  quiz: FixtureQuiz & { quizId: string },
): ConsumerAdCardDto {
  return {
    campaignId,
    quizId: quiz.quizId,
    ...meta,
    quizQuestion: quiz.question,
    quizOptions: quiz.options.map((o) => ({
      optionId: o.optionId,
      label: o.label,
    })),
    readOnlyMode: true,
  };
}

/** Stage 2-A preview fixtures when DB has no active campaigns. */
export function getStage2AFixtureAdCards(): ConsumerAdCardDto[] {
  return [
    toCard("stage2a-fixture-campaign-1", {
      title: "강남 로컬 카페 — 시즌 메뉴 안내",
      advertiserDisplayName: "강남 로컬 카페",
      categoryLabel: "음식·카페",
      regionLabel: "서울특별시 강남구",
      bodyExcerpt:
        "강남역 인근에서 운영하는 로컬 카페의 시즌 메뉴를 소개합니다. 매장 방문 시 시즌 음료를 체험해 보세요.",
      pointPreviewLabel: "예상 적립 50P (미리보기)",
      rewardPointsPreview: 50,
      minViewSecondsPreview: 5,
    }, FIXTURE_QUIZZES["stage2a-fixture-campaign-1"]),
    toCard("stage2a-fixture-campaign-2", {
      title: "안양 생활 밀착 할인 — 주중 혜택",
      advertiserDisplayName: "안양 생활 밀착 상점",
      categoryLabel: "생활·쇼핑",
      regionLabel: "경기도 안양시",
      bodyExcerpt:
        "안양 지역 주민을 위한 주중 할인 혜택을 안내합니다. 광고 본문을 읽고 퀴즈에 참여해 보세요.",
      pointPreviewLabel: "예상 적립 30P (미리보기)",
      rewardPointsPreview: 30,
      minViewSecondsPreview: 5,
    }, FIXTURE_QUIZZES["stage2a-fixture-campaign-2"]),
  ];
}
