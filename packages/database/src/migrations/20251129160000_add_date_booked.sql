-- Add date_booked column to track when a booking was confirmed
ALTER TABLE bookings ADD COLUMN date_booked DATE;

-- DB-level CHECK constraint: if status='confirmed', date_booked and confirmation_number must be set
-- This ensures data integrity at the database level
ALTER TABLE bookings ADD CONSTRAINT chk_confirmed_requires_booking_details
  CHECK (
    status != 'confirmed' OR (date_booked IS NOT NULL AND confirmation_number IS NOT NULL)
  );

-- Add index for querying bookings by date_booked
CREATE INDEX idx_bookings_date_booked ON bookings(date_booked) WHERE date_booked IS NOT NULL;
