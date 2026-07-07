/**
 * Generate Stage 1-F-R MOIS admin-dong seed SQL + manifest.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMoisRegions } from "./parse-mois-regions.mjs";
import { STAGE1F_R_LEGACY_CODES } from "./legacy-region-codes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "source");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function buildSortOrders(nodes) {
  const byParent = new Map();
  for (const node of nodes) {
    const key = node.parentAdmeCode ?? "__ROOT__";
    const list = byParent.get(key) ?? [];
    list.push(node);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    list.forEach((n, i) => {
      n.sortOrder = i + 1;
    });
  }
}

function renderAdminBatch(batch, effectiveDate) {
  const values = batch
    .map((n) => {
      const parentSql = n.parentAdmeCode
        ? `(SELECT id FROM public.regions WHERE code = '${sqlEscape(n.parentAdmeCode)}')`
        : "NULL";
      const legalSql = n.legalCode ? `'${sqlEscape(n.legalCode)}'` : "NULL";
      const relationSql = n.relationSource ? `'${sqlEscape(n.relationSource)}'` : "NULL";
      return `  ('${sqlEscape(n.admeCode)}', '${sqlEscape(n.name)}', ${parentSql}, ${n.sortOrder}, ${n.isActive}, true, 'mois-kikcd-h', '${sqlEscape(n.officialCode)}', DATE '${effectiveDate}', '${n.level}', '${sqlEscape(n.pathKey)}', ${legalSql}, ${relationSql})`;
    })
    .join(",\n");

  return `INSERT INTO public.regions (
  code, name, parent_id, sort_order, is_active, is_selectable,
  source_kind, source_code, source_effective_date, region_level, path_key,
  legal_code, relation_source
)
VALUES
${values}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  is_selectable = EXCLUDED.is_selectable,
  source_kind = EXCLUDED.source_kind,
  source_code = EXCLUDED.source_code,
  source_effective_date = EXCLUDED.source_effective_date,
  region_level = EXCLUDED.region_level,
  path_key = EXCLUDED.path_key,
  legal_code = COALESCE(EXCLUDED.legal_code, public.regions.legal_code),
  relation_source = COALESCE(EXCLUDED.relation_source, public.regions.relation_source);
`;
}

async function main() {
  const moisManifest = JSON.parse(
    await readFile(path.join(SOURCE_DIR, "mois-source-manifest.json"), "utf8"),
  );
  const baseDir = path.join(SOURCE_DIR, "jscode20260701", "jscode20260701");
  const parsed = await parseMoisRegions(baseDir);
  buildSortOrders(parsed.adminNodes);

  const ordered = [...parsed.adminNodes].sort((a, b) => {
    const levelOrder = { sido: 0, sigungu: 1, dong: 2 };
    const ld = levelOrder[a.level] - levelOrder[b.level];
    if (ld !== 0) return ld;
    return a.admeCode.localeCompare(b.admeCode);
  });

  const header = `-- AUTO-GENERATED Stage 1-F-R MOIS admin-dong seed
-- source: mois-jscode
-- effective_date: ${moisManifest.effectiveDate}
-- zip_sha256: ${moisManifest.sha256}
-- admin_nodes: ${parsed.counts.adminActive} (sido=${parsed.counts.adminSido}, sigungu=${parsed.counts.adminSigungu}, dong=${parsed.counts.adminDong})
-- mappings: ${parsed.counts.mappingCount}
-- DO NOT EDIT BY HAND

-- Preserve molit legal-dong baseline for saved references; hide from selector
UPDATE public.regions
SET is_selectable = false
WHERE source_kind = 'molit-legal-dong' OR code LIKE 'KR-L-%';

-- Legacy molit sido without admin counterpart (KR-29/KR-46) remain display-only
UPDATE public.regions
SET is_selectable = false
WHERE code IN ('KR-29', 'KR-46');

`;

  const batches = [];
  const BATCH = 1;
  for (let i = 0; i < ordered.length; i += BATCH) {
    batches.push(renderAdminBatch(ordered.slice(i, i + BATCH), moisManifest.effectiveDate));
  }

  const seedSql = header + batches.join("\n\n");
  const outDir = path.join(REPO_ROOT, "supabase", "seed-data", "regions");
  await mkdir(outDir, { recursive: true });
  const seedPath = path.join(outDir, "stage_1_f_r_regions_seed.sql");
  await writeFile(seedPath, seedSql, "utf8");

  const testManifest = {
    generatedAt: new Date().toISOString(),
    moisEffectiveDate: moisManifest.effectiveDate,
    moisSha256: moisManifest.sha256,
    canonicalSource: "mois-kikcd-h",
    counts: parsed.counts,
    changeChecks: parsed.changeChecks,
    legacyCodes: STAGE1F_R_LEGACY_CODES,
    testRegions: {
      jeonnamGwangju: { sido: "전남광주통합특별시", code: "KR-H-1200000000" },
      metro: { sido: "서울특별시", sigungu: "강남구", code: "KR-11-GANGNAM" },
      anyang: { sido: "경기도", sigungu: "안양시 만안구", dong: "명학동" },
      gun: { sido: "충청남도", sigungu: "태안군", code: "KR-44-TAEAN" },
    },
  };

  await writeFile(
    path.join(SOURCE_DIR, "stage1f-r-test-manifest.json"),
    JSON.stringify(testManifest, null, 2),
    "utf8",
  );

  console.log(`PASS: wrote ${seedPath} (${ordered.length} admin nodes)`);
  console.log(`INFO: legacy codes in mapping: ${STAGE1F_R_LEGACY_CODES.length}`);
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
