-- Migration: Support floating packages (activities without a specific day)
-- Packages can span multiple days and group activities together, so they don't belong to a single day

-- 1. Add trip_id column for packages to know which trip they belong to
-- This is needed because packages don't have an itinerary_day_id
ALTER TABLE itinerary_activities
ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id) ON DELETE CASCADE;

-- 2. Make itinerary_day_id nullable to support floating packages
ALTER TABLE itinerary_activities
ALTER COLUMN itinerary_day_id DROP NOT NULL;

-- 3. Add a check constraint to ensure either itinerary_day_id or trip_id is set
-- (packages must have trip_id, regular activities must have itinerary_day_id)
ALTER TABLE itinerary_activities
DROP CONSTRAINT IF EXISTS chk_activity_has_parent;

ALTER TABLE itinerary_activities
ADD CONSTRAINT chk_activity_has_parent
CHECK (
  (itinerary_day_id IS NOT NULL) OR
  -- Cast to text to avoid "unsafe use of new enum value" error
  -- when this migration runs in the same transaction as the enum value addition
  (trip_id IS NOT NULL AND activity_type::text = 'package')
);

-- 4. Backfill trip_id for existing activities (derive from itinerary_day -> itineraries -> trip)
UPDATE itinerary_activities ia
SET trip_id = i.trip_id
FROM itinerary_days id
JOIN itineraries i ON id.itinerary_id = i.id
WHERE ia.itinerary_day_id = id.id
AND ia.trip_id IS NULL;

-- 5. Create index on trip_id for faster package queries
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_trip_id
ON itinerary_activities(trip_id)
WHERE trip_id IS NOT NULL;
