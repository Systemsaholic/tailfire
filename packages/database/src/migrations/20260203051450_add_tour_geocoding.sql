-- Tour Geocoding Migration
-- Adds coordinate columns and geocoding cache for tour locations

-- ============================================================================
-- Add coordinates to tours table
-- ============================================================================
ALTER TABLE catalog.tours
  ADD COLUMN IF NOT EXISTS start_city TEXT,
  ADD COLUMN IF NOT EXISTS start_city_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS start_city_lng DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS end_city TEXT,
  ADD COLUMN IF NOT EXISTS end_city_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS end_city_lng DECIMAL(10, 7);

-- Add coordinates to tour_departures (may differ from tour-level)
ALTER TABLE catalog.tour_departures
  ADD COLUMN IF NOT EXISTS start_city_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS start_city_lng DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS end_city_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS end_city_lng DECIMAL(10, 7);

-- Add coordinates to itinerary days for overnight cities
ALTER TABLE catalog.tour_itinerary_days
  ADD COLUMN IF NOT EXISTS overnight_city_lat DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS overnight_city_lng DECIMAL(10, 7);

-- ============================================================================
-- Geocoding Cache (avoid repeated API calls)
-- ============================================================================
CREATE TABLE IF NOT EXISTS catalog.geocoding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT NOT NULL UNIQUE,  -- Normalized city name
  display_name TEXT,                   -- Original formatted name
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  country TEXT,
  country_code TEXT,
  region TEXT,                         -- State/Province
  provider TEXT DEFAULT 'google',      -- google, mapbox, etc.
  raw_response JSONB,                  -- Store full response for debugging
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_geocoding_cache_key ON catalog.geocoding_cache(location_key);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_country ON catalog.geocoding_cache(country_code);

-- ============================================================================
-- Spatial index hints (if PostGIS available)
-- ============================================================================
-- Note: These indexes are useful if you enable PostGIS extension
-- CREATE INDEX IF NOT EXISTS idx_tours_start_coords ON catalog.tours USING GIST (
--   ST_SetSRID(ST_MakePoint(start_city_lng, start_city_lat), 4326)
-- );
