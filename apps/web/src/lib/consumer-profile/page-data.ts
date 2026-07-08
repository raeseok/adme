import type { SupabaseClient } from "@supabase/supabase-js";
import {
  INTEREST_SCOPE_SELECTED,
  intentToSpendRange,
  isInterestScopeValue,
  isPetTypeValue,
  normalizePetTypes,
  type PetTypeValue,
} from "./constants";
import type { InterestScopeValue } from "./constants";
import type { ConsumerProfilePageData } from "./types";
import {
  buildBasicMunicipalityOptions,
  buildRegionOptions,
  type RegionRow,
} from "./regions";
import { getSavableRegionIds, countRegionLevels, assessCanonicalAdminSeedCoverage } from "@/lib/regions/region-options";
import {
  fetchAllActiveRegions,
  fetchSelectableAdminRegions,
  fetchCanonicalRegionLevelCounts,
  type RegionLevelCounts,
} from "@/lib/regions/fetch-regions";
import { STAGE1F_R_LEGACY_CODES } from "@/lib/regions/stage1f-r-source";

function assessHierarchicalSeedCoverageFromCounts(
  counts: RegionLevelCounts,
  rows: RegionRow[],
): "partial" | "adequate" | "full" | "unknown" {
  if (counts.total === 0) return assessCanonicalAdminSeedCoverage(rows);
  const coverage = assessCanonicalAdminSeedCoverage(rows);
  if (coverage !== "unknown") return coverage;
  const legacyPresent = STAGE1F_R_LEGACY_CODES.every((code) =>
    rows.some((r) => r.code === code),
  );
  if (
    legacyPresent &&
    counts.sido >= 16 &&
    counts.sigungu >= 250 &&
    counts.dong >= 3000
  ) {
    return "full";
  }
  if (legacyPresent && counts.sigungu >= 30) return "adequate";
  return "partial";
}

export async function getConsumerProfilePageData(
  supabase: SupabaseClient | null,
): Promise<ConsumerProfilePageData> {
  if (!supabase) {
    return {
      regions: [],
      regionRows: [],
      selectorRegionRows: [],
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
      molitLegalDongBaselinePreserved: false,
    };
  }

  const [regionsFetch, selectorFetch, levelCountsFetch, categoriesResult] = await Promise.all([
    fetchAllActiveRegions(supabase),
    fetchSelectableAdminRegions(supabase),
    fetchCanonicalRegionLevelCounts(supabase),
    supabase
      .from("interest_categories")
      .select("id, code, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const regionsReadStatus = regionsFetch.error ? "error" : "ok";
  const categoriesReadStatus = categoriesResult.error ? "error" : "ok";

  const regionRows = regionsReadStatus === "ok" ? regionsFetch.rows : [];
  const selectorRegionRows =
    !selectorFetch.error && selectorFetch.rows.length > 0
      ? selectorFetch.rows
      : regionRows.filter(
          (r) => r.source_kind === "mois-kikcd-h" && r.is_selectable !== false,
        );
  const allRegionOptions =
    regionsReadStatus === "ok" ? buildRegionOptions(regionRows) : [];
  const regions =
    regionsReadStatus === "ok" ? buildBasicMunicipalityOptions(selectorRegionRows) : [];
  const savableRegionIdSet =
    regionsReadStatus === "ok" ? getSavableRegionIds(selectorRegionRows) : new Set<string>();
  const savableRegionIds = [...savableRegionIdSet];
  const regionLevelCounts =
    !levelCountsFetch.error && levelCountsFetch.counts.total > 0
      ? levelCountsFetch.counts
      : countRegionLevels(regionRows, true);
  const hierarchicalSeedCoverage =
    regionLevelCounts.total > 0
      ? assessHierarchicalSeedCoverageFromCounts(regionLevelCounts, regionRows)
      : "unknown";
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

  const molitLegalDongBaselinePreserved =
    regionRows.filter(
      (r) => r.source_kind === "molit-legal-dong" || r.code.startsWith("KR-L-"),
    ).length >= 5000;

  return {
    regions,
    regionRows,
    selectorRegionRows,
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
    molitLegalDongBaselinePreserved,
  };
}

export type ConsumerProfileDraft = {
  birthYear: number | null;
  gender: string | null;
  oldestChildBirthYear: number | null;
  youngestChildBirthYear: number | null;
  petTypes: PetTypeValue[] | null;
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
  knownRegionRows?: RegionRow[],
): Promise<{ draft: ConsumerProfileDraft | null; meta: ConsumerProfileReadMeta }> {
  const { data: profile, error: profileError } = await supabase
    .from("consumer_profiles")
    .select(
      "id, region_id, monthly_intent_min, monthly_intent_max, birth_year, gender, interest_scope, oldest_child_birth_year, youngest_child_birth_year, pet_types",
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

  const knownRegionIds = new Set(knownRegionRows?.map((r) => r.id) ?? []);

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

  if (
    knownRegionRows &&
    residenceRegionId &&
    !knownRegionIds.has(residenceRegionId)
  ) {
    legacyResidenceRegionId = residenceRegionId;
    residenceRegionId = "";
  }

  if (knownRegionRows) {
    if (activitySlot1RegionId && !knownRegionIds.has(activitySlot1RegionId)) {
      activitySlot1RegionId = "";
    }
    if (activitySlot2RegionId && !knownRegionIds.has(activitySlot2RegionId)) {
      activitySlot2RegionId = "";
    }
  }

  const interestScope = normalizeInterestScope(
    profile.interest_scope as string | null | undefined,
  );

  const rawPetTypes = (profile.pet_types as string[] | null) ?? null;
  const petTypes =
    rawPetTypes == null
      ? null
      : normalizePetTypes(
          rawPetTypes.filter((value): value is PetTypeValue =>
            isPetTypeValue(value),
          ),
        );

  return {
    draft: {
      birthYear: (profile.birth_year as number | null) ?? null,
      gender: normalizeGender(profile.gender as string | null),
      oldestChildBirthYear:
        (profile.oldest_child_birth_year as number | null) ?? null,
      youngestChildBirthYear:
        (profile.youngest_child_birth_year as number | null) ?? null,
      petTypes,
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
  const loaded = await loadConsumerProfileDraft(supabase, userId, pageData.regionRows);
  return { ...loaded, pageData };
}
