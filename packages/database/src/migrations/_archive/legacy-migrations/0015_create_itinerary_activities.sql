-- Migration: Create Itinerary Activities Table
-- Description: Creates the itinerary_activities table and supporting enums for activity management
-- Activities represent individual items within an itinerary day (lodging, flights, tours, etc.)

-- Create enums for activity management
CREATE TYPE activity_type AS ENUM (
  'lodging',
  'flight',
  'activity',
  'transportation',
  'cruise',
  'dining'
);

CREATE TYPE activity_status AS ENUM (
  'proposed',
  'confirmed',
  'cancelled',
  'optional'
);

CREATE TYPE pricing_type AS ENUM (
  'per_person',
  'per_room',
  'flat_rate',
  'per_night'
);

-- Create itinerary_activities table
CREATE TABLE IF NOT EXISTS itinerary_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_day_id UUID NOT NULL,

  -- Core fields
  activity_type activity_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,

  -- Timing: Store actual moments as timestamptz with explicit timezone string
  -- Fallback chain: activity.timezone → trip.timezone → browser timezone
  start_datetime TIMESTAMP WITH TIME ZONE,
  end_datetime TIMESTAMP WITH TIME ZONE,
  timezone VARCHAR(64), -- IANA timezone identifier (e.g., 'America/New_York')

  -- Location
  location VARCHAR(255),
  address TEXT,
  coordinates JSONB, -- {lat: number, lng: number}

  -- Details
  notes TEXT,
  confirmation_number VARCHAR(100),
  status activity_status DEFAULT 'proposed',

  -- Pricing
  estimated_cost DECIMAL(10, 2),
  pricing_type pricing_type,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Media (deferred - kept nullable for future photo uploads)
  photos JSONB, -- [{url: string, caption?: string}]

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Foreign key to itinerary_days table
  CONSTRAINT fk_itinerary_activities_day
    FOREIGN KEY (itinerary_day_id)
    REFERENCES itinerary_days(id)
    ON DELETE CASCADE,

  -- Ensure sequence order is unique within a day
  CONSTRAINT unique_activity_sequence
    UNIQUE(itinerary_day_id, sequence_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_day_id
  ON itinerary_activities(itinerary_day_id);

CREATE INDEX IF NOT EXISTS idx_activities_type
  ON itinerary_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_activities_status
  ON itinerary_activities(status);

CREATE INDEX IF NOT EXISTS idx_activities_start_datetime
  ON itinerary_activities(start_datetime);

CREATE INDEX IF NOT EXISTS idx_activities_sequence
  ON itinerary_activities(itinerary_day_id, sequence_order);

-- Comments for documentation
COMMENT ON TABLE itinerary_activities IS 'Individual activities within an itinerary day (lodging, flights, tours, dining, etc.)';
COMMENT ON COLUMN itinerary_activities.activity_type IS 'Type of activity: lodging, flight, activity, transportation, cruise, or dining';
COMMENT ON COLUMN itinerary_activities.start_datetime IS 'Actual moment in time (timestamptz). Use with timezone field for proper display.';
COMMENT ON COLUMN itinerary_activities.timezone IS 'IANA timezone identifier. Falls back to trip timezone, then browser timezone if null.';
COMMENT ON COLUMN itinerary_activities.status IS 'Activity status: proposed (not yet confirmed), confirmed (booked), cancelled, or optional (add-on)';
COMMENT ON COLUMN itinerary_activities.pricing_type IS 'How pricing is calculated: per_person, per_room, flat_rate, or per_night';
COMMENT ON COLUMN itinerary_activities.sequence_order IS 'Display order within the day (allows drag-and-drop reordering)';
