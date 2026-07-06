"use server";

import {
  isSpendRangeValue,
  spendRangeToIntent,
} from "@/lib/consumer-profile/constants";
import type {
  SaveConsumerProfileInput,
  SaveConsumerProfileResult,
} from "@/lib/consumer-profile/types";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function authRequiredResult(message: string): SaveConsumerProfileResult {
  return {
    ok: false,
    code: "AUTH_REQUIRED",
    mutationExecuted: false,
    pointLedgerMutation: false,
    quizAnswerAccess: false,
    serviceRoleUsed: false,
    message,
    stage1CProfileSaveStatus: "auth_required",
    stage1CConsumerProfileWriteStatus: "skipped",
    stage1CConsumerRegionsWriteStatus: "skipped",
    stage1CInterestCategoriesWriteStatus: "skipped",
    stage1CMutationExecuted: false,
  };
}

function errorResult(message: string): SaveConsumerProfileResult {
  return {
    ok: false,
    code: "ERROR",
    mutationExecuted: false,
    pointLedgerMutation: false,
    quizAnswerAccess: false,
    serviceRoleUsed: false,
    message,
    stage1CProfileSaveStatus: "error",
    stage1CConsumerProfileWriteStatus: "error",
    stage1CConsumerRegionsWriteStatus: "error",
    stage1CInterestCategoriesWriteStatus: "error",
    stage1CMutationExecuted: false,
  };
}

function validateInput(input: SaveConsumerProfileInput): string | null {
  if (!input.residenceRegionId || !UUID_RE.test(input.residenceRegionId)) {
    return "주거지역을 선택해 주세요.";
  }

  const activityIds = [
    input.activitySlot1RegionId,
    input.activitySlot2RegionId,
  ].filter((id) => id.length > 0);

  for (const id of activityIds) {
    if (!UUID_RE.test(id)) {
      return "주활동지역 형식이 올바르지 않습니다.";
    }
  }

  if (!input.categoryIds.length) {
    return "관심 분야를 1개 이상 선택해 주세요.";
  }

  for (const id of input.categoryIds) {
    if (!UUID_RE.test(id)) {
      return "관심 분야 형식이 올바르지 않습니다.";
    }
  }

  if (!isSpendRangeValue(input.spendRange)) {
    return "소비 규모 범위를 선택해 주세요.";
  }

  return null;
}

export async function saveConsumerProfileAction(
  input: SaveConsumerProfileInput,
): Promise<SaveConsumerProfileResult> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      code: "CONFIG_ERROR",
      mutationExecuted: false,
      pointLedgerMutation: false,
      quizAnswerAccess: false,
      serviceRoleUsed: false,
      message: "Supabase 환경변수가 설정되지 않았습니다.",
      stage1CProfileSaveStatus: "error",
      stage1CMutationExecuted: false,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return authRequiredResult(
      "로그인이 필요합니다. /auth/login 에서 로그인 후 저장할 수 있습니다.",
    );
  }

  const validationError = validateInput(input);
  if (validationError) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      mutationExecuted: false,
      pointLedgerMutation: false,
      quizAnswerAccess: false,
      serviceRoleUsed: false,
      message: validationError,
      stage1CProfileSaveStatus: "error",
      stage1CMutationExecuted: false,
    };
  }

  const intent = spendRangeToIntent(
    input.spendRange as Parameters<typeof spendRangeToIntent>[0],
  );

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("consumer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    return errorResult(profileLookupError.message);
  }

  let profileId = existingProfile?.id as string | undefined;

  if (!profileId) {
    const { data: created, error: createError } = await supabase
      .from("consumer_profiles")
      .insert({
        user_id: user.id,
        region_id: input.residenceRegionId,
        monthly_intent_min: intent.monthly_intent_min,
        monthly_intent_max: intent.monthly_intent_max,
      })
      .select("id")
      .single();

    if (createError || !created) {
      return errorResult(createError?.message ?? "프로필 생성에 실패했습니다.");
    }
    profileId = created.id as string;
  } else {
    const { error: updateError } = await supabase
      .from("consumer_profiles")
      .update({
        region_id: input.residenceRegionId,
        monthly_intent_min: intent.monthly_intent_min,
        monthly_intent_max: intent.monthly_intent_max,
      })
      .eq("id", profileId);

    if (updateError) {
      return errorResult(updateError.message);
    }
  }

  const { error: deleteRegionsError } = await supabase
    .from("consumer_regions")
    .delete()
    .eq("consumer_profile_id", profileId);

  if (deleteRegionsError) {
    return errorResult(deleteRegionsError.message);
  }

  const regionRows: {
    consumer_profile_id: string;
    region_id: string;
    region_type: "residence" | "activity";
    activity_slot: number | null;
  }[] = [
    {
      consumer_profile_id: profileId,
      region_id: input.residenceRegionId,
      region_type: "residence",
      activity_slot: null,
    },
  ];

  if (input.activitySlot1RegionId) {
    regionRows.push({
      consumer_profile_id: profileId,
      region_id: input.activitySlot1RegionId,
      region_type: "activity",
      activity_slot: 1,
    });
  }

  if (input.activitySlot2RegionId) {
    regionRows.push({
      consumer_profile_id: profileId,
      region_id: input.activitySlot2RegionId,
      region_type: "activity",
      activity_slot: 2,
    });
  }

  const { error: insertRegionsError } = await supabase
    .from("consumer_regions")
    .insert(regionRows);

  if (insertRegionsError) {
    return errorResult(insertRegionsError.message);
  }

  const { error: deleteCategoriesError } = await supabase
    .from("consumer_category_interests")
    .delete()
    .eq("consumer_profile_id", profileId);

  if (deleteCategoriesError) {
    return errorResult(deleteCategoriesError.message);
  }

  const categoryRows = input.categoryIds.map((categoryId) => ({
    consumer_profile_id: profileId,
    category_id: categoryId,
  }));

  const { error: insertCategoriesError } = await supabase
    .from("consumer_category_interests")
    .insert(categoryRows);

  if (insertCategoriesError) {
    return errorResult(insertCategoriesError.message);
  }

  return {
    ok: true,
    code: "SAVED",
    mutationExecuted: true,
    pointLedgerMutation: false,
    quizAnswerAccess: false,
    serviceRoleUsed: false,
    message: "소비 의향 프로필이 저장되었습니다.",
    stage1CProfileSaveStatus: "saved",
    stage1CConsumerProfileWriteStatus: "saved",
    stage1CConsumerRegionsWriteStatus: "saved",
    stage1CInterestCategoriesWriteStatus: "saved",
    stage1CMutationExecuted: true,
  };
}
