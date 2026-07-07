export type RegionRow = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export type RegionOption = {
  id: string;
  code: string;
  label: string;
};

function getRegionPath(row: RegionRow, byId: Map<string, RegionRow>): string[] {
  const parts: string[] = [row.name];
  let current = row;
  while (current.parent_id) {
    const parent = byId.get(current.parent_id);
    if (!parent) break;
    parts.unshift(parent.name);
    current = parent;
  }
  return parts;
}

/** @deprecated province-only 포함 전체 옵션 — diagnostics 등 내부용 */
export function buildRegionOptions(rows: RegionRow[]): RegionOption[] {
  const byId = new Map(rows.map((r) => [r.id, r]));

  return rows
    .map((row) => ({
      id: row.id,
      code: row.code,
      label: getRegionPath(row, byId).join(" "),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

/**
 * 기초자치단체(시·군·구) leaf 노드만 선택 가능.
 * 광역시·도 단독 및 중간 시·군(하위 구·군이 있는)은 제외한다.
 */
export function buildBasicMunicipalityOptions(rows: RegionRow[]): RegionOption[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const childCount = new Map<string, number>();

  for (const row of rows) {
    if (row.parent_id) {
      childCount.set(row.parent_id, (childCount.get(row.parent_id) ?? 0) + 1);
    }
  }

  return rows
    .filter((row) => {
      if (!row.parent_id) return false;
      if ((childCount.get(row.id) ?? 0) > 0) return false;
      return getRegionPath(row, byId).length >= 2;
    })
    .map((row) => ({
      id: row.id,
      code: row.code,
      label: getRegionPath(row, byId).join(" "),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}

export function isBasicMunicipalityRegionId(
  regionId: string,
  options: RegionOption[],
): boolean {
  if (!regionId) return false;
  return options.some((o) => o.id === regionId);
}
