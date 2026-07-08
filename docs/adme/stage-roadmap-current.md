# AdMe Stage Roadmap (Current)

작성일: 2026-07-08  
기준 commit: `d6eefea` 이후 current

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

---

## 조건부 / 최근 해소

| Stage | 이전 상태 | 현재 |
|---|---|---|
| Stage 3-1 | 조건부 (`verify:stage2c-db-uuid-campaign` FAIL) | **3-1-R로 해소** |
| Stage 3-1 | final deploy 정합성 | commit `d6eefea`, Production align 확인 권장 |

---

## 다음 후보 Stage

| ID | 내용 | 금전성 mutation |
|---|---|---|
| **DOC-0** | living document + decision log (본 작업) | 없음 |
| **Stage 1-G** | 자녀 생년 선택, 소비 의향 프로필 UX 문구 | 없음 (프로필 확장) |
| **Stage 3-A** | point_ledger actual mutation RPC **dev-only** dry-run | 설계·dev only, prod 금지 |

---

## 권장 순서

1. **DOC-0** — living document 구축 *(current)*
2. **Stage 1-G** 또는 **Stage 3-A** 중 선택
   - UX·정책 우선 → **Stage 1-G**
   - ledger transaction 설계 우선 → **Stage 3-A** (반드시 dev-only, gate 승인 전 prod 금지)
3. 금전성 로직(Stage 3-A)은 **별도 설계·검수 단위**로 진행
4. 사용자 프로필 UX 개선은 **Stage 1-G**로 분리

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
| **DOC-0** | 🔄 current task |
| Stage 1-G | 📋 planned |
| Stage 3-A | 📋 planned |

---

## 검증 앵커 (완료 Stage)

- Stage 3-1: `verify:stage3-1-env-split-production`, `verify:stage3-1-env-split-preview`
- Stage 3-0: `verify:stage3-0-env-separation-readiness`, `verify:stage3-0-point-ledger-no-mutation`
- Stage 2-C: `verify:stage2c-db-uuid-campaign`, `verify:stage2c-r-ad-views-rls`
- DOC-0: `verify:doc-0-current-docs`

---

## 관련 Stage 문서 (historical)

- [stage-3-0-supabase-env-separation.md](./stage-3-0-supabase-env-separation.md)
- [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md)
- [stage-3-1-supabase-env-split-result.md](./stage-3-1-supabase-env-split-result.md)
- [stage-3-1-r-prod-oauth-parity-result.md](./stage-3-1-r-prod-oauth-parity-result.md)
