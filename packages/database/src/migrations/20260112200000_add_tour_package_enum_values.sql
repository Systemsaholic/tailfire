-- Migration: Add 'tour' and 'package' to activity_type enum
-- These values were missing from the production database
-- Note: Using DO blocks because ALTER TYPE ADD VALUE cannot use IF NOT EXISTS

-- Add 'tour' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'activity_type'::regtype
    AND enumlabel = 'tour'
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'tour';
  END IF;
END$$;

-- Add 'package' if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'activity_type'::regtype
    AND enumlabel = 'package'
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'package';
  END IF;
END$$;
