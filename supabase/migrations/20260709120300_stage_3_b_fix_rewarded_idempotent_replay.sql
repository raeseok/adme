-- Stage 3-B fix: rewarded ad_view + same idempotency key returns IDEMPOTENT_DUPLICATE

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

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STAGE3B_USER_NOT_FOUND'
      USING ERRCODE = 'P0001';
  END IF;

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

  SELECT COALESCE(SUM(amount), 0)
  INTO v_ledger_sum
  FROM public.point_ledger
  WHERE account_type = 'consumer'
    AND user_id = v_uid;

  IF v_profile.point_balance IS DISTINCT FROM v_ledger_sum THEN
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
