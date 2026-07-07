/**
 * Parse MOIS jscode20260701 files (KIKcd_H, KIKcd_B, KIKmix).
 * EUC-KR fixed-width text format.
 */
import { readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import iconv from "iconv-lite";
import {
  getOfficialLevel,
  normalizePath,
  pad10,
  resolveAdmeCode,
  resolveParentOfficialCode,
} from "./legacy-region-codes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "source");

function parseMoisRow(line) {
  const trimmed = line.trim();
  if (!/^\d{10}/.test(trimmed)) return null;
  const code = trimmed.slice(0, 10);
  const parts = trimmed.slice(10).trim().split(/\s{2,}/);
  const sido = (parts[0] ?? "").trim();
  const sigungu = (parts[1] ?? "").trim();
  const eup = (parts[2] ?? "").trim();
  const datePart = (parts[3] ?? parts[2] ?? "").trim();
  const dates = datePart.match(/\d{8}/g) ?? [];
  const createdAt = dates[0] ?? "";
  const deletedAt = dates[1] ?? "";
  return { code: pad10(code), sido, sigungu, eup, createdAt, deletedAt };
}

function parseAdminLine(line) {
  const row = parseMoisRow(line);
  if (!row) return null;
  // sigungu-only row: parts = [sido, sigungu, date]
  if (/^\d{8}$/.test(row.eup) && !row.deletedAt) {
    return {
      code: row.code,
      sido: row.sido,
      sigungu: row.sigungu,
      eup: "",
      createdAt: row.eup || row.createdAt,
      deletedAt: row.deletedAt,
    };
  }
  return {
    code: row.code,
    sido: row.sido,
    sigungu: row.sigungu,
    eup: row.eup,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  };
}

function parseLegalLine(line) {
  const trimmed = line.trim();
  const code = trimmed.slice(0, 10);
  const parts = trimmed.slice(10).trim().split(/\s{2,}/);
  const sido = (parts[0] ?? "").trim();
  const sigungu = (parts[1] ?? "").trim();
  const eup = (parts[2] ?? "").trim();
  const ri = (parts[3] ?? "").trim();
  const datePart = (parts[4] ?? parts[3] ?? parts[2] ?? "").trim();
  const dates = datePart.match(/\d{8}/g) ?? [];
  // ri-level row when eup is missing and ri has date
  if (/^\d{8}$/.test(ri) && !dates.length) {
    return {
      code: pad10(code),
      sido,
      sigungu,
      eup,
      ri: "",
      createdAt: ri,
      deletedAt: "",
    };
  }
  return {
    code: pad10(code),
    sido,
    sigungu,
    eup,
    ri: /^\d{8}$/.test(ri) ? "" : ri,
    createdAt: dates[0] ?? "",
    deletedAt: dates[1] ?? "",
  };
}

function parseMixLine(line) {
  const trimmed = line.trim();
  const adminCode = pad10(trimmed.slice(0, 10));
  const parts = trimmed.slice(10).trim().split(/\s{2,}/);
  const sido = (parts[0] ?? "").trim();
  const sigungu = (parts[1] ?? "").trim();
  const adminEup = (parts[2] ?? "").trim();
  const legalPart = (parts[3] ?? "").trim();
  const legalMatch = legalPart.match(/^(\d{10})\s*(.*)$/);
  const legalCode = legalMatch ? pad10(legalMatch[1]) : "";
  const dates = (legalMatch?.[2] ?? legalPart).match(/\d{8}/g) ?? [];
  return {
    adminCode,
    sido,
    sigungu,
    adminEup,
    legalCode,
    createdAt: dates[0] ?? "",
    deletedAt: dates[1] ?? "",
  };
}

function buildAdminNode(row) {
  const level = getOfficialLevel(row.code);
  let name = "";
  if (level === "sido") name = row.sido;
  if (level === "sigungu") name = row.sigungu;
  if (level === "dong") name = row.eup;
  if (!name) return null;

  const pathParts =
    level === "sido"
      ? [name]
      : level === "sigungu"
        ? [row.sido, name].filter(Boolean)
        : [row.sido, row.sigungu, name].filter(Boolean);

  const parentOfficial = resolveParentOfficialCode(row.code, level);
  return {
    officialCode: row.code,
    name,
    level,
    pathKey: normalizePath(pathParts),
    parentOfficial,
    admeCode: resolveAdmeCode(row.code, "mois-kikcd-h"),
    parentAdmeCode: parentOfficial ? resolveAdmeCode(parentOfficial, "mois-kikcd-h") : null,
    sourceKind: "mois-kikcd-h",
    isActive: !row.deletedAt,
    isSelectable: !row.deletedAt,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
  };
}

export async function parseMoisRegions(baseDir) {
  const hPath = path.join(baseDir, "KIKcd_H.20260701");
  const bPath = path.join(baseDir, "KIKcd_B.20260701");
  const mixPath = path.join(baseDir, "KIKmix.20260701");

  const hText = iconv.decode(readFileSync(hPath), "euc-kr");
  const bText = iconv.decode(readFileSync(bPath), "euc-kr");
  const mixText = iconv.decode(readFileSync(mixPath), "euc-kr");

  const hLines = hText.split(/\r?\n/).slice(1).filter((l) => l.trim());
  const bLines = bText.split(/\r?\n/).slice(1).filter((l) => l.trim());
  const mixLines = mixText.split(/\r?\n/).slice(1).filter((l) => l.trim());

  const adminNodes = new Map();
  let skippedAdmin = 0;
  for (const line of hLines) {
    const row = parseAdminLine(line);
    const node = buildAdminNode(row);
    if (!node) {
      skippedAdmin++;
      continue;
    }
    adminNodes.set(node.officialCode, node);
  }

  const legalNodes = new Map();
  let skippedLegal = 0;
  for (const line of bLines) {
    const row = parseLegalLine(line);
    const level = getOfficialLevel(row.code);
    if (level !== "sido" && level !== "sigungu" && level !== "dong") {
      skippedLegal++;
      continue;
    }
    let name = "";
    if (level === "sido") name = row.sido;
    if (level === "sigungu") name = row.sigungu;
    if (level === "dong") name = row.eup;
    if (!name) {
      skippedLegal++;
      continue;
    }
    legalNodes.set(row.code, {
      officialCode: row.code,
      name,
      level,
      isActive: !row.deletedAt,
      deletedAt: row.deletedAt,
    });
  }

  const mappings = [];
  const mixByAdmin = new Map();
  for (const line of mixLines) {
    const row = parseMixLine(line);
    if (!row.legalCode) continue;
    mappings.push({
      adminCode: row.adminCode,
      legalCode: row.legalCode,
      deletedAt: row.deletedAt,
    });
    const list = mixByAdmin.get(row.adminCode) ?? [];
    if (!list.includes(row.legalCode)) list.push(row.legalCode);
    mixByAdmin.set(row.adminCode, list);
  }

  for (const node of adminNodes.values()) {
    const legalCodes = mixByAdmin.get(node.officialCode);
    if (legalCodes?.length === 1) {
      node.legalCode = legalCodes[0];
      node.relationSource = "kikmix";
    } else if (legalCodes?.length) {
      node.legalCode = legalCodes[0];
      node.relationSource = "kikmix-multi";
      node.legalCodeAlternates = legalCodes;
    }
  }

  const adminList = [...adminNodes.values()].sort((a, b) =>
    a.officialCode.localeCompare(b.officialCode),
  );
  const activeAdmin = adminList.filter((n) => n.isActive);
  const counts = {
    adminTotal: adminList.length,
    adminActive: activeAdmin.length,
    adminInactive: adminList.length - activeAdmin.length,
    adminSido: activeAdmin.filter((n) => n.level === "sido").length,
    adminSigungu: activeAdmin.filter((n) => n.level === "sigungu").length,
    adminDong: activeAdmin.filter((n) => n.level === "dong").length,
    legalTotal: legalNodes.size,
    legalActive: [...legalNodes.values()].filter((n) => n.isActive).length,
    mappingCount: mappings.length,
    skippedAdmin,
    skippedLegal,
    sourceRows: {
      kikcdH: hLines.length,
      kikcdB: bLines.length,
      kikmix: mixLines.length,
    },
  };

  return {
    adminNodes: adminList,
    legalNodes: [...legalNodes.values()],
    mappings,
    counts,
    changeChecks: buildChangeChecks(adminList, legalNodes, mappings),
  };
}

function buildChangeChecks(adminList, legalNodes, mappings) {
  const adminByCode = new Map(adminList.map((n) => [n.officialCode, n]));
  const adminByName = (pred) => adminList.find(pred);

  const jeonnamGwangju = adminByCode.get("1200000000");
  const gwangjuGone = !adminByCode.has("2900000000");
  const jeonnamGone = !adminByCode.has("4600000000");

  const anyangMyeonghak = adminByName(
    (n) => n.name === "명학동" && n.pathKey?.includes("안양시"),
  );
  const anyangByeongmok = adminByName(
    (n) => n.name === "병목안동" && n.pathKey?.includes("안양시"),
  );
  const anyang8Gone = !adminList.some((n) => n.name === "안양8동" && n.isActive);
  const anyang9Gone = !adminList.some((n) => n.name === "안양9동" && n.isActive);

  const incheonSeoguMappings = mappings.filter((m) => {
    const admin = adminByCode.get(m.adminCode);
    return admin?.pathKey?.includes("인천광역시") && admin?.pathKey?.includes("서구");
  });

  return {
    jeonnamGwangjuUnified: {
      applied: !!jeonnamGwangju && jeonnamGwangju.isActive,
      code: jeonnamGwangju?.officialCode ?? null,
      name: jeonnamGwangju?.name ?? null,
      gwangjuRemoved: gwangjuGone,
      jeonnamRemoved: jeonnamGone,
    },
    incheonSeoguLegal: {
      mappingSamples: incheonSeoguMappings.slice(0, 5),
      legalCodesInB: [...legalNodes.values()]
        .filter((n) => n.name && JSON.stringify(n).includes("서구"))
        .slice(0, 3),
      note: "Legal code updates preserved on molit-legal-dong baseline rows",
    },
    anyangAdminDong: {
      myeonghakApplied: !!anyangMyeonghak?.isActive,
      byeongmokApplied: !!anyangByeongmok?.isActive,
      anyang8Removed: anyang8Gone,
      anyang9Removed: anyang9Gone,
      myeonghakCode: anyangMyeonghak?.officialCode ?? null,
      byeongmokCode: anyangByeongmok?.officialCode ?? null,
    },
  };
}

export function validateMoisParsed(parsed) {
  const errors = [];
  const { counts, changeChecks } = parsed;

  if (!changeChecks.jeonnamGwangjuUnified.applied) {
    errors.push("전남광주통합특별시 not found in admin tree");
  }
  if (!changeChecks.anyangAdminDong.myeonghakApplied) {
    errors.push("안양시 명학동 not found");
  }
  if (!changeChecks.anyangAdminDong.byeongmokApplied) {
    errors.push("안양시 병목안동 not found");
  }
  if (counts.adminSido < 16) errors.push(`admin sido low: ${counts.adminSido}`);
  if (counts.adminSigungu < 250) errors.push(`admin sigungu low: ${counts.adminSigungu}`);
  if (counts.adminDong < 3000) errors.push(`admin dong low: ${counts.adminDong}`);
  if (counts.mappingCount < 1000) errors.push(`mapping count low: ${counts.mappingCount}`);

  const byPath = new Map();
  for (const node of parsed.adminNodes.filter((n) => n.isActive)) {
    const key = `${node.parentOfficial ?? "ROOT"}|${node.pathKey}`;
    if (byPath.has(key)) errors.push(`duplicate admin path: ${key}`);
    byPath.set(key, node.officialCode);
  }

  return errors;
}

async function main() {
  const baseDir = path.join(SOURCE_DIR, "jscode20260701", "jscode20260701");
  const parsed = await parseMoisRegions(baseDir);
  const errors = validateMoisParsed(parsed);

  const outPath = path.join(SOURCE_DIR, "parsed-mois-regions.json");
  await writeFile(outPath, JSON.stringify(parsed, null, 2));

  console.log(`PASS: parsed MOIS admin active=${parsed.counts.adminActive}`);
  console.log(
    `INFO: admin sido=${parsed.counts.adminSido} sigungu=${parsed.counts.adminSigungu} dong=${parsed.counts.adminDong}`,
  );
  console.log(
    `INFO: legal=${parsed.counts.legalTotal} mappings=${parsed.counts.mappingCount} skipped admin=${parsed.counts.skippedAdmin} legal=${parsed.counts.skippedLegal}`,
  );
  console.log(
    `INFO: 전남광주=${parsed.changeChecks.jeonnamGwangjuUnified.applied} 명학동=${parsed.changeChecks.anyangAdminDong.myeonghakApplied} 병목안동=${parsed.changeChecks.anyangAdminDong.byeongmokApplied}`,
  );

  if (errors.length) {
    console.error(`FAIL: validation (${errors.length})`);
    for (const e of errors.slice(0, 20)) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("PASS: MOIS parser validation");
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((e) => {
    console.error(`FAIL: ${e.message}`);
    process.exit(1);
  });
}
