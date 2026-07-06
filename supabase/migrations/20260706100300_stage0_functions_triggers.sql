-- AdMe Stage 0: Functions, Triggers (원장·잔액 동기화, auth 연동)

-- ---------------------------------------------------------------------------
-- auth.users 가입 시 profiles 자동 생성 (role은 metadata에서)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    'consumer'::public.user_role
  );

  INSERT INTO public.profiles (id, role, email, display_name)
  VALUES (
    NEW.id,
    v_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- point_ledger INSERT 시 잔액 캐시 동기화
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_balance_cache_from_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_type = 'consumer' AND NEW.user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET point_balance = COALESCE(
      (SELECT SUM(amount) FROM public.point_ledger
       WHERE account_type = 'consumer' AND user_id = NEW.user_id),
      0
    )
    WHERE id = NEW.user_id;
  ELSIF NEW.account_type = 'advertiser' AND NEW.account_id IS NOT NULL THEN
    UPDATE public.advertisers
    SET prepay_balance = COALESCE(
      (SELECT SUM(amount) FROM public.point_ledger
       WHERE account_type = 'advertiser' AND account_id = NEW.account_id),
      0
    )
    WHERE id = NEW.account_id;
  ELSIF NEW.account_type = 'partner' AND NEW.account_id IS NOT NULL THEN
    UPDATE public.partners
    SET settlement_balance = COALESCE(
      (SELECT SUM(amount) FROM public.point_ledger
       WHERE account_type = 'partner' AND account_id = NEW.account_id),
      0
    )
    WHERE id = NEW.account_id;
  ELSIF NEW.account_type IN ('reward_pool', 'adme_hq', 'ops_pool', 'buffer_pool') THEN
    INSERT INTO public.system_pool_balances (pool_type, balance, updated_at)
    VALUES (
      NEW.account_type,
      COALESCE(
        (SELECT SUM(amount) FROM public.point_ledger
         WHERE account_type = NEW.account_type),
        0
      ),
      now()
    )
    ON CONFLICT (pool_type) DO UPDATE
    SET balance = EXCLUDED.balance, updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER point_ledger_sync_balance_cache
  AFTER INSERT ON public.point_ledger
  FOR EACH ROW EXECUTE FUNCTION public.sync_balance_cache_from_ledger();

-- ---------------------------------------------------------------------------
-- 원장 잔액 대조 함수
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_consumer_balance(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  cached_balance BIGINT,
  ledger_balance BIGINT,
  is_consistent BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.point_balance AS cached_balance,
    COALESCE(
      (SELECT SUM(pl.amount) FROM public.point_ledger pl
       WHERE pl.account_type = 'consumer' AND pl.user_id = p.id),
      0
    ) AS ledger_balance,
    p.point_balance = COALESCE(
      (SELECT SUM(pl.amount) FROM public.point_ledger pl
       WHERE pl.account_type = 'consumer' AND pl.user_id = p.id),
      0
    ) AS is_consistent
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.verify_advertiser_balance(p_advertiser_id UUID)
RETURNS TABLE (
  advertiser_id UUID,
  cached_balance BIGINT,
  ledger_balance BIGINT,
  is_consistent BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id AS advertiser_id,
    a.prepay_balance AS cached_balance,
    COALESCE(
      (SELECT SUM(pl.amount) FROM public.point_ledger pl
       WHERE pl.account_type = 'advertiser' AND pl.account_id = a.id),
      0
    ) AS ledger_balance,
    a.prepay_balance = COALESCE(
      (SELECT SUM(pl.amount) FROM public.point_ledger pl
       WHERE pl.account_type = 'advertiser' AND pl.account_id = a.id),
      0
    ) AS is_consistent
  FROM public.advertisers a
  WHERE a.id = p_advertiser_id;
$$;

-- ---------------------------------------------------------------------------
-- 퀴즈 채점 (SECURITY DEFINER — 서버 전용, 정답 비노출)
-- Stage 1에서 ad_views/point_ledger 연동 확장 예정
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grade_quiz_answer(
  p_quiz_id UUID,
  p_submitted_answer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  SELECT q.quiz_answer INTO v_correct
  FROM public.quizzes q
  WHERE q.id = p_quiz_id AND q.is_active = true;

  IF v_correct IS NULL THEN
    RAISE EXCEPTION 'quiz not found';
  END IF;

  RETURN lower(trim(p_submitted_answer)) = lower(trim(v_correct));
END;
$$;

REVOKE ALL ON FUNCTION public.grade_quiz_answer(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grade_quiz_answer(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 광고주 선납 기록 + 원장 (admin 전용 RPC)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_advertiser_prepayment(
  p_advertiser_id UUID,
  p_amount BIGINT,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prepay_id UUID;
  v_ledger_id UUID;
  v_new_balance BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  SELECT COALESCE(SUM(amount), 0) + p_amount INTO v_new_balance
  FROM public.point_ledger
  WHERE account_type = 'advertiser' AND account_id = p_advertiser_id;

  INSERT INTO public.point_ledger (
    account_type, account_id, user_id, entry_type, amount,
    balance_after, reference_type, description, created_by
  )
  SELECT
    'advertiser', p_advertiser_id, a.user_id, 'advertiser_prepay', p_amount,
    v_new_balance, 'advertiser_prepayments', COALESCE(p_note, '관리자 선납 충전'), auth.uid()
  FROM public.advertisers a
  WHERE a.id = p_advertiser_id
  RETURNING id INTO v_ledger_id;

  INSERT INTO public.advertiser_prepayments (
    advertiser_id, amount, admin_user_id, note, ledger_entry_id
  )
  VALUES (p_advertiser_id, p_amount, auth.uid(), p_note, v_ledger_id)
  RETURNING id INTO v_prepay_id;

  RETURN v_prepay_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_advertiser_prepayment(UUID, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_advertiser_prepayment(UUID, BIGINT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 수익 배분 계산 (100원 단위 BIGINT)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_revenue_split(p_gross_amount BIGINT)
RETURNS TABLE (
  reward_pool BIGINT,
  partner_share BIGINT,
  adme_hq BIGINT,
  ops_pool BIGINT,
  buffer_pool BIGINT
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_units BIGINT;
BEGIN
  IF p_gross_amount <= 0 THEN
    RAISE EXCEPTION 'gross amount must be positive';
  END IF;

  v_units := p_gross_amount / 100;

  RETURN QUERY
  SELECT
    v_units * 35 AS reward_pool,
    v_units * 30 AS partner_share,
    v_units * 20 AS adme_hq,
    v_units * 10 AS ops_pool,
    (p_gross_amount - (v_units * 35 + v_units * 30 + v_units * 20 + v_units * 10)) AS buffer_pool;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_revenue_split(BIGINT) TO authenticated;
