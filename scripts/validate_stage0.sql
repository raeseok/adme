-- AdMe Stage 0: 검증 SQL (Stage 0-R 보강)
-- supabase db reset 후 psql 또는 supabase db query 로 실행
-- \set ON_ERROR_STOP on 은 psql 전용; Supabase CLI 실행 시 DO 블록만 사용

-- ===========================================================================
-- 1. 필수 테이블 존재 확인
-- ===========================================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'profiles', 'regions', 'interest_categories', 'consumer_profiles',
    'consumer_category_interests', 'advertisers', 'advertiser_prepayments',
    'partners', 'partner_settlements', 'campaigns', 'quizzes', 'ad_views',
    'point_ledger', 'cash_redemption_requests', 'system_pool_balances'
  ];
  v_table TEXT;
  v_missing TEXT[] := '{}';
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = v_table
    ) THEN
      v_missing := array_append(v_missing, v_table);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'FAIL: missing tables: %', v_missing;
  END IF;
  RAISE NOTICE 'PASS [1]: all required tables exist (15 core tables)';
END $$;

-- ===========================================================================
-- 2. 금액·포인트 컬럼 BIGINT/INTEGER 검증 (FLOAT/REAL/NUMERIC 소수 금지)
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
    RAISE EXCEPTION 'FAIL [2]: non-integer monetary columns: %', v_bad_cols;
  END IF;
  RAISE NOTICE 'PASS [2]: monetary columns use BIGINT/INTEGER only';
END $$;

-- ===========================================================================
-- 3. RLS 활성화 확인
-- ===========================================================================

DO $$
DECLARE
  v_unprotected TEXT;
BEGIN
  SELECT string_agg(c.relname, ', ') INTO v_unprotected
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN (
      'profiles', 'regions', 'interest_categories', 'consumer_profiles',
      'consumer_category_interests', 'advertisers', 'advertiser_prepayments',
      'partners', 'partner_settlements', 'campaigns', 'quizzes', 'ad_views',
      'point_ledger', 'cash_redemption_requests', 'system_pool_balances'
    )
    AND NOT c.relrowsecurity;

  IF v_unprotected IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL [3]: tables without RLS: %', v_unprotected;
  END IF;
  RAISE NOTICE 'PASS [3]: RLS enabled on all 15 core tables';
END $$;

-- ===========================================================================
-- 4. quiz_answer 비노출 — quizzes_public VIEW에 정답 컬럼 없음
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'quizzes_public'
  ) THEN
    RAISE EXCEPTION 'FAIL [4a]: quizzes_public view missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'quizzes_public'
      AND column_name IN ('quiz_answer', 'correct_answer', 'answer')
  ) THEN
    RAISE EXCEPTION 'FAIL [4b]: quizzes_public exposes answer column';
  END IF;
  RAISE NOTICE 'PASS [4]: quizzes_public is a view without quiz_answer';
END $$;

-- ===========================================================================
-- 5. anon 역할 quizzes 기본 테이블 SELECT 권한 없음
-- ===========================================================================

DO $$
BEGIN
  IF has_table_privilege('anon', 'public.quizzes', 'SELECT') THEN
    RAISE EXCEPTION 'FAIL [5]: anon has SELECT on quizzes base table';
  END IF;
  RAISE NOTICE 'PASS [5]: anon cannot SELECT quizzes base table';
END $$;

-- ===========================================================================
-- 6. grade_quiz_answer() 반환 타입 BOOLEAN (정답 원문 미반환)
-- ===========================================================================

DO $$
DECLARE
  v_rettype TEXT;
BEGIN
  SELECT pg_catalog.format_type(p.prorettype, NULL) INTO v_rettype
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'grade_quiz_answer';

  IF v_rettype != 'boolean' THEN
    RAISE EXCEPTION 'FAIL [6]: grade_quiz_answer return type is %, expected boolean', v_rettype;
  END IF;
  RAISE NOTICE 'PASS [6]: grade_quiz_answer() returns BOOLEAN only';
END $$;

-- ===========================================================================
-- 7. point_ledger append-only 트리거 존재 및 UPDATE/DELETE 차단
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'point_ledger' AND t.tgname = 'point_ledger_no_update'
  ) THEN
    RAISE EXCEPTION 'FAIL [7a]: point_ledger_no_update trigger missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'point_ledger' AND t.tgname = 'point_ledger_no_delete'
  ) THEN
    RAISE EXCEPTION 'FAIL [7b]: point_ledger_no_delete trigger missing';
  END IF;
END $$;

DO $$
DECLARE
  v_id UUID;
  v_err TEXT;
BEGIN
  INSERT INTO public.point_ledger (
    account_type, entry_type, amount, description
  ) VALUES (
    'system', 'admin_adjustment', 1, 'append-only test seed'
  ) RETURNING id INTO v_id;

  BEGIN
    UPDATE public.point_ledger SET amount = 2 WHERE id = v_id;
    RAISE EXCEPTION 'FAIL [7c]: UPDATE on point_ledger should have failed';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT ILIKE '%append-only%' THEN
      RAISE EXCEPTION 'FAIL [7c]: UPDATE error message wrong: %', v_err;
    END IF;
  END;

  BEGIN
    DELETE FROM public.point_ledger WHERE id = v_id;
    RAISE EXCEPTION 'FAIL [7d]: DELETE on point_ledger should have failed';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    IF v_err NOT ILIKE '%append-only%' THEN
      RAISE EXCEPTION 'FAIL [7d]: DELETE error message wrong: %', v_err;
    END IF;
  END;

  RAISE NOTICE 'PASS [7]: point_ledger append-only (UPDATE/DELETE blocked with clear message)';
END $$;

-- ===========================================================================
-- 8. point_ledger INSERT 정책 — authenticated 직접 INSERT 불가
-- ===========================================================================

DO $$
DECLARE
  v_insert_policies INT;
BEGIN
  SELECT COUNT(*) INTO v_insert_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'point_ledger'
    AND cmd = 'INSERT';

  IF v_insert_policies > 0 THEN
    RAISE EXCEPTION 'FAIL [8]: point_ledger has INSERT policy for authenticated (count=%)', v_insert_policies;
  END IF;
  RAISE NOTICE 'PASS [8]: no INSERT policy on point_ledger for clients (RPC/service_role only)';
END $$;

-- ===========================================================================
-- 9. admin_adjustment reason 필수 검증
-- ===========================================================================

DO $$
BEGIN
  BEGIN
    INSERT INTO public.point_ledger (account_type, entry_type, amount)
    VALUES ('system', 'admin_adjustment', 1);
    RAISE EXCEPTION 'FAIL [9]: admin_adjustment without reason should fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT ILIKE '%requires reason%' THEN
      RAISE EXCEPTION 'FAIL [9]: unexpected error: %', SQLERRM;
    END IF;
  END;
  RAISE NOTICE 'PASS [9]: admin_adjustment requires reason';
END $$;

-- ===========================================================================
-- 10. 광고주 선납 배분 — 100원 / 101원
-- ===========================================================================

DO $$
DECLARE
  v100 RECORD;
  v101 RECORD;
  v_sum100 BIGINT;
  v_sum101 BIGINT;
BEGIN
  SELECT * INTO v100 FROM public.calculate_revenue_split(100);
  v_sum100 := v100.reward_pool + v100.partner_share + v100.adme_hq + v100.ops_pool + v100.buffer_pool;

  IF v100.reward_pool != 35 OR v100.partner_share != 30 OR v100.adme_hq != 20
     OR v100.ops_pool != 10 OR v100.buffer_pool != 5 OR v_sum100 != 100 THEN
    RAISE EXCEPTION 'FAIL [10a]: 100 won split = %/%/%/%/% sum=%',
      v100.reward_pool, v100.partner_share, v100.adme_hq, v100.ops_pool, v100.buffer_pool, v_sum100;
  END IF;

  SELECT * INTO v101 FROM public.calculate_revenue_split(101);
  v_sum101 := v101.reward_pool + v101.partner_share + v101.adme_hq + v101.ops_pool + v101.buffer_pool;

  IF v101.reward_pool != 35 OR v101.partner_share != 30 OR v101.adme_hq != 20
     OR v101.ops_pool != 10 OR v101.buffer_pool != 6 OR v_sum101 != 101 THEN
    RAISE EXCEPTION 'FAIL [10b]: 101 won split = %/%/%/%/% sum=% (buffer should absorb remainder)',
      v101.reward_pool, v101.partner_share, v101.adme_hq, v101.ops_pool, v101.buffer_pool, v_sum101;
  END IF;

  RAISE NOTICE 'PASS [10]: revenue split 100→35/30/20/10/5, 101→35/30/20/10/6 (buffer absorbs +1)';
END $$;

-- ===========================================================================
-- 11. SECURITY DEFINER 함수 search_path 설정 확인
-- ===========================================================================

DO $$
DECLARE
  v_missing TEXT;
BEGIN
  SELECT string_agg(p.proname, ', ') INTO v_missing
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.proname IN (
      'grade_quiz_answer', 'record_advertiser_prepayment',
      'handle_new_user', 'sync_balance_cache_from_ledger',
      'is_admin', 'is_consumer', 'is_advertiser', 'is_partner',
      'current_advertiser_id', 'current_partner_id',
      'verify_consumer_balance', 'verify_advertiser_balance',
      'point_ledger_reject_mutation', 'validate_point_ledger_insert'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc pro
      JOIN pg_namespace ns ON ns.oid = pro.pronamespace
      WHERE pro.oid = p.oid
        AND pro.proconfig IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM unnest(pro.proconfig) cfg WHERE cfg LIKE 'search_path=%'
        )
    );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL [11]: SECURITY DEFINER functions missing search_path: %', v_missing;
  END IF;
  RAISE NOTICE 'PASS [11]: SECURITY DEFINER functions have search_path set';
END $$;

-- ===========================================================================
-- 12. 시드 데이터 idempotency (재실행 시 중복 없음)
-- ===========================================================================

DO $$
DECLARE
  v_dup_regions INT;
  v_dup_categories INT;
BEGIN
  SELECT COUNT(*) - COUNT(DISTINCT code) INTO v_dup_regions FROM public.regions;
  SELECT COUNT(*) - COUNT(DISTINCT code) INTO v_dup_categories FROM public.interest_categories;

  IF v_dup_regions > 0 OR v_dup_categories > 0 THEN
    RAISE EXCEPTION 'FAIL [12]: duplicate seed codes (regions=%, categories=%)', v_dup_regions, v_dup_categories;
  END IF;
  RAISE NOTICE 'PASS [12]: seed data has no duplicate region/category codes';
END $$;

-- ===========================================================================
-- 13. 핵심 인덱스 존재
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_point_ledger_account'
  ) THEN
    RAISE EXCEPTION 'FAIL [13a]: idx_point_ledger_account missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_ad_views_consumer_campaign_day'
  ) THEN
    RAISE EXCEPTION 'FAIL [13b]: idx_ad_views_consumer_campaign_day missing';
  END IF;
  RAISE NOTICE 'PASS [13]: core indexes exist';
END $$;

-- ===========================================================================
-- 14. 비즈니스 상수
-- ===========================================================================

DO $$
DECLARE
  v_min BIGINT;
  v_split RECORD;
BEGIN
  SELECT public.min_cash_redemption_points() INTO v_min;
  IF v_min != 10000 THEN
    RAISE EXCEPTION 'FAIL [14a]: min cash redemption = %', v_min;
  END IF;

  SELECT * INTO v_split FROM public.revenue_split_per_100_won();
  IF v_split.reward_pool != 35 OR v_split.buffer_pool != 5 THEN
    RAISE EXCEPTION 'FAIL [14b]: revenue_split_per_100_won mismatch';
  END IF;

  RAISE NOTICE 'PASS [14]: min redemption 10,000P, split constants OK';
END $$;

-- ===========================================================================
-- 15. point_packages (VIEW) 존재 및 컬럼 호환성
-- ===========================================================================

DO $$
DECLARE
  v_relkind CHAR;
  v_missing_cols TEXT;
  v_required TEXT[] := ARRAY[
    'id', 'advertiser_id', 'amount',
    'reward_pool_amount', 'partner_share_amount', 'adme_share_amount',
    'operation_reserve_amount', 'buffer_amount',
    'paid_at', 'refunded', 'refund_amount', 'memo', 'created_by', 'created_at'
  ];
  v_col TEXT;
  v_missing TEXT[] := '{}';
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'point_packages';

  IF v_relkind IS NULL THEN
    RAISE EXCEPTION 'FAIL [15a]: point_packages relation does not exist';
  END IF;

  IF v_relkind != 'v' THEN
    RAISE EXCEPTION 'FAIL [15b]: point_packages must be a VIEW, got relkind=%', v_relkind;
  END IF;

  FOREACH v_col IN ARRAY v_required LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'point_packages'
        AND column_name = v_col
    ) THEN
      v_missing := array_append(v_missing, v_col);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'FAIL [15c]: point_packages missing columns: %', v_missing;
  END IF;

  RAISE NOTICE 'PASS [15]: point_packages VIEW exists with required columns';
END $$;

-- point_packages 배분 컬럼 BIGINT 및 합계 검증 (VIEW 정의 기반)
DO $$
DECLARE
  v_bad_types INT;
BEGIN
  SELECT COUNT(*) INTO v_bad_types
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'point_packages'
    AND column_name ~ '(amount|reward|share|reserve|buffer|refund)'
    AND data_type NOT IN ('bigint', 'integer', 'boolean');

  IF v_bad_types > 0 THEN
    RAISE EXCEPTION 'FAIL [15d]: point_packages has non-bigint amount columns';
  END IF;
  RAISE NOTICE 'PASS [15d]: point_packages amount columns are integer types';
END $$;

-- point_packages 직접 write 불가 (VIEW, INSTEAD OF 트리거 없음)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table = 'point_packages'
  ) THEN
    RAISE EXCEPTION 'FAIL [15e]: point_packages must not have INSTEAD OF triggers';
  END IF;
  RAISE NOTICE 'PASS [15e]: point_packages has no write triggers (read-only view)';
END $$;

-- ===========================================================================
-- 16. point_packages VIEW 배분 smoke test (local DB only)
-- ===========================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_adv_id UUID;
  v_prepay_id UUID;
  v_pkg RECORD;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_user_id::TEXT || '@stage0f-test.local',
    now(),
    '{"provider":"email","providers":["email"]}'::JSONB,
    '{"role":"advertiser"}'::JSONB,
    now(),
    now()
  );

  INSERT INTO public.advertisers (user_id, company_name)
  VALUES (v_user_id, 'Stage0F Test Co')
  RETURNING id INTO v_adv_id;

  INSERT INTO public.advertiser_prepayments (advertiser_id, amount, admin_user_id, note)
  VALUES (v_adv_id, 100, v_user_id, 'view smoke 100')
  RETURNING id INTO v_prepay_id;

  SELECT * INTO v_pkg FROM public.point_packages WHERE id = v_prepay_id;

  IF v_pkg.amount != 100 OR v_pkg.reward_pool_amount != 35
     OR v_pkg.partner_share_amount != 30 OR v_pkg.adme_share_amount != 20
     OR v_pkg.operation_reserve_amount != 10 OR v_pkg.buffer_amount != 5 THEN
    RAISE EXCEPTION 'FAIL [16a]: point_packages 100 won via view: %/%/%/%/%',
      v_pkg.reward_pool_amount, v_pkg.partner_share_amount, v_pkg.adme_share_amount,
      v_pkg.operation_reserve_amount, v_pkg.buffer_amount;
  END IF;

  INSERT INTO public.advertiser_prepayments (advertiser_id, amount, admin_user_id, note)
  VALUES (v_adv_id, 101, v_user_id, 'view smoke 101')
  RETURNING id INTO v_prepay_id;

  SELECT * INTO v_pkg FROM public.point_packages WHERE id = v_prepay_id;

  IF v_pkg.buffer_amount != 6 OR (
    v_pkg.reward_pool_amount + v_pkg.partner_share_amount + v_pkg.adme_share_amount
    + v_pkg.operation_reserve_amount + v_pkg.buffer_amount
  ) != 101 THEN
    RAISE EXCEPTION 'FAIL [16b]: point_packages 101 won via view, buffer=%', v_pkg.buffer_amount;
  END IF;

  RAISE NOTICE 'PASS [16]: point_packages VIEW split smoke test (100/101) OK';
END $$;

-- ===========================================================================
-- 완료
-- ===========================================================================

SELECT 'AdMe Stage 0-LV validation complete — all checks passed' AS result;
