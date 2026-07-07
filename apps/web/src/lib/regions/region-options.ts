import type { RegionRow } from "@/lib/consumer-profile/regions";

/**
 * Region hierarchy levels (maps to parent_id tree; DB has no sido/sigungu/dong columns).
 *
 * - sido: root node (parent_id null) — e.g. 서울특별시, 경기도
 * - sigungu: direct child of sido — e.g. 종로구, 고양시
 * - dong: child of sigungu when present — e.g. 일산동구 (optional leaf)
 *
 * Consumer save level: sigungu (leaf) or dong.
 * Advertiser target level (Stage 2+): sido | sigungu | dong — matching engine TBD.
 */

export type RegionLevel = "sido" | "sigungu" | "dong";

export type RegionHierarchyOption = {
  id: string;
  code: string;
  name: string;
};

export type RegionSelectionState = {
  sidoId: string | null;
  sigunguId: string | null;
  dongId: string | null;
};

export type ResolveRegionIdResult =
  | {
      ok: true;
      regionId: string;
      level: "sigungu" | "dong";
    }
  | {
      ok: false;
      reason:
        | "incomplete_sido_only"
        | "incomplete_sigungu_only"
        | "dong_required"
        | "invalid_selection";
      message: string;
    };

export type RegionHierarchyIndex = {
  byId: Map<string, RegionRow>;
  childIds: Map<string, string[]>;
  sidoRows: RegionRow[];
};

function isNonEmptyName(name: string | null | undefined): boolean {
  return typeof name === "string" && name.trim().length > 0;
}

export function buildRegionHierarchyIndex(rows: RegionRow[]): RegionHierarchyIndex {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const childIds = new Map<string, string[]>();

  for (const row of rows) {
    if (!row.parent_id) continue;
    const siblings = childIds.get(row.parent_id) ?? [];
    siblings.push(row.id);
    childIds.set(row.parent_id, siblings);
  }

  for (const [parentId, ids] of childIds) {
    ids.sort((a, b) => {
      const rowA = byId.get(a);
      const rowB = byId.get(b);
      if (!rowA || !rowB) return 0;
      return rowA.sort_order - rowB.sort_order || rowA.name.localeCompare(rowB.name, "ko");
    });
    childIds.set(parentId, ids);
  }

  const sidoRows = rows
    .filter((r) => !r.parent_id && isNonEmptyName(r.name))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko"));

  return { byId, childIds, sidoRows };
}

/** 시·도 options — root nodes (sido distinct equivalent). */
export function buildSidoOptions(index: RegionHierarchyIndex): RegionHierarchyOption[] {
  return index.sidoRows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
  }));
}

/** 시·군·구 options — direct children of selected sido. */
export function buildSigunguOptions(
  index: RegionHierarchyIndex,
  sidoId: string | null,
): RegionHierarchyOption[] {
  if (!sidoId) return [];
  const ids = index.childIds.get(sidoId) ?? [];
  return ids
    .map((id) => index.byId.get(id))
    .filter((row): row is RegionRow => !!row && isNonEmptyName(row.name))
    .map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
}

/**
 * 읍·면·동 options — children of selected sigungu.
 * Empty/null names are excluded (dong absent equivalent).
 */
export function buildDongOptions(
  index: RegionHierarchyIndex,
  sigunguId: string | null,
): RegionHierarchyOption[] {
  if (!sigunguId) return [];
  const ids = index.childIds.get(sigunguId) ?? [];
  return ids
    .map((id) => index.byId.get(id))
    .filter((row): row is RegionRow => !!row && isNonEmptyName(row.name))
    .map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
    }));
}

export function getRegionPath(row: RegionRow, index: RegionHierarchyIndex): RegionRow[] {
  const path: RegionRow[] = [row];
  let current = row;
  while (current.parent_id) {
    const parent = index.byId.get(current.parent_id);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path;
}

/** Savable region ids: sigungu-level leaf or dong-level leaf (path depth >= 2). */
export function getSavableRegionIds(rows: RegionRow[]): Set<string> {
  const index = buildRegionHierarchyIndex(rows);
  const savable = new Set<string>();

  for (const row of rows) {
    if (!row.parent_id) continue;
    const childCount = index.childIds.get(row.id)?.length ?? 0;
    if (childCount > 0) continue;
    if (getRegionPath(row, index).length >= 2) {
      savable.add(row.id);
    }
  }

  return savable;
}

export function isSavableRegionId(regionId: string, rows: RegionRow[]): boolean {
  if (!regionId) return false;
  return getSavableRegionIds(rows).has(regionId);
}

export function hasDongOptions(
  index: RegionHierarchyIndex,
  sigunguId: string | null,
): boolean {
  return buildDongOptions(index, sigunguId).length > 0;
}

/**
 * Determine storable region id from hierarchical selection.
 * - dong selected → dong row id
 * - sigungu leaf (no children) → sigungu row id
 * - sigungu with children but no dong → error (do not pick arbitrary dong)
 * - sido only → incomplete
 */
export function resolveFinalRegionId(
  index: RegionHierarchyIndex,
  selection: RegionSelectionState,
): ResolveRegionIdResult {
  if (!selection.sidoId) {
    return {
      ok: false,
      reason: "incomplete_sido_only",
      message: "먼저 시·도를 선택한 뒤 시·군·구를 선택해 주세요.",
    };
  }

  if (!selection.sigunguId) {
    return {
      ok: false,
      reason: "incomplete_sigungu_only",
      message: "시·군·구를 선택해 주세요.",
    };
  }

  const sigunguRow = index.byId.get(selection.sigunguId);
  if (!sigunguRow) {
    return {
      ok: false,
      reason: "invalid_selection",
      message: "선택한 시·군·구를 찾을 수 없습니다.",
    };
  }

  const dongOptions = buildDongOptions(index, selection.sigunguId);

  if (selection.dongId) {
    const dongRow = index.byId.get(selection.dongId);
    if (!dongRow || dongRow.parent_id !== selection.sigunguId) {
      return {
        ok: false,
        reason: "invalid_selection",
        message: "선택한 읍·면·동을 찾을 수 없습니다.",
      };
    }
    return { ok: true, regionId: selection.dongId, level: "dong" };
  }

  if (dongOptions.length > 0) {
    return {
      ok: false,
      reason: "dong_required",
      message:
        "이 지역은 읍·면·동 단위까지 선택해야 합니다. 상세 지역을 선택해 주세요.",
    };
  }

  return { ok: true, regionId: selection.sigunguId, level: "sigungu" };
}

/** Reverse-parse saved region id into sido / sigungu / dong selection state. */
export function parseRegionSelectionFromId(
  rows: RegionRow[],
  regionId: string | null | undefined,
): RegionSelectionState {
  const empty: RegionSelectionState = {
    sidoId: null,
    sigunguId: null,
    dongId: null,
  };

  if (!regionId) return empty;

  const index = buildRegionHierarchyIndex(rows);
  const row = index.byId.get(regionId);
  if (!row) return empty;

  const path = getRegionPath(row, index);
  if (path.length < 2) return empty;

  const sido = path[0];
  if (path.length === 2) {
    return {
      sidoId: sido.id,
      sigunguId: path[1].id,
      dongId: null,
    };
  }

  return {
    sidoId: sido.id,
    sigunguId: path[path.length - 2].id,
    dongId: path[path.length - 1].id,
  };
}
