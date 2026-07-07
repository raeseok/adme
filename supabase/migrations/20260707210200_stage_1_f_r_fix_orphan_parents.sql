-- Fix MOIS admin rows inserted with null parent_id in same multi-row INSERT batch

UPDATE public.regions AS child
SET parent_id = parent.id
FROM public.regions AS parent
WHERE child.source_kind = 'mois-kikcd-h'
  AND child.region_level = 'sigungu'
  AND child.parent_id IS NULL
  AND parent.source_kind = 'mois-kikcd-h'
  AND parent.region_level = 'sido'
  AND parent.source_code = (substring(child.source_code, 1, 2) || '00000000');

UPDATE public.regions AS child
SET parent_id = parent.id
FROM public.regions AS parent
WHERE child.source_kind = 'mois-kikcd-h'
  AND child.region_level = 'dong'
  AND child.parent_id IS NULL
  AND parent.source_kind = 'mois-kikcd-h'
  AND parent.region_level = 'sigungu'
  AND parent.source_code = (substring(child.source_code, 1, 5) || '00000');
