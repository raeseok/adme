# Stage 1-F / 1-F-R Official Region Source

## Canonical selector source (Stage 1-F-R)

| Field | Value |
|-------|-------|
| Provider | 행정안전부 주민과 jscode |
| URL | https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039 |
| Zip | `jscode20260701.zip` |
| Effective date | **2026-07-01** |
| SHA-256 (zip) | `0b9f143fb6e43657ff72c863ac1412cc4be43e79dce323aac602fb7754663898` |
| Files | `KIKcd_H.20260701` (행정동), `KIKcd_B.20260701` (법정동), `KIKmix.20260701` (관할 매핑) |
| source_kind | `mois-kikcd-h` |
| Canonical selector | `mois-admin-dong` (행정동 tree) |

### Manual download (if auto-fetch fails)

1. Open the MOIS article URL above.
2. Download `jscode20260701.zip` (주소코드1).
3. Extract to `apps/web/scripts/regions/source/jscode20260701/jscode20260701/`.
4. Run `npm run regions:fetch-mois` (uses `FileDown.do` when HTML is reachable).

### 2026.7.1 representative changes verified in parser

- 전남광주통합특별시 신설 (`1200000000`), 광주/전남 단독 시·도 제거
- 경기도 안양시 만안구 명학동·병목안동 신설 (안양8동·9동 폐지)
- 인천광역시 서구 법정동 코드 변경 — molit baseline 보존 + KIKmix mapping

## MOLIT legal-dong baseline (preserved, non-selectable)

| Field | Value |
|-------|-------|
| Provider | 국토교통부 전국 법정동 (공공데이터포털) |
| URL | https://www.data.go.kr/data/15063424/fileData.do |
| File | `molit_bjd_20260609.csv` |
| Effective date | 2026-06-09 |
| SHA-256 | `6b26e8929df44e55a091ffb4331ba1a68d1aa09a1377a94287be858f482b3dc5` |
| source_kind | `molit-legal-dong` |
| Role | Saved profile reload / mapping assist; **not** shown in selector |

## Consumer region model

- **Selector**: `is_selectable=true` AND `source_kind=mois-kikcd-h` only (no admin/legal duplicate tree)
- **Tree**: `parent_id` — 시·도 → 시·군·구 → 읍·면·동
- **Legacy KR-\*** ids preserved on upsert where admin code maps
- **New admin nodes**: `KR-H-{10-digit}` code prefix
- **MOLIT KR-L-\*** rows kept for historical saved values

## Regenerate pipeline (Stage 1-F-R)

```bash
cd apps/web
npm run regions:fetch-mois
npm run regions:parse-mois
npm run regions:generate-seed-r
# wrap into supabase/migrations/20260707210100_stage_1_f_r_regions_seed.sql
```

## Rollback

- Stage 1-F: `supabase/rollback/stage_1_f_regions_seed_rollback.sql`
- Stage 1-F-R: `supabase/rollback/stage_1_f_r_regions_seed_rollback.sql`

---

## SGIS 주소경계 API 검토 (보조 source, non-canonical)

| 항목 | 결과 |
|------|------|
| API 사용 가능 여부 | 공개 문서 기준 사용 가능 (인증 필요) |
| accessToken 필요 | **예** — SGIS 개발자센터 발급 |
| 무료/쿼터 | 개발자 등록 후 일일 호출 한도 적용 (운영 의존성 있음) |
| Stage 1-F-R에서 token 사용 | **아니오** |
| token/log 노출 | **없음** |

### 검토 API

1. **단계별 주소 조회** `https://sgisapi.mods.go.kr/OpenAPI3/addr/stage.json`
   - 시도→시군구→읍면동 단계 조회 가능
   - `cd`, `addr_name` 필드가 MOIS 행정동 코드와 동일 체계로 보임 (샘플 비교는 token 없이 문서 수준)
2. **지오코딩** `geocode.json` / `geocodewgs84.json`
   - `adm_cd`(행정동), `leg_cd`(법정동) 동시 제공 → KIKmix 검증·향후 주소입력 변환 후보
3. **리버스 지오코딩** `rgeocode.json` — 향후 위치 기반 추천 후보만 문서화
4. **행정구역경계** `hadmarea.geojson` — year 2000~2025 한정, **2026.7.1 MOIS 대체 불가**

### Canonical source 판단

| 선택 | 판단 |
|------|------|
| SGIS를 canonical seed로 채택 | **비채택** — API 의존·토큰 관리·경계 year 제한 |
| MOIS jscode20260701 | **채택** — 공식 정적 일괄 배포, 2026.7.1 시행 명시 |
| SGIS 향후 보조 source | **유지** — 지오코딩·단계별 주소·경계(별도 Stage) |

MOIS KiKcd_H vs SGIS `cd`/`adm_cd`: 동일 10자리 행정기관코드 체계(문서·샘플 일치). Stage 1-F-R은 정적 MOIS 파일로 검증 완료.
