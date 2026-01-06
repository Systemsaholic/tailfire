-- Custom Cruise Details Migration
-- Stores cruise booking information for itinerary components
-- Traveltek-aligned field structure for future API ingestion

-- Create custom_cruise_details table
CREATE TABLE IF NOT EXISTS custom_cruise_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES itinerary_activities(id) ON DELETE CASCADE,

  -- Traveltek Identity
  traveltek_cruise_id TEXT,                    -- codetocruiseid for API reference
  source VARCHAR(50) DEFAULT 'manual',         -- 'traveltek' | 'manual'

  -- Cruise Line Information
  cruise_line_name VARCHAR(255),               -- "Silversea"
  cruise_line_code VARCHAR(50),                -- lineid or shortname
  ship_name VARCHAR(255),                      -- "Silver Dawn"
  ship_code VARCHAR(50),                       -- shipid
  ship_class VARCHAR(100),                     -- Ship classification
  ship_image_url TEXT,                         -- Default ship image

  -- Voyage Details
  itinerary_name VARCHAR(255),                 -- "East & South Caribbean"
  voyage_code VARCHAR(100),                    -- "DA251222014"
  region VARCHAR(100),                         -- Geographic region
  nights INTEGER,                              -- Duration in nights
  sea_days INTEGER,                            -- Number of days at sea

  -- Departure Details
  departure_port VARCHAR(255),                 -- "Fort Lauderdale, Florida"
  departure_date DATE,
  departure_time TIME,
  departure_timezone VARCHAR(100),

  -- Arrival Details
  arrival_port VARCHAR(255),
  arrival_date DATE,
  arrival_time TIME,
  arrival_timezone VARCHAR(100),

  -- Cabin Details (Normalized)
  cabin_category VARCHAR(50),                  -- suite, balcony, oceanview, inside
  cabin_code VARCHAR(50),                      -- "S2" (grade code)
  cabin_number VARCHAR(50),                    -- Actual assigned cabin
  cabin_deck VARCHAR(50),

  -- Booking Information
  booking_number VARCHAR(100),                 -- Cruise line confirmation
  fare_code VARCHAR(50),                       -- Promotional/fare code
  booking_deadline DATE,

  -- JSON Data (Traveltek structures)
  port_calls_json JSONB DEFAULT '[]'::jsonb,   -- [{day, port, arriveTime, departTime, tender}]
  cabin_pricing_json JSONB DEFAULT '{}'::jsonb, -- Traveltek cachedprices structure
  ship_content_json JSONB DEFAULT '{}'::jsonb,  -- shipcontent for images, amenities

  -- Additional Details
  inclusions TEXT[] DEFAULT '{}',              -- What's included
  special_requests TEXT,                       -- Guest special requests

  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT custom_cruise_details_component_id_unique UNIQUE (component_id),
  CONSTRAINT custom_cruise_details_nights_check CHECK (nights IS NULL OR nights >= 0),
  CONSTRAINT custom_cruise_details_sea_days_check CHECK (sea_days IS NULL OR sea_days >= 0),
  CONSTRAINT custom_cruise_details_source_check CHECK (source IN ('traveltek', 'manual')),
  CONSTRAINT custom_cruise_details_cabin_category_check CHECK (
    cabin_category IS NULL OR cabin_category IN ('suite', 'balcony', 'oceanview', 'inside')
  )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_custom_cruise_details_component_id ON custom_cruise_details(component_id);
CREATE INDEX IF NOT EXISTS idx_custom_cruise_details_traveltek_id ON custom_cruise_details(traveltek_cruise_id) WHERE traveltek_cruise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_cruise_details_departure_date ON custom_cruise_details(departure_date) WHERE departure_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_cruise_details_cruise_line ON custom_cruise_details(cruise_line_name) WHERE cruise_line_name IS NOT NULL;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_cruise_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_cruise_details_updated_at_trigger
  BEFORE UPDATE ON custom_cruise_details
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_cruise_details_updated_at();

-- Comments for documentation
COMMENT ON TABLE custom_cruise_details IS 'Stores cruise-specific booking details for itinerary components';
COMMENT ON COLUMN custom_cruise_details.traveltek_cruise_id IS 'Traveltek codetocruiseid for API reference';
COMMENT ON COLUMN custom_cruise_details.port_calls_json IS 'Array of port calls: [{day, portName, arriveDate, departDate, arriveTime, departTime, tender}]';
COMMENT ON COLUMN custom_cruise_details.cabin_pricing_json IS 'Traveltek cabin pricing structure for all cabin types';
COMMENT ON COLUMN custom_cruise_details.ship_content_json IS 'Ship details including images, amenities from Traveltek';
