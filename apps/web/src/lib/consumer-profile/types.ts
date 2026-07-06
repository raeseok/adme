import type { SessionSnapshot } from "@/lib/auth/session";
import type { ConsumerProfileReadMeta } from "@/lib/consumer-profile/page-data";

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

export type ConsumerProfileStage1CContext = {
  session: SessionSnapshot;
  masterReadMode: "authenticated-client" | "anonymous-client";
  regionsReadStatusAuth: "ok" | "error" | "skipped";
  categoriesReadStatusAuth: "ok" | "error" | "skipped";
  regionCountAuth: number;
  categoryCountAuth: number;
  consumerProfileReadStatus: ConsumerProfileReadMeta["consumerProfileReadStatus"];
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
  stage1CProfileSaveStatus?: "idle" | "auth_required" | "saved" | "error";
  stage1CConsumerProfileWriteStatus?: "idle" | "saved" | "error" | "skipped";
  stage1CConsumerRegionsWriteStatus?: "idle" | "saved" | "error" | "skipped";
  stage1CInterestCategoriesWriteStatus?: "idle" | "saved" | "skipped" | "error";
  stage1CMutationExecuted?: boolean;
};
