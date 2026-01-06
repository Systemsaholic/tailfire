-- Fix schema drift: add columns missing from trips and user_profiles
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'itinerary_style') THEN
    CREATE TYPE itinerary_style AS ENUM ('side_by_side', 'stacked', 'compact');
  END IF;
END $$;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS allow_pdf_downloads BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS itinerary_style itinerary_style DEFAULT 'side_by_side';

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT;
