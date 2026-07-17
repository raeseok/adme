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
    | "campaignId"
    | "quizId"
    | "quizQuestion"
    | "quizOptions"
    | "quizType"
    | "answerRegistered"
    | "readOnlyMode"
  > &
    Partial<
      Pick<
        ConsumerAdCardDto,
        "quizType" | "answerRegistered" | "acceptedAnswerCount"
      >
    >,
  quiz: FixtureQuiz & { quizId: string },
): ConsumerAdCardDto {
  return {
    campaignId,
    quizId: quiz.quizId,
    ...meta,
    quizType: meta.quizType ?? "multiple_choice",
    quizQuestion: quiz.question,
    quizOptions: quiz.options.map((o) => ({
      optionId: o.optionId,
      label: o.label,
    })),
    answerRegistered: meta.answerRegistered ?? true,
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
      creativeType: "text",
      creativeTitle: "강남 로컬 카페 시즌 메뉴",
      creativeBody:
        "강남역 인근 로컬 카페의 시즌 메뉴와 매장 방문 혜택을 안내하는 텍스트 demo 광고입니다.",
      linkEnabled: true,
      landingUrl: "https://example.com/gangnam-cafe",
      landingHostname: "example.com",
      ctaLabel: "홈페이지 방문",
      externalLinkNotice:
        "외부 사이트로 이동합니다. 외부 사이트의 내용과 개인정보 처리방침은 해당 사이트의 정책을 따릅니다.",
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
      creativeType: "image",
      creativeTitle: "안양 생활 밀착 할인",
      creativeBody:
        "주중 할인 혜택과 방문 조건을 이미지 demo 소재로 확인한 뒤 퀴즈에 참여합니다.",
      imageUrl: "/window.svg",
      imageAlt: "안양 생활 밀착 할인 demo 이미지",
      linkEnabled: true,
      landingUrl: "https://example.com/anyang-benefit",
      landingHostname: "example.com",
      ctaLabel: "혜택 확인하기",
      externalLinkNotice:
        "외부 사이트로 이동합니다. 외부 사이트의 내용과 개인정보 처리방침은 해당 사이트의 정책을 따릅니다.",
      pointPreviewLabel: "예상 적립 30P (미리보기)",
      rewardPointsPreview: 30,
      minViewSecondsPreview: 5,
    }, FIXTURE_QUIZZES["stage2a-fixture-campaign-2"]),
    toCard("stage4a2-video-multiple-choice-demo", {
      title: "Stage 4-A-2 동영상 광고 — 픽업 혜택",
      advertiserDisplayName: "종로리프레시",
      categoryLabel: "생활·편의",
      regionLabel: "서울특별시 종로구",
      bodyExcerpt:
        "동영상 광고 메인 콘텐츠와 외부 CTA를 확인한 뒤 선택형 퀴즈에 참여하는 demo입니다.",
      creativeType: "video",
      creativeTitle: "퇴근길 픽업 전용 프로모션",
      creativeBody:
        "퇴근길 픽업 주문 혜택을 동영상 demo 소재로 확인합니다. CTA 클릭은 보상으로 인정되지 않습니다.",
      videoUrl: "/file.svg",
      videoPosterUrl: "/vercel.svg",
      videoCaption: "퇴근길 픽업 혜택 demo 동영상 설명",
      linkEnabled: true,
      landingUrl: "https://example.com/jongno-refresh-pickup",
      landingHostname: "example.com",
      ctaLabel: "상품 확인하기",
      externalLinkNotice:
        "외부 사이트로 이동합니다. 외부 사이트의 내용과 개인정보 처리방침은 해당 사이트의 정책을 따릅니다.",
      pointPreviewLabel: "예상 적립 40P (미리보기)",
      rewardPointsPreview: 40,
      minViewSecondsPreview: 5,
    }, {
      quizId: "stage4a2-video-multiple-choice-quiz",
      question: "이 광고가 안내하는 주요 이용 시간은 언제인가요?",
      options: [
        { optionId: "video-opt-1", label: "퇴근길" },
        { optionId: "video-opt-2", label: "새벽 배송" },
        { optionId: "video-opt-3", label: "점심 회의" },
        { optionId: "video-opt-4", label: "주말 여행" },
      ],
      answer: "퇴근길",
    }),
    toCard("stage4a2-image-short-answer-demo", {
      title: "일산 반려동물 건강검진 안내",
      advertiserDisplayName: "일산펫케어센터",
      categoryLabel: "반려동물",
      regionLabel: "경기도 고양시 일산동구",
      bodyExcerpt:
        "반려동물 관심 소비자에게 건강검진 필요성과 예약 혜택을 안내하는 이미지·단답형 deterministic demo입니다.",
      creativeType: "image",
      creativeTitle: "여름철 반려동물 건강검진 패키지",
      creativeBody:
        "반려동물 보호자를 위한 여름철 건강검진과 피부 관리 상담을 안내합니다.",
      imageUrl: "/window.svg",
      imageAlt: "반려동물 건강검진 demo 이미지",
      linkEnabled: true,
      landingUrl: "https://example.com/ilsan-petcare-booking",
      landingHostname: "example.com",
      ctaLabel: "예약 페이지 열기",
      externalLinkNotice:
        "외부 사이트로 이동합니다. 외부 사이트의 내용과 개인정보 처리방침은 해당 사이트의 정책을 따릅니다.",
      pointPreviewLabel: "예상 적립 250P (미리보기)",
      rewardPointsPreview: 250,
      minViewSecondsPreview: 6,
      quizType: "short_answer",
      answerRegistered: true,
      acceptedAnswerCount: 3,
    }, {
      quizId: "stage4a2-image-short-answer-quiz",
      question: "검진 패키지가 안내하는 주요 대상은 무엇인가요?",
      options: [],
      answer: "server-only-short-answer",
    }),
    toCard("stage4a2-short-answer-demo", {
      title: "Stage 4-A-2 단답형 광고 — 백석동 할인",
      advertiserDisplayName: "백석온테이블",
      categoryLabel: "음식·카페",
      regionLabel: "경기도 고양시 일산동구",
      bodyExcerpt:
        "텍스트 광고를 읽고 단답형으로 핵심 혜택을 입력하는 deterministic server grading demo입니다.",
      creativeType: "text",
      creativeTitle: "백석동 지역 할인 안내",
      creativeBody:
        "백석동 지역 할인 행사는 점심 시간 방문 고객에게 적용되는 demo 혜택입니다.",
      linkEnabled: true,
      landingUrl: "https://example.com/baekseok-discount",
      landingHostname: "example.com",
      ctaLabel: "자세히 보기",
      externalLinkNotice:
        "외부 사이트로 이동합니다. 외부 사이트의 내용과 개인정보 처리방침은 해당 사이트의 정책을 따릅니다.",
      pointPreviewLabel: "예상 적립 60P (미리보기)",
      rewardPointsPreview: 60,
      minViewSecondsPreview: 5,
      quizType: "short_answer",
      answerRegistered: true,
      acceptedAnswerCount: 3,
    }, {
      quizId: "stage4a2-short-answer-quiz",
      question: "광고 본문에서 안내한 핵심 혜택을 입력하세요.",
      options: [],
      answer: "server-only-short-answer",
    }),
  ];
}
