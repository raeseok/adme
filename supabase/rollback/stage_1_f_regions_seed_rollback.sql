-- AdMe Stage 1-F rollback (review only — do not auto-execute in CI)
-- Restores region master rows from snapshot and removes unreferenced Stage 1-F inserts.

-- 1) Restore metadata + name for rows that existed before Stage 1-F
UPDATE public.regions r
SET
  name = s.name,
  parent_id = s.parent_id,
  sort_order = s.sort_order,
  is_active = s.is_active,
  source_kind = s.source_kind,
  source_code = s.source_code,
  source_effective_date = s.source_effective_date,
  region_level = s.region_level,
  path_key = s.path_key,
  updated_at = now()
FROM public._stage_1_f_regions_snapshot s
WHERE r.id = s.id;

-- 2) Delete Stage 1-F inserts that are not referenced by consumer_regions / partners / campaigns
DELETE FROM public.regions r
WHERE NOT EXISTS (SELECT 1 FROM public._stage_1_f_regions_snapshot s WHERE s.id = r.id)
  AND NOT EXISTS (SELECT 1 FROM public.consumer_regions cr WHERE cr.region_id = r.id)
  AND NOT EXISTS (SELECT 1 FROM public.consumer_profiles cp WHERE cp.region_id = r.id)
  AND NOT EXISTS (SELECT 1 FROM public.partners p WHERE p.region_id = r.id)
  AND NOT EXISTS (SELECT 1 FROM public.campaigns c WHERE c.region_id = r.id)
  AND r.source_kind = 'molit-legal-dong';

-- 3) Mark remaining unreferenced new rows inactive instead of deleting (if delete blocked)
UPDATE public.regions r
SET is_active = false, updated_at = now()
WHERE NOT EXISTS (SELECT 1 FROM public._stage_1_f_regions_snapshot s WHERE s.id = r.id)
  AND r.source_kind = 'molit-legal-dong'
  AND is_active = true
  AND (
    EXISTS (SELECT 1 FROM public.consumer_regions cr WHERE cr.region_id = r.id)
    OR EXISTS (SELECT 1 FROM public.consumer_profiles cp WHERE cp.region_id = r.id)
    OR EXISTS (SELECT 1 FROM public.partners p WHERE p.region_id = r.id)
    OR EXISTS (SELECT 1 FROM public.campaigns c WHERE c.region_id = r.id)
  );
