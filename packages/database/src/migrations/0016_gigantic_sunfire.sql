-- Add component_type column (nullable first to allow backfill)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'itinerary_activities' AND column_name = 'component_type') THEN
    ALTER TABLE "itinerary_activities" ADD COLUMN "component_type" "activity_type";
  END IF;
END $$;

-- Backfill component_type from activity_type for existing rows
UPDATE "itinerary_activities" SET "component_type" = "activity_type" WHERE "component_type" IS NULL;

-- Now make it NOT NULL (only if column exists and is nullable)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itinerary_activities'
    AND column_name = 'component_type'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "itinerary_activities" ALTER COLUMN "component_type" SET NOT NULL;
  END IF;
END $$;