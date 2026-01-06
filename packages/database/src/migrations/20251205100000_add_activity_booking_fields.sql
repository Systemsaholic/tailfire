-- Migration: Add isBooked and bookingDate fields to itinerary_activities
-- Purpose: Track when activities are confirmed as booked with a specific booking date
-- isBooked: Boolean flag indicating if the activity has been marked as booked
-- bookingDate: The date when the booking was confirmed/made

ALTER TABLE itinerary_activities
ADD COLUMN is_booked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN booking_date TIMESTAMPTZ;

-- Create index for filtering booked activities
CREATE INDEX idx_itinerary_activities_is_booked ON itinerary_activities(is_booked);

COMMENT ON COLUMN itinerary_activities.is_booked IS 'Whether the activity has been marked as booked/confirmed by the user';
COMMENT ON COLUMN itinerary_activities.booking_date IS 'Date when the booking was confirmed/made';
