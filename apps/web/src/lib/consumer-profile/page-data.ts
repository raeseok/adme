import type { SupabaseClient } from "@supabase/supabase-js";
import { intentToSpendRange } from "./constants";
import type { ConsumerProfilePageData } from "./types";
import { buildRegionOptions, type RegionRow } from "./regions";

export async function getConsumerProfilePageData(
  supabase: SupabaseClient | null,
): Promise<ConsumerProfilePageData> {
  if (!supabase) {
    return {
      regions: [],
      categories: [],
      regionsReadStatus: "error",
      categoriesReadStatus: "error",
      regionCount: 0,
      categoryCount: 0,
      regionsEmpty: true,
      categoriesEmpty: true,
    };
  }

  const [regionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("regions")
      .select("id, code, name, parent_id, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("interest_categories")
      .select("id, code, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const regionsReadStatus = regionsResult.error ? "error" : "ok";
  const categoriesReadStatus = categoriesResult.error ? "error" : "ok";

  const regionRows = (regionsResult.data ?? []) as RegionRow[];
  const regions = regionsReadStatus === "ok" ? buildRegionOptions(regionRows) : [];

  const categories =
    categoriesReadStatus === "ok"
      ? (categoriesResult.data ?? []).map((c) => ({
          id: c.id as string,
          code: c.code as string,
          name: c.name as string,
        }))
      : [];

  return {
    regions,
    categories,
    regionsReadStatus,
    categoriesReadStatus,
    regionCount: regions.length,
    categoryCount: categories.length,
    regionsEmpty: regions.length === 0,
    categoriesEmpty: categories.length === 0,
  };
}

export type ConsumerProfileDraft = {
  residenceRegionId: string;
  activitySlot1RegionId: string;
  activitySlot2RegionId: string;
  categoryIds: string[];
  spendRange: string;
};

export type ConsumerProfileReadMeta = {
  consumerProfileReadStatus: "ok" | "not_found" | "error" | "skipped";
};

export async function loadConsumerProfileDraft(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ draft: ConsumerProfileDraft | null; meta: ConsumerProfileReadMeta }> {
  const { data: profile, error: profileError } = await supabase
    .from("consumer_profiles")
    .select("id, region_id, monthly_intent_min, monthly_intent_max")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    return { draft: null, meta: { consumerProfileReadStatus: "error" } };
  }

  if (!profile) {
    return { draft: null, meta: { consumerProfileReadStatus: "not_found" } };
  }

  const profileId = profile.id as string;

  const [regionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("consumer_regions")
      .select("region_id, region_type, activity_slot")
      .eq("consumer_profile_id", profileId),
    supabase
      .from("consumer_category_interests")
      .select("category_id")
      .eq("consumer_profile_id", profileId),
  ]);

  if (regionsResult.error || categoriesResult.error) {
    return { draft: null, meta: { consumerProfileReadStatus: "error" } };
  }

  let residenceRegionId = "";
  let activitySlot1RegionId = "";
  let activitySlot2RegionId = "";

  for (const row of regionsResult.data ?? []) {
    if (row.region_type === "residence") {
      residenceRegionId = row.region_id as string;
    } else if (row.region_type === "activity" && row.activity_slot === 1) {
      activitySlot1RegionId = row.region_id as string;
    } else if (row.region_type === "activity" && row.activity_slot === 2) {
      activitySlot2RegionId = row.region_id as string;
    }
  }

  if (!residenceRegionId && profile.region_id) {
    residenceRegionId = profile.region_id as string;
  }

  return {
    draft: {
      residenceRegionId,
      activitySlot1RegionId,
      activitySlot2RegionId,
      categoryIds: (categoriesResult.data ?? []).map((c) => c.category_id as string),
      spendRange: intentToSpendRange(
        profile.monthly_intent_min as number | null,
        profile.monthly_intent_max as number | null,
      ),
    },
    meta: { consumerProfileReadStatus: "ok" },
  };
}
