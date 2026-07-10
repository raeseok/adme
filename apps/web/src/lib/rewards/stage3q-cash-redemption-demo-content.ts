export type Stage3QRequestStatus =
  | "draft"
  | "eligibility_check_required"
  | "eligible"
  | "ineligible"
  | "submitted"
  | "under_review"
  | "on_hold"
  | "approved"
  | "rejected"
  | "processing"
  | "demo_completed"
  | "cancelled"
  | "expired";

export type Stage3QEligibilityResult =
  | "eligible"
  | "insufficient_balance"
  | "identity_verification_required"
  | "bank_verification_required"
  | "tax_review_required"
  | "required_terms_missing"
  | "protected_fund_check_failed"
  | "minimum_threshold_not_met"
  | "account_restricted"
  | "manual_review_required";

export type Stage3QDemoScenario = {
  id: "normal-approval" | "low-balance" | "bank-required" | "hold-then-approve";
  title: string;
  requestReference: string;
  maskedConsumer: string;
  balance: number;
  requestedAmount: number;
  eligibilityResult: Stage3QEligibilityResult;
  initialStatus: Stage3QRequestStatus;
  path: Stage3QRequestStatus[];
  preconditions: Array<{
    label: string;
    status: string;
    ok: boolean;
  }>;
  consumerMessage: string;
  adminSummary: string;
};

export const STAGE3Q_MINIMUM_REDEMPTION_AMOUNT = 10000;

export const STAGE3Q_STATUS_LABELS: Record<Stage3QRequestStatus, string> = {
  draft: "초안",
  eligibility_check_required: "조건 확인 필요",
  eligible: "신청 가능",
  ineligible: "신청 불가",
  submitted: "신청 접수",
  under_review: "관리자 검토 중",
  on_hold: "보류",
  approved: "승인",
  rejected: "반려",
  processing: "처리 중",
  demo_completed: "데모 완료",
  cancelled: "취소",
  expired: "만료",
};

export const STAGE3Q_ELIGIBILITY_LABELS: Record<Stage3QEligibilityResult, string> = {
  eligible: "전환 조건을 충족했습니다.",
  insufficient_balance: "표시 잔액이 신청 금액보다 부족합니다.",
  identity_verification_required: "본인확인 데모 조건이 필요합니다.",
  bank_verification_required: "계좌확인 데모 조건이 필요합니다.",
  tax_review_required: "세무 검토 데모 조건이 필요합니다.",
  required_terms_missing: "필수 약관 동의가 필요합니다.",
  protected_fund_check_failed: "보호재원 데모 점검이 필요합니다.",
  minimum_threshold_not_met: "최소 전환 기준에 도달하지 않았습니다.",
  account_restricted: "계정 제한 상태라 신청할 수 없습니다.",
  manual_review_required: "관리자 확인 후 진행할 수 있습니다.",
};

export const STAGE3Q_ALLOWED_TRANSITIONS: Record<Stage3QRequestStatus, Stage3QRequestStatus[]> = {
  draft: ["eligibility_check_required"],
  eligibility_check_required: ["eligible", "ineligible"],
  eligible: ["submitted"],
  ineligible: [],
  submitted: ["under_review", "cancelled"],
  under_review: ["on_hold", "approved", "rejected"],
  on_hold: ["under_review", "rejected", "cancelled"],
  approved: ["processing"],
  rejected: [],
  processing: ["demo_completed"],
  demo_completed: [],
  cancelled: [],
  expired: [],
};

const commonOkPreconditions = [
  { label: "본인확인", status: "Sandbox 확인 완료", ok: true },
  { label: "계좌확인", status: "Sandbox 확인 완료", ok: true },
  { label: "세무 검토", status: "Sandbox 검토 완료", ok: true },
  { label: "필수 약관", status: "현재 버전 동의", ok: true },
  { label: "보호재원", status: "데모 재원 충분", ok: true },
  { label: "최소 포인트", status: "기준 충족", ok: true },
];

export const STAGE3Q_DEMO_SCENARIOS: Stage3QDemoScenario[] = [
  {
    id: "normal-approval",
    title: "Scenario A: 정상 승인",
    requestReference: "DEMO-CR-A-10000",
    maskedConsumer: "consumer-demo-01",
    balance: 18500,
    requestedAmount: 10000,
    eligibilityResult: "eligible",
    initialStatus: "eligible",
    path: ["submitted", "under_review", "approved", "processing", "demo_completed"],
    preconditions: commonOkPreconditions,
    consumerMessage: "모든 sandbox 조건을 충족해 관리자 검토로 진행할 수 있습니다.",
    adminSummary: "일반 승인 흐름을 보여주는 기본 시나리오입니다.",
  },
  {
    id: "low-balance",
    title: "Scenario B: 최소 잔액 부족",
    requestReference: "DEMO-CR-B-LOW",
    maskedConsumer: "consumer-demo-02",
    balance: 7800,
    requestedAmount: 10000,
    eligibilityResult: "minimum_threshold_not_met",
    initialStatus: "ineligible",
    path: [],
    preconditions: [
      ...commonOkPreconditions.slice(0, 5),
      { label: "최소 포인트", status: "10,000P 미만", ok: false },
    ],
    consumerMessage: "최소 전환 기준에 도달하지 않아 신청 버튼이 열리지 않습니다.",
    adminSummary: "부족 조건이 자연스럽게 안내되는 소비자 시나리오입니다.",
  },
  {
    id: "bank-required",
    title: "Scenario C: 계좌확인 필요",
    requestReference: "DEMO-CR-C-BANK",
    maskedConsumer: "consumer-demo-03",
    balance: 25000,
    requestedAmount: 10000,
    eligibilityResult: "bank_verification_required",
    initialStatus: "ineligible",
    path: [],
    preconditions: [
      commonOkPreconditions[0],
      { label: "계좌확인", status: "Sandbox 확인 필요", ok: false },
      ...commonOkPreconditions.slice(2),
    ],
    consumerMessage: "실제 계좌정보 없이 계좌확인 필요 상태만 시연합니다.",
    adminSummary: "계좌정보를 저장하지 않고 precondition gap을 설명하는 시나리오입니다.",
  },
  {
    id: "hold-then-approve",
    title: "Scenario D: 보류 후 승인",
    requestReference: "DEMO-CR-D-HOLD",
    maskedConsumer: "consumer-demo-04",
    balance: 32000,
    requestedAmount: 10000,
    eligibilityResult: "manual_review_required",
    initialStatus: "submitted",
    path: ["under_review", "on_hold", "under_review", "approved", "processing", "demo_completed"],
    preconditions: [
      ...commonOkPreconditions.slice(0, 5),
      { label: "최소 포인트", status: "기준 충족, 관리자 확인 필요", ok: true },
    ],
    consumerMessage: "관리자 보류와 재검토 후 승인되는 업무 흐름을 시연합니다.",
    adminSummary: "보류, 재검토, 승인, 처리 중, 데모 완료를 한 번에 보여줍니다.",
  },
];

export function formatStage3QPoints(value: number) {
  return `${value.toLocaleString("ko-KR")}P`;
}

export function getStage3QScenario(id?: string) {
  return (
    STAGE3Q_DEMO_SCENARIOS.find((scenario) => scenario.id === id) ??
    STAGE3Q_DEMO_SCENARIOS[0]
  );
}
