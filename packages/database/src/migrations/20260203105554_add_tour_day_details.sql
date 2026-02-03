-- Add tour_day_details table for tour day activity storage
-- Child activities of custom_tour (tour days with day number, overnight city, locked status)

CREATE TABLE IF NOT EXISTS tour_day_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL UNIQUE REFERENCES itinerary_activities(id) ON DELETE CASCADE,

  -- Tour day information
  day_number INTEGER,
  overnight_city TEXT,

  -- Locking flag - when true, the tour day is read-only
  -- Default true = locked to parent tour data
  -- False = detached/customizable by agent
  is_locked BOOLEAN DEFAULT true,

  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookups by activity_id
CREATE INDEX IF NOT EXISTS idx_tour_day_details_activity_id
  ON tour_day_details(activity_id);

-- Comment for documentation
COMMENT ON TABLE tour_day_details IS 'Tour day details for tour_day activities (children of custom_tour). Stores day number, overnight city, and lock status.';
