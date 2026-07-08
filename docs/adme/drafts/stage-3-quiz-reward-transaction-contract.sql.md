# Stage 3 quiz_reward Transaction — SQL Draft (Documentation Only)

**DO NOT apply to `supabase/migrations`.**  
Stage 3-0 design reference only. Contract version: `stage3-0-v1`.

---

## Proposed function signature (draft)

```sql
-- NOT MIGRATED — design draft for Stage 3-A or Stage 3-1+
CREATE OR REPLACE FUNCTION public.submit_quiz_reward_transaction(
  p_campaign_id uuid,
  p_quiz_id uuid,
  p_ad_view_id uuid,
  p_selected_option_id uuid,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Stage 3-0: entire body intentionally omitted.
  -- Future implementation must:
  -- 1. verify auth.uid() = ad_views.consumer_user_id
  -- 2. SELECT ... FOR UPDATE on ad_views
  -- 3. enforce min view from view_started_at
  -- 4. grade against quizzes server-side (no answer in return payload)
  -- 5. lock campaign budget row
  -- 6. INSERT point_ledger (quiz_reward)
  -- 7. UPDATE campaign budget
  -- 8. UPDATE ad_views status
  -- 9. optional users balance cache sync
  -- All in one transaction; idempotency on p_idempotency_key

  RAISE EXCEPTION 'REWARD_MUTATION_DISABLED';
END;
$$;
```

---

## Proposed idempotency unique index (draft)

```sql
-- NOT MIGRATED
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_quiz_reward_idempotency
--   ON public.point_ledger (consumer_user_id, campaign_id, quiz_id)
--   WHERE entry_type = 'quiz_reward';
```

---

## Failure codes (RPC return mapping)

| SQL / app code | Client code |
|---|---|
| min view check fail | `MIN_VIEW_NOT_MET` |
| attempt >= limit | `ATTEMPT_LIMIT_REACHED` |
| duplicate idempotency | `ALREADY_REWARDED` |
| wrong answer, retries left | `INCORRECT_RETRY_AVAILABLE` |
| wrong answer, final | `INCORRECT_FINAL` |
| budget insufficient | `CAMPAIGN_BUDGET_EXHAUSTED` |
| gate off | `REWARD_MUTATION_DISABLED` |
| dev/prod not separated | `ENV_NOT_SEPARATED` |

---

## Related docs

- [stage-3-0-quiz-reward-transaction-contract.md](../stage-3-0-quiz-reward-transaction-contract.md)
- [stage-3-0-point-ledger-safety-preflight.md](../stage-3-0-point-ledger-safety-preflight.md)
