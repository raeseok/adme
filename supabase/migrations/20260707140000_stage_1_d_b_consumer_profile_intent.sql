-- AdMe Stage 1-D-B: 소비 의향 프로필 UX (출생년도·성별·기초자치단체·관심정보)
-- 기존 spend_range(monthly_intent_*) 값은 legacy로 보존한다.

-- ---------------------------------------------------------------------------
-- consumer_profiles: interest_scope + gender 허용값 확장
-- ---------------------------------------------------------------------------

ALTER TABLE public.consumer_profiles
  ADD COLUMN IF NOT EXISTS interest_scope TEXT NOT NULL DEFAULT 'selected';

ALTER TABLE public.consumer_profiles
  DROP CONSTRAINT IF EXISTS consumer_profiles_interest_scope_check;

ALTER TABLE public.consumer_profiles
  ADD CONSTRAINT consumer_profiles_interest_scope_check
  CHECK (interest_scope IN ('selected', 'all'));

ALTER TABLE public.consumer_profiles
  DROP CONSTRAINT IF EXISTS consumer_profiles_gender_check;

ALTER TABLE public.consumer_profiles
  ADD CONSTRAINT consumer_profiles_gender_check
  CHECK (
    gender IS NULL
    OR gender IN ('male', 'female', 'undisclosed', 'other', 'prefer_not_to_say')
  );

COMMENT ON COLUMN public.consumer_profiles.interest_scope IS
  'selected=개별 카테고리, all=모든 관심정보';

-- ---------------------------------------------------------------------------
-- 기초자치단체 seed (Stage 1-D-B 검증용 대표 지역, partial coverage)
-- ---------------------------------------------------------------------------

INSERT INTO public.regions (code, name, parent_id, sort_order)
SELECT
  v.code,
  v.name,
  (SELECT id FROM public.regions WHERE code = v.parent_code),
  v.sort_order
FROM (VALUES
  ('KR-41-GOYANG', '고양시', 'KR-41', 1),
  ('KR-44-TAEAN', '태안군', 'KR-44', 1),
  ('KR-47-YEONGCHEON', '영천시', 'KR-47', 1),
  ('KR-45-JEONGEUP', '정읍시', 'KR-45', 1)
) AS v(code, name, parent_code, sort_order)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.regions (code, name, parent_id, sort_order)
SELECT
  v.code,
  v.name,
  (SELECT id FROM public.regions WHERE code = 'KR-41-GOYANG'),
  v.sort_order
FROM (VALUES
  ('KR-41-GOYANG-ILSANDONG', '일산동구', 1),
  ('KR-41-GOYANG-DEYANG', '덕양구', 2)
) AS v(code, name, sort_order)
ON CONFLICT (code) DO NOTHING;
