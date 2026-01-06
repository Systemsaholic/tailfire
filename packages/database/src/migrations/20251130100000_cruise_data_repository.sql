-- Cruise Data Repository Migration
-- Creates tables for cruise sailings, ship assets, cabin prices, and sync tracking
-- All prices stored in CAD (canonical currency)

-- ============================================================================
-- SHIP ASSET TABLES (Images, Decks, Cabin Types)
-- ============================================================================

-- Cruise Ship Images
CREATE TABLE IF NOT EXISTS cruise_ship_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id UUID NOT NULL REFERENCES cruise_ships(id) ON DELETE CASCADE,

  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text VARCHAR(500),

  image_type VARCHAR(50) NOT NULL DEFAULT 'gallery',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_hero BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for ship images
CREATE INDEX IF NOT EXISTS idx_ship_images_ship_id ON cruise_ship_images(ship_id);
CREATE INDEX IF NOT EXISTS idx_ship_images_active ON cruise_ship_images(ship_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ship_images_hero ON cruise_ship_images(ship_id) WHERE is_hero = TRUE;

-- Cruise Ship Decks
CREATE TABLE IF NOT EXISTS cruise_ship_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id UUID NOT NULL REFERENCES cruise_ships(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  deck_number INTEGER,
  deck_plan_url TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for ship decks
CREATE INDEX IF NOT EXISTS idx_ship_decks_ship_id ON cruise_ship_decks(ship_id);
CREATE INDEX IF NOT EXISTS idx_ship_decks_active ON cruise_ship_decks(ship_id, is_active) WHERE is_active = TRUE;

-- Cruise Ship Cabin Types
CREATE TABLE IF NOT EXISTS cruise_ship_cabin_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id UUID NOT NULL REFERENCES cruise_ships(id) ON DELETE CASCADE,

  cabin_code VARCHAR(20) NOT NULL,
  cabin_category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  deck_locations VARCHAR(255),
  default_occupancy INTEGER NOT NULL DEFAULT 2,

  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT cruise_ship_cabin_types_code_unique UNIQUE (ship_id, cabin_code)
);

-- Indexes for cabin types
CREATE INDEX IF NOT EXISTS idx_cabin_types_ship_id ON cruise_ship_cabin_types(ship_id);
CREATE INDEX IF NOT EXISTS idx_cabin_types_category ON cruise_ship_cabin_types(cabin_category);
CREATE INDEX IF NOT EXISTS idx_cabin_types_active ON cruise_ship_cabin_types(ship_id, is_active) WHERE is_active = TRUE;

-- ============================================================================
-- SAILING TABLES
-- ============================================================================

-- Cruise Sailings
CREATE TABLE IF NOT EXISTS cruise_sailings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider mapping
  provider VARCHAR(100) NOT NULL DEFAULT 'traveltek',
  provider_identifier VARCHAR(100) NOT NULL,

  -- References
  ship_id UUID NOT NULL REFERENCES cruise_ships(id) ON DELETE RESTRICT,
  cruise_line_id UUID NOT NULL REFERENCES cruise_lines(id) ON DELETE RESTRICT,
  embark_port_id UUID REFERENCES cruise_ports(id) ON DELETE SET NULL,
  disembark_port_id UUID REFERENCES cruise_ports(id) ON DELETE SET NULL,

  -- Sailing details
  name VARCHAR(500) NOT NULL,
  sail_date DATE NOT NULL,
  end_date DATE NOT NULL,
  nights INTEGER NOT NULL,

  -- Denormalized port names (for display when FK is null/stub)
  embark_port_name VARCHAR(255),
  disembark_port_name VARCHAR(255),

  -- Price summaries - All in CAD (canonical currency)
  -- NULL means no prices available for that category
  cheapest_inside_cents INTEGER,
  cheapest_oceanview_cents INTEGER,
  cheapest_balcony_cents INTEGER,
  cheapest_suite_cents INTEGER,

  -- Extensible metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Sync tracking
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Active flag
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Provider uniqueness constraint
  CONSTRAINT cruise_sailings_provider_identifier_unique UNIQUE (provider, provider_identifier)
);

-- Indexes for sailings
CREATE INDEX IF NOT EXISTS idx_sailings_sail_date_active ON cruise_sailings(sail_date) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sailings_nights_active ON cruise_sailings(nights) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sailings_price_inside_active ON cruise_sailings(cheapest_inside_cents) WHERE is_active = TRUE AND cheapest_inside_cents IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sailings_ship_id ON cruise_sailings(ship_id);
CREATE INDEX IF NOT EXISTS idx_sailings_cruise_line_id ON cruise_sailings(cruise_line_id);
CREATE INDEX IF NOT EXISTS idx_sailings_embark_port ON cruise_sailings(embark_port_id);
CREATE INDEX IF NOT EXISTS idx_sailings_last_synced ON cruise_sailings(last_synced_at);

-- Cruise Sailing Regions (Junction Table)
CREATE TABLE IF NOT EXISTS cruise_sailing_regions (
  sailing_id UUID NOT NULL REFERENCES cruise_sailings(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES cruise_regions(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  PRIMARY KEY (sailing_id, region_id)
);

-- Indexes for sailing regions
CREATE INDEX IF NOT EXISTS idx_sailing_regions_sailing ON cruise_sailing_regions(sailing_id);
CREATE INDEX IF NOT EXISTS idx_sailing_regions_region ON cruise_sailing_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_sailing_regions_primary ON cruise_sailing_regions(sailing_id) WHERE is_primary = TRUE;

-- Cruise Sailing Stops (Itinerary)
CREATE TABLE IF NOT EXISTS cruise_sailing_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sailing_id UUID NOT NULL REFERENCES cruise_sailings(id) ON DELETE CASCADE,
  port_id UUID REFERENCES cruise_ports(id) ON DELETE SET NULL,

  port_name VARCHAR(255) NOT NULL,  -- "At Sea" for sea days
  is_sea_day BOOLEAN NOT NULL DEFAULT FALSE,
  day_number INTEGER NOT NULL,
  sequence_order INTEGER NOT NULL DEFAULT 0,

  arrival_time TIME,
  departure_time TIME,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT cruise_sailing_stops_unique UNIQUE (sailing_id, day_number, sequence_order)
);

-- Indexes for sailing stops
CREATE INDEX IF NOT EXISTS idx_sailing_stops_sailing ON cruise_sailing_stops(sailing_id);
CREATE INDEX IF NOT EXISTS idx_sailing_stops_port ON cruise_sailing_stops(port_id);
CREATE INDEX IF NOT EXISTS idx_sailing_stops_sea_day ON cruise_sailing_stops(sailing_id) WHERE is_sea_day = TRUE;

-- ============================================================================
-- PRICING TABLES
-- ============================================================================

-- Cruise Sailing Cabin Prices
-- All prices in CAD (canonical currency)
CREATE TABLE IF NOT EXISTS cruise_sailing_cabin_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sailing_id UUID NOT NULL REFERENCES cruise_sailings(id) ON DELETE CASCADE,

  cabin_code VARCHAR(20) NOT NULL,
  cabin_category VARCHAR(50) NOT NULL,
  occupancy INTEGER NOT NULL DEFAULT 2,

  -- All prices in CAD (canonical currency)
  base_price_cents INTEGER NOT NULL,
  taxes_cents INTEGER NOT NULL DEFAULT 0,
  total_price_cents INTEGER GENERATED ALWAYS AS (base_price_cents + taxes_cents) STORED,

  -- Future-proofing fields (will be 'CAD' for now)
  original_currency VARCHAR(3) NOT NULL DEFAULT 'CAD',
  original_amount_cents INTEGER NOT NULL,

  -- Per-person pricing flag
  is_per_person INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT cruise_sailing_cabin_prices_unique UNIQUE (sailing_id, cabin_code, occupancy)
);

-- Indexes for cabin prices
CREATE INDEX IF NOT EXISTS idx_cabin_prices_sailing ON cruise_sailing_cabin_prices(sailing_id);
CREATE INDEX IF NOT EXISTS idx_cabin_prices_category ON cruise_sailing_cabin_prices(cabin_category);
CREATE INDEX IF NOT EXISTS idx_cabin_prices_sailing_category ON cruise_sailing_cabin_prices(sailing_id, cabin_category);

-- ============================================================================
-- SYNC TRACKING TABLES
-- ============================================================================

-- Cruise Sync Raw (Raw JSON Storage with 30-day TTL)
CREATE TABLE IF NOT EXISTS cruise_sync_raw (
  provider_sailing_id VARCHAR(100) PRIMARY KEY,

  raw_data JSONB NOT NULL,

  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '30 days',

  -- Size limit check (500KB)
  CONSTRAINT raw_data_size_limit CHECK (pg_column_size(raw_data) < 500000)
);

-- Indexes for sync raw
CREATE INDEX IF NOT EXISTS idx_sync_raw_expires ON cruise_sync_raw(expires_at);
CREATE INDEX IF NOT EXISTS idx_sync_raw_synced ON cruise_sync_raw(synced_at);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

-- Generic updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
CREATE TRIGGER cruise_ship_images_updated_at
  BEFORE UPDATE ON cruise_ship_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cruise_ship_decks_updated_at
  BEFORE UPDATE ON cruise_ship_decks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cruise_ship_cabin_types_updated_at
  BEFORE UPDATE ON cruise_ship_cabin_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cruise_sailings_updated_at
  BEFORE UPDATE ON cruise_sailings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cruise_sailing_stops_updated_at
  BEFORE UPDATE ON cruise_sailing_stops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cruise_sailing_cabin_prices_updated_at
  BEFORE UPDATE ON cruise_sailing_cabin_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GEO CONSTRAINTS FOR PORTS (Enhancement)
-- ============================================================================

-- Add latitude/longitude columns to cruise_ports if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cruise_ports' AND column_name = 'latitude') THEN
    ALTER TABLE cruise_ports ADD COLUMN latitude NUMERIC(9,6);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cruise_ports' AND column_name = 'longitude') THEN
    ALTER TABLE cruise_ports ADD COLUMN longitude NUMERIC(10,6);
  END IF;
END
$$;

-- Add CHECK constraints for valid coordinates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'cruise_ports' AND constraint_name = 'check_latitude') THEN
    ALTER TABLE cruise_ports ADD CONSTRAINT check_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'cruise_ports' AND constraint_name = 'check_longitude') THEN
    ALTER TABLE cruise_ports ADD CONSTRAINT check_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));
  END IF;
END
$$;

-- Partial geo index for ports with coordinates
CREATE INDEX IF NOT EXISTS idx_ports_geo ON cruise_ports(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cruise_ship_images IS 'Normalized storage for cruise ship images (gallery, hero, deck plans)';
COMMENT ON TABLE cruise_ship_decks IS 'Deck information and deck plans for cruise ships';
COMMENT ON TABLE cruise_ship_cabin_types IS 'Cabin type definitions per ship (inside, oceanview, balcony, suite)';
COMMENT ON TABLE cruise_sailings IS 'Individual cruise departures/sailings with price summaries (CAD)';
COMMENT ON TABLE cruise_sailing_regions IS 'Many-to-many relationship between sailings and regions';
COMMENT ON TABLE cruise_sailing_stops IS 'Itinerary stops for each sailing including sea days';
COMMENT ON TABLE cruise_sailing_cabin_prices IS 'Full price matrix per sailing (all prices in CAD)';
COMMENT ON TABLE cruise_sync_raw IS 'Raw JSON storage for Traveltek data with 30-day TTL';

COMMENT ON COLUMN cruise_sailings.cheapest_inside_cents IS 'Cheapest inside cabin price in CAD cents (NULL if no prices)';
COMMENT ON COLUMN cruise_sailings.cheapest_oceanview_cents IS 'Cheapest oceanview cabin price in CAD cents (NULL if no prices)';
COMMENT ON COLUMN cruise_sailings.cheapest_balcony_cents IS 'Cheapest balcony cabin price in CAD cents (NULL if no prices)';
COMMENT ON COLUMN cruise_sailings.cheapest_suite_cents IS 'Cheapest suite cabin price in CAD cents (NULL if no prices)';

COMMENT ON COLUMN cruise_sailing_cabin_prices.base_price_cents IS 'Base cabin price in CAD cents';
COMMENT ON COLUMN cruise_sailing_cabin_prices.taxes_cents IS 'Taxes in CAD cents';
COMMENT ON COLUMN cruise_sailing_cabin_prices.total_price_cents IS 'Generated column: base_price_cents + taxes_cents';
COMMENT ON COLUMN cruise_sailing_cabin_prices.original_currency IS 'Original currency code (CAD for Traveltek feed)';
COMMENT ON COLUMN cruise_sailing_cabin_prices.original_amount_cents IS 'Original amount in original currency cents';
