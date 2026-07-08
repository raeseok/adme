# AdMe Stage 3-0 — point_ledger 실적립 사전 안전장치 (Preflight)

작성일: 2026-07-08  
목적: Stage 3 actual mutation 진입 전 point_ledger·budget·balance 불가침 원칙과 safety gate를 정의한다.

---

## point_ledger 불가침 원칙

| 원칙 | 설명 |
|---|---|
| **append-only** | ledger row는 INSERT만 허용; 잔액 수정은 새 row로 반영 |
| **UPDATE/DELETE 금지** | 감사·대사를 위해 기존 row 변경·삭제 불가 |
| **직접 client insert 금지** | browser·client component에서 point_ledger 접근 금지 |
| **서버 전용 RPC/transaction** | actual mutation은 authenticated server action + DB transaction/RPC만 |

---

## Stage 3-0 금지 mutation 목록

Stage 3-0에서 **절대 수행하지 않음**:

- `point_ledger` INSERT / UPDATE / DELETE
- campaign budget 차감 (`budget_spent`, `remaining_budget` 등)
- `users` balance 변경
- `partner_settlements` INSERT / UPDATE / DELETE
- `cash_out` INSERT
- advertiser `point_packages` 실제 charge 기록

verify script(`verify:stage3-0-point-ledger-no-mutation`)가 정적 스캔 + diagnostics marker로 이를 검증한다.

---

## actual mutation safety gate 설계

### 기본값

- `ADME_POINT_LEDGER_ACTUAL_MUTATION_ENABLED` — unset 또는 false
- `ADME_QUIZ_REWARD_ACTUAL_MUTATION_ENABLED` — unset 또는 false
- **effective value (Stage 3-0):** 항상 **false** — env에 true가 있어도 코드에서 강제 false

### 차단 규칙

1. dev/prod Supabase **미분리** → actual mutation **무조건 차단** (`ENV_NOT_SEPARATED`)
2. Stage 3-0 preflight → `assertStage3ActualMutationAllowed()` 항상 `{ allowed: false }`
3. Production에서 actual mutation enable 전 **별도 문서·PR 승인** 필요

### 코드 위치

- `apps/web/src/lib/stage3/readiness.ts` — env·ref·readinessStatus 계산
- `apps/web/src/lib/stage3/point-ledger-safety.ts` — `getStage30PointLedgerSafetyState()`, `assertStage3ActualMutationAllowed()`
- `/admin/diagnostics` — `stage30PointLedgerActualMutationEnabled=false` visible marker

---

## 중복 적립 방지 원칙 (Stage 3 본작업용 설계)

Stage 3-0에서는 **구현하지 않으나** 다음을 Stage 3 RPC 설계에 반영:

| 항목 | 요구 |
|---|---|
| idempotency key | `user_id + campaign_id + quiz_id` 또는 `ad_view_id` 기준 |
| unique constraint | 동일 소비자·동일 캠페인·동일 퀴즈 중복 reward 방지 |
| transaction lock | `ad_views` row lock → budget row lock → ledger insert 순 |

---

## 정합성 검증 원칙 (Stage 3 본작업용)

- `point_ledger` 합계 = users 잔액 캐시 (캐시 사용 시)
- campaign `consumed` / `budget` 잔액과 ledger 합계 **대사**
- reward pool 재원과 미전환 포인트 **대사**

Stage 3-0에서는 대사 job/RPC를 만들지 않는다.

---

## Stage 3-0 결론

| 항목 | Stage 3-0 상태 |
|---|---|
| actual mutation 구현 | **없음** |
| RPC / migration | **없음** (`supabase/migrations`에 quiz_reward RPC 미추가) |
| readiness marker | `/admin/diagnostics`에 visible |
| transaction contract | 문서 + `quiz-reward-contract.ts` 상수만 |
| 다음 단계 | Stage 3-1 dev/prod 실분리 또는 Stage 3-A RPC dry-run |

**핵심:** Stage 3-0은 “돈이 움직이는 코드”가 아니라 “돈이 움직이기 전 안전판”이다.
