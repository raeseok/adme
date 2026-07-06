-- AdMe Stage 0: Auth Helper Functions & RLS
-- 역할 기반 접근 제어 — admin / consumer / advertiser / partner

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER — JWT에서 현재 사용자 역할 조회)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_consumer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'consumer' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_advertiser()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'advertiser' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'partner' AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_advertiser_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.advertisers WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_partner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.partners WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_consumer_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.consumer_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- quiz_answer 방어: 공개 뷰 (정답 컬럼 제외)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.quizzes_public
WITH (security_invoker = true)
AS
SELECT
  id,
  campaign_id,
  question_text,
  options,
  sort_order,
  is_active,
  created_at,
  updated_at
FROM public.quizzes;

COMMENT ON VIEW public.quizzes_public IS '클라이언트/API 조회용 — quiz_answer 미포함';

-- quizzes 기본 테이블: authenticated/anon 직접 SELECT 금지
REVOKE ALL ON TABLE public.quizzes FROM anon, authenticated;
GRANT SELECT ON public.quizzes_public TO authenticated;
GRANT SELECT ON public.quizzes_public TO anon;

-- ---------------------------------------------------------------------------
-- RLS 활성화
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_category_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertiser_prepayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_redemption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_pool_balances ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_insert_admin ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR id = auth.uid());

-- ---------------------------------------------------------------------------
-- regions — 활성 지역은 모두 조회, 쓰기는 admin
-- ---------------------------------------------------------------------------

CREATE POLICY regions_select_active ON public.regions
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY regions_admin_all ON public.regions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- interest_categories
-- ---------------------------------------------------------------------------

CREATE POLICY interest_categories_select_active ON public.interest_categories
  FOR SELECT TO authenticated
  USING (is_active = true OR public.is_admin());

CREATE POLICY interest_categories_admin_all ON public.interest_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- consumer_profiles — 본인만 CRUD
-- ---------------------------------------------------------------------------

CREATE POLICY consumer_profiles_select_own ON public.consumer_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY consumer_profiles_insert_own ON public.consumer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_consumer());

CREATE POLICY consumer_profiles_update_own ON public.consumer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- consumer_category_interests
-- ---------------------------------------------------------------------------

CREATE POLICY consumer_category_interests_select_own ON public.consumer_category_interests
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR consumer_profile_id = public.current_consumer_profile_id()
  );

CREATE POLICY consumer_category_interests_insert_own ON public.consumer_category_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    consumer_profile_id = public.current_consumer_profile_id()
    AND public.is_consumer()
  );

CREATE POLICY consumer_category_interests_delete_own ON public.consumer_category_interests
  FOR DELETE TO authenticated
  USING (
    consumer_profile_id = public.current_consumer_profile_id()
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- advertisers
-- ---------------------------------------------------------------------------

CREATE POLICY advertisers_select_own ON public.advertisers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR (
      public.is_partner()
      AND id IN (
        SELECT c.advertiser_id
        FROM public.campaigns c
        JOIN public.partners p ON p.region_id = c.region_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY advertisers_insert_own ON public.advertisers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_advertiser());

CREATE POLICY advertisers_update_own ON public.advertisers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- advertiser_prepayments — 광고주 조회(본인), admin 쓰기
-- ---------------------------------------------------------------------------

CREATE POLICY advertiser_prepayments_select ON public.advertiser_prepayments
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR advertiser_id = public.current_advertiser_id()
  );

CREATE POLICY advertiser_prepayments_admin_insert ON public.advertiser_prepayments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- partners
-- ---------------------------------------------------------------------------

CREATE POLICY partners_select ON public.partners
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY partners_insert_own ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_partner());

CREATE POLICY partners_update_own ON public.partners
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- partner_settlements
-- ---------------------------------------------------------------------------

CREATE POLICY partner_settlements_select ON public.partner_settlements
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR partner_id = public.current_partner_id()
  );

CREATE POLICY partner_settlements_admin_write ON public.partner_settlements
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------

CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR advertiser_id = public.current_advertiser_id()
    OR (
      public.is_consumer()
      AND status = 'active'
    )
    OR (
      public.is_partner()
      AND region_id IN (
        SELECT region_id FROM public.partners WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY campaigns_advertiser_insert ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (
    advertiser_id = public.current_advertiser_id()
    AND public.is_advertiser()
  );

CREATE POLICY campaigns_advertiser_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (advertiser_id = public.current_advertiser_id() OR public.is_admin())
  WITH CHECK (advertiser_id = public.current_advertiser_id() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- quizzes — 기본 테이블: admin/service_role만 (REVOKE로 이중 방어)
-- ---------------------------------------------------------------------------

CREATE POLICY quizzes_admin_only ON public.quizzes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- ad_views
-- ---------------------------------------------------------------------------

CREATE POLICY ad_views_select_own ON public.ad_views
  FOR SELECT TO authenticated
  USING (
    consumer_user_id = auth.uid()
    OR public.is_admin()
    OR campaign_id IN (
      SELECT id FROM public.campaigns
      WHERE advertiser_id = public.current_advertiser_id()
    )
    OR (
      public.is_partner()
      AND campaign_id IN (
        SELECT c.id FROM public.campaigns c
        JOIN public.partners p ON p.region_id = c.region_id
        WHERE p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY ad_views_insert_consumer ON public.ad_views
  FOR INSERT TO authenticated
  WITH CHECK (consumer_user_id = auth.uid() AND public.is_consumer());

-- ---------------------------------------------------------------------------
-- point_ledger — 본인 거래만 조회, INSERT/UPDATE는 서버(service_role) 전용
-- ---------------------------------------------------------------------------

CREATE POLICY point_ledger_select_own ON public.point_ledger
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR (
      account_type = 'advertiser'
      AND account_id = public.current_advertiser_id()
    )
    OR (
      account_type = 'partner'
      AND account_id = public.current_partner_id()
    )
  );

-- INSERT/UPDATE/DELETE: authenticated 직접 금지 (정책 미생성 = deny)

-- ---------------------------------------------------------------------------
-- cash_redemption_requests
-- ---------------------------------------------------------------------------

CREATE POLICY cash_redemption_select_own ON public.cash_redemption_requests
  FOR SELECT TO authenticated
  USING (consumer_user_id = auth.uid() OR public.is_admin());

CREATE POLICY cash_redemption_insert_own ON public.cash_redemption_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    consumer_user_id = auth.uid()
    AND public.is_consumer()
    AND amount >= public.min_cash_redemption_points()
  );

CREATE POLICY cash_redemption_admin_update ON public.cash_redemption_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- system_pool_balances — admin만
-- ---------------------------------------------------------------------------

CREATE POLICY system_pool_balances_admin ON public.system_pool_balances
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
