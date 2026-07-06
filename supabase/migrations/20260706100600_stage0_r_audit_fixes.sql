-- AdMe Stage 0-R: Audit fixes
-- append-only point_ledger, INSERT 검증, quiz_answer 광고주 관리 경로, SECURITY DEFINER 보강

-- ---------------------------------------------------------------------------
-- point_ledger append-only (UPDATE/DELETE 차단)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.point_ledger_reject_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'point_ledger is append-only: % operations are not allowed', TG_OP;
END;
$$;

CREATE TRIGGER point_ledger_no_update
  BEFORE UPDATE ON public.point_ledger
  FOR EACH ROW EXECUTE FUNCTION public.point_ledger_reject_mutation();

CREATE TRIGGER point_ledger_no_delete
  BEFORE DELETE ON public.point_ledger
  FOR EACH ROW EXECUTE FUNCTION public.point_ledger_reject_mutation();

-- ---------------------------------------------------------------------------
-- point_ledger INSERT 유형별 제약
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

  IF NEW.entry_type = 'ad_reward' THEN
    IF NEW.account_type != 'consumer' OR NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'ad_reward requires consumer account with user_id';
    END IF;
    IF NEW.amount <= 0 THEN
      RAISE EXCEPTION 'ad_reward amount must be positive';
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

CREATE TRIGGER point_ledger_validate_insert
  BEFORE INSERT ON public.point_ledger
  FOR EACH ROW EXECUTE FUNCTION public.validate_point_ledger_insert();

-- ---------------------------------------------------------------------------
-- quizzes: anon 차단 유지, authenticated는 RLS로 역할 분리
-- (기존 REVOKE ALL FROM authenticated 는 admin/advertiser 정책 무력화 버그)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.quizzes FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.quizzes TO authenticated;

DROP POLICY IF EXISTS quizzes_admin_only ON public.quizzes;

CREATE POLICY quizzes_admin_all ON public.quizzes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY quizzes_advertiser_select ON public.quizzes
  FOR SELECT TO authenticated
  USING (
    public.is_advertiser()
    AND campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.advertiser_id = public.current_advertiser_id()
    )
  );

CREATE POLICY quizzes_advertiser_write ON public.quizzes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_advertiser()
    AND campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.advertiser_id = public.current_advertiser_id()
    )
  );

CREATE POLICY quizzes_advertiser_update ON public.quizzes
  FOR UPDATE TO authenticated
  USING (
    public.is_advertiser()
    AND campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.advertiser_id = public.current_advertiser_id()
    )
  )
  WITH CHECK (
    public.is_advertiser()
    AND campaign_id IN (
      SELECT c.id FROM public.campaigns c
      WHERE c.advertiser_id = public.current_advertiser_id()
    )
  );

-- ---------------------------------------------------------------------------
-- calculate_revenue_split search_path 보강
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
SET search_path = public
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
