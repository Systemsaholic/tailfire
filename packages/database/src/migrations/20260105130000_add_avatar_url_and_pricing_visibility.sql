DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'pricing_visibility'
  ) THEN
    CREATE TYPE pricing_visibility AS ENUM ('show_all', 'hide_all', 'travelers_only');
  END IF;
END $$;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS pricing_visibility pricing_visibility DEFAULT 'show_all';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;
