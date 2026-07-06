import { createServerClient } from "@/lib/supabase/server";
import type { ConsumerProfilePageData } from "./types";
import { buildRegionOptions, type RegionRow } from "./regions";

export async function getConsumerProfilePageData(): Promise<ConsumerProfilePageData> {
  const supabase = createServerClient();

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
