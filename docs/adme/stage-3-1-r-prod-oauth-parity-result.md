# AdMe Stage 3-1-R — prod Supabase OAuth/Auth parity 및 DB UUID E2E 회복 결과

작성일: 2026-07-08

**Current living docs:** [current-development-plan.md](./current-development-plan.md) · [adme-decision-log.md](./adme-decision-log.md)

---

## project-ref

| 역할 | ref |
|---|---|
| dev | `ogncvdxrrsjnwsuvgoyh` |
| prod | `vupsalteyltjqumppltc` |

---

## 조치 요약

### 주요 원인 (후보 E)

`apps/web/scripts/e2e/supabase-auth-session.mjs`가 Production E2E에서도 **dev project-ref(`ogncvdxrrsjnwsuvgoyh`)** 를 하드코딩 사용.

- ephemeral signup → dev Supabase
- auth cookie → `sb-ogncvdxrrsjnwsuvgoyh-auth-token`
- Production Next.js → `sb-vupsalteyltjqumppltc-auth-token` 기대
- 결과: authenticated session 미인식 → `beginAdViewAction` 미실행 → `ad-view-started` timeout

### 수정

1. Production E2E base URL일 때 `/admin/diagnostics`에서 `stage30CurrentSupabaseProjectRef` 추출
2. 해당 ref로 Supabase anon client·auth cookie 생성
3. `verify:stage2c-db-uuid-campaign` 진단 로그 보강 + 2회차 오답 재선택

---

## prod Auth 설정 (config push 기준)

| 항목 | prod 상태 |
|---|---|
| Site URL | `https://web-ashen-xi-52.vercel.app` |
| Redirect URLs | Production callback + local dev URLs (config.toml) |
| Email signup | enabled |
| Email confirmations | **false** (E2E ephemeral signup 호환) |
| Google provider | Dashboard 수동 복제 필요 (CLI 미검증) |
| Kakao provider | Dashboard 수동 복제 필요 (CLI 미검증) |
| secret raw value recorded | **false** |
| service role used | **false** |

---

## verify:stage2c-db-uuid-campaign

| 항목 | 결과 |
|---|---|
| 최종 결과 | **PASS** |
| prod ref | `vupsalteyltjqumppltc` |
| ephemeral auth | PASS |
| e2e campaign seed | PASS (`e2e00002-...0002`) |
| ad_views INSERT | PASS |
| point_ledger mutation | 없음 |

---

## 원인 후보별 판정

| 후보 | 판정 |
|---|---|
| A prod OAuth/redirect | 부분 해당 가능 (Google/Kakao Dashboard 미복제) — **이번 FAIL 직접 원인 아님** |
| B prod seed/migration 누락 | **해당 없음** — campaign/quiz prod에 존재 |
| C RLS 차이 | **해당 없음** — authenticated consumer read/write PASS |
| D Production env mismatch | **해당 없음** — diagnostics ref 일치 |
| E E2E script assumption | **최종 원인** — dev ref hardcode |

---

## 남은 리스크

- Google/Kakao **인터랙티브 OAuth** 로그인은 prod Dashboard에 dev와 동일 provider client ID/secret 수동 복제 필요
- Preview redirect URL은 Vercel preview 배포 URL 변경 시 Supabase redirect 목록 갱신 필요
- Email ephemeral E2E는 prod에서 PASS 확인됨

---

## Stage 3-1-R 이후

- Stage 3-1 조건부 보류(`verify:stage2c-db-uuid-campaign` FAIL) **해소**
- Stage 3-1 최종 완료 인정 가능
- actual mutation은 계속 **disabled**
