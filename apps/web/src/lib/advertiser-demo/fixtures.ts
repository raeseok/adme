import {
  STAGE4A_DEMO_IMAGE_URL,
  STAGE4A_DEMO_POSTER_URL,
  STAGE4A_DEMO_VIDEO_URL,
  STAGE4A_DEMO_CATEGORIES,
  STAGE4A_DEMO_DAYS,
  STAGE4A_DEMO_REGIONS,
  STAGE4A_SCHEMA_VERSION,
} from "./constants";
import { calculateStage4ABudgetEstimate } from "./calculations";
import { createPublicCreative, createPublicQuiz } from "./creative-quiz";
import type {
  AdCreativeType,
  AdQuizType,
  Stage4ACampaign,
  Stage4ADemoEvent,
  Stage4ADemoStore,
  Stage4AGenderTarget,
} from "./types";

const activeBudget = calculateStage4ABudgetEstimate({
  demoBudgetPoints: 260000,
  pointPerPass: 300,
  estimatedVerifiedEngagements: 820,
});

export const STAGE4A_DEMO_CAMPAIGNS: Stage4ACampaign[] = [
  {
    id: "baekseok-lunch-active",
    name: "백석 생활권 평일 점심 할인",
    advertiserName: "백석온테이블",
    adTitle: "평일 점심 15% 할인 쿠폰",
    description:
      "백석역 반경 생활권에서 점심 메뉴를 찾는 소비자에게 매장 방문 동기를 전달하는 demo 캠페인입니다.",
    category: "음식·카페",
    targetRegions: ["경기도 고양시 일산동구", "경기도 고양시 일산서구"],
    interestCategories: ["음식·카페", "생활·편의"],
    genderTarget: "all",
    birthYearRange: { from: 1976, to: 2004 },
    exposureDays: ["월", "화", "수", "목", "금"],
    exposureTime: { start: "10:30", end: "13:30" },
    creativeLabel: "branded-local-food-card",
    creative: createPublicCreative({
      type: "text",
      title: "평일 점심 15% 할인 쿠폰",
      body: "백석역 근처 직장인과 주민을 위한 평일 점심 15% 할인 혜택입니다. 매장 방문 전 메뉴와 운영 시간을 확인해 보세요.",
      linkEnabled: true,
      landingUrl: "https://example.com/baekseok-table",
      ctaLabel: "메뉴 자세히 보기",
    }),
    minViewSeconds: 7,
    quizType: "multiple_choice",
    quizQuestion: "이 캠페인의 평일 점심 할인율은 얼마인가요?",
    quizOptions: ["5%", "10%", "15%", "20%"],
    quiz: createPublicQuiz({
      type: "multiple_choice",
      question: "이 캠페인의 평일 점심 할인율은 얼마인가요?",
      options: ["5%", "10%", "15%", "20%"],
      authoringSecret: { multipleChoiceSelection: 2 },
    }),
    answerRegistered: true,
    pointPerPass: 300,
    demoBudgetPoints: 260000,
    estimatedReach: 2430,
    estimatedVerifiedEngagements: 820,
    startsAt: "2026-07-15",
    endsAt: "2026-07-31",
    status: "active",
    metrics: {
      matchedConsumers: 2430,
      adOpens: 1180,
      verifiedViews: 820,
      quizAttempts: 760,
      quizPasses: 672,
      pointPerPass: 300,
      demoPointSpend: 672 * 300,
      remainingDemoBudget: activeBudget.estimatedRemainingBudget,
    },
  },
  {
    id: "ilsan-pet-review",
    name: "일산 반려동물 건강검진 안내",
    advertiserName: "일산펫케어센터",
    adTitle: "여름철 반려동물 건강검진 패키지",
    description:
      "반려동물 관심 소비자에게 건강검진 필요성과 예약 혜택을 안내하는 검토 대기 demo 캠페인입니다.",
    category: "반려동물",
    targetRegions: ["경기도 고양시 일산동구"],
    interestCategories: ["반려동물"],
    genderTarget: "undisclosed",
    birthYearRange: { from: 1970, to: 2006 },
    exposureDays: ["월", "수", "금"],
    exposureTime: { start: "18:00", end: "21:00" },
    creativeLabel: "pet-care-demo-card",
    creative: createPublicCreative({
      type: "image",
      title: "여름철 반려동물 건강검진 패키지",
      body: "반려동물 보호자를 위한 여름철 건강검진과 피부 관리 상담을 안내합니다.",
      imageUrl: STAGE4A_DEMO_IMAGE_URL,
      imageAlt: "반려동물 건강검진 demo 이미지",
      linkEnabled: true,
      landingUrl: "https://example.com/ilsan-petcare-booking",
      ctaLabel: "예약 페이지 열기",
    }),
    minViewSeconds: 6,
    quizType: "short_answer",
    quizQuestion: "검진 패키지가 안내하는 주요 대상은 무엇인가요?",
    quizOptions: [],
    quiz: createPublicQuiz({
      type: "short_answer",
      question: "검진 패키지가 안내하는 주요 대상은 무엇인가요?",
      options: [],
      authoringSecret: {
        shortAnswer: "반려동물",
        acceptedAnswers: ["반려동물 건강검진", "펫 건강검진"],
      },
    }),
    answerRegistered: true,
    acceptedAnswerCount: 3,
    pointPerPass: 250,
    demoBudgetPoints: 140000,
    estimatedReach: 1280,
    estimatedVerifiedEngagements: 435,
    startsAt: "2026-07-20",
    endsAt: "2026-08-05",
    status: "under_review",
    metrics: {
      matchedConsumers: 0,
      adOpens: 0,
      verifiedViews: 0,
      quizAttempts: 0,
      quizPasses: 0,
      pointPerPass: 250,
      demoPointSpend: 0,
      remainingDemoBudget: 140000,
    },
  },
  {
    id: "jongno-after-work-draft",
    name: "종로 직장인 퇴근길 프로모션",
    advertiserName: "종로리프레시",
    adTitle: "퇴근길 픽업 전용 프로모션",
    description:
      "종로 업무지구 소비자에게 퇴근 시간대 픽업 혜택을 안내하기 위한 작성 중 demo 캠페인입니다.",
    category: "생활·편의",
    targetRegions: ["서울특별시 종로구"],
    interestCategories: ["생활·편의", "음식·카페"],
    genderTarget: "all",
    birthYearRange: { from: 1980, to: 2002 },
    exposureDays: ["월", "화", "수", "목"],
    exposureTime: { start: "17:30", end: "20:30" },
    creativeLabel: "after-work-demo-card",
    creative: createPublicCreative({
      type: "video",
      title: "퇴근길 픽업 전용 프로모션",
      body: "종로 업무지구 소비자를 위한 퇴근길 픽업 혜택과 주문 동선을 영상 demo로 안내합니다.",
      videoUrl: STAGE4A_DEMO_VIDEO_URL,
      videoPosterUrl: STAGE4A_DEMO_POSTER_URL,
      videoCaption: "퇴근길 픽업 혜택을 설명하는 deterministic demo 영상 설명",
      linkEnabled: true,
      landingUrl: "https://example.com/jongno-refresh-pickup",
      ctaLabel: "상품 확인하기",
    }),
    minViewSeconds: 5,
    quizType: "multiple_choice",
    quizQuestion: "이 프로모션이 주로 노출되는 시간대는 언제인가요?",
    quizOptions: ["출근 전", "점심 직후", "퇴근길", "새벽"],
    quiz: createPublicQuiz({
      type: "multiple_choice",
      question: "이 프로모션이 주로 노출되는 시간대는 언제인가요?",
      options: ["출근 전", "점심 직후", "퇴근길", "새벽"],
      authoringSecret: { multipleChoiceSelection: null },
    }),
    answerRegistered: false,
    pointPerPass: 200,
    demoBudgetPoints: 90000,
    estimatedReach: 960,
    estimatedVerifiedEngagements: 326,
    startsAt: "2026-08-01",
    endsAt: "2026-08-14",
    status: "draft",
    metrics: {
      matchedConsumers: 0,
      adOpens: 0,
      verifiedViews: 0,
      quizAttempts: 0,
      quizPasses: 0,
      pointPerPass: 200,
      demoPointSpend: 0,
      remainingDemoBudget: 90000,
    },
  },
  {
    id: "local-bakery-completed",
    name: "지역 베이커리 신메뉴 체험",
    advertiserName: "동네브레드랩",
    adTitle: "신메뉴 체험단 방문 혜택",
    description:
      "지역 기반 신메뉴 체험을 알리고 verified engagement 성과를 확인하는 완료 demo 캠페인입니다.",
    category: "음식·카페",
    targetRegions: ["충청남도 천안시 서북구"],
    interestCategories: ["음식·카페"],
    genderTarget: "all",
    birthYearRange: { from: 1975, to: 2005 },
    exposureDays: ["금", "토", "일"],
    exposureTime: { start: "11:00", end: "18:00" },
    creativeLabel: "bakery-demo-card",
    creative: createPublicCreative({
      type: "image",
      title: "신메뉴 체험단 방문 혜택",
      body: "동네 베이커리 신메뉴 체험 혜택과 방문 조건을 이미지 demo 소재로 안내합니다.",
      imageUrl: STAGE4A_DEMO_IMAGE_URL,
      imageAlt: "베이커리 신메뉴 demo 이미지",
      linkEnabled: true,
      landingUrl: "https://example.com/local-bakery-menu",
      ctaLabel: "홈페이지 방문",
    }),
    minViewSeconds: 8,
    quizType: "multiple_choice",
    quizQuestion: "신메뉴 체험 혜택은 어떤 업종의 캠페인인가요?",
    quizOptions: ["베이커리", "세탁", "정비", "학원"],
    quiz: createPublicQuiz({
      type: "multiple_choice",
      question: "신메뉴 체험 혜택은 어떤 업종의 캠페인인가요?",
      options: ["베이커리", "세탁", "정비", "학원"],
      authoringSecret: { multipleChoiceSelection: 0 },
    }),
    answerRegistered: true,
    pointPerPass: 150,
    demoBudgetPoints: 120000,
    estimatedReach: 1510,
    estimatedVerifiedEngagements: 513,
    startsAt: "2026-06-01",
    endsAt: "2026-06-21",
    status: "completed",
    metrics: {
      matchedConsumers: 1510,
      adOpens: 730,
      verifiedViews: 488,
      quizAttempts: 460,
      quizPasses: 414,
      pointPerPass: 150,
      demoPointSpend: 414 * 150,
      remainingDemoBudget: 120000 - 414 * 150,
    },
  },
];

export type Stage4AWizardDefaults = {
  advertiserName: string;
  name: string;
  adTitle: string;
  description: string;
  category: string;
  targetRegions: string[];
  interestCategories: string[];
  genderTarget: Stage4AGenderTarget;
  birthYearFrom: number;
  birthYearTo: number;
  exposureDays: string[];
  startTime: string;
  endTime: string;
  minViewSeconds: number;
  creativeType: AdCreativeType;
  creativeTitle: string;
  creativeBody: string;
  imageUrl: string;
  imageAlt: string;
  videoUrl: string;
  videoPosterUrl: string;
  videoCaption: string;
  linkEnabled: boolean;
  landingUrl: string;
  ctaLabel: string;
  quizType: AdQuizType;
  quizQuestion: string;
  quizOptions: string[];
  shortAnswerPrompt: string;
  acceptedAnswerCount: number;
  pointPerPass: number;
  demoBudgetPoints: number;
};

export const STAGE4A_WIZARD_DEFAULTS: Stage4AWizardDefaults = {
  advertiserName: "AdMe Demo Advertiser",
  name: "투자자 시연용 신규 캠페인",
  adTitle: "동네 고객에게 검증형 혜택 알리기",
  description:
    "소비 의향과 지역 조건이 맞는 소비자에게만 노출되는 투자자 demo 캠페인입니다.",
  category: STAGE4A_DEMO_CATEGORIES[0],
  targetRegions: [STAGE4A_DEMO_REGIONS[0]],
  interestCategories: [STAGE4A_DEMO_CATEGORIES[0]],
  genderTarget: "all",
  birthYearFrom: 1978,
  birthYearTo: 2004,
  exposureDays: [...STAGE4A_DEMO_DAYS],
  startTime: "10:30",
  endTime: "13:30",
  minViewSeconds: 7,
  creativeType: "text",
  creativeTitle: "동네 고객에게 검증형 혜택 알리기",
  creativeBody:
    "AdMe는 광고 콘텐츠를 확인한 소비자에게만 퀴즈 참여 기회를 제공하는 투자자 demo입니다.",
  imageUrl: STAGE4A_DEMO_IMAGE_URL,
  imageAlt: "AdMe demo 이미지 소재",
  videoUrl: STAGE4A_DEMO_VIDEO_URL,
  videoPosterUrl: STAGE4A_DEMO_POSTER_URL,
  videoCaption: "AdMe demo 동영상 설명",
  linkEnabled: true,
  landingUrl: "https://example.com/adme-demo",
  ctaLabel: "자세히 보기",
  quizType: "multiple_choice",
  quizQuestion: "이 광고는 어떤 혜택을 안내하나요?",
  quizOptions: ["지역 할인", "해외 배송", "계좌 등록", "세금 신고"],
  shortAnswerPrompt: "",
  acceptedAnswerCount: 0,
  pointPerPass: 300,
  demoBudgetPoints: 260000,
};

export function getStage4ACampaign(id?: string) {
  return (
    STAGE4A_DEMO_CAMPAIGNS.find((campaign) => campaign.id === id) ??
    STAGE4A_DEMO_CAMPAIGNS[0]
  );
}

export function createStage4AInitialEvents(campaign: Stage4ACampaign): Stage4ADemoEvent[] {
  const base: Stage4ADemoEvent[] = [
    {
      id: `${campaign.id}-draft`,
      campaignId: campaign.id,
      label: "캠페인 초안 생성",
      status: "draft",
    },
  ];

  if (campaign.status === "draft") return base;
  base.push({
    id: `${campaign.id}-submitted`,
    campaignId: campaign.id,
    label: "관리자 검토 제출",
    status: "submitted",
  });
  if (campaign.status === "submitted") return base;
  base.push({
    id: `${campaign.id}-under-review`,
    campaignId: campaign.id,
    label: "관리자 검토 시작",
    status: "under_review",
  });
  if (campaign.status === "under_review") return base;
  if (campaign.status === "changes_requested") {
    return [
      ...base,
      {
        id: `${campaign.id}-changes`,
        campaignId: campaign.id,
        label: "검토 결과 수정 요청",
        status: "changes_requested",
      },
    ];
  }
  if (campaign.status === "rejected") {
    return [
      ...base,
      {
        id: `${campaign.id}-rejected`,
        campaignId: campaign.id,
        label: "검토 결과 반려",
        status: "rejected",
      },
    ];
  }
  base.push({
    id: `${campaign.id}-approved`,
    campaignId: campaign.id,
    label: "관리자 승인",
    status: "approved",
  });
  if (campaign.status === "approved") return base;
  base.push({
    id: `${campaign.id}-active`,
    campaignId: campaign.id,
    label: "Demo 활성화",
    status: "active",
  });
  if (campaign.status === "completed") {
    base.push({
      id: `${campaign.id}-completed`,
      campaignId: campaign.id,
      label: "Demo 완료",
      status: "completed",
    });
  }
  return base;
}

export function createStage4AInitialStore(): Stage4ADemoStore {
  return {
    schemaVersion: STAGE4A_SCHEMA_VERSION,
    statusByCampaignId: Object.fromEntries(
      STAGE4A_DEMO_CAMPAIGNS.map((campaign) => [campaign.id, campaign.status]),
    ),
    eventsByCampaignId: Object.fromEntries(
      STAGE4A_DEMO_CAMPAIGNS.map((campaign) => [
        campaign.id,
        createStage4AInitialEvents(campaign),
      ]),
    ),
    resetVersion: 0,
    submittedCampaignId: null,
  };
}
