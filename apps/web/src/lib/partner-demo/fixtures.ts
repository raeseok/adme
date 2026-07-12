import { STAGE4B_PARTNER_SHARE_RATE_PERCENT, STAGE4B_SCHEMA_VERSION } from "./constants";
import type {
  Stage4BAdvertiser,
  Stage4BInsightRow,
  Stage4BPartner,
  Stage4BPartnerDemoStore,
  Stage4BSettlement,
} from "./types";

export const STAGE4B_DEMO_PARTNER: Stage4BPartner = {
  id: "partner-goyang-north-demo",
  name: "고양 북부 로컬 파트너",
  region: "경기도 고양시 일산동구·일산서구",
  exclusiveRegionStatus: "담당 생활권 독점 demo",
  contractStatus: "active",
  shareRatePercent: STAGE4B_PARTNER_SHARE_RATE_PERCENT,
};

export const STAGE4B_DEMO_ADVERTISERS: Stage4BAdvertiser[] = [
  {
    id: "adv-baekseok-table",
    partnerId: STAGE4B_DEMO_PARTNER.id,
    name: "백석온테이블",
    category: "음식·카페",
    region: "경기도 고양시 일산동구",
    status: "active",
    maskedDemoBusinessCode: "demo-***-1204",
    recentActivityDate: "2026-07-10",
    campaigns: [
      {
        id: "camp-baekseok-lunch",
        advertiserId: "adv-baekseok-table",
        name: "백석 생활권 평일 점심 할인",
        status: "active",
        spentWon: 201600,
        verifiedViews: 820,
        quizPasses: 672,
      },
      {
        id: "camp-baekseok-evening",
        advertiserId: "adv-baekseok-table",
        name: "퇴근길 포장 주문 안내",
        status: "pending_review",
        spentWon: 0,
        verifiedViews: 0,
        quizPasses: 0,
      },
    ],
  },
  {
    id: "adv-ilsan-petcare",
    partnerId: STAGE4B_DEMO_PARTNER.id,
    name: "일산펫케어센터",
    category: "반려동물",
    region: "경기도 고양시 일산동구",
    status: "active",
    maskedDemoBusinessCode: "demo-***-7741",
    recentActivityDate: "2026-07-09",
    campaigns: [
      {
        id: "camp-ilsan-pet-checkup",
        advertiserId: "adv-ilsan-petcare",
        name: "일산 반려동물 건강검진 안내",
        status: "pending_review",
        spentWon: 0,
        verifiedViews: 0,
        quizPasses: 0,
      },
      {
        id: "camp-ilsan-pet-summer",
        advertiserId: "adv-ilsan-petcare",
        name: "여름철 피부 관리 상담",
        status: "completed",
        spentWon: 93600,
        verifiedViews: 390,
        quizPasses: 312,
      },
    ],
  },
  {
    id: "adv-lake-edu",
    partnerId: STAGE4B_DEMO_PARTNER.id,
    name: "호수키즈러닝",
    category: "교육·키즈",
    region: "경기도 고양시 일산서구",
    status: "onboarding",
    maskedDemoBusinessCode: "demo-***-5032",
    recentActivityDate: "2026-07-08",
    campaigns: [
      {
        id: "camp-lake-edu-trial",
        advertiserId: "adv-lake-edu",
        name: "초등 체험 수업 모집",
        status: "draft",
        spentWon: 0,
        verifiedViews: 0,
        quizPasses: 0,
      },
    ],
  },
  {
    id: "adv-bakery-lab",
    partnerId: STAGE4B_DEMO_PARTNER.id,
    name: "동네브레드랩",
    category: "음식·카페",
    region: "경기도 고양시 일산서구",
    status: "dormant",
    maskedDemoBusinessCode: "demo-***-8840",
    recentActivityDate: "2026-06-21",
    campaigns: [
      {
        id: "camp-bakery-new-menu",
        advertiserId: "adv-bakery-lab",
        name: "지역 베이커리 신메뉴 체험",
        status: "completed",
        spentWon: 62100,
        verifiedViews: 488,
        quizPasses: 414,
      },
    ],
  },
];

export const STAGE4B_MONTHLY_TRENDS = [
  { month: "2026-02", spentWon: 238000 },
  { month: "2026-03", spentWon: 286000 },
  { month: "2026-04", spentWon: 331000 },
  { month: "2026-05", spentWon: 358000 },
  { month: "2026-06", spentWon: 389000 },
  { month: "2026-07", spentWon: 357300 },
];

export const STAGE4B_DEMO_SETTLEMENTS: Stage4BSettlement[] = [
  {
    id: "settlement-2026-07",
    periodLabel: "2026년 7월",
    periodStart: "2026-07-01",
    periodEnd: "2026-07-31",
    status: "pending",
    shareRatePercent: STAGE4B_PARTNER_SHARE_RATE_PERCENT,
    approvedAt: null,
    paidAt: null,
    breakdown: [
      { advertiserId: "adv-baekseok-table", campaignCount: 1, spentWon: 201600 },
      { advertiserId: "adv-ilsan-petcare", campaignCount: 1, spentWon: 93600 },
      { advertiserId: "adv-bakery-lab", campaignCount: 1, spentWon: 62100 },
    ],
    adjustments: [
      {
        type: "rounding_hold",
        label: "원 단위 보류",
        amountWon: 0,
        reason: "정수 원 단위 demo 계산",
      },
    ],
    events: [
      { id: "settlement-2026-07-pending", label: "월 정산 집계 완료", status: "pending" },
    ],
  },
  {
    id: "settlement-2026-06",
    periodLabel: "2026년 6월",
    periodStart: "2026-06-01",
    periodEnd: "2026-06-30",
    status: "approved",
    shareRatePercent: STAGE4B_PARTNER_SHARE_RATE_PERCENT,
    approvedAt: "2026-07-10",
    paidAt: null,
    breakdown: [
      { advertiserId: "adv-baekseok-table", campaignCount: 2, spentWon: 184000 },
      { advertiserId: "adv-ilsan-petcare", campaignCount: 1, spentWon: 118000 },
      { advertiserId: "adv-bakery-lab", campaignCount: 1, spentWon: 87000 },
    ],
    adjustments: [
      {
        type: "demo_credit",
        label: "Demo 운영 조정",
        amountWon: 1200,
        reason: "투자자 시연용 승인 조정",
      },
    ],
    events: [
      { id: "settlement-2026-06-pending", label: "검토 대기", status: "pending" },
      { id: "settlement-2026-06-approved", label: "관리자 승인", status: "approved" },
    ],
  },
  {
    id: "settlement-2026-05",
    periodLabel: "2026년 5월",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    status: "paid",
    shareRatePercent: STAGE4B_PARTNER_SHARE_RATE_PERCENT,
    approvedAt: "2026-06-09",
    paidAt: "2026-06-15",
    breakdown: [
      { advertiserId: "adv-baekseok-table", campaignCount: 2, spentWon: 163000 },
      { advertiserId: "adv-ilsan-petcare", campaignCount: 1, spentWon: 105000 },
      { advertiserId: "adv-bakery-lab", campaignCount: 1, spentWon: 90000 },
    ],
    adjustments: [
      {
        type: "chargeback_next_month",
        label: "전월 chargeback",
        amountWon: -1800,
        reason: "paid row 직접 수정 없이 다음 달 차감하는 demo",
      },
    ],
    events: [
      { id: "settlement-2026-05-pending", label: "검토 대기", status: "pending" },
      { id: "settlement-2026-05-approved", label: "관리자 승인", status: "approved" },
      { id: "settlement-2026-05-paid", label: "수동 지급 완료", status: "paid" },
    ],
  },
];

export const STAGE4B_INSIGHTS: Stage4BInsightRow[] = [
  {
    label: "음식·카페",
    demandScore: 84,
    advertiserSupplyScore: 68,
    recommendation: "평일 점심·퇴근길 혜택 광고주 추가 모집",
  },
  {
    label: "반려동물",
    demandScore: 76,
    advertiserSupplyScore: 41,
    recommendation: "동물병원·미용·용품점 우선 제안",
  },
  {
    label: "교육·키즈",
    demandScore: 63,
    advertiserSupplyScore: 29,
    recommendation: "학원 체험수업과 주말 프로그램 캠페인 추천",
  },
  {
    label: "생활·편의",
    demandScore: 58,
    advertiserSupplyScore: 52,
    recommendation: "세탁·수리·픽업 서비스 광고주 유지",
  },
];

export function createStage4BInitialStore(): Stage4BPartnerDemoStore {
  return {
    schemaVersion: STAGE4B_SCHEMA_VERSION,
    selectedAdvertiserStatus: "all",
    selectedCategory: "all",
    searchQuery: "",
    settlementStatusById: Object.fromEntries(
      STAGE4B_DEMO_SETTLEMENTS.map((settlement) => [settlement.id, settlement.status]),
    ),
    resetVersion: 0,
  };
}

export function getStage4BAdvertiser(id?: string) {
  return (
    STAGE4B_DEMO_ADVERTISERS.find((advertiser) => advertiser.id === id) ??
    STAGE4B_DEMO_ADVERTISERS[0]
  );
}

export function getStage4BSettlement(id?: string) {
  return (
    STAGE4B_DEMO_SETTLEMENTS.find((settlement) => settlement.id === id) ??
    STAGE4B_DEMO_SETTLEMENTS[0]
  );
}
