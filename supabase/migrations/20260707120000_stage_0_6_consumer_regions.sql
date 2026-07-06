-- AdMe Stage 0.6: consumer_regions — 주거지역 1개 + 주활동지역 최대 2개
-- consumer_profiles.region_id 는 legacy compatibility 필드로 유지 (삭제하지 않음)

-- ---------------------------------------------------------------------------
-- consumer_regions
-- ---------------------------------------------------------------------------

CREATE TABLE public.consumer_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_profile_id UUID NOT NULL REFERENCES public.consumer_profiles(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  region_type TEXT NOT NULL,
  activity_slot SMALLINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consumer_regions_region_type_check
    CHECK (region_type IN ('residence', 'activity')),
  CONSTRAINT consumer_regions_slot_shape_check
    CHECK (
      (region_type = 'residence' AND activity_slot IS NULL)
      OR (region_type = 'activity' AND activity_slot IN (1, 2))
    ),
  CONSTRAINT consumer_regions_unique_type_region
    UNIQUE (consumer_profile_id, region_type, region_id)
);

CREATE TRIGGER consumer_regions_set_updated_at
  BEFORE UPDATE ON public.consumer_regions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.consumer_regions IS
  '소비자 지역 컨텍스트 — residence 1개, activity 최대 2개 (slot 1/2). Stage 1-B SSOT.';
COMMENT ON COLUMN public.consumer_regions.region_type IS 'residence | activity';
COMMENT ON COLUMN public.consumer_regions.activity_slot IS 'activity 전용: 1 또는 2. residence 는 NULL';

COMMENT ON COLUMN public.consumer_profiles.region_id IS
  'LEGACY: 단일 지역 호환 필드. Stage 0.6+ 신규 로직은 consumer_regions 우선. 삭제 예정은 Stage 2 이후 별도 판단.';

-- ---------------------------------------------------------------------------
-- Indexes & uniqueness (DB-level constraints)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_consumer_regions_consumer_profile_id
  ON public.consumer_regions (consumer_profile_id);

CREATE INDEX idx_consumer_regions_region_id
  ON public.consumer_regions (region_id);

CREATE INDEX idx_consumer_regions_profile_type
  ON public.consumer_regions (consumer_profile_id, region_type);

-- 소비자별 주거지역 최대 1개
CREATE UNIQUE INDEX consumer_regions_one_residence_per_profile
  ON public.consumer_regions (consumer_profile_id)
  WHERE region_type = 'residence';

-- 소비자별 activity slot 1, 2 각각 최대 1개 (최대 2개 activity)
CREATE UNIQUE INDEX consumer_regions_unique_activity_slot
  ON public.consumer_regions (consumer_profile_id, activity_slot)
  WHERE region_type = 'activity';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.consumer_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY consumer_regions_select_own ON public.consumer_regions
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR consumer_profile_id = public.current_consumer_profile_id()
  );

CREATE POLICY consumer_regions_insert_own ON public.consumer_regions
  FOR INSERT TO authenticated
  WITH CHECK (
    consumer_profile_id = public.current_consumer_profile_id()
    AND public.is_consumer()
  );

CREATE POLICY consumer_regions_update_own ON public.consumer_regions
  FOR UPDATE TO authenticated
  USING (
    consumer_profile_id = public.current_consumer_profile_id()
    OR public.is_admin()
  )
  WITH CHECK (
    consumer_profile_id = public.current_consumer_profile_id()
    OR public.is_admin()
  );

CREATE POLICY consumer_regions_delete_own ON public.consumer_regions
  FOR DELETE TO authenticated
  USING (
    consumer_profile_id = public.current_consumer_profile_id()
    OR public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Backfill: legacy consumer_profiles.region_id → residence (idempotent)
-- ---------------------------------------------------------------------------

INSERT INTO public.consumer_regions (consumer_profile_id, region_id, region_type, activity_slot)
SELECT cp.id, cp.region_id, 'residence', NULL
FROM public.consumer_profiles cp
WHERE cp.region_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.consumer_regions cr
    WHERE cr.consumer_profile_id = cp.id
      AND cr.region_type = 'residence'
  );
