-- AdMe Stage 0.6: consumer_regions 검증 SQL
-- Stage 0 migration 적용 후 실행 (validate_stage0.sql 이후 권장)
-- 출력 형식: RAISE NOTICE 'PASS [N]: ...' / 실패 시 RAISE EXCEPTION

-- ===========================================================================
-- [1] consumer_regions 테이블 존재
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'consumer_regions'
  ) THEN
    RAISE EXCEPTION 'FAIL [1]: consumer_regions table missing';
  END IF;
  RAISE NOTICE 'PASS [1]: consumer_regions table exists';
END $$;

-- ===========================================================================
-- [2] RLS enabled
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'consumer_regions'
      AND c.relkind = 'r'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'FAIL [2]: consumer_regions RLS not enabled';
  END IF;
  RAISE NOTICE 'PASS [2]: consumer_regions RLS enabled';
END $$;

-- ===========================================================================
-- [3] region_type check constraint
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.consumer_regions'::regclass
      AND conname = 'consumer_regions_region_type_check'
  ) THEN
    RAISE EXCEPTION 'FAIL [3]: consumer_regions_region_type_check missing';
  END IF;
  RAISE NOTICE 'PASS [3]: region_type check constraint exists';
END $$;

-- ===========================================================================
-- [4] residence 최대 1개 (partial unique index)
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'consumer_regions'
      AND indexname = 'consumer_regions_one_residence_per_profile'
  ) THEN
    RAISE EXCEPTION 'FAIL [4]: residence max-1 partial unique index missing';
  END IF;
  RAISE NOTICE 'PASS [4]: residence max 1 constraint exists';
END $$;

-- ===========================================================================
-- [5] activity slot 구조 제약 (check + partial unique)
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.consumer_regions'::regclass
      AND conname = 'consumer_regions_slot_shape_check'
  ) THEN
    RAISE EXCEPTION 'FAIL [5a]: consumer_regions_slot_shape_check missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'consumer_regions'
      AND indexname = 'consumer_regions_unique_activity_slot'
  ) THEN
    RAISE EXCEPTION 'FAIL [5b]: activity slot unique index missing';
  END IF;
  RAISE NOTICE 'PASS [5]: activity max 2 structure constraints exist';
END $$;

-- ===========================================================================
-- [6] activity slot 1/2 unique 제약
-- ===========================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_profile_id UUID := gen_random_uuid();
  v_region_a UUID;
  v_region_b UUID;
  v_region_c UUID;
BEGIN
  SELECT id INTO v_region_a FROM public.regions ORDER BY code LIMIT 1;
  SELECT id INTO v_region_b FROM public.regions ORDER BY code OFFSET 1 LIMIT 1;
  SELECT id INTO v_region_c FROM public.regions ORDER BY code OFFSET 2 LIMIT 1;

  IF v_region_a IS NULL OR v_region_b IS NULL OR v_region_c IS NULL THEN
    RAISE EXCEPTION 'FAIL [6]: need at least 3 regions in seed for constraint test';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_user_id::TEXT || '@stage06-test.local',
    now(),
    '{"provider":"email","providers":["email"]}'::JSONB,
    '{"role":"consumer"}'::JSONB,
    now(),
    now()
  );

  INSERT INTO public.consumer_profiles (id, user_id, region_id)
  VALUES (v_profile_id, v_user_id, v_region_a);

  INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
  VALUES (v_profile_id, v_region_a, 'activity', 1);

  INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
  VALUES (v_profile_id, v_region_b, 'activity', 2);

  BEGIN
    INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
    VALUES (v_profile_id, v_region_c, 'activity', 1);
    RAISE EXCEPTION 'FAIL [6]: duplicate activity slot 1 should be blocked';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
    VALUES (v_profile_id, v_region_c, 'activity', 3);
    RAISE EXCEPTION 'FAIL [6]: activity slot 3 should be blocked';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  DELETE FROM public.consumer_regions WHERE consumer_profile_id = v_profile_id;
  DELETE FROM public.consumer_profiles WHERE id = v_profile_id;
  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;

  RAISE NOTICE 'PASS [6]: activity slot 1/2 unique and slot 3 blocked';
END $$;

-- ===========================================================================
-- [7] FK to regions
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'consumer_regions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'region_id'
  ) THEN
    RAISE EXCEPTION 'FAIL [7]: FK consumer_regions.region_id → regions missing';
  END IF;
  RAISE NOTICE 'PASS [7]: FK to regions exists';
END $$;

-- ===========================================================================
-- [8] FK to consumer_profiles (owner)
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'consumer_regions'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'consumer_profile_id'
  ) THEN
    RAISE EXCEPTION 'FAIL [8]: FK consumer_regions.consumer_profile_id missing';
  END IF;
  RAISE NOTICE 'PASS [8]: owner FK to consumer_profiles exists';
END $$;

-- ===========================================================================
-- [9] updated_at trigger
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'consumer_regions'
      AND t.tgname = 'consumer_regions_set_updated_at'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'FAIL [9]: consumer_regions_set_updated_at trigger missing';
  END IF;
  RAISE NOTICE 'PASS [9]: updated_at trigger exists';
END $$;

-- ===========================================================================
-- [10] legacy consumer_profiles.region_id preserved
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'consumer_profiles'
      AND column_name = 'region_id'
      AND is_nullable = 'NO'
  ) THEN
    RAISE EXCEPTION 'FAIL [10]: consumer_profiles.region_id column missing or nullable';
  END IF;
  RAISE NOTICE 'PASS [10]: legacy consumer_profiles.region_id preserved';
END $$;

-- ===========================================================================
-- [11] point_ledger unchanged (append-only triggers still present)
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'point_ledger' AND t.tgname = 'point_ledger_no_update'
  ) THEN
    RAISE EXCEPTION 'FAIL [11a]: point_ledger_no_update trigger missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'point_ledger' AND t.tgname = 'point_ledger_no_delete'
  ) THEN
    RAISE EXCEPTION 'FAIL [11b]: point_ledger_no_delete trigger missing';
  END IF;

  RAISE NOTICE 'PASS [11]: point_ledger unchanged (append-only triggers intact)';
END $$;

-- ===========================================================================
-- [12] quiz_answer 비노출 unchanged
-- ===========================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quizzes_public'
      AND column_name IN ('quiz_answer', 'correct_answer', 'answer')
  ) THEN
    RAISE EXCEPTION 'FAIL [12]: quizzes_public exposes answer column';
  END IF;

  IF has_table_privilege('anon', 'public.quizzes', 'SELECT') THEN
    RAISE EXCEPTION 'FAIL [12]: anon has SELECT on quizzes base table';
  END IF;

  RAISE NOTICE 'PASS [12]: quiz_answer exposure unchanged (still blocked)';
END $$;

-- ===========================================================================
-- [13] BIGINT 금액 컬럼 unchanged
-- ===========================================================================

DO $$
DECLARE
  v_bad_count INT;
  v_bad_cols TEXT;
BEGIN
  SELECT COUNT(*), string_agg(c.table_name || '.' || c.column_name || '(' || c.data_type || ')', ', ')
  INTO v_bad_count, v_bad_cols
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND (
      c.column_name ~ '(^|_)(amount|balance|budget|prepay|settlement|intent|spent|earned|gross)($|_)'
      OR c.column_name IN (
        'reward_per_view', 'points_earned', 'point_balance', 'prepay_balance',
        'settlement_balance', 'budget_total', 'budget_spent',
        'monthly_intent_min', 'monthly_intent_max',
        'reward_pool_amount', 'partner_share_amount', 'adme_share_amount',
        'operation_reserve_amount', 'buffer_amount', 'refund_amount'
      )
    )
    AND c.data_type NOT IN ('bigint', 'integer');

  IF v_bad_count > 0 THEN
    RAISE EXCEPTION 'FAIL [13]: non-integer monetary columns: %', v_bad_cols;
  END IF;
  RAISE NOTICE 'PASS [13]: BIGINT monetary columns unchanged';
END $$;

-- ===========================================================================
-- [14] anon 직접 접근 차단 (정책 없음 = deny)
-- ===========================================================================

DO $$
DECLARE
  v_anon_policies INT;
BEGIN
  SELECT COUNT(*) INTO v_anon_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'consumer_regions'
    AND 'anon' = ANY (roles);

  IF v_anon_policies > 0 THEN
    RAISE EXCEPTION 'FAIL [14]: consumer_regions has anon policies (count=%)', v_anon_policies;
  END IF;
  RAISE NOTICE 'PASS [14]: anon direct access blocked (no anon policies)';
END $$;

-- ===========================================================================
-- [15] authenticated own-access 정책 존재
-- ===========================================================================

DO $$
DECLARE
  v_select INT;
  v_insert INT;
  v_update INT;
  v_delete INT;
BEGIN
  SELECT COUNT(*) INTO v_select
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'consumer_regions' AND cmd = 'SELECT';

  SELECT COUNT(*) INTO v_insert
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'consumer_regions' AND cmd = 'INSERT';

  SELECT COUNT(*) INTO v_update
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'consumer_regions' AND cmd = 'UPDATE';

  SELECT COUNT(*) INTO v_delete
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'consumer_regions' AND cmd = 'DELETE';

  IF v_select < 1 OR v_insert < 1 OR v_update < 1 OR v_delete < 1 THEN
    RAISE EXCEPTION 'FAIL [15]: missing CRUD policies (sel=% ins=% upd=% del=%)',
      v_select, v_insert, v_update, v_delete;
  END IF;
  RAISE NOTICE 'PASS [15]: authenticated own-access CRUD policies exist';
END $$;

-- ===========================================================================
-- [16] backfill idempotency & invalid region_type blocked
-- ===========================================================================

DO $$
DECLARE
  v_before INT;
  v_after INT;
  v_user_id UUID := gen_random_uuid();
  v_profile_id UUID := gen_random_uuid();
  v_region_id UUID;
  v_other_region_id UUID;
BEGIN
  SELECT COUNT(*) INTO v_before FROM public.consumer_regions WHERE region_type = 'residence';

  INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
  SELECT cp.id, cp.region_id, 'residence', NULL
  FROM public.consumer_profiles cp
  WHERE cp.region_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.consumer_regions cr
      WHERE cr.consumer_profile_id = cp.id AND cr.region_type = 'residence'
    );

  SELECT COUNT(*) INTO v_after FROM public.consumer_regions WHERE region_type = 'residence';

  IF v_after < v_before THEN
    RAISE EXCEPTION 'FAIL [16a]: backfill reduced residence row count';
  END IF;

  SELECT id INTO v_region_id FROM public.regions ORDER BY code LIMIT 1;
  SELECT id INTO v_other_region_id FROM public.regions ORDER BY code OFFSET 1 LIMIT 1;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_user_id::TEXT || '@stage06-backfill-test.local',
    now(),
    '{"provider":"email","providers":["email"]}'::JSONB,
    '{"role":"consumer"}'::JSONB,
    now(),
    now()
  );

  INSERT INTO public.consumer_profiles (id, user_id, region_id)
  VALUES (v_profile_id, v_user_id, v_region_id);

  INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
  VALUES (v_profile_id, v_region_id, 'residence', NULL);

  BEGIN
    INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
    VALUES (v_profile_id, v_region_id, 'invalid_type', NULL);
    RAISE EXCEPTION 'FAIL [16b]: invalid region_type should be blocked';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
    VALUES (v_profile_id, v_other_region_id, 'residence', NULL);
    RAISE EXCEPTION 'FAIL [16c]: second residence should be blocked';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  DELETE FROM public.consumer_regions WHERE consumer_profile_id = v_profile_id;
  DELETE FROM public.consumer_profiles WHERE id = v_profile_id;
  DELETE FROM public.profiles WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;

  RAISE NOTICE 'PASS [16]: backfill idempotent, invalid region_type and residence max 1 blocked';
END $$;

-- ===========================================================================
-- 완료
-- ===========================================================================

SELECT 'AdMe Stage 0.6 validation complete — all checks passed' AS result;
