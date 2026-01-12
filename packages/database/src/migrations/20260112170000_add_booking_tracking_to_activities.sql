-- Add is_booked and booking_date columns to itinerary_activities table
-- These columns track booking status for activities

-- Add is_booked column with default false
ALTER TABLE itinerary_activities ADD COLUMN IF NOT EXISTS is_booked boolean NOT NULL DEFAULT false;

-- Add booking_date column
ALTER TABLE itinerary_activities ADD COLUMN IF NOT EXISTS booking_date timestamptz;
