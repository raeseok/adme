"use server";

import {
  getBirthYearMax,
  BIRTH_YEAR_MIN,
  isGenderValue,
  isInterestScopeValue,
  INTEREST_SCOPE_ALL,
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
  if (input.birthYear != null) {
    if (!Number.isInteger(input.birthYear)) {
      return "출생년도는 숫자로 입력해 주세요.";
    }
    if (input.birthYear < BIRTH_YEAR_MIN) {
      return `출생년도는 ${BIRTH_YEAR_MIN}년 이상이어야 합니다.`;
    }
    if (input.birthYear > getBirthYearMax()) {
      return `출생년도는 ${getBirthYearMax()}년 이하여야 합니다.`;
    }
  }

  if (input.gender != null && input.gender !== "" && !isGenderValue(input.gender)) {
    return "성별 선택값이 올바르지 않습니다.";
  }

  if (!input.residenceRegionId || !UUID_RE.test(input.residenceRegionId)) {
    return "주거지역(시·군·구)을 선택해 주세요.";
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

  if (!isInterestScopeValue(input.interestScope)) {
    return "관심정보 선택 방식이 올바르지 않습니다.";
  }

  if (input.interestScope === "selected" && !input.categoryIds.length) {
    return "관심 분야를 1개 이상 선택하거나 '전체'를 선택해 주세요.";
  }

  if (input.interestScope === "selected") {
    for (const id of input.categoryIds) {
      if (!UUID_RE.test(id)) {
        return "관심 분야 형식이 올바르지 않습니다.";
      }
    }
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

  const birthYear = input.birthYear;
  const gender =
    input.gender && input.gender.length > 0 ? input.gender : null;
  const interestScope = input.interestScope;

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("consumer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    return errorResult(profileLookupError.message);
  }

  let profileId = existingProfile?.id as string | undefined;

  const profilePayload = {
    region_id: input.residenceRegionId,
    birth_year: birthYear,
    gender,
    interest_scope: interestScope,
  };

  if (!profileId) {
    const { data: created, error: createError } = await supabase
      .from("consumer_profiles")
      .insert({
        user_id: user.id,
        ...profilePayload,
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
      .update(profilePayload)
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

  if (interestScope !== INTEREST_SCOPE_ALL && input.categoryIds.length > 0) {
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
