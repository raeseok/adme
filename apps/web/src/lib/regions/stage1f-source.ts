/** Stage 1-F official source metadata (from source-manifest.json at build time). */
export const STAGE1F_SOURCE = {
  provider: "molit-bjd-csv",
  sourceKind: "molit-legal-dong",
  effectiveDate: "2026-06-09",
  sha256: "6b26e8929df44e55a091ffb4331ba1a68d1aa09a1377a94287be858f482b3dc5",
  sha256Short: "6b26e8929df4",
  dataGoKrUrl: "https://www.data.go.kr/data/15063424/fileData.do",
  moisArticleUrl:
    "https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039",
  newerSourceNote:
    "MOIS jscode20260701 (2026.7.1 시행) auto-download unavailable; MOLIT 2026-06-09 CSV used (sourced from code.go.kr)",
} as const;

export const STAGE1F_LEGACY_CODES = [
  "KR-11",
  "KR-41",
  "KR-11-GANGNAM",
  "KR-11-JONGNO",
  "KR-41-GOYANG",
  "KR-41-GOYANG-ILSANDONG",
  "KR-41-GOYANG-DEYANG",
] as const;
