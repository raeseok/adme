-- Stage 1-F-R rollback (review only — do not auto-run)
-- Restores region rows from _stage_1_f_r_regions_snapshot

UPDATE public.regions r
SET
  name = s.name,
  parent_id = s.parent_id,
  sort_order = s.sort_order,
  is_active = s.is_active,
  is_selectable = s.is_selectable,
  source_kind = s.source_kind,
  source_code = s.source_code,
  source_effective_date = s.source_effective_date,
  region_level = s.region_level,
  path_key = s.path_key,
  legal_code = s.legal_code,
  relation_source = s.relation_source
FROM public._stage_1_f_r_regions_snapshot s
WHERE r.id = s.id;

DELETE FROM public.regions r
WHERE r.source_kind = 'mois-kikcd-h'
  AND r.code LIKE 'KR-H-%'
  AND NOT EXISTS (
    SELECT 1 FROM public._stage_1_f_r_regions_snapshot s WHERE s.id = r.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.consumer_regions cr WHERE cr.region_id = r.id
  );
