-- Add agency_id column to itineraries table
-- This column denormalizes agency association for RLS policies

ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS agency_id uuid;

-- Backfill agency_id from trips table
UPDATE itineraries i
SET agency_id = t.agency_id
FROM trips t
WHERE i.trip_id = t.id
AND i.agency_id IS NULL;

-- Add index for RLS queries
CREATE INDEX IF NOT EXISTS idx_itineraries_agency_id ON itineraries(agency_id);
