import type { SupabaseClient } from "@supabase/supabase-js";
import {
  INTEREST_SCOPE_SELECTED,
  intentToSpendRange,
  isInterestScopeValue,
} from "./constants";
import type { InterestScopeValue } from "./constants";
import type { ConsumerProfilePageData } from "./types";
import {
  buildBasicMunicipalityOptions,
  buildRegionOptions,
  type RegionRow,
} from "./regions";
import { getSavableRegionIds, assessHierarchicalSeedCoverage, countRegionLevels } from "@/lib/regions/region-options";

export async function getConsumerProfilePageData(
  supabase: SupabaseClient | null,
): Promise<ConsumerProfilePageData> {
  if (!supabase) {
    return {
      regions: [],
      regionRows: [],
      savableRegionIds: [],
      categories: [],
      regionsReadStatus: "error",
      categoriesReadStatus: "error",
      regionCount: 0,
      categoryCount: 0,
      regionsEmpty: true,
      categoriesEmpty: true,
      provinceOnlyOptionCount: 0,
      basicMunicipalitySeedCoverage: "unknown",
      hierarchicalSeedCoverage: "unknown",
      regionLevelCounts: { sido: 0, sigungu: 0, dong: 0, total: 0 },
    };
  }

  const [regionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("regions")
      .select("id, code, name, parent_id, sort_order, is_active, region_level, path_key")
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
  const allRegionOptions =
    regionsReadStatus === "ok" ? buildRegionOptions(regionRows) : [];
  const regions =
    regionsReadStatus === "ok" ? buildBasicMunicipalityOptions(regionRows) : [];
  const savableRegionIdSet =
    regionsReadStatus === "ok" ? getSavableRegionIds(regionRows) : new Set<string>();
  const savableRegionIds = [...savableRegionIdSet];
  const hierarchicalSeedCoverage = assessHierarchicalSeedCoverage(regionRows);
  const regionLevelCounts = countRegionLevels(regionRows);
  const basicMunicipalitySeedCoverage =
    hierarchicalSeedCoverage === "unknown"
      ? "unknown"
      : hierarchicalSeedCoverage === "partial"
        ? "partial"
        : "adequate";

  const provinceOnlyOptionCount =
    regionsReadStatus === "ok"
      ? allRegionOptions.filter((o) => !regions.some((m) => m.id === o.id))
          .length
      : 0;

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
    regionRows,
    savableRegionIds,
    categories,
    regionsReadStatus,
    categoriesReadStatus,
    regionCount: regions.length,
    categoryCount: categories.length,
    regionsEmpty: regionRows.length === 0,
    categoriesEmpty: categories.length === 0,
    provinceOnlyOptionCount,
    basicMunicipalitySeedCoverage,
    hierarchicalSeedCoverage,
    regionLevelCounts,
  };
}

export type ConsumerProfileDraft = {
  birthYear: number | null;
  gender: string | null;
  residenceRegionId: string;
  activitySlot1RegionId: string;
  activitySlot2RegionId: string;
  interestScope: InterestScopeValue;
  categoryIds: string[];
  legacySpendRange: string;
  legacyResidenceRegionId: string | null;
};

export type ConsumerProfileReadMeta = {
  consumerProfileReadStatus: "ok" | "not_found" | "error" | "skipped";
};

function normalizeGender(raw: string | null): string | null {
  if (!raw) return null;
  if (raw === "prefer_not_to_say" || raw === "other") return "undisclosed";
  return raw;
}

function normalizeInterestScope(raw: string | null | undefined): InterestScopeValue {
  if (raw && isInterestScopeValue(raw)) return raw;
  return INTEREST_SCOPE_SELECTED;
}

export async function loadConsumerProfileDraft(
  supabase: SupabaseClient,
  userId: string,
  validRegionIds?: ReadonlySet<string>,
): Promise<{ draft: ConsumerProfileDraft | null; meta: ConsumerProfileReadMeta }> {
  const { data: profile, error: profileError } = await supabase
    .from("consumer_profiles")
    .select(
      "id, region_id, monthly_intent_min, monthly_intent_max, birth_year, gender, interest_scope",
    )
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
  let legacyResidenceRegionId: string | null = null;

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

  if (validRegionIds && residenceRegionId && !validRegionIds.has(residenceRegionId)) {
    legacyResidenceRegionId = residenceRegionId;
    residenceRegionId = "";
  }

  if (validRegionIds) {
    if (activitySlot1RegionId && !validRegionIds.has(activitySlot1RegionId)) {
      activitySlot1RegionId = "";
    }
    if (activitySlot2RegionId && !validRegionIds.has(activitySlot2RegionId)) {
      activitySlot2RegionId = "";
    }
  }

  const interestScope = normalizeInterestScope(
    profile.interest_scope as string | null | undefined,
  );

  return {
    draft: {
      birthYear: (profile.birth_year as number | null) ?? null,
      gender: normalizeGender(profile.gender as string | null),
      residenceRegionId,
      activitySlot1RegionId,
      activitySlot2RegionId,
      interestScope,
      categoryIds: (categoriesResult.data ?? []).map((c) => c.category_id as string),
      legacySpendRange: intentToSpendRange(
        profile.monthly_intent_min as number | null,
        profile.monthly_intent_max as number | null,
      ),
      legacyResidenceRegionId,
    },
    meta: { consumerProfileReadStatus: "ok" },
  };
}

export async function loadConsumerProfileSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  draft: ConsumerProfileDraft | null;
  meta: ConsumerProfileReadMeta;
  pageData: ConsumerProfilePageData;
}> {
  const pageData = await getConsumerProfilePageData(supabase);
  const validRegionIds = new Set(pageData.savableRegionIds);
  const loaded = await loadConsumerProfileDraft(supabase, userId, validRegionIds);
  return { ...loaded, pageData };
}
