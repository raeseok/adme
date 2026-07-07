/**
 * Generate Stage 1-F region seed SQL from parsed official regions.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseOfficialRegions } from "./parse-official-regions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "source");
const REPO_ROOT = path.resolve(__dirname, "../../../..");

function sqlEscape(value) {
  return value.replace(/'/g, "''");
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

function renderBatch(batch, effectiveDate) {
  const values = batch
    .map((n) => {
      const parentSql = n.parentAdmeCode
        ? `(SELECT id FROM public.regions WHERE code = '${sqlEscape(n.parentAdmeCode)}')`
        : "NULL";
      return `  ('${sqlEscape(n.admeCode)}', '${sqlEscape(n.name)}', ${parentSql}, ${n.sortOrder}, true, 'molit-legal-dong', '${n.legalCode}', DATE '${effectiveDate}', '${n.level}', '${sqlEscape(n.pathKey)}')`;
    })
    .join(",\n");

  return `INSERT INTO public.regions (
  code, name, parent_id, sort_order, is_active,
  source_kind, source_code, source_effective_date, region_level, path_key
)
VALUES
${values}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  source_kind = EXCLUDED.source_kind,
  source_code = EXCLUDED.source_code,
  source_effective_date = EXCLUDED.source_effective_date,
  region_level = EXCLUDED.region_level,
  path_key = EXCLUDED.path_key;
`;
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(SOURCE_DIR, "source-manifest.json"), "utf8"),
  );
  const parsed = await parseOfficialRegions(manifest.file);
  buildSortOrders(parsed.nodes);

  const ordered = [...parsed.nodes].sort((a, b) => {
    const levelOrder = { sido: 0, sigungu: 1, dong: 2 };
    const ld = levelOrder[a.level] - levelOrder[b.level];
    if (ld !== 0) return ld;
    return a.admeCode.localeCompare(b.admeCode);
  });

  const header = `-- AUTO-GENERATED Stage 1-F region seed
-- source: ${manifest.provider}
-- effective_date: ${manifest.effectiveDate}
-- sha256: ${manifest.sha256}
-- nodes: ${parsed.counts.total} (sido=${parsed.counts.sido}, sigungu=${parsed.counts.sigungu}, dong=${parsed.counts.dong})
-- DO NOT EDIT BY HAND — regenerate via: node apps/web/scripts/regions/generate-stage1f-region-seed-sql.mjs

`;

  const batches = [];
  const BATCH = 150;
  for (let i = 0; i < ordered.length; i += BATCH) {
    batches.push(renderBatch(ordered.slice(i, i + BATCH), manifest.effectiveDate));
  }

  const seedSql = header + batches.join("\n\n");
  const outDir = path.join(REPO_ROOT, "supabase", "seed-data", "regions");
  await mkdir(outDir, { recursive: true });
  const seedPath = path.join(outDir, "stage_1_f_regions_seed.sql");
  await writeFile(seedPath, seedSql, "utf8");

  const manifestOut = {
    generatedAt: new Date().toISOString(),
    sourceEffectiveDate: manifest.effectiveDate,
    sourceSha256: manifest.sha256,
    counts: parsed.counts,
    legacyCodesPreserved: ordered.filter((n) => n.admeCode.startsWith("KR-") && !n.admeCode.startsWith("KR-L-")).length,
    samplePaths: {
      metro: ordered.find((n) => n.admeCode === "KR-11-GANGNAM")?.pathKey,
      provinceCity: ordered.find((n) => n.admeCode === "KR-41-GOYANG")?.pathKey,
      dongUnderGoyang: ordered.find((n) => n.admeCode === "KR-41-GOYANG-ILSANDONG")?.pathKey,
      gun: ordered.find((n) => n.pathKey?.includes("태안군"))?.pathKey,
      recentChangeNote:
        "MOIS jscode 2026-07-01 (전남광주통합특별시) not in MOLIT 2026-06-09 CSV — document in README",
    },
    testManifest: buildTestManifest(ordered),
  };

  await writeFile(
    path.join(SOURCE_DIR, "stage1f-test-manifest.json"),
    JSON.stringify(manifestOut, null, 2),
    "utf8",
  );

  console.log(`PASS: wrote ${seedPath} (${seedSql.length} chars, ${ordered.length} nodes)`);
  console.log(
    `INFO: legacy codes preserved in mapping: ${manifestOut.legacyCodesPreserved}`,
  );
}

function buildTestManifest(nodes) {
  const pick = (pred) => nodes.find(pred);
  return {
    metro: {
      label: "수도권 시·군·구",
      sido: "서울특별시",
      sigungu: "강남구",
      code: "KR-11-GANGNAM",
    },
    metropolitan: {
      label: "광역시",
      sido: "부산광역시",
      sigungu: pick((n) => n.pathKey === "부산광역시 > 해운대구")?.name ?? "해운대구",
    },
    provinceCity: {
      label: "도 단위 시",
      path: pick((n) => n.admeCode === "KR-41-GOYANG")?.pathKey,
    },
    gun: {
      label: "군 단위",
      path: pick((n) => n.admeCode === "KR-44-TAEAN")?.pathKey,
    },
    dongSample: {
      label: "읍·면·동",
      path: pick((n) => n.level === "dong" && n.pathKey?.startsWith("경기도 > 고양시"))?.pathKey,
    },
    goyangHierarchy: {
      label: "고양시 하위 구",
      sigungu: "고양시",
      dong: "일산동구",
      code: "KR-41-GOYANG-ILSANDONG",
    },
  };
}

main().catch((e) => {
  console.error(`FAIL: ${e.message}`);
  process.exit(1);
});
