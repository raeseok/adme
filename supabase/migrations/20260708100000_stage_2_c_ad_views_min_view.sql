-- Stage 2-C: server-authoritative min-view tracking on ad_views
-- Non-destructive: adds nullable/timestamp columns + consumer UPDATE policy

ALTER TABLE public.ad_views
  ADD COLUMN IF NOT EXISTS view_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempt_no SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE public.ad_views
  DROP CONSTRAINT IF EXISTS ad_views_attempt_no_check;

ALTER TABLE public.ad_views
  ADD CONSTRAINT ad_views_attempt_no_check
  CHECK (attempt_no >= 0 AND attempt_no <= 2);

COMMENT ON COLUMN public.ad_views.view_started_at IS
  'Server-authoritative view start for min-view verification (Stage 2-C)';
COMMENT ON COLUMN public.ad_views.attempt_no IS
  'Quiz attempt count: 0=view only, 1-2=quiz attempts (Stage 2-C)';

UPDATE public.ad_views
SET view_started_at = COALESCE(viewed_at, created_at)
WHERE view_started_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ad_views_consumer_campaign_started
  ON public.ad_views (consumer_user_id, campaign_id, view_started_at DESC NULLS LAST);

-- Authenticated consumers may update their own ad_views rows (attempt tracking only)
DROP POLICY IF EXISTS ad_views_update_own_consumer ON public.ad_views;

CREATE POLICY ad_views_update_own_consumer ON public.ad_views
  FOR UPDATE TO authenticated
  USING (consumer_user_id = auth.uid() AND public.is_consumer())
  WITH CHECK (consumer_user_id = auth.uid() AND public.is_consumer());
