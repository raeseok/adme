/**
 * Shared legacy AdMe code anchors (admin/legal 10-digit → KR-* code).
 */
export const LEGACY_CODE_BY_OFFICIAL = {
  "1100000000": "KR-11",
  "2600000000": "KR-26",
  "2700000000": "KR-27",
  "2800000000": "KR-28",
  "2900000000": "KR-29",
  "3000000000": "KR-30",
  "3100000000": "KR-31",
  "3600000000": "KR-36",
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
  "4128500000": "KR-41-GOYANG-ILSANDONG",
  "4128100000": "KR-41-GOYANG-DEYANG",
};

export const LEGACY_PARENT_OVERRIDE = {
  "4128500000": "4128000000",
  "4128100000": "4128000000",
};

export const STAGE1F_R_LEGACY_CODES = Object.values(LEGACY_CODE_BY_OFFICIAL);

export function pad10(code) {
  return String(code).padStart(10, "0");
}

export function getOfficialLevel(code10) {
  const n = Number(code10);
  if (n % 100_000_000 === 0) return "sido";
  if (n % 100_000 === 0) return "sigungu";
  return "dong";
}

export function sidoOfficialCode(code10) {
  return `${code10.slice(0, 2)}00000000`;
}

export function sigunguOfficialCode(code10) {
  return `${code10.slice(0, 5)}00000`;
}

export function resolveParentOfficialCode(code10, level) {
  if (LEGACY_PARENT_OVERRIDE[code10]) return LEGACY_PARENT_OVERRIDE[code10];
  if (level === "sido") return null;
  if (level === "sigungu") return sidoOfficialCode(code10);
  const sg = sigunguOfficialCode(code10);
  if (LEGACY_PARENT_OVERRIDE[sg]) return LEGACY_PARENT_OVERRIDE[sg];
  return sg;
}

export function resolveAdmeCode(officialCode, sourceKind = "mois-kikcd-h") {
  if (LEGACY_CODE_BY_OFFICIAL[officialCode]) return LEGACY_CODE_BY_OFFICIAL[officialCode];
  if (sourceKind === "molit-legal-dong") return `KR-L-${officialCode}`;
  return `KR-H-${officialCode}`;
}

export function normalizePath(parts) {
  return parts.filter(Boolean).join(" > ");
}
