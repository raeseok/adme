-- AdMe Stage 3-B: quiz_reward full transaction RPC (dev-only actual mutation)
-- Production JWT (iss containing prod project-ref) is rejected before any mutation.
-- entry_type canonical: quiz_reward (Stage 3-A ad_reward + metadata legacy unchanged).

-- ---------------------------------------------------------------------------
-- ledger_entry_type: add quiz_reward (non-destructive enum extension)
-- ---------------------------------------------------------------------------

ALTER TYPE public.ledger_entry_type ADD VALUE IF NOT EXISTS 'quiz_reward';

-- ---------------------------------------------------------------------------
-- ad_views: optional server-authoritative viewed_seconds for min-view checks
-- ---------------------------------------------------------------------------

ALTER TABLE public.ad_views
  ADD COLUMN IF NOT EXISTS viewed_seconds SMALLINT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.ad_views.viewed_seconds IS
  'Server-authoritative elapsed view seconds; NULL falls back to view_started_at (Stage 3-B)';
COMMENT ON COLUMN public.ad_views.submitted_at IS
  'Last quiz submission timestamp (Stage 3-B)';

-- ---------------------------------------------------------------------------
-- quiz_submission_idempotency — receipt table (no quiz_answer stored)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quiz_submission_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ad_view_id UUID NOT NULL REFERENCES public.ad_views(id) ON DELETE RESTRICT,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE RESTRICT,
  result_code TEXT NOT NULL,
  rewarded BOOLEAN NOT NULL DEFAULT false,
  amount BIGINT,
  attempt_no SMALLINT,
  ledger_entry_id UUID REFERENCES public.point_ledger(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER quiz_submission_idempotency_set_updated_at
  BEFORE UPDATE ON public.quiz_submission_idempotency
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_quiz_submission_idempotency_user_ad_view
  ON public.quiz_submission_idempotency (user_id, ad_view_id);

ALTER TABLE public.quiz_submission_idempotency ENABLE ROW LEVEL SECURITY;
-- No authenticated policies — SECURITY DEFINER RPC only

COMMENT ON TABLE public.quiz_submission_idempotency IS
  'Stage 3-B idempotency receipts — no quiz_answer; raw access denied to clients';

-- ---------------------------------------------------------------------------
-- point_ledger INSERT validation: quiz_reward
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_point_ledger_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.entry_type = 'admin_adjustment' THEN
    IF COALESCE(trim(NEW.description), '') = ''
       AND (NEW.metadata->>'reason') IS NULL THEN
      RAISE EXCEPTION 'admin_adjustment requires reason in description or metadata.reason';
    END IF;
  END IF;

  IF NEW.entry_type = 'advertiser_prepay' THEN
    IF NEW.account_type != 'advertiser' OR NEW.account_id IS NULL THEN
      RAISE EXCEPTION 'advertiser_prepay requires account_type advertiser with account_id';
    END IF;
    IF NEW.amount <= 0 THEN
      RAISE EXCEPTION 'advertiser_prepay amount must be positive';
    END IF;
  END IF;

  IF NEW.entry_type IN ('ad_reward', 'quiz_reward') THEN
    IF NEW.account_type != 'consumer' OR NEW.user_id IS NULL THEN
      RAISE EXCEPTION '% requires consumer account with user_id', NEW.entry_type;
    END IF;
    IF NEW.amount <= 0 THEN
      RAISE EXCEPTION '% amount must be positive', NEW.entry_type;
    END IF;
  END IF;

  IF NEW.entry_type = 'cash_redemption' THEN
    IF NEW.account_type != 'consumer' OR NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'cash_redemption requires consumer account with user_id';
    END IF;
    IF NEW.amount >= 0 THEN
      RAISE EXCEPTION 'cash_redemption amount must be negative';
    END IF;
  END IF;

  IF NEW.entry_type = 'campaign_spend' THEN
    IF NEW.account_type != 'advertiser' OR NEW.account_id IS NULL THEN
      RAISE EXCEPTION 'campaign_spend requires account_type advertiser with account_id';
    END IF;
    IF NEW.amount >= 0 THEN
      RAISE EXCEPTION 'campaign_spend amount must be negative';
    END IF;
  END IF;

  IF NEW.entry_type = 'partner_settlement' THEN
    IF NEW.account_type != 'partner' OR NEW.account_id IS NULL THEN
      RAISE EXCEPTION 'partner_settlement requires account_type partner with account_id';
    END IF;
  END IF;

  IF NEW.entry_type = 'revenue_allocation' THEN
    IF NEW.account_type NOT IN ('reward_pool', 'adme_hq', 'ops_pool', 'buffer_pool', 'partner') THEN
      RAISE EXCEPTION 'revenue_allocation requires pool or partner account_type';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Stage 3-B dev/prod JWT gate
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.stage3b_allowed_dev_project_ref()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'ogncvdxrrsjnwsuvgoyh'::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.stage3b_assert_dev_only_jwt()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_iss TEXT;
  v_allowed TEXT := public.stage3b_allowed_dev_project_ref();
BEGIN
  v_iss := COALESCE(auth.jwt() ->> 'iss', '');

  IF v_iss = '' THEN
    RAISE EXCEPTION 'STAGE3B_AUTH_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  IF position('vupsalteyltjqumppltc' IN v_iss) > 0 THEN
    RAISE EXCEPTION 'STAGE3B_PRODUCTION_BLOCKED'
      USING ERRCODE = 'P0001';
  END IF;

  IF position(v_allowed IN v_iss) = 0 THEN
    RAISE EXCEPTION 'STAGE3B_PRODUCTION_BLOCKED'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Stage 3-B response builder (never exposes quiz_answer)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.stage3b_build_response(
  p_status TEXT,
  p_result_code TEXT,
  p_rewarded BOOLEAN DEFAULT false,
  p_amount BIGINT DEFAULT NULL,
  p_attempt_no SMALLINT DEFAULT NULL,
  p_remaining_attempts INT DEFAULT NULL,
  p_ledger_entry_id UUID DEFAULT NULL,
  p_idempotency_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'status', p_status,
    'result_code', p_result_code,
    'rewarded', p_rewarded,
    'amount', p_amount,
    'attempt_no', p_attempt_no,
    'remaining_attempts', p_remaining_attempts,
    'ledger_entry_id', p_ledger_entry_id,
    'idempotency_status', p_idempotency_status,
    'stage3bBuild', 'stage3b-quiz-reward-full-transaction-dev-only',
    'entryTypeCanonical', 'quiz_reward',
    'productionMutationBlocked', true
  ));
$$;

-- ---------------------------------------------------------------------------
-- Stage 3-B full transaction RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_stage3b_dev_submit_quiz_reward_transaction(
  p_ad_view_id UUID,
  p_campaign_id UUID,
  p_quiz_id UUID,
  p_selected_option TEXT,
  p_idempotency_key TEXT,
  p_dev_force_rollback_after_budget BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_key TEXT;
  v_expected_key TEXT;
  v_receipt public.quiz_submission_idempotency%ROWTYPE;
  v_ad_view public.ad_views%ROWTYPE;
  v_campaign public.campaigns%ROWTYPE;
  v_quiz public.quizzes%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_min_view_seconds INT := 5;
  v_viewed_seconds INT;
  v_is_correct BOOLEAN;
  v_new_attempt_no SMALLINT;
  v_remaining INT;
  v_amount BIGINT;
  v_budget_remaining BIGINT;
  v_ledger_id UUID;
  v_balance_after BIGINT;
  v_ledger_sum BIGINT;
  v_result_code TEXT;
  v_status TEXT;
  v_rewarded BOOLEAN := false;
  v_idempotency_status TEXT;
BEGIN
  PERFORM public.stage3b_assert_dev_only_jwt();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'STAGE3B_AUTH_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  IF NOT public.is_consumer() THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_CONSUMER_ROLE_REQUIRED', false, NULL, NULL, NULL, NULL, NULL
    );
  END IF;

  IF p_ad_view_id IS NULL OR p_campaign_id IS NULL OR p_quiz_id IS NULL THEN
    RAISE EXCEPTION 'STAGE3B_INVALID_INPUT'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_selected_option IS NULL OR length(trim(p_selected_option)) = 0 THEN
    RAISE EXCEPTION 'STAGE3B_INVALID_INPUT'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'STAGE3B_INVALID_IDEMPOTENCY_KEY'
      USING ERRCODE = 'P0001';
  END IF;

  v_key := trim(p_idempotency_key);
  v_expected_key :=
    'stage3b:quiz_reward:' || v_uid::TEXT || ':' || p_ad_view_id::TEXT
    || ':' || p_campaign_id::TEXT || ':' || p_quiz_id::TEXT;

  SELECT * INTO v_ad_view
  FROM public.ad_views
  WHERE id = p_ad_view_id
    AND consumer_user_id = v_uid
    AND campaign_id = p_campaign_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_AD_VIEW_NOT_FOUND', false, NULL, NULL, NULL, NULL, NULL
    );
  END IF;

  IF v_ad_view.quiz_id IS NOT NULL AND v_ad_view.quiz_id IS DISTINCT FROM p_quiz_id THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_AD_VIEW_NOT_FOUND', false, NULL, NULL, NULL, NULL, NULL
    );
  END IF;

  IF v_ad_view.status = 'rewarded' OR v_ad_view.points_earned > 0 THEN
    IF v_key = v_expected_key THEN
      SELECT * INTO v_receipt
      FROM public.quiz_submission_idempotency
      WHERE idempotency_key = v_key
      LIMIT 1;

      IF FOUND THEN
        RETURN public.stage3b_build_response(
          CASE WHEN v_receipt.rewarded THEN 'rewarded' ELSE 'completed' END,
          'STAGE3B_IDEMPOTENT_DUPLICATE',
          v_receipt.rewarded,
          v_receipt.amount,
          v_receipt.attempt_no,
          NULL,
          v_receipt.ledger_entry_id,
          'duplicate'
        );
      END IF;

      SELECT id INTO v_ledger_id
      FROM public.point_ledger
      WHERE entry_type = 'quiz_reward'
        AND idempotency_key = v_key
      LIMIT 1;

      IF v_ledger_id IS NOT NULL THEN
        RETURN public.stage3b_build_response(
          'rewarded', 'STAGE3B_IDEMPOTENT_DUPLICATE', true, v_ad_view.points_earned,
          v_ad_view.attempt_no, 0, v_ledger_id, 'duplicate'
        );
      END IF;
    END IF;

    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_DUPLICATE_SUBMISSION_BLOCKED', false, NULL, v_ad_view.attempt_no, 0, NULL, 'blocked'
    );
  END IF;

  IF v_key <> v_expected_key THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_IDEMPOTENCY_KEY_MISMATCH', false, NULL, NULL, NULL, NULL, NULL
    );
  END IF;

  SELECT * INTO v_receipt
  FROM public.quiz_submission_idempotency
  WHERE idempotency_key = v_key
  FOR UPDATE;

  IF FOUND THEN
    RETURN public.stage3b_build_response(
      CASE WHEN v_receipt.rewarded THEN 'rewarded' ELSE 'completed' END,
      'STAGE3B_IDEMPOTENT_DUPLICATE',
      v_receipt.rewarded,
      v_receipt.amount,
      v_receipt.attempt_no,
      NULL,
      v_receipt.ledger_entry_id,
      'duplicate'
    );
  END IF;

  IF v_ad_view.status = 'failed' AND v_ad_view.attempt_no >= 2 THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_ATTEMPT_LIMIT_EXCEEDED', false, NULL, v_ad_view.attempt_no, 0, NULL, NULL
    );
  END IF;

  -- campaign + quiz lookup (before min-view to validate entities)
  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF NOT FOUND THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_CAMPAIGN_NOT_FOUND', false, NULL, NULL, NULL, NULL, NULL
    );
  END IF;

  SELECT * INTO v_quiz
  FROM public.quizzes
  WHERE id = p_quiz_id
    AND campaign_id = p_campaign_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_QUIZ_NOT_FOUND', false, NULL, NULL, NULL, NULL, NULL
    );
  END IF;

  -- min view seconds (canonical default 5 — matches resolveMinViewSeconds)
  IF v_ad_view.viewed_seconds IS NOT NULL THEN
    v_viewed_seconds := v_ad_view.viewed_seconds;
  ELSE
    v_viewed_seconds := GREATEST(
      0,
      FLOOR(
        EXTRACT(
          EPOCH FROM (
            clock_timestamp() - COALESCE(v_ad_view.view_started_at, v_ad_view.viewed_at)
          )
        )
      )::INT
    );
  END IF;

  IF v_viewed_seconds < v_min_view_seconds THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_MIN_VIEW_SECONDS_NOT_MET', false, NULL, v_ad_view.attempt_no,
      GREATEST(0, 2 - v_ad_view.attempt_no), NULL, NULL
    );
  END IF;

  IF v_ad_view.attempt_no >= 2 THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_ATTEMPT_LIMIT_EXCEEDED', false, NULL, v_ad_view.attempt_no, 0, NULL, NULL
    );
  END IF;

  -- server-side grading (quiz_answer never returned)
  v_is_correct := lower(trim(p_selected_option)) = lower(trim(v_quiz.quiz_answer));
  v_new_attempt_no := v_ad_view.attempt_no + 1;

  IF NOT v_is_correct THEN
    v_remaining := GREATEST(0, 2 - v_new_attempt_no);
    v_result_code := CASE
      WHEN v_new_attempt_no >= 2 THEN 'STAGE3B_WRONG_FINAL_NO_REWARD'
      ELSE 'STAGE3B_WRONG_RETRY_ALLOWED'
    END;

    UPDATE public.ad_views
    SET
      attempt_no = v_new_attempt_no,
      status = CASE WHEN v_new_attempt_no >= 2 THEN 'failed'::public.ad_view_status ELSE status END,
      submitted_at = clock_timestamp(),
      quiz_id = COALESCE(quiz_id, p_quiz_id)
    WHERE id = v_ad_view.id;

    -- Receipt only on final wrong (retry-allowed attempts omit receipt so same key can retry)
    IF v_new_attempt_no >= 2 THEN
      INSERT INTO public.quiz_submission_idempotency (
        idempotency_key, user_id, ad_view_id, campaign_id, quiz_id,
        result_code, rewarded, amount, attempt_no
      ) VALUES (
        v_key, v_uid, p_ad_view_id, p_campaign_id, p_quiz_id,
        v_result_code, false, NULL, v_new_attempt_no
      );
    END IF;

    RETURN public.stage3b_build_response(
      'completed', v_result_code, false, NULL, v_new_attempt_no, v_remaining, NULL, 'recorded'
    );
  END IF;

  -- correct answer path — lock campaign FOR UPDATE
  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id
  FOR UPDATE;

  v_amount := v_campaign.reward_per_view;
  v_budget_remaining := v_campaign.budget_total - v_campaign.budget_spent;

  IF v_amount IS NULL OR v_amount <= 0 THEN
    RAISE EXCEPTION 'STAGE3B_INVALID_REWARD_AMOUNT'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_budget_remaining < v_amount THEN
    RETURN public.stage3b_build_response(
      'rejected', 'STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT', false, NULL,
      v_new_attempt_no, GREATEST(0, 2 - v_new_attempt_no), NULL, NULL
    );
  END IF;

  -- lock user balance cache row
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STAGE3B_USER_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

  -- budget deduction (before ledger — forced rollback test point)
  UPDATE public.campaigns
  SET budget_spent = budget_spent + v_amount
  WHERE id = p_campaign_id;

  IF p_dev_force_rollback_after_budget THEN
    RAISE EXCEPTION 'STAGE3B_DEV_FORCED_ROLLBACK'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE(SUM(amount), 0) + v_amount
  INTO v_balance_after
  FROM public.point_ledger
  WHERE account_type = 'consumer'
    AND user_id = v_uid;

  INSERT INTO public.point_ledger (
    account_type,
    account_id,
    user_id,
    entry_type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description,
    metadata,
    created_by,
    idempotency_key
  ) VALUES (
    'consumer',
    NULL,
    v_uid,
    'quiz_reward',
    v_amount,
    v_balance_after,
    'stage3b_quiz_reward',
    p_ad_view_id,
    'Stage 3-B dev-only quiz reward',
    jsonb_build_object(
      'source', 'stage3b_full_transaction_dev',
      'campaign_id', p_campaign_id::TEXT,
      'quiz_id', p_quiz_id::TEXT,
      'ad_view_id', p_ad_view_id::TEXT,
      'attempt_no', v_new_attempt_no,
      'idempotency_key_ref', left(md5(v_key), 16)
    ),
    v_uid,
    v_key
  )
  RETURNING id INTO v_ledger_id;

  UPDATE public.ad_views
  SET
    attempt_no = v_new_attempt_no,
    status = 'rewarded'::public.ad_view_status,
    points_earned = v_amount,
    rewarded_at = clock_timestamp(),
    submitted_at = clock_timestamp(),
    quiz_id = COALESCE(quiz_id, p_quiz_id)
  WHERE id = v_ad_view.id;

  -- balance cache consistency (trigger also syncs; verify inline)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_ledger_sum
  FROM public.point_ledger
  WHERE account_type = 'consumer'
    AND user_id = v_uid;

  IF v_profile.point_balance IS DISTINCT FROM v_ledger_sum THEN
  -- trigger may run after statement; re-read profile
    SELECT point_balance INTO v_profile.point_balance
    FROM public.profiles
    WHERE id = v_uid;

    IF v_profile.point_balance IS DISTINCT FROM v_ledger_sum THEN
      RAISE EXCEPTION 'STAGE3B_BALANCE_INCONSISTENT'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.quiz_submission_idempotency (
    idempotency_key, user_id, ad_view_id, campaign_id, quiz_id,
    result_code, rewarded, amount, attempt_no, ledger_entry_id
  ) VALUES (
    v_key, v_uid, p_ad_view_id, p_campaign_id, p_quiz_id,
    'STAGE3B_REWARDED', true, v_amount, v_new_attempt_no, v_ledger_id
  );

  RETURN public.stage3b_build_response(
    'rewarded', 'STAGE3B_REWARDED', true, v_amount, v_new_attempt_no, 0, v_ledger_id, 'recorded'
  );

EXCEPTION
  WHEN unique_violation THEN
    -- concurrent idempotency or ledger duplicate
    SELECT * INTO v_receipt
    FROM public.quiz_submission_idempotency
    WHERE idempotency_key = v_key
    LIMIT 1;

    IF FOUND THEN
      RETURN public.stage3b_build_response(
        CASE WHEN v_receipt.rewarded THEN 'rewarded' ELSE 'completed' END,
        'STAGE3B_IDEMPOTENT_DUPLICATE',
        v_receipt.rewarded,
        v_receipt.amount,
        v_receipt.attempt_no,
        NULL,
        v_receipt.ledger_entry_id,
        'duplicate'
      );
    END IF;

    SELECT id INTO v_ledger_id
    FROM public.point_ledger
    WHERE entry_type = 'quiz_reward'
      AND idempotency_key = v_key
    LIMIT 1;

    IF v_ledger_id IS NOT NULL THEN
      RETURN public.stage3b_build_response(
        'rewarded', 'STAGE3B_IDEMPOTENT_DUPLICATE', true, v_amount, v_new_attempt_no, 0, v_ledger_id, 'duplicate'
      );
    END IF;
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.rpc_stage3b_dev_submit_quiz_reward_transaction(
  UUID, UUID, UUID, TEXT, TEXT, BOOLEAN
) IS
  'Stage 3-B: dev-only atomic quiz_reward transaction. Production JWT blocked. Consumer role only.';

REVOKE ALL ON FUNCTION public.rpc_stage3b_dev_submit_quiz_reward_transaction(
  UUID, UUID, UUID, TEXT, TEXT, BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_stage3b_dev_submit_quiz_reward_transaction(
  UUID, UUID, UUID, TEXT, TEXT, BOOLEAN
) TO authenticated;

REVOKE ALL ON FUNCTION public.stage3b_assert_dev_only_jwt() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stage3b_allowed_dev_project_ref() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stage3b_allowed_dev_project_ref() TO authenticated;

-- ---------------------------------------------------------------------------
-- Stage 3-B dev fixture: low-budget campaign for insufficient-budget tests
-- Fixed UUIDs — no point_ledger mutation; idempotent seed
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_adv_user_id UUID := 'e2e00001-0000-4000-8000-000000000001';
  v_low_budget_campaign_id UUID := 'e2e00004-0000-4000-8000-000000000004';
  v_low_budget_quiz_id UUID := 'e2e00005-0000-4000-8000-000000000005';
  v_region_id UUID;
  v_category_id UUID;
  v_advertiser_id UUID;
BEGIN
  SELECT id INTO v_region_id FROM public.regions WHERE code = 'KR-11-GANGNAM' LIMIT 1;
  SELECT id INTO v_category_id FROM public.interest_categories WHERE code = 'FOOD-CAFE' LIMIT 1;

  IF v_region_id IS NULL OR v_category_id IS NULL THEN
    RAISE NOTICE 'Stage 3-B low-budget seed skipped — base region/category missing';
    RETURN;
  END IF;

  SELECT id INTO v_advertiser_id FROM public.advertisers WHERE user_id = v_adv_user_id LIMIT 1;
  IF v_advertiser_id IS NULL THEN
    RAISE NOTICE 'Stage 3-B low-budget seed skipped — E2E advertiser missing';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.campaigns WHERE id = v_low_budget_campaign_id) THEN
    INSERT INTO public.campaigns (
      id, advertiser_id, title, description, region_id, category_id,
      ad_content_text, budget_total, budget_spent, reward_per_view,
      max_views_per_consumer, status
    ) VALUES (
      v_low_budget_campaign_id,
      v_advertiser_id,
      'Stage 3-B Low Budget E2E Campaign',
      'Remaining budget < reward_per_view for STAGE3B_CAMPAIGN_BUDGET_INSUFFICIENT tests',
      v_region_id,
      v_category_id,
      'Stage 3-B low budget fixture.',
      100,
      95,
      30,
      2,
      'active'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = v_low_budget_quiz_id) THEN
    INSERT INTO public.quizzes (
      id, campaign_id, question_text, options, quiz_answer, sort_order, is_active
    ) VALUES (
      v_low_budget_quiz_id,
      v_low_budget_campaign_id,
      'Stage 3-B low budget fixture question?',
      '[{"id":"opt-lb-a","label":"수요일"},{"id":"opt-lb-b","label":"월요일"}]'::JSONB,
      '수요일',
      0,
      true
    );
  END IF;

  RAISE NOTICE 'Stage 3-B low-budget fixture ready: %', v_low_budget_campaign_id;
END $$;
