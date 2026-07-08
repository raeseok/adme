# AdMe Stage Roadmap (Current)

작성일: 2026-07-08 (DOC-0-R 갱신)  
기준 commit: `eb080e2` 이후 current

Living 문서: [current-business-plan.md](./current-business-plan.md) · [current-development-plan.md](./current-development-plan.md) · [adme-decision-log.md](./adme-decision-log.md)

---

## 완료된 Stage

| Stage | 요약 |
|---|---|
| **Stage 0** | schema, RLS, seed, extensions |
| **Stage 0.5** | Vercel shell |
| **Stage 0.6** | consumer_regions |
| **Stage 1-C ~ 1-D-B** | Auth, social login, public UI, profile intent |
| **Stage 1-E / 1-E-R** | hierarchical region selector, region auth verify |
| **Stage 1-F / 1-F-R** | MOIS region seed full coverage |
| **Stage 2-A** | read-only ad card, quiz preview, Kakao feasibility doc |
| **Stage 2-B** | min-view timer, server grading preview |
| **Stage 2-C / 2-C-R** | ad_views, server authoritative min-view, attempt limit |
| **Stage 3-0** | dev/prod readiness markers, ledger safety preflight, transaction contract (design only) |
| **Stage 3-1** | Supabase dev/prod 실제 분리, Vercel env split |
| **Stage 3-1-R** | prod E2E ref fix, `verify:stage2c-db-uuid-campaign` 회복 |
| **DOC-0** | living document + decision log 구축 완료 |
| **Stage 1-G** | 자녀 생년·반려동물 조건·능동형 프로필 UX |
| **Stage 1-G-R** | 기본/선택 정보 섹션, Production commit 정합화 |
| **Stage 3-A** | point_ledger actual mutation RPC **dev-only** dry-run |

---

## 조건부 / 최근 해소

| Stage | 이전 상태 | 현재 |
|---|---|---|
| Stage 3-1 | 조건부 (`verify:stage2c-db-uuid-campaign` FAIL) | **3-1-R로 해소** |
| Stage 1-G | 조건부 (Production commit 불일치) | **1-G-R로 해소** |
| Stage 1-G-R | 재보류 (329e73f vs fceb801) | **해소·완료** |

---

## 다음 후보 Stage

| ID | 내용 | 금전성 mutation |
|---|---|---|
| **Stage 3-B** | quiz_reward full transaction (ad_views + budget + ledger) **dev-only** | dev only, prod 금지 |
| **Stage 1-H** | (후보) 프로필·매칭 후속 확장 | TBD |

### Stage 3-B 주의

- Production point_ledger / budget / cash_out actual mutation은 **별도 승인 전 금지**
- Stage 3-A RPC는 dry-run 전용 — 제품 quiz 제출 경로와 아직 미연결

---

## 권장 순서

1. **Stage 3-B** — quiz_reward full transaction dev-only (별도 설계·검수)
2. 이후 **Stage 1-H** 또는 Production mutation enable는 별도 승인

---

## Stage별 상태 표

| Stage | Status |
|---|---|
| Stage 0 | ✅ 완료 |
| Stage 0.5 / 0.6 | ✅ 완료 |
| Stage 1-D / E / F / F-R | ✅ 완료 |
| Stage 2-A / B / C | ✅ 완료 |
| Stage 3-0 | ✅ 완료 |
| Stage 3-1 | ✅ 완료 (3-1-R 반영) |
| Stage 3-1-R | ✅ 완료 |
| **DOC-0** | ✅ 완료 |
| **Stage 1-G** | ✅ 완료 |
| **Stage 1-G-R** | ✅ 완료 |
| **Stage 3-A** | ✅ 완료 (dev-only dry-run; Production mutation=false) |
| Stage 3-B | 📋 planned |

---

## 검증 앵커 (완료 Stage)

- Stage 3-1: `verify:stage3-1-env-split-production`, `verify:stage3-1-env-split-preview`
- Stage 3-0: `verify:stage3-0-env-separation-readiness`, `verify:stage3-0-point-ledger-no-mutation`
- Stage 2-C: `verify:stage2c-db-uuid-campaign`, `verify:stage2c-r-ad-views-rls`
- DOC-0: `verify:doc-0-current-docs`
- Stage 1-G: `verify:stage1g-profile-family-pet`, `smoke:stage1g-profile-ux`, `verify:stage1g-rls-family-pet`, `verify:stage1g-public-marker-guard`
- Stage 1-G-R: `smoke:stage1g-r-profile-basic-optional-ux`, `verify:stage1g-r-production-commit`, `verify:stage1g-r-public-marker-guard`
- Stage 3-A: `verify:stage3a-dev-dry-run`, `verify:stage3a-production-blocked`, `verify:stage3a-public-marker-guard`

---

## 관련 Stage 문서 (historical)

- [stage-1-g-child-pet-profile-ux.md](./stage-1-g-child-pet-profile-ux.md)
- [stage-1-g-r-profile-basic-optional-sections.md](./stage-1-g-r-profile-basic-optional-sections.md)
- [stage-3-a-point-ledger-dev-dry-run-result.md](./stage-3-a-point-ledger-dev-dry-run-result.md)

- [stage-3-0-supabase-env-separation.md](./stage-3-0-supabase-env-separation.md)
- [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)
- [stage-3-1-supabase-env-split-result.md](./stage-3-1-supabase-env-split-result.md)
- [stage-3-1-r-prod-oauth-parity-result.md](./stage-3-1-r-prod-oauth-parity-result.md)
