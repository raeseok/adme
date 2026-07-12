export type Stage4BPartnerContractStatus = "active" | "pending_review" | "terminated";

export type Stage4BAdvertiserStatus = "active" | "onboarding" | "dormant";

export type Stage4BCampaignStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type Stage4BSettlementStatus = "pending" | "approved" | "paid" | "cancelled";

export type Stage4BPartner = {
  id: string;
  name: string;
  region: string;
  exclusiveRegionStatus: string;
  contractStatus: Stage4BPartnerContractStatus;
  shareRatePercent: number;
};

export type Stage4BCampaign = {
  id: string;
  advertiserId: string;
  name: string;
  status: Stage4BCampaignStatus;
  spentWon: number;
  verifiedViews: number;
  quizPasses: number;
};

export type Stage4BAdvertiser = {
  id: string;
  partnerId: string;
  name: string;
  category: string;
  region: string;
  status: Stage4BAdvertiserStatus;
  maskedDemoBusinessCode: string;
  recentActivityDate: string;
  campaigns: Stage4BCampaign[];
};

export type Stage4BSettlementBreakdown = {
  advertiserId: string;
  campaignCount: number;
  spentWon: number;
};

export type Stage4BSettlementAdjustment = {
  type: "demo_credit" | "chargeback_next_month" | "rounding_hold";
  label: string;
  amountWon: number;
  reason: string;
};

export type Stage4BSettlementEvent = {
  id: string;
  label: string;
  status: Stage4BSettlementStatus;
};

export type Stage4BSettlement = {
  id: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  status: Stage4BSettlementStatus;
  shareRatePercent: number;
  approvedAt: string | null;
  paidAt: string | null;
  breakdown: Stage4BSettlementBreakdown[];
  adjustments: Stage4BSettlementAdjustment[];
  events: Stage4BSettlementEvent[];
};

export type Stage4BInsightRow = {
  label: string;
  demandScore: number;
  advertiserSupplyScore: number;
  recommendation: string;
};

export type Stage4BPartnerDemoStore = {
  schemaVersion: 1;
  selectedAdvertiserStatus: "all" | Stage4BAdvertiserStatus;
  selectedCategory: "all" | string;
  searchQuery: string;
  settlementStatusById: Record<string, Stage4BSettlementStatus>;
  resetVersion: number;
};
