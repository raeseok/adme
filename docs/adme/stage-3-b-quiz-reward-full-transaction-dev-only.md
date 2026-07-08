# AdMe Stage 3-B — quiz_reward Full Transaction Dev-Only

작성일: 2026-07-09  
상태: **구현 완료** (Production actual mutation = false)

**선행:** [stage-3-a-point-ledger-dev-dry-run-result.md](./stage-3-a-point-ledger-dev-dry-run-result.md) · [stage-3-0-quiz-reward-transaction-contract.md](./stage-3-0-quiz-reward-transaction-contract.md)

---

## 목표

- dev Supabase(`ogncvdxrrsjnwsuvgoyh`)에서만 quiz_reward **원자적 full transaction** RPC 검증
- ad_views lock → min-view → attempt → 서버 채점 → budget 차감 → `point_ledger` append → balance cache 정합성 → ad_views result
- Production(`vupsalteyltjqumppltc`)에서는 **모든 actual mutation 차단**

## 비목표

- `/consumer/ads` 실제 제출 버튼 연결
- Production reward mutation
- cash_out / partner_settlements / advertiser dashboard
- point_ledger UPDATE/DELETE 또는 adjust 구현

---

## RPC

| 항목 | 값 |
|---|---|
| 이름 | `rpc_stage3b_dev_submit_quiz_reward_transaction` |
| SECURITY DEFINER | true |
| search_path | `public` |
| GRANT | `authenticated` only |
| consumer gate | `public.is_consumer()` 내부 검증 |
| Production gate | JWT `iss` prod ref 포함 시 `STAGE3B_PRODUCTION_BLOCKED` |

### 입력

- `p_ad_view_id`, `p_campaign_id`, `p_quiz_id`
- `p_selected_option` TEXT — 선택지 label (서버에서 `quizzes.quiz_answer`와 trim/lower 비교)
- `p_idempotency_key` — 서버 expected key와 일치 필수
- `p_dev_force_rollback_after_budget` — dev rollback 검증용

### entry_type canonical

- **Stage 3-B 신규 row:** `entry_type='quiz_reward'`
- **Stage 3-A legacy:** `entry_type='ad_reward'` + `metadata.reward_type='quiz_reward'` 유지 (UPDATE 금지)

### reward amount / budget

- amount 컬럼: `campaigns.reward_per_view` (BIGINT)
- budget 차감: `campaigns.budget_spent += amount` (`budget_total - budget_spent` 검증)
- E2E fixture: 30P (50~500P 범위 내)

### min-view

- canonical: **5초** (`resolveMinViewSeconds` default)
- `ad_views.viewed_seconds` 우선, NULL이면 `view_started_at` 경과 계산
- 미충족 시 attempt 증가 없음 → `STAGE3B_MIN_VIEW_SECONDS_NOT_MET`

### idempotency

- expected key: `stage3b:quiz_reward:{uid}:{ad_view_id}:{campaign_id}:{quiz_id}`
- receipt table: `quiz_submission_idempotency` (RLS on, client policy 없음)
- wrong 1회차는 receipt 미기록 (same key 재시도 허용)
- rewarded + same key → `STAGE3B_IDEMPOTENT_DUPLICATE`
- rewarded + different key → `STAGE3B_DUPLICATE_SUBMISSION_BLOCKED`

### lock 순서

1. ad_views FOR UPDATE (terminal rewarded 시 receipt/ledger replay)
2. idempotency receipt FOR UPDATE
3. campaigns FOR UPDATE (정답·budget 충분 시)
4. profiles FOR UPDATE (balance cache)
5. point_ledger INSERT

### users balance cache

- `profiles.point_balance` 존재 → INSERT 후 ledger sum과 일치 검증
- trigger `sync_balance_cache_from_ledger` 동일 transaction 내 동작

### quiz_answer 비노출

- RPC 응답·metadata·receipt·diagnostics·public route에 정답 필드 금지
- 채점은 RPC 내부에서만 `quizzes` 직접 조회

### advertiser/partner raw ledger

- consumer raw `point_ledger` row SELECT/INSERT/UPDATE/DELETE 차단 (RLS)
- 향후 aggregate DTO/view만 허용 (이번 Stage 미구현)

---

## Migrations

| 파일 | 내용 |
|---|---|
| `20260709120000_stage_3_b_quiz_reward_full_transaction_dev_only.sql` | enum, receipt, RPC, low-budget fixture |
| `20260709120100_stage_3_b_fix_rpc_metadata_digest.sql` | md5 metadata |
| `20260709120200_stage_3_b_fix_duplicate_key_lock_order.sql` | lock 순서 |
| `20260709120300_stage_3_b_fix_rewarded_idempotent_replay.sql` | rewarded idempotent replay |
| `20260709120400_stage_3_b_verify_fixture_campaigns.sql` | verify용 추가 campaign seed |

---

## 검증 스크립트

| script | 용도 |
|---|---|
| `verify:stage3b-dev-full-transaction` | dev 8시나리오 + role gate |
| `verify:stage3b-production-blocked` | Production RPC/budget/ledger 차단 |
| `verify:stage3b-quiz-answer-non-exposure` | RPC/HTML/diagnostics/network |
| `verify:stage3b-ledger-raw-access-guard` | advertiser/partner raw ledger |
| `verify:stage3b-public-marker-guard` | diagnostics only marker |

---

## Stage 3-C 이월

- consumer quiz submit UI controlled integration
- Production actual mutation 별도 승인 전까지 금지 유지
- partner/advertiser aggregate ledger DTO

---

## Stage 3-A 이월 링크

[stage-3-a-point-ledger-dev-dry-run-result.md](./stage-3-a-point-ledger-dev-dry-run-result.md) — Stage 3-B canonical `quiz_reward` 및 full transaction 확장 참조
