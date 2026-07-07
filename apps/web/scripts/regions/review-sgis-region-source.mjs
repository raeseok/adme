#!/usr/bin/env node
/**
 * Stage 1-F-R — SGIS 주소경계 API 보조 source 검토 (정적, token 미사용).
 * 공식 문서 + MOIS jscode20260701 파싱 결과만 대조한다.
 * SGIS accessToken을 요청·로그·저장하지 않는다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOIS_PATH = join(__dirname, "source", "parsed-mois-regions.json");
const OUT_PATH = join(__dirname, "..", "..", "..", "..", "docs", "adme", "stage-1-f-r-sgis-review.json");

const SGIS_DOC_URL =
  "https://sgis.mods.go.kr/developer/html/newOpenApi/api/dataApi/addressBoundary.html";

/** @type {Array<{api:string, endpoint:string, fields:Record<string,string>, note?:string}>} */
const SGIS_DOC_EXAMPLES = [
  {
    api: "stage",
    endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/addr/stage.json",
    fields: { cd: "11240660", addr_name: "가락1동", full_addr: "서울특별시 송파구 가락1동" },
    note: "문서 예제 — 구 행정동 코드 가능성",
  },
  {
    api: "stage",
    endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/addr/stage.json",
    fields: { cd: "11240670", addr_name: "가락2동", full_addr: "서울특별시 송파구 가락2동" },
    note: "문서 예제 — 구 행정동 코드 가능성",
  },
  {
    api: "geocode",
    endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/addr/geocode.json",
    fields: { adm_cd: "25030600", leg_cd: "3017011200", sido_cd: "25", sgg_cd: "25030" },
    note: "문서 예제 — adm_cd 8자리 + leg_cd 법정동",
  },
  {
    api: "rgeocode",
    endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/addr/rgeocode.json",
    fields: {
      sido_cd: "11",
      sgg_cd: "140",
      emdong_cd: "690",
      emdong_nm: "망원1동",
      full_addr: "서울특별시 마포구 망원1동",
    },
    note: "문서 예제 — 분할 코드(sido+sgg+emdong)",
  },
  {
    api: "hadmarea",
    endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/boundary/hadmarea.geojson",
    fields: { adm_cd: "11040520", year_max: "2025" },
    note: "문서 예제 — year 2000~2025",
  },
];

/** @type {Array<{label:string, mois10:string}>} */
const MOIS_REPRESENTATIVE_SAMPLES = [
  { label: "서울특별시", mois10: "1100000000" },
  { label: "종로구", mois10: "1111000000" },
  { label: "강남구", mois10: "1168000000" },
  { label: "송파구 가락1동 (2026.7.1)", mois10: "1171063100" },
  { label: "전남광주통합특별시", mois10: "1200000000" },
  { label: "안양시 만안구 명학동", mois10: "4117158200" },
];

function sgis8ToMois10(sgis8) {
  if (!sgis8 || sgis8 === "null") return null;
  const trimmed = String(sgis8).trim();
  if (trimmed.length === 10) return trimmed;
  if (trimmed.length === 8) return `${trimmed}00`;
  return null;
}

function mois10ToSgisVariants(mois10) {
  return {
    sido2: mois10.slice(0, 2),
    sigungu5: mois10.slice(0, 5),
    dong8: mois10.slice(0, 8),
  };
}

function findAdmin(adminNodes, code) {
  return adminNodes.find((n) => n.officialCode === code) ?? null;
}

function compareDocExample(adminNodes, example) {
  const { fields } = example;
  const cd = fields.cd ?? fields.adm_cd;
  const moisFromCd = cd ? sgis8ToMois10(cd) : null;
  const hit = moisFromCd ? findAdmin(adminNodes, moisFromCd) : null;

  let splitHit = null;
  if (fields.sido_cd && fields.sgg_cd && fields.emdong_cd) {
    const combined8 = `${fields.sido_cd}${fields.sgg_cd}${fields.emdong_cd}`.padEnd(8, "0").slice(0, 8);
    const mois10 = `${combined8}00`;
    splitHit = findAdmin(adminNodes, mois10);
  }

  return {
    api: example.api,
    endpoint: example.endpoint,
    sgisFields: fields,
    mois10FromCd: moisFromCd,
    moisNameFromCd: hit?.name ?? null,
    moisPathFromCd: hit?.pathKey ?? null,
    mois10FromSplitCodes: splitHit?.officialCode ?? null,
    moisNameFromSplit: splitHit?.name ?? null,
    docExampleMatchesMois20260701: Boolean(hit || splitHit),
    note: example.note ?? null,
  };
}

function main() {
  const mois = JSON.parse(readFileSync(MOIS_PATH, "utf8"));
  const adminNodes = mois.adminNodes ?? [];

  const moisSamples = MOIS_REPRESENTATIVE_SAMPLES.map((s) => {
    const node = findAdmin(adminNodes, s.mois10);
    const sgis = mois10ToSgisVariants(s.mois10);
    return {
      label: s.label,
      mois10: s.mois10,
      moisName: node?.name ?? null,
      moisPath: node?.pathKey ?? null,
      sgisVariants: sgis,
      structuralRule:
        s.mois10.endsWith("00000000")
          ? "sido: MOIS PP00000000 ↔ SGIS cd 2자리 PP"
          : s.mois10.endsWith("00000")
            ? "sigungu: MOIS 앞 5자리 ↔ SGIS stage cd 5자리"
            : "dong: MOIS 앞 8자리 + 00 ↔ SGIS cd/adm_cd 8자리",
    };
  });

  const docComparisons = SGIS_DOC_EXAMPLES.map((ex) => compareDocExample(adminNodes, ex));

  const review = {
    reviewedAt: new Date().toISOString(),
    sgisDocUrl: SGIS_DOC_URL,
    accessTokenUsed: false,
    liveApiCalled: false,
    apis: [
      {
        name: "단계별 주소 조회",
        endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/addr/stage.json",
        accessTokenRequired: true,
        stage1fRImplemented: false,
        purpose: "시도→시군구→읍면동 단계 조회, parent_id tree 보조 검증",
        responseFields: ["cd", "addr_name", "full_addr", "x_coor", "y_coor", "pg"],
      },
      {
        name: "지오코딩",
        endpoints: [
          "https://sgisapi.mods.go.kr/OpenAPI3/addr/geocode.json",
          "https://sgisapi.mods.go.kr/OpenAPI3/addr/geocodewgs84.json",
        ],
        accessTokenRequired: true,
        stage1fRImplemented: false,
        purpose: "adm_cd/adm_nm + leg_cd/leg_nm 동시 제공 — KIKmix·주소입력 변환 후보",
      },
      {
        name: "리버스 지오코딩",
        endpoints: [
          "https://sgisapi.mods.go.kr/OpenAPI3/addr/rgeocode.json",
          "https://sgisapi.mods.go.kr/OpenAPI3/addr/rgeocodewgs84.json",
        ],
        accessTokenRequired: true,
        stage1fRImplemented: false,
        purpose: "좌표→행정동 판별 — 위치 기반 추천 후보만",
      },
      {
        name: "행정구역경계",
        endpoint: "https://sgisapi.mods.go.kr/OpenAPI3/boundary/hadmarea.geojson",
        accessTokenRequired: true,
        yearParameter: "2000~2025",
        stage1fRImplemented: false,
        purpose: "GeoJSON 경계 — 지도 UI·상권 후보, 2026.7.1 대체 불가",
      },
    ],
    operationalLimits: {
      authFlow:
        "consumer_key/consumer_secret → authentication.json → accessToken (4시간 유효, 문서 기준)",
      dailyQuotaDoc:
        "SGIS OpenAPI 일일 약 50,000회 이하 권장(과부하 시 중지 가능) — 운영 의존성 있음",
      freeTier: "개발자 등록·테스트키/상용키 발급 후 사용",
    },
    codeMappingRule: {
      summary:
        "MOIS KiKcd_H 10자리 행정기관코드와 SGIS cd/adm_cd는 동일 체계 — SGIS는 종종 8자리(끝 00 생략) 또는 단계별 2/5/8자리로 표현",
      sido: "MOIS PP00000000 ↔ SGIS sido_cd 또는 stage cd 2자리 PP",
      sigungu: "MOIS 앞 5자리 ↔ SGIS stage 요청 cd 5자리",
      dong: "MOIS 10자리 앞 8자리 ↔ SGIS cd/adm_cd 8자리 (MOIS = 8자리 + '00')",
    },
    moisRepresentativeSamples: moisSamples,
    sgisDocExampleComparisons: docComparisons,
    canonicalDecision: {
      moisJscode20260701: "canonical seed source (채택)",
      sgisCanonical: "비채택 — API·토큰 의존, 정적 일괄 배포 없음, 경계 year≤2025, 문서 예제 일부 구코드",
      sgisAuxiliary: "유지 — 지오코딩·단계별 주소·리버스지오·경계(별도 Stage)",
    },
    stage1fRConstraints: {
      noMapUi: true,
      noGps: true,
      noBoundaryBulkDb: true,
      noTokenInRepo: true,
    },
  };

  writeFileSync(OUT_PATH, `${JSON.stringify(review, null, 2)}\n`, "utf8");

  const docMatchCount = docComparisons.filter((c) => c.docExampleMatchesMois20260701).length;
  console.log("SGIS region source review (static, no token)");
  console.log(`  MOIS samples: ${moisSamples.length}`);
  console.log(`  SGIS doc examples matched to MOIS 2026.7.1: ${docMatchCount}/${docComparisons.length}`);
  console.log(`  Output: ${OUT_PATH}`);
  console.log("  PASS — review artifact written (live API not required for Stage 1-F-R)");
}

main();
