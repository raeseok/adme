# AdMe Stage 3-0 — quiz_reward Transaction Contract (Design Only)

작성일: 2026-07-08  
Contract version: **stage3-0-v1**  
상태: **설계·문서·코드 상수만** — actual RPC/migration **미구현**

---

## future RPC / function 이름 제안

| 후보 | 비고 |
|---|---|
| `record_quiz_reward_actual` | ledger 중심 naming |
| `submit_quiz_reward_transaction` | transaction 중심 naming |

Stage 3 본작업에서 하나를 선택하거나 alias로 통일한다. Stage 3-0에서는 DB에 생성하지 않는다.

---

## 입력 계약

| 필드 | 필수 | 설명 |
|---|---|---|
| `campaign_id` | yes | UUID |
| `quiz_id` | yes | UUID |
| `selected_option_id` 또는 `selected_option_value` | yes (택1) | 소비자 선택 — 정답 원문 아님 |
| `ad_view_id` | yes | 서버 기록된 열람 row |
| `idempotency_key` | yes | 중복 적립 방지 |

TypeScript mirror: `apps/web/src/lib/stage3/quiz-reward-contract.ts`

---

## 서버 내부 처리 순서 (단일 transaction)

1. authenticated consumer 확인
2. `ad_views` row를 `consumer_user_id + campaign_id + ad_view_id` 기준으로 **lock**
3. server-side `view_started_at` 기준 **최소 열람 시간** 검증
4. `attempt_no`와 reward 상태 검증
5. `quizzes` 원본 테이블에서 서버가 **정답 대조**
6. **정답 원문은 어떤 응답에도 포함하지 않음**
7. campaign budget 또는 reward budget row **lock**
8. campaign remaining budget >= `point_per_pass` 확인
9. `point_ledger` `quiz_reward` **insert** (canonical `entry_type='quiz_reward'` — Stage 3-B부터)
10. campaign budget **차감**
11. `ad_views` quiz_result/pass 상태 **update**
12. users balance cache가 있다면 ledger 합계와 함께 **update**
13. 모든 작업은 **하나의 transaction**으로 처리

Stage 3-0: 위 순서는 contract 문서화만 — **실행 코드 없음**.

**Stage 3-B:** `rpc_stage3b_dev_submit_quiz_reward_transaction`이 dev-only로 위 순서를 구현. Production mutation 금지. 상세: [stage-3-b-quiz-reward-full-transaction-dev-only.md](./stage-3-b-quiz-reward-full-transaction-dev-only.md)

**Stage 3-C:** 소비자 UI 제출은 server action → Stage 3-B RPC 경로만 허용. client 직접 RPC 금지. Production app gate `STAGE3C_PRODUCTION_REWARD_BLOCKED`. 상세: [stage-3-c-consumer-quiz-submit-ui-controlled-integration.md](./stage-3-c-consumer-quiz-submit-ui-controlled-integration.md)

---

## 실패 시 응답 계약

| code | 의미 |
|---|---|
| `MIN_VIEW_NOT_MET` | 서버 기록 최소 열람 미충족 |
| `ATTEMPT_LIMIT_REACHED` | 시도 횟수 초과 |
| `ALREADY_REWARDED` | 동일 idempotency / 이미 적립 |
| `INCORRECT_RETRY_AVAILABLE` | 오답, 재시도 가능 |
| `INCORRECT_FINAL` | 오답, 재시도 불가 |
| `CAMPAIGN_BUDGET_EXHAUSTED` | 캠페인 예산 부족 |
| `REWARD_MUTATION_DISABLED` | safety gate off |
| `ENV_NOT_SEPARATED` | dev/prod 미분리 |

---

## 성공 시 응답 계약

```json
{
  "status": "rewarded",
  "rewardAmount": 100,
  "balanceAfter": 1500
}
```

- `balanceAfter` — optional (캐시 미사용 시 생략 가능)
- **절대 포함 금지:** `answer`, `correctAnswer`, `correctOption`, `correctIndex`, `answerIndex`, `solution`

---

## Stage 3-0 범위

| 포함 | 미포함 |
|---|---|
| 본 문서 | `supabase/migrations` RPC |
| `quiz-reward-contract.ts` 상수 | actual INSERT/UPDATE |
| SQL draft (docs/adme/drafts/) | Production mutation |
| diagnostics `stage30TransactionContractVersion=stage3-0-v1` | client/API 정답 노출 |

---

## 코드 mirror

- `STAGE3_0_TRANSACTION_CONTRACT_VERSION = "stage3-0-v1"`
- `QUIZ_REWARD_FAILURE_CODES` — 위 8개 code
- `getQuizRewardTransactionContract()` — contract object 반환 (mutation 없음)
