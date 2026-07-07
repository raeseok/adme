-- Stage 2-C-R: ad_views SELECT restricted to consumer own rows + admin only
-- Removes advertiser/partner raw row access (consumer_user_id must not leak)

DROP POLICY IF EXISTS ad_views_select_own ON public.ad_views;

CREATE POLICY ad_views_select_own_consumer ON public.ad_views
  FOR SELECT TO authenticated
  USING (
    consumer_user_id = auth.uid()
    OR public.is_admin()
  );

COMMENT ON POLICY ad_views_select_own_consumer ON public.ad_views IS
  'Stage 2-C-R: consumer own rows + admin only — no advertiser/partner raw SELECT';
