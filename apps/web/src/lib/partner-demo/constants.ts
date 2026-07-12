export const STAGE4B_BUILD_NAME = "Stage 4-B Partner Dashboard Investor Demo";

export const STAGE4B_LOCAL_STORAGE_KEY = "adme-stage4b-partner-demo-v1";

export const STAGE4B_SCHEMA_VERSION = 1 as const;

export const STAGE4B_PARTNER_SHARE_RATE_PERCENT = 30;

export const STAGE4B_VISIBLE_MARKERS = [
  STAGE4B_BUILD_NAME,
  "Partner Dashboard",
  "Demo / Sandbox — 실제 파트너 정산·송금 없음",
  "담당 지역",
  "예상 파트너 수익",
  "정산 내역",
  "지역 소비 수요 인사이트",
  "Production DB mutation 없음",
] as const;

export const STAGE4B_ROUTES = [
  "/partner",
  "/partner/dashboard",
  "/partner/advertisers",
  "/partner/advertisers/[advertiserId]",
  "/partner/settlements",
  "/partner/settlements/[settlementId]",
  "/partner/insights",
  "/admin/partner-settlements",
  "/admin/partner-settlements/[settlementId]",
] as const;

export const STAGE4B_CONTRACT_STATUS_LABELS = {
  active: "계약 활성",
  pending_review: "계약 검토 중",
  terminated: "계약 해지",
} as const;

export const STAGE4B_ADVERTISER_STATUS_LABELS = {
  active: "활성",
  onboarding: "온보딩",
  dormant: "휴면",
} as const;

export const STAGE4B_CAMPAIGN_STATUS_LABELS = {
  draft: "초안",
  pending_review: "검토 대기",
  active: "활성",
  paused: "일시정지",
  completed: "완료",
  cancelled: "취소",
} as const;

export const STAGE4B_SETTLEMENT_STATUS_LABELS = {
  pending: "검토 대기",
  approved: "승인",
  paid: "지급 완료",
  cancelled: "취소",
} as const;
