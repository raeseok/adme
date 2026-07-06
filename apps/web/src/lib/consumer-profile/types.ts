export type RegionOption = {
  id: string;
  code: string;
  label: string;
};

export type CategoryOption = {
  id: string;
  code: string;
  name: string;
};

export type ConsumerProfilePageData = {
  regions: RegionOption[];
  categories: CategoryOption[];
  regionsReadStatus: "ok" | "error";
  categoriesReadStatus: "ok" | "error";
  regionCount: number;
  categoryCount: number;
  regionsEmpty: boolean;
  categoriesEmpty: boolean;
};

export type SaveConsumerProfileInput = {
  residenceRegionId: string;
  activitySlot1RegionId: string;
  activitySlot2RegionId: string;
  categoryIds: string[];
  spendRange: string;
};

export type SaveConsumerProfileResult = {
  ok: boolean;
  code: "AUTH_REQUIRED" | "VALIDATION_ERROR" | "SAVED" | "ERROR" | "CONFIG_ERROR";
  mutationExecuted: boolean;
  pointLedgerMutation: false;
  quizAnswerAccess: false;
  serviceRoleUsed: false;
  message?: string;
};
