-- AdMe Stage 3-A: point_ledger append-only dry-run RPC (dev-only)
-- Production JWT (iss containing prod project-ref) is rejected inside the function.
-- Does NOT mutate campaign budget, partner_settlements, or cash_out.
-- Uses existing entry_type ad_reward (quiz_reward enum is out of Stage 3-A scope).

-- ---------------------------------------------------------------------------
-- idempotency_key on point_ledger
-- ---------------------------------------------------------------------------

ALTER TABLE public.point_ledger
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

COMMENT ON COLUMN public.point_ledger.idempotency_key IS
  'Duplicate-prevention key for ledger inserts; Stage 3-A dry-run and future quiz_reward';

CREATE UNIQUE INDEX IF NOT EXISTS idx_point_ledger_idempotency_key
  ON public.point_ledger (entry_type, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Stage 3-A allowed (dev) project-ref — hard-coded gate for JWT iss check
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.stage3a_allowed_dev_project_ref()
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'ogncvdxrrsjnwsuvgoyh'::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.stage3a_assert_dev_only_jwt()
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_iss TEXT;
  v_allowed TEXT := public.stage3a_allowed_dev_project_ref();
BEGIN
  v_iss := COALESCE(auth.jwt() ->> 'iss', '');

  IF v_iss = '' THEN
    RAISE EXCEPTION 'STAGE3A_AUTH_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  -- Production JWT iss contains prod project-ref → hard reject (not UI-only)
  IF position('vupsalteyltjqumppltc' IN v_iss) > 0 THEN
    RAISE EXCEPTION 'STAGE3A_PRODUCTION_BLOCKED'
      USING ERRCODE = 'P0001';
  END IF;

  IF position(v_allowed IN v_iss) = 0 THEN
    RAISE EXCEPTION 'STAGE3A_PRODUCTION_BLOCKED'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Stage 3-A dry-run RPC — append-only point_ledger INSERT (ad_reward)
-- Amount is server-authoritative; client amount/user_id are not trusted.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rpc_stage3a_dev_record_quiz_reward_dry_run(
  p_campaign_id UUID,
  p_ad_view_id UUID,
  p_idempotency_key TEXT,
  p_amount BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_amount BIGINT := 100;
  v_key TEXT;
  v_existing public.point_ledger%ROWTYPE;
  v_ledger_id UUID;
  v_balance_after BIGINT;
  v_expected_key_prefix TEXT;
BEGIN
  PERFORM public.stage3a_assert_dev_only_jwt();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'STAGE3A_AUTH_REQUIRED'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_campaign_id IS NULL OR p_ad_view_id IS NULL THEN
    RAISE EXCEPTION 'STAGE3A_INVALID_INPUT'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN
    RAISE EXCEPTION 'STAGE3A_INVALID_IDEMPOTENCY_KEY'
      USING ERRCODE = 'P0001';
  END IF;

  v_key := trim(p_idempotency_key);
  v_expected_key_prefix :=
    'stage3a:' || v_uid::TEXT || ':' || p_campaign_id::TEXT || ':quiz_reward:';

  -- Idempotency key must bind to auth.uid() + campaign (prevents cross-user replay)
  IF position(v_expected_key_prefix IN v_key) <> 1 THEN
    RAISE EXCEPTION 'STAGE3A_IDEMPOTENCY_KEY_MISMATCH'
      USING ERRCODE = 'P0001';
  END IF;

  -- Server-authoritative amount: ignore forged client amounts
  IF p_amount IS NOT NULL AND p_amount <> v_amount THEN
    RAISE EXCEPTION 'STAGE3A_AMOUNT_FORBIDDEN'
      USING ERRCODE = 'P0001';
  END IF;

  -- Idempotent replay
  SELECT * INTO v_existing
  FROM public.point_ledger
  WHERE entry_type = 'ad_reward'
    AND idempotency_key = v_key
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.user_id IS DISTINCT FROM v_uid
       OR v_existing.amount IS DISTINCT FROM v_amount
       OR (v_existing.metadata->>'campaign_id') IS DISTINCT FROM p_campaign_id::TEXT
       OR (v_existing.metadata->>'ad_view_id') IS DISTINCT FROM p_ad_view_id::TEXT THEN
      RAISE EXCEPTION 'STAGE3A_IDEMPOTENCY_CONFLICT'
        USING ERRCODE = 'P0001';
    END IF;

    RETURN jsonb_build_object(
      'status', 'idempotent_duplicate',
      'ledgerId', v_existing.id,
      'rewardAmount', v_existing.amount,
      'balanceAfter', v_existing.balance_after,
      'stage3aBuild', 'stage3a-point-ledger-dev-dry-run',
      'pointLedgerAppendOnly', true,
      'productionMutationBlocked', true
    );
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
    'ad_reward',
    v_amount,
    v_balance_after,
    'stage3a_dry_run',
    p_ad_view_id,
    'Stage 3-A dev-only quiz reward dry-run',
    jsonb_build_object(
      'stage3a', true,
      'stage3a_dev_dry_run', true,
      'reward_type', 'quiz_reward',
      'campaign_id', p_campaign_id::TEXT,
      'ad_view_id', p_ad_view_id::TEXT,
      'marker', 'stage3a-fixture'
    ),
    v_uid,
    v_key
  )
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object(
    'status', 'rewarded',
    'ledgerId', v_ledger_id,
    'rewardAmount', v_amount,
    'balanceAfter', v_balance_after,
    'stage3aBuild', 'stage3a-point-ledger-dev-dry-run',
    'pointLedgerAppendOnly', true,
    'productionMutationBlocked', true
  );
EXCEPTION
  WHEN unique_violation THEN
    -- Concurrent duplicate insert raced the unique index — treat as idempotent
    SELECT * INTO v_existing
    FROM public.point_ledger
    WHERE entry_type = 'ad_reward'
      AND idempotency_key = v_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'status', 'idempotent_duplicate',
        'ledgerId', v_existing.id,
        'rewardAmount', v_existing.amount,
        'balanceAfter', v_existing.balance_after,
        'stage3aBuild', 'stage3a-point-ledger-dev-dry-run',
        'pointLedgerAppendOnly', true,
        'productionMutationBlocked', true
      );
    END IF;
    RAISE;
END;
$$;

COMMENT ON FUNCTION public.rpc_stage3a_dev_record_quiz_reward_dry_run(UUID, UUID, TEXT, BIGINT) IS
  'Stage 3-A: dev-only point_ledger ad_reward INSERT dry-run. Production JWT blocked. No budget mutation.';

REVOKE ALL ON FUNCTION public.rpc_stage3a_dev_record_quiz_reward_dry_run(UUID, UUID, TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_stage3a_dev_record_quiz_reward_dry_run(UUID, UUID, TEXT, BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.stage3a_assert_dev_only_jwt() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stage3a_allowed_dev_project_ref() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stage3a_allowed_dev_project_ref() TO authenticated;
