-- AdMe Stage 1-F: regions metadata columns for official source tracking
-- Additive only — no destructive changes

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS source_kind TEXT;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS source_code TEXT;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS source_effective_date DATE;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS region_level TEXT;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS path_key TEXT;

ALTER TABLE public.regions
  DROP CONSTRAINT IF EXISTS regions_region_level_check;

ALTER TABLE public.regions
  ADD CONSTRAINT regions_region_level_check
  CHECK (region_level IS NULL OR region_level IN ('sido', 'sigungu', 'dong'));

CREATE UNIQUE INDEX IF NOT EXISTS regions_source_kind_code_idx
  ON public.regions (source_kind, source_code)
  WHERE source_code IS NOT NULL;

COMMENT ON COLUMN public.regions.source_kind IS 'Official source provider e.g. molit-legal-dong';
COMMENT ON COLUMN public.regions.source_code IS 'Official 10-digit legal dong code';
COMMENT ON COLUMN public.regions.region_level IS 'sido | sigungu | dong — maps to parent_id tree depth';
COMMENT ON COLUMN public.regions.path_key IS 'Normalized path key for duplicate detection';

-- Pre-apply snapshot for rollback (region master only, no PII)
CREATE TABLE IF NOT EXISTS public._stage_1_f_regions_snapshot AS
SELECT
  id,
  code,
  name,
  parent_id,
  sort_order,
  is_active,
  source_kind,
  source_code,
  source_effective_date,
  region_level,
  path_key,
  created_at,
  updated_at
FROM public.regions
WHERE false;

TRUNCATE public._stage_1_f_regions_snapshot;

INSERT INTO public._stage_1_f_regions_snapshot
SELECT
  id,
  code,
  name,
  parent_id,
  sort_order,
  is_active,
  source_kind,
  source_code,
  source_effective_date,
  region_level,
  path_key,
  created_at,
  updated_at
FROM public.regions;
