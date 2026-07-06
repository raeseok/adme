export type RegionRow = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export function buildRegionOptions(rows: RegionRow[]): {
  id: string;
  code: string;
  label: string;
}[] {
  const byId = new Map(rows.map((r) => [r.id, r]));

  return rows
    .map((row) => {
      const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
      const label = parent ? `${parent.name} ${row.name}` : row.name;
      return { id: row.id, code: row.code, label };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));
}
