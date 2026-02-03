-- Migration: Add custom_tour_details table
-- Purpose: Store tour-specific data for custom_tour activities (similar to custom_cruise_details)
-- Part of Tour Library Phase 3 implementation

-- Add new activity types for tours
DO $$
BEGIN
  -- Add 'custom_tour' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'custom_tour'
    AND enumtypid = 'activity_type'::regtype
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'custom_tour';
  END IF;

  -- Add 'tour_day' if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'tour_day'
    AND enumtypid = 'activity_type'::regtype
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'tour_day';
  END IF;
END $$;

-- Create custom_tour_details table
CREATE TABLE IF NOT EXISTS custom_tour_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL UNIQUE REFERENCES itinerary_activities(id) ON DELETE CASCADE,

  -- Catalog linkage
  tour_id UUID,                          -- catalog.tours.id
  operator_code TEXT,                    -- globus | cosmos | monograms
  provider TEXT DEFAULT 'globus',        -- external provider
  provider_identifier TEXT,              -- tour code (e.g. "CQ")

  -- Departure selection
  departure_id UUID,                     -- catalog.tour_departures.id
  departure_code TEXT,
  departure_start_date DATE,             -- land_start_date
  departure_end_date DATE,               -- land_end_date
  currency TEXT DEFAULT 'CAD',
  base_price_cents INTEGER,

  -- Snapshot/metadata (denormalized for display without joins)
  tour_name TEXT,
  days INTEGER,
  nights INTEGER,
  start_city TEXT,
  end_city TEXT,

  -- JSON data for extended info
  itinerary_json JSONB DEFAULT '[]'::jsonb,      -- Array of day info from catalog
  inclusions_json JSONB DEFAULT '[]'::jsonb,     -- What's included
  hotels_json JSONB DEFAULT '[]'::jsonb,         -- Hotels on the tour

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_tour_details_activity_id
  ON custom_tour_details(activity_id);

CREATE INDEX IF NOT EXISTS idx_custom_tour_details_tour_id
  ON custom_tour_details(tour_id);

CREATE INDEX IF NOT EXISTS idx_custom_tour_details_departure_id
  ON custom_tour_details(departure_id);

-- Add RLS policies (same pattern as custom_cruise_details)
ALTER TABLE custom_tour_details ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access tour details for activities in their agency's trips
CREATE POLICY "custom_tour_details_agency_isolation" ON custom_tour_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM itinerary_activities ia
      JOIN itinerary_days id ON ia.itinerary_day_id = id.id
      JOIN itineraries i ON id.itinerary_id = i.id
      JOIN trips t ON i.trip_id = t.id
      WHERE ia.id = custom_tour_details.activity_id
      AND t.agency_id = (current_setting('request.jwt.claims', true)::json->>'agency_id')::uuid
    )
  );

-- Comment on table
COMMENT ON TABLE custom_tour_details IS 'Extended details for tour bookings. One-to-one relationship with itinerary_activities.';
