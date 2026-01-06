-- Add google_places to api_provider enum
-- Must be run BEFORE schema builds or API start

ALTER TYPE api_provider ADD VALUE 'google_places';
