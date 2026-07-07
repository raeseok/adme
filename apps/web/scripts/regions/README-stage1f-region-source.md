# Stage 1-F Official Region Source

## Primary source (used for seed generation)

| Field | Value |
|-------|-------|
| Provider | 국토교통부 전국 법정동 (공공데이터포털) |
| URL | https://www.data.go.kr/data/15063424/fileData.do |
| File | `molit_bjd_20260609.csv` |
| Effective date | 2026-06-09 |
| SHA-256 | `6b26e8929df44e55a091ffb4331ba1a68d1aa09a1377a94287be858f482b3dc5` |
| Upstream | 행정표준코드관리시스템 (code.go.kr) 법정동코드 |

## Newer source (documented, not auto-applied)

| Field | Value |
|-------|-------|
| Provider | 행정안전부 주민과 jscode |
| URL | https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000052&nttId=127039 |
| Effective date | 2026-07-01 |
| Files | `jscode20260701.zip`, `KiKcd_B.20260701` (법정동) |
| Note | MOIS direct download blocked in CI; includes 전남광주통합특별시 등 2026.7.1 변경 |

## Consumer region model

- **Source kind**: `molit-legal-dong` (법정동 우선)
- **Tree**: `parent_id` — 시·도 → 시·군·구 → 읍·면·동
- **Selectable**: active regions only; 리(里) level excluded
- **Legacy tree preserved**: 고양시 → 일산동구/덕양구 AdMe codes unchanged

## Regenerate pipeline

```bash
cd apps/web
node scripts/regions/fetch-official-region-source.mjs
node scripts/regions/parse-official-regions.mjs
node scripts/regions/generate-stage1f-region-seed-sql.mjs
node scripts/regions/wrap-seed-migration.mjs
```

## Rollback

See `supabase/rollback/stage_1_f_regions_seed_rollback.sql` (review only).
