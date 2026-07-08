-- AdMe Stage 1-G — consumer_profiles child birth year & pet condition fields (nullable)

ALTER TABLE public.consumer_profiles
  ADD COLUMN IF NOT EXISTS oldest_child_birth_year INTEGER NULL,
  ADD COLUMN IF NOT EXISTS youngest_child_birth_year INTEGER NULL,
  ADD COLUMN IF NOT EXISTS pet_types TEXT[] NULL;

ALTER TABLE public.consumer_profiles
  DROP CONSTRAINT IF EXISTS consumer_profiles_oldest_child_birth_year_check;

ALTER TABLE public.consumer_profiles
  ADD CONSTRAINT consumer_profiles_oldest_child_birth_year_check
  CHECK (
    oldest_child_birth_year IS NULL
    OR oldest_child_birth_year BETWEEN 1970 AND EXTRACT(YEAR FROM NOW())::INT
  );

ALTER TABLE public.consumer_profiles
  DROP CONSTRAINT IF EXISTS consumer_profiles_youngest_child_birth_year_check;

ALTER TABLE public.consumer_profiles
  ADD CONSTRAINT consumer_profiles_youngest_child_birth_year_check
  CHECK (
    youngest_child_birth_year IS NULL
    OR youngest_child_birth_year BETWEEN 1970 AND EXTRACT(YEAR FROM NOW())::INT
  );

ALTER TABLE public.consumer_profiles
  DROP CONSTRAINT IF EXISTS consumer_profiles_child_birth_year_order_check;

ALTER TABLE public.consumer_profiles
  ADD CONSTRAINT consumer_profiles_child_birth_year_order_check
  CHECK (
    oldest_child_birth_year IS NULL
    OR youngest_child_birth_year IS NULL
    OR oldest_child_birth_year <= youngest_child_birth_year
  );

ALTER TABLE public.consumer_profiles
  DROP CONSTRAINT IF EXISTS consumer_profiles_pet_types_check;

ALTER TABLE public.consumer_profiles
  ADD CONSTRAINT consumer_profiles_pet_types_check
  CHECK (
    pet_types IS NULL
    OR pet_types <@ ARRAY['dog'::TEXT, 'cat'::TEXT, 'other'::TEXT]
  );
