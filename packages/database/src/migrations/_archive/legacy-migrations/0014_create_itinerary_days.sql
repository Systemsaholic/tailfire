-- Migration: Create Itinerary Days Table
-- Description: Creates the itinerary_days table for organizing activities by day
-- Each itinerary can have multiple days, including a pre-travel day (day_number = 0)

CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE,
  title VARCHAR(255),
  notes TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  -- Foreign key to itineraries table
  CONSTRAINT fk_itinerary_days_itinerary
    FOREIGN KEY (itinerary_id)
    REFERENCES itineraries(id)
    ON DELETE CASCADE,

  -- Ensure each day number is unique within an itinerary
  CONSTRAINT unique_itinerary_day_number
    UNIQUE(itinerary_id, day_number),

  -- Ensure sequence order is unique within an itinerary
  CONSTRAINT unique_itinerary_day_sequence
    UNIQUE(itinerary_id, sequence_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary_id
  ON itinerary_days(itinerary_id);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_date
  ON itinerary_days(date);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_sequence
  ON itinerary_days(itinerary_id, sequence_order);

-- Comments for documentation
COMMENT ON TABLE itinerary_days IS 'Organizes itinerary activities by day. Day 0 represents pre-travel information.';
COMMENT ON COLUMN itinerary_days.day_number IS 'Day number: 0 for pre-travel, 1+ for actual trip days';
COMMENT ON COLUMN itinerary_days.date IS 'Calendar date for this day (nullable for date-flexible trips)';
COMMENT ON COLUMN itinerary_days.sequence_order IS 'Display order (allows reordering without changing day numbers)';
