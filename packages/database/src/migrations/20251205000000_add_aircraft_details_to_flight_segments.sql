-- Add aircraft details to flight_segments
-- Stores aircraft information from Aerodatabox API for hover popovers

ALTER TABLE flight_segments
ADD COLUMN aircraft_model VARCHAR(255),
ADD COLUMN aircraft_registration VARCHAR(50),
ADD COLUMN aircraft_mode_s VARCHAR(10),
ADD COLUMN aircraft_image_url TEXT,
ADD COLUMN aircraft_image_author VARCHAR(255);

-- Note: Existing rows will have NULL values for these columns
-- Aircraft data is populated when flight is saved from Aerodatabox search results
