-- Create booking_travelers junction table
-- Links trip travelers to bookings for explicit traveler assignment
CREATE TABLE booking_travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trip_traveler_id UUID NOT NULL REFERENCES trip_travelers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate traveler assignments to the same booking
  CONSTRAINT booking_travelers_unique UNIQUE(booking_id, trip_traveler_id)
);

-- Index for efficient lookups by booking
CREATE INDEX idx_booking_travelers_booking ON booking_travelers(booking_id);

-- Index for efficient lookups by traveler
CREATE INDEX idx_booking_travelers_traveler ON booking_travelers(trip_traveler_id);
