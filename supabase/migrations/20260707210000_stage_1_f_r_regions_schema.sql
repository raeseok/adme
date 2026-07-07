-- AdMe Stage 1-F-R: selector source alignment columns (additive only)

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS is_selectable BOOLEAN DEFAULT true;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS legal_code TEXT;

ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS relation_source TEXT;

COMMENT ON COLUMN public.regions.is_selectable IS 'Consumer selector visibility; molit baseline rows false after Stage 1-F-R';
COMMENT ON COLUMN public.regions.legal_code IS 'Mapped 법정동 code from KIKmix when available';
COMMENT ON COLUMN public.regions.relation_source IS 'Admin/legal mapping provenance e.g. kikmix';

-- Pre-apply snapshot for rollback (region master only)
CREATE TABLE IF NOT EXISTS public._stage_1_f_r_regions_snapshot AS
SELECT
  id,
  code,
  name,
  parent_id,
  sort_order,
  is_active,
  is_selectable,
  source_kind,
  source_code,
  source_effective_date,
  region_level,
  path_key,
  legal_code,
  relation_source,
  created_at,
  updated_at
FROM public.regions
WHERE false;

TRUNCATE public._stage_1_f_r_regions_snapshot;

INSERT INTO public._stage_1_f_r_regions_snapshot
SELECT
  id,
  code,
  name,
  parent_id,
  sort_order,
  is_active,
  is_selectable,
  source_kind,
  source_code,
  source_effective_date,
  region_level,
  path_key,
  legal_code,
  relation_source,
  created_at,
  updated_at
FROM public.regions;
