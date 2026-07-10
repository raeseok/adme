-- Stage 3-Q dev DB validation.
-- Synthetic demo fixtures are created inside a transaction and rolled back.

BEGIN;

CREATE TEMP TABLE stage3q_validation_context AS
SELECT
  (SELECT id FROM public.profiles WHERE role = 'consumer' AND is_active = true ORDER BY created_at LIMIT 1) AS consumer_a,
  (SELECT id FROM public.profiles WHERE role = 'consumer' AND is_active = true ORDER BY created_at OFFSET 1 LIMIT 1) AS consumer_b,
  (SELECT id FROM public.profiles WHERE role = 'admin' AND is_active = true ORDER BY created_at LIMIT 1) AS admin_user,
  (SELECT id FROM public.profiles WHERE role = 'advertiser' AND is_active = true ORDER BY created_at LIMIT 1) AS advertiser_user,
  (SELECT id FROM public.profiles WHERE role = 'partner' AND is_active = true ORDER BY created_at LIMIT 1) AS partner_user,
  (SELECT count(*) FROM public.point_ledger) AS point_ledger_count_before,
  (SELECT COALESCE(sum(point_balance), 0) FROM public.profiles) AS profile_balance_sum_before,
  (SELECT count(*) FROM public.cash_redemption_requests) AS cash_redemption_requests_count_before,
  NULL::UUID AS request_id;

DO $$
DECLARE
  missing_actor_count INTEGER;
BEGIN
  SELECT
    (consumer_a IS NULL)::INT +
    (consumer_b IS NULL)::INT +
    (admin_user IS NULL)::INT +
    (advertiser_user IS NULL)::INT +
    (partner_user IS NULL)::INT
  INTO missing_actor_count
  FROM stage3q_validation_context;

  IF missing_actor_count <> 0 THEN
    RAISE EXCEPTION 'Stage 3-Q validation requires active consumer/admin/advertiser/partner dev profiles';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.stage3q_set_local_claims(p_subject UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub', p_subject::TEXT,
      'role', 'authenticated',
      'iss', 'https://ogncvdxrrsjnwsuvgoyh.supabase.co/auth/v1'
    )::TEXT,
    true
  );
END;
$$;

DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'cash_redemption_demo_requests',
    'cash_redemption_demo_events',
    'cash_redemption_demo_review_assignments'
  ];
  v_table_name TEXT;
BEGIN
  FOREACH v_table_name IN ARRAY expected_tables LOOP
    IF to_regclass('public.' || v_table_name) IS NULL THEN
      RAISE EXCEPTION 'missing Stage 3-Q table: %', v_table_name;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = v_table_name
        AND c.relrowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on %', v_table_name;
    END IF;
  END LOOP;
END $$;

SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM count(*) FROM public.cash_redemption_demo_requests;
    RAISE EXCEPTION 'anonymous SELECT unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'PASS: anonymous SELECT blocked';
  END;
END $$;
RESET ROLE;

DO $$
DECLARE
  v_subject UUID;
  v_response JSONB;
BEGIN
  SELECT consumer_a INTO v_subject FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  SET LOCAL ROLE authenticated;
  SELECT public.rpc_stage3q_demo_evaluate_cash_redemption(
    10000,
    18500,
    'normal-approval',
    'stage3q_validation_normal'
  )
  INTO v_response;
  RESET ROLE;

  UPDATE stage3q_validation_context
  SET request_id = (v_response ->> 'request_id')::UUID;
END $$;

DO $$
DECLARE
  v_subject UUID;
  v_request_id UUID;
BEGIN
  SELECT consumer_a INTO v_subject FROM stage3q_validation_context;
  SELECT request_id INTO v_request_id FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  SET LOCAL ROLE authenticated;
  PERFORM public.rpc_stage3q_demo_submit_cash_redemption(
    v_request_id,
    'stage3q_validation_submit'
  );
  RESET ROLE;
END $$;

DO $$
DECLARE
  v_subject UUID;
  v_request_id UUID;
BEGIN
  SELECT admin_user INTO v_subject FROM stage3q_validation_context;
  SELECT request_id INTO v_request_id FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  SET LOCAL ROLE authenticated;
  PERFORM public.rpc_stage3q_demo_start_review(
    v_request_id,
    'stage3q_validation_review'
  );
  PERFORM public.rpc_stage3q_demo_approve(
    v_request_id,
    'stage3q_validation_approve'
  );
  PERFORM public.rpc_stage3q_demo_start_processing(
    v_request_id,
    'stage3q_validation_processing'
  );
  PERFORM public.rpc_stage3q_demo_complete(
    v_request_id,
    'stage3q_validation_complete'
  );
  RESET ROLE;
END $$;

DO $$
DECLARE
  v_subject UUID;
  v_request_id UUID;
BEGIN
  SELECT admin_user INTO v_subject FROM stage3q_validation_context;
  SELECT request_id INTO v_request_id FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.rpc_stage3q_demo_start_processing(
      v_request_id,
      'stage3q_validation_invalid_transition'
    );
    RESET ROLE;
    RAISE EXCEPTION 'invalid transition unexpectedly succeeded';
  EXCEPTION WHEN raise_exception THEN
    RESET ROLE;
    RAISE NOTICE 'PASS: invalid transition blocked';
  END;
END $$;

DO $$
DECLARE
  v_subject UUID;
BEGIN
  SELECT consumer_a INTO v_subject FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM public.rpc_stage3q_demo_evaluate_cash_redemption(
      10000,
      18500,
      'normal-approval',
      'stage3q_validation_normal'
    );
    RESET ROLE;
    RAISE EXCEPTION 'duplicate idempotency unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN
    RESET ROLE;
    RAISE NOTICE 'PASS: duplicate idempotency blocked';
  END;
END $$;

DO $$
DECLARE
  v_subject UUID;
  visible_count INTEGER;
BEGIN
  SELECT consumer_b INTO v_subject FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO visible_count FROM public.cash_redemption_demo_requests;
  RESET ROLE;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'consumer non-owner expected zero rows, got %', visible_count;
  END IF;
END $$;

DO $$
DECLARE
  v_subject UUID;
  visible_count INTEGER;
BEGIN
  SELECT advertiser_user INTO v_subject FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO visible_count FROM public.cash_redemption_demo_requests;
  RESET ROLE;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'advertiser expected zero rows, got %', visible_count;
  END IF;
END $$;

DO $$
DECLARE
  v_subject UUID;
  visible_count INTEGER;
BEGIN
  SELECT partner_user INTO v_subject FROM stage3q_validation_context;
  PERFORM pg_temp.stage3q_set_local_claims(v_subject);

  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO visible_count FROM public.cash_redemption_demo_requests;
  RESET ROLE;

  IF visible_count <> 0 THEN
    RAISE EXCEPTION 'partner expected zero rows, got %', visible_count;
  END IF;
END $$;

DO $$
DECLARE
  event_count INTEGER;
BEGIN
  SELECT count(*)
  INTO event_count
  FROM public.cash_redemption_demo_events
  WHERE request_id = (SELECT request_id FROM stage3q_validation_context);

  IF event_count < 5 THEN
    RAISE EXCEPTION 'expected append-only event history, got %', event_count;
  END IF;

  IF (SELECT count(*) FROM public.point_ledger) <>
     (SELECT point_ledger_count_before FROM stage3q_validation_context) THEN
    RAISE EXCEPTION 'point_ledger changed during Stage 3-Q validation';
  END IF;

  IF (SELECT COALESCE(sum(point_balance), 0) FROM public.profiles) <>
     (SELECT profile_balance_sum_before FROM stage3q_validation_context) THEN
    RAISE EXCEPTION 'profiles point_balance changed during Stage 3-Q validation';
  END IF;

  IF (SELECT count(*) FROM public.cash_redemption_requests) <>
     (SELECT cash_redemption_requests_count_before FROM stage3q_validation_context) THEN
    RAISE EXCEPTION 'cash_redemption_requests changed during Stage 3-Q validation';
  END IF;
END $$;

SELECT 'PASS: Stage 3-Q dev state machine, RLS, idempotency validation completed with rollback' AS result;

ROLLBACK;
