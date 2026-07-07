/** Stage 1-F-R MOIS canonical source metadata. */
export const STAGE1F_R_SOURCE = {
  provider: "mois-jscode",
  sourceKind: "mois-kikcd-h",
  canonicalRegionSource: "mois-admin-dong",
  effectiveDate: "2026-07-01",
  zipSha256: "0b9f143fb6e43657ff72c863ac1412cc4be43e79dce323aac602fb7754663898",
  zipSha256Short: "0b9f143fb6e4",
  moisArticleUrl:
    "https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039",
  molitBaselineKind: "molit-legal-dong",
  molitBaselineDate: "2026-06-09",
  molitBaselineSha256Short: "6b26e8929df4",
} as const;

export const STAGE1F_R_LEGACY_CODES = [
  "KR-11",
  "KR-41",
  "KR-11-GANGNAM",
  "KR-11-JONGNO",
  "KR-41-GOYANG",
  "KR-41-GOYANG-ILSANDONG",
  "KR-41-GOYANG-DEYANG",
] as const;
