/**
 * Parse official MOLIT 법정동 CSV (sourced from code.go.kr) into hierarchy nodes.
 * Consumer selectable level: sigungu (leaf) or dong (읍·면·동, not 리).
 */
import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "source");

/** Existing AdMe codes from Stage 0/1 migrations — id stability anchors */
export const LEGACY_CODE_BY_LEGAL = {
  "1100000000": "KR-11",
  "2600000000": "KR-26",
  "2700000000": "KR-27",
  "2800000000": "KR-28",
  "2900000000": "KR-29",
  "3000000000": "KR-30",
  "3100000000": "KR-31",
  "4100000000": "KR-41",
  "4200000000": "KR-42",
  "4300000000": "KR-43",
  "4400000000": "KR-44",
  "4500000000": "KR-45",
  "4600000000": "KR-46",
  "4700000000": "KR-47",
  "4800000000": "KR-48",
  "5000000000": "KR-50",
  "1111000000": "KR-11-JONGNO",
  "1114000000": "KR-11-JUNG",
  "1117000000": "KR-11-YONGSAN",
  "1120000000": "KR-11-SEONGDONG",
  "1121500000": "KR-11-GWANGJIN",
  "1123000000": "KR-11-DONGDAEMUN",
  "1126000000": "KR-11-JUNGNANG",
  "1129000000": "KR-11-SEONGBUK",
  "1130500000": "KR-11-GANGBUK",
  "1132000000": "KR-11-DOBONG",
  "1135000000": "KR-11-NOWON",
  "1138000000": "KR-11-EUNPYEONG",
  "1144000000": "KR-11-MAPO",
  "1147000000": "KR-11-YANGCHEON",
  "1150000000": "KR-11-GANGSEO",
  "1153000000": "KR-11-GURO",
  "1154500000": "KR-11-GEUMCHEON",
  "1156000000": "KR-11-YEONGDEUNGPO",
  "1159000000": "KR-11-DONGJAK",
  "1162000000": "KR-11-GWANAK",
  "1165000000": "KR-11-SECHO",
  "1168000000": "KR-11-GANGNAM",
  "1171000000": "KR-11-SONGPA",
  "1174000000": "KR-11-GANGDONG",
  "4128000000": "KR-41-GOYANG",
  "4482500000": "KR-44-TAEAN",
  "4723000000": "KR-47-YEONGCHEON",
  "4513000000": "KR-45-JEONGEUP",
};

/** AdMe tree overrides: parent legal code differs from official flat 시군구 */
export const LEGACY_PARENT_OVERRIDE = {
  "4128500000": "4128000000", // 일산동구 under 고양시
  "4128100000": "4128000000", // 덕양구 under 고양시
};

export const LEGACY_CODE_OVERRIDE = {
  "4128500000": "KR-41-GOYANG-ILSANDONG",
  "4128100000": "KR-41-GOYANG-DEYANG",
};

function pad10(code) {
  return String(code).padStart(10, "0");
}

function sidoCode(code10) {
  return `${code10.slice(0, 2)}00000000`;
}

function sigunguCode(code10) {
  return `${code10.slice(0, 5)}00000`;
}

function getLevel(code10) {
  const n = Number(code10);
  if (n % 100_000_000 === 0) return "sido";
  if (n % 100_000 === 0) return "sigungu";
  if (n % 100 === 0) return "dong";
  return "ri";
}

function parseCsvLine(line) {
  const parts = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === "," && !inQ) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function normalizePath(parts) {
  return parts.filter(Boolean).join(" > ");
}

function resolveAdmeCode(legalCode) {
  if (LEGACY_CODE_OVERRIDE[legalCode]) return LEGACY_CODE_OVERRIDE[legalCode];
  if (LEGACY_CODE_BY_LEGAL[legalCode]) return LEGACY_CODE_BY_LEGAL[legalCode];
  return `KR-L-${legalCode}`;
}

function resolveParentLegalCode(legalCode, level) {
  if (LEGACY_PARENT_OVERRIDE[legalCode]) return LEGACY_PARENT_OVERRIDE[legalCode];
  if (level === "sido") return null;
  if (level === "sigungu") return sidoCode(legalCode);
  if (level === "dong") {
    const sg = sigunguCode(legalCode);
    if (LEGACY_PARENT_OVERRIDE[sg]) return LEGACY_PARENT_OVERRIDE[sg];
    return sg;
  }
  return null;
}

export async function parseOfficialRegions(csvPath) {
  const nodes = new Map();

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  for await (const rawLine of rl) {
    lineNo++;
    const line = rawLine.replace(/^\uFEFF/, "");
    if (lineNo === 1 || !line.trim()) continue;

    const [legalCodeRaw, sidoName, sigunguName, eupmyeondongName, , , , deletedAt] =
      parseCsvLine(line);
    if (deletedAt?.trim()) continue;

    const legalCode = pad10(legalCodeRaw?.trim());
    const level = getLevel(legalCode);
    if (level === "ri") continue;

    let name = "";
    if (level === "sido") name = sidoName?.trim() ?? "";
    if (level === "sigungu") name = sigunguName?.trim() ?? "";
    if (level === "dong") name = eupmyeondongName?.trim() ?? "";
    if (!name) continue;

    const pathParts =
      level === "sido"
        ? [name]
        : level === "sigungu"
          ? [sidoName?.trim(), name].filter(Boolean)
          : [sidoName?.trim(), sigunguName?.trim(), name].filter(Boolean);

    const parentLegal = resolveParentLegalCode(legalCode, level);
    const pathKey = normalizePath(pathParts);

    nodes.set(legalCode, {
      legalCode,
      name,
      level,
      pathKey,
      parentLegal,
      admeCode: resolveAdmeCode(legalCode),
      parentAdmeCode: parentLegal ? resolveAdmeCode(parentLegal) : null,
      isActive: true,
      sourceKind: "molit-legal-dong",
    });
  }

  const list = [...nodes.values()].sort((a, b) => a.legalCode.localeCompare(b.legalCode));

  const sido = list.filter((n) => n.level === "sido");
  const sigungu = list.filter((n) => n.level === "sigungu");
  const dong = list.filter((n) => n.level === "dong");

  return {
    nodes: list,
    counts: {
      sido: sido.length,
      sigungu: sigungu.length,
      dong: dong.length,
      total: list.length,
    },
  };
}

export function validateParsedRegions(parsed) {
  const errors = [];
  const byLegal = new Map(parsed.nodes.map((n) => [n.legalCode, n]));
  const byPath = new Map();

  for (const node of parsed.nodes) {
    if (node.level !== "sido" && !node.parentLegal) {
      errors.push(`orphan parent missing: ${node.legalCode}`);
    }
    if (node.parentLegal && !byLegal.has(node.parentLegal) && node.level !== "sido") {
      errors.push(`orphan child ${node.legalCode} parent ${node.parentLegal}`);
    }
    const key = `${node.parentLegal ?? "ROOT"}|${node.pathKey}`;
    if (byPath.has(key)) {
      errors.push(`duplicate sibling path: ${key}`);
    }
    byPath.set(key, node.legalCode);
  }

  if (parsed.counts.sido < 17) errors.push(`sido count low: ${parsed.counts.sido}`);
  if (parsed.counts.sigungu < 200) errors.push(`sigungu count low: ${parsed.counts.sigungu}`);
  if (parsed.counts.dong < 3000) errors.push(`dong count low: ${parsed.counts.dong}`);

  return errors;
}

async function main() {
  const manifestPath = path.join(SOURCE_DIR, "source-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const csvPath = manifest.file;
  const parsed = await parseOfficialRegions(csvPath);
  const errors = validateParsedRegions(parsed);

  const outPath = path.join(SOURCE_DIR, "parsed-regions.json");
  await writeFile(outPath, JSON.stringify(parsed, null, 2));

  console.log(`PASS: parsed ${parsed.counts.total} nodes`);
  console.log(
    `INFO: sido=${parsed.counts.sido} sigungu=${parsed.counts.sigungu} dong=${parsed.counts.dong}`,
  );

  if (errors.length) {
    console.error(`FAIL: validation errors (${errors.length})`);
    for (const e of errors.slice(0, 20)) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("PASS: parser validation");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((e) => {
    console.error(`FAIL: ${e.message}`);
    process.exit(1);
  });
}
