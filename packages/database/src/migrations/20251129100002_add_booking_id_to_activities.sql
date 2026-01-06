-- Add booking_id FK to itinerary_activities for linking activities to bookings
-- Migration: 20251129100002_add_booking_id_to_activities.sql

-- Add booking FK to activities
ALTER TABLE itinerary_activities
  ADD COLUMN booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL;

-- Index for querying activities by booking (partial index for linked only)
CREATE INDEX idx_activities_booking ON itinerary_activities(booking_id)
  WHERE booking_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN itinerary_activities.booking_id IS
  'Links activity to a booking/package for financial grouping. SET NULL on booking delete preserves activity. When set, booking price is source of truth (activity pricing ignored in totals).';
