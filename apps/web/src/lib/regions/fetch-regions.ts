import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegionRow } from "@/lib/consumer-profile/regions";

const REGION_SELECT =
  "id, code, name, parent_id, sort_order, is_active, is_selectable, source_kind, region_level, path_key, legal_code";
const PAGE_SIZE = 1000;

export type RegionLevelCounts = {
  sido: number;
  sigungu: number;
  dong: number;
  total: number;
};

async function countCanonicalByLevel(
  supabase: SupabaseClient,
  level: "sido" | "sigungu" | "dong",
) {
  const result = await supabase
    .from("regions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("is_selectable", true)
    .eq("source_kind", "mois-kikcd-h")
    .eq("region_level", level);
  return result.error ? 0 : (result.count ?? 0);
}

/** Count-only query — canonical MOIS admin-dong tree (diagnostics-friendly). */
export async function fetchCanonicalRegionLevelCounts(
  supabase: SupabaseClient,
): Promise<{ counts: RegionLevelCounts; error: boolean }> {
  const [sido, sigungu, dong] = await Promise.all([
    countCanonicalByLevel(supabase, "sido"),
    countCanonicalByLevel(supabase, "sigungu"),
    countCanonicalByLevel(supabase, "dong"),
  ]);
  if (sido === 0 && sigungu === 0 && dong === 0) {
    return { counts: { sido: 0, sigungu: 0, dong: 0, total: 0 }, error: true };
  }
  return { counts: { sido, sigungu, dong, total: sido + sigungu + dong }, error: false };
}

/** Paginated fetch of all active regions for hierarchy selector. */
export async function fetchAllActiveRegions(
  supabase: SupabaseClient,
): Promise<{ rows: RegionRow[]; error: boolean }> {
  const rows: RegionRow[] = [];
  let from = 0;

  while (true) {
    const result = await supabase
      .from("regions")
      .select(REGION_SELECT)
      .eq("is_active", true)
      .order("code")
      .range(from, from + PAGE_SIZE - 1);

    if (result.error) {
      return { rows: [], error: true };
    }

    const batch = (result.data ?? []) as RegionRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { rows, error: false };
}
