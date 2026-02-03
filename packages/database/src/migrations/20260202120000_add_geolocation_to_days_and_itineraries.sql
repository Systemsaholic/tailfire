-- Add geolocation fields to itinerary_days (start + end of day)
ALTER TABLE itinerary_days
  ADD COLUMN start_location_name VARCHAR(255),
  ADD COLUMN start_location_lat NUMERIC(9,6),
  ADD COLUMN start_location_lng NUMERIC(10,6),
  ADD COLUMN end_location_name VARCHAR(255),
  ADD COLUMN end_location_lat NUMERIC(9,6),
  ADD COLUMN end_location_lng NUMERIC(10,6),
  ADD COLUMN start_location_override BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN end_location_override BOOLEAN NOT NULL DEFAULT FALSE;

-- Add primary + secondary destination to itineraries
ALTER TABLE itineraries
  ADD COLUMN primary_destination_name VARCHAR(255),
  ADD COLUMN primary_destination_lat NUMERIC(9,6),
  ADD COLUMN primary_destination_lng NUMERIC(10,6),
  ADD COLUMN secondary_destination_name VARCHAR(255),
  ADD COLUMN secondary_destination_lat NUMERIC(9,6),
  ADD COLUMN secondary_destination_lng NUMERIC(10,6);
