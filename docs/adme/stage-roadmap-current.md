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
| **Stage 1-G** | 자녀 생년 선택, 소비 의향 프로필 능동형 UX 문구 | 없음 (프로필 확장) |
| **Stage 3-A** | point_ledger actual mutation RPC **dev-only** dry-run | 설계·dev only, prod 금지 |

### Stage 1-G 우선 권장 사유

- DOC-0에서 확정한 제품 철학을 사용자-facing UX에 먼저 반영
- 자녀 생년 선택 항목과 능동형 프로필 문구 구현
- 금전성 mutation이 없으므로 Stage 3-A보다 리스크가 낮음

### Stage 3-A 주의

- point_ledger actual mutation은 **dev-only dry-run**부터 진행
- **prod actual mutation은 별도 승인 전 금지**
- campaign budget, users balance, partner_settlements, cash_out actual mutation은 **별도 gate 전 금지**

---

## 권장 순서

1. **Stage 1-G** — 소비 의향 프로필 확장 및 능동형 UX 문구 개선
2. **Stage 3-A** — point_ledger actual mutation RPC dev-only dry-run
3. 이후 **Stage 1-H** 또는 **Stage 3-B**는 완료 상태에 따라 별도 판단

금전성 로직(Stage 3-A)은 **별도 설계·검수 단위**로 진행한다.

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
