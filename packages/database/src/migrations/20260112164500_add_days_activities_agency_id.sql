-- Add agency_id column to itinerary_days and itinerary_activities tables
-- These columns denormalize agency association for RLS policies

-- Add agency_id to itinerary_days
ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS agency_id uuid;

-- Backfill itinerary_days.agency_id from itineraries table
UPDATE itinerary_days d
SET agency_id = i.agency_id
FROM itineraries i
WHERE d.itinerary_id = i.id
AND d.agency_id IS NULL;

-- Add index for RLS queries
CREATE INDEX IF NOT EXISTS idx_itinerary_days_agency_id ON itinerary_days(agency_id);

-- Add agency_id to itinerary_activities
ALTER TABLE itinerary_activities ADD COLUMN IF NOT EXISTS agency_id uuid;

-- Backfill itinerary_activities.agency_id from itinerary_days table
UPDATE itinerary_activities a
SET agency_id = d.agency_id
FROM itinerary_days d
WHERE a.itinerary_day_id = d.id
AND a.agency_id IS NULL;

-- Add index for RLS queries
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_agency_id ON itinerary_activities(agency_id);
