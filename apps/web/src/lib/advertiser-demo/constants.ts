export const STAGE4A_BUILD_NAME =
  "Stage 4-A Advertiser Console Investor Demo Flow";

export const STAGE4A_LOCAL_STORAGE_KEY = "adme-stage4a-advertiser-demo-v1";

export const STAGE4A_SCHEMA_VERSION = 1 as const;

export const STAGE4A_VISIBLE_MARKERS = [
  "투자자 데모 · 광고주 콘솔",
  "DEMO / SANDBOX — 실제 결제·캠페인 집행 없음",
  STAGE4A_BUILD_NAME,
  "소비자의 개인 식별 정보는 광고주에게 제공되지 않습니다.",
  "정답은 서버 전용 정보이며 소비자 화면에 노출되지 않습니다.",
  "투자자 데모 · 캠페인 검토",
  "Production DB mutation 없음",
  "Demo Performance Data",
] as const;

export const STAGE4A2_BUILD_NAME =
  "Stage 4-A-2 Ad Creative Content, Landing Link and Dual Quiz Type Demo";

export const STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ID =
  "stage4a2-image-short-answer-demo" as const;

export const STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ROUTE =
  `/consumer/ads/${STAGE4A2_IMAGE_SHORT_ANSWER_CONSUMER_DEMO_ID}` as const;

export const STAGE4A2_ADVERTISER_IMAGE_SHORT_ANSWER_DEMO_ID = "ilsan-pet-review" as const;

export const STAGE4A2_VISIBLE_MARKERS = [
  STAGE4A2_BUILD_NAME,
  "광고 메인 콘텐츠",
  "텍스트",
  "이미지",
  "동영상",
  "랜딩페이지 연결",
  "외부 사이트로 이동합니다",
  "퀴즈 유형",
  "선택형",
  "단답형",
  "정답 등록 완료",
  "정답은 소비자 화면에 표시되지 않습니다",
  "image short-answer consumer demo",
  "Production DB mutation 없음",
] as const;

export const STAGE4A_ROUTES = [
  "/advertiser",
  "/advertiser/dashboard",
  "/advertiser/campaigns",
  "/advertiser/campaigns/new",
  "/advertiser/campaigns/[campaignId]",
  "/advertiser/campaigns/[campaignId]/preview",
  "/advertiser/campaigns/[campaignId]/performance",
  "/admin/campaign-review",
  "/admin/campaign-review/[campaignId]",
] as const;

export const STAGE4A_POINT_MIN = 50;
export const STAGE4A_POINT_MAX = 500;
export const STAGE4A_MIN_VIEW_SECONDS_MIN = 3;
export const STAGE4A_MIN_VIEW_SECONDS_MAX = 15;

export const STAGE4A_DEMO_IMAGE_URL = "/window.svg";
export const STAGE4A_DEMO_VIDEO_URL = "/file.svg";
export const STAGE4A_DEMO_POSTER_URL = "/vercel.svg";
export const STAGE4A_EXTERNAL_LINK_NOTICE =
  "외부 사이트로 이동합니다. 외부 사이트의 내용과 개인정보 처리방침은 해당 사이트의 정책을 따릅니다.";

export const STAGE4A_STATUS_LABELS = {
  draft: "초안",
  ready_for_preview: "Preview 준비",
  submitted: "검토 제출",
  under_review: "관리자 검토 중",
  changes_requested: "수정 요청",
  approved: "승인",
  active: "Demo 활성",
  completed: "완료",
  rejected: "반려",
} as const;

export const STAGE4A_ALLOWED_TRANSITIONS = {
  draft: ["ready_for_preview"],
  ready_for_preview: ["draft", "submitted"],
  submitted: ["under_review"],
  under_review: ["changes_requested", "approved", "rejected"],
  changes_requested: ["draft"],
  approved: ["active"],
  active: ["completed"],
  completed: [],
  rejected: [],
} as const;

export const STAGE4A_DEMO_REGIONS = [
  "경기도 고양시 일산동구",
  "경기도 고양시 일산서구",
  "서울특별시 종로구",
  "충청남도 천안시 서북구",
] as const;

export const STAGE4A_DEMO_CATEGORIES = [
  "음식·카페",
  "반려동물",
  "생활·편의",
  "교육·키즈",
] as const;

export const STAGE4A_DEMO_DAYS = ["월", "화", "수", "목", "금"] as const;
