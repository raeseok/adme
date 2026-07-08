# AdMe Stage 3-A — point_ledger Dev-Only Dry-Run Result

작성일: 2026-07-08  
상태: **완료** (Production actual mutation = false)

**Current living docs:** [current-development-plan.md](./current-development-plan.md) · [stage-roadmap-current.md](./stage-roadmap-current.md) · [adme-decision-log.md](./adme-decision-log.md)

**선행:** [stage-3-0-point-ledger-safety-preflight.md](./stage-3-0-point-ledger-safety-preflight.md) · [stage-3-0-quiz-reward-transaction-contract.md](./stage-3-0-quiz-reward-transaction-contract.md)

---

## 범위

### 포함 (dev-only)

- `point_ledger` **INSERT only** via SECURITY DEFINER RPC
- idempotency key + unique index
- Production JWT / prod project-ref 차단
- diagnostics stage3A markers
- verify scripts (dev dry-run, Production blocked, public marker guard)

### 미포함 (금지 / 후속)

- Production point_ledger actual mutation
- campaign budget 차감
- users balance 임의 수동 변경 (cache sync trigger는 INSERT 부작용만 — Stage 3-A dry-run은 **dev만**)
- partner_settlements / cash_out mutation
- quiz 정답 채점·정답 노출
- adjust UI / 운영자 환수 버튼
- 전체 `submit_quiz_reward_transaction` 제품 RPC

---

## RPC 계약

| 항목 | 값 |
|---|---|
| 이름 | `rpc_stage3a_dev_record_quiz_reward_dry_run` |
| SECURITY DEFINER | **true** |
| search_path | `public` 고정 |
| GRANT | `authenticated` 만 EXECUTE |
| entry_type | 기존 enum `ad_reward` (metadata `reward_type=quiz_reward`) |
| amount | 서버 고정 **100** (BIGINT) — 클라이언트 amount 불신 |
| user_id | `auth.uid()` 만 사용 |

### 입력

- `p_campaign_id` UUID
- `p_ad_view_id` UUID
- `p_idempotency_key` TEXT
- `p_amount` BIGINT optional (서버 값과 불일치 시 `STAGE3A_AMOUNT_FORBIDDEN`)

### 성공 응답 (JSON)

- `status`: `rewarded` | `idempotent_duplicate`
- `ledgerId`, `rewardAmount`, `balanceAfter`
- **금지 필드:** correctAnswer / quiz_answer / solution 등

### Production 거부

1. DB: JWT `iss`에 prod ref `vupsalteyltjqumppltc` 포함 → `STAGE3A_PRODUCTION_BLOCKED`
2. DB: JWT `iss`에 allowed dev ref `ogncvdxrrsjnwsuvgoyh` 없음 → 동일 거부
3. App: `assertStage3ADevOnlyMutationAllowed()` — Vercel production / prod URL 차단

---

## idempotency key 정책

형식:

```text
stage3a:{user_id}:{campaign_id}:quiz_reward:{ad_view_id}
```

- unique index: `(entry_type, idempotency_key) WHERE idempotency_key IS NOT NULL`
- 동일 key 재호출 → INSERT 없이 `idempotent_duplicate`
- key prefix와 auth.uid/campaign 불일치 → `STAGE3A_IDEMPOTENCY_KEY_MISMATCH`
- 동일 key + 다른 amount/user/campaign metadata → `STAGE3A_IDEMPOTENCY_CONFLICT`

---

## append-only / rollback / adjust

| 원칙 | Stage 3-A |
|---|---|
| INSERT only | RPC만 INSERT |
| UPDATE/DELETE | trigger `point_ledger_reject_mutation` 유지 |
| 트랜잭션 실패 | 단일 함수 본문 — 실패 시 INSERT 잔존 없음 |
| commit 후 정정 | **adjust append만** (정책 문서화; 실제 adjust mutation 미구현) |
| adjust 향후 계약 | admin only, reason 필수, 원거래 참조 필수, 별도 Stage 승인 |

---

## RLS / SECURITY DEFINER 검토

| 항목 | 결과 |
|---|---|
| authenticated 직접 INSERT | 정책 없음 → deny |
| SELECT own | 기존 `point_ledger_select_own` 유지 |
| DEFINER search_path | `public` 고정 |
| 입력 user_id 신뢰 | **하지 않음** — `auth.uid()` |
| 타인 적립 | idempotency prefix에 uid 강제 |
| quiz_answer 반환 | 없음 |
| service role client | 앱 코드에서 미사용 |

---

## migration

| 항목 | 값 |
|---|---|
| 파일 | `supabase/migrations/20260708180000_stage_3_a_point_ledger_dev_dry_run.sql` |
| dev 적용 | `ogncvdxrrsjnwsuvgoyh` |
| prod 적용 | `vupsalteyltjqumppltc` (함수는 Production JWT를 거부) |
| db reset | **false** |
| migration repair | **false** |

---

## 검증 명령

```bash
cd apps/web
npm run verify:stage3a-dev-dry-run
npm run verify:stage3a-production-blocked
npm run verify:stage3a-public-marker-guard
```

---

## diagnostics markers

`/admin/diagnostics` only — Production에서도 visible, 단 mutation=false:

- `stage3AEnabled=true`
- `stage3ADevOnlyMutation=true`
- `stage3AProductionMutationBlocked=true`
- `stage3APointLedgerAppendOnly=true`
- `stage3AIdempotencyUnique=true`
- `stage3AProdPointLedgerMutation=false`
- `stage3ARpcName=rpc_stage3a_dev_record_quiz_reward_dry_run`

---

## 다음 Stage 후보

1. **Stage 3-B** — quiz_reward full transaction (ad_views lock + budget + ledger) **dev-only**
2. Production actual mutation enable는 **별도 승인** 전 금지
