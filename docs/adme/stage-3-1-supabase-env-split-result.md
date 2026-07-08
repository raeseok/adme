# AdMe Stage 3-1 — Supabase dev/prod 분리 결과

작성일: 2026-07-08  
전략: **권장안 A**

**Current living docs:** [current-development-plan.md](./current-development-plan.md) · [stage-roadmap-current.md](./stage-roadmap-current.md) · [adme-decision-log.md](./adme-decision-log.md)

---

## 선택한 분리 전략

| 항목 | 값 |
|---|---|
| 전략 | 권장안 A — 기존 project를 dev로 유지, 별도 prod 생성 |
| dev project-ref | `ogncvdxrrsjnwsuvgoyh` (Supabase name: ADMe) |
| prod project-ref | `vupsalteyltjqumppltc` (Supabase name: ADMe-prod) |
| 기존 ogncvdxrrsjnwsuvgoyh 역할 | **dev** |

---

## Vercel env ref 매핑

| 환경 | Supabase ref | 비고 |
|---|---|---|
| Production | `vupsalteyltjqumppltc` (prod) | NEXT_PUBLIC_SUPABASE_URL/anon key |
| Preview | `ogncvdxrrsjnwsuvgoyh` (dev) | PR·브랜치 배포 |
| Local | `ogncvdxrrsjnwsuvgoyh` (dev) | `.env.local` (git 미커밋) |

### ADME expected ref env (Production·Preview 공통)

| 변수 | 값 |
|---|---|
| `ADME_EXPECTED_PROD_SUPABASE_REF` | `vupsalteyltjqumppltc` |
| `ADME_EXPECTED_DEV_SUPABASE_REF` | `ogncvdxrrsjnwsuvgoyh` |
| `ADME_POINT_LEDGER_ACTUAL_MUTATION_ENABLED` | `false` |
| `ADME_QUIZ_REWARD_ACTUAL_MUTATION_ENABLED` | `false` |
| `ADME_CAMPAIGN_BUDGET_ACTUAL_MUTATION_ENABLED` | `false` |

---

## prod migration 적용

- 방식: `npx supabase link --project-ref vupsalteyltjqumppltc` → `npx supabase db push --yes`
- target ref 확인 후 적용 (완료보고에 ref 기록)
- `supabase db reset`: **미사용**
- `supabase migration repair`: **미사용**
- Production data 삭제: **없음** (신규 prod project)

---

## actual mutation 상태

Stage 3-1 완료 시점에도 다음은 **disabled**:

- point_ledger mutation
- campaign budget mutation
- users balance mutation
- partner_settlements mutation
- cash_out mutation
- quiz_reward actual mutation

---

## Stage 3-A 진입 가능 조건 (Stage 3-1 완료 후)

1. `stage30DevProdSupabaseSeparated=true`
2. `stage30CurrentEnvMatchesExpectedRef=true` (Production·Preview)
3. `stage30ReadinessStatus=READY_FOR_STAGE3_DESIGN_ONLY`
4. Stage 3-1 verify 전체 PASS
5. **별도 PR·문서 승인** 후 actual mutation gate enable (Stage 3-A)

---

## diagnostics 확인

- Production: https://web-ashen-xi-52.vercel.app/admin/diagnostics
- Preview: 배포 URL `/admin/diagnostics` (verify:stage3-1-env-split-preview)
