-- Cruise Reference Tables Migration
-- Database-backed reference data for cruise lines, ships, regions, and ports
-- Supports provider-agnostic design with Traveltek as initial data source

-- Create cruise_lines reference table
CREATE TABLE IF NOT EXISTS cruise_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,

  -- Provider mapping for external system references
  provider VARCHAR(100) NOT NULL DEFAULT 'traveltek',  -- 'traveltek', 'cruiseline_direct', etc.
  provider_identifier VARCHAR(100) NOT NULL,           -- External system ID (always string)

  -- Optional supplier FK for vendor management (FK constraint added when suppliers table exists)
  supplier_id UUID,

  -- Extensible metadata for future enrichment
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cruise_lines_provider_identifier_unique UNIQUE (provider, provider_identifier),
  CONSTRAINT cruise_lines_slug_unique UNIQUE (slug)
);

-- Create cruise_ships reference table
CREATE TABLE IF NOT EXISTS cruise_ships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,

  -- Provider mapping
  provider VARCHAR(100) NOT NULL DEFAULT 'traveltek',
  provider_identifier VARCHAR(100) NOT NULL,

  -- FK to cruise line
  cruise_line_id UUID REFERENCES cruise_lines(id) ON DELETE SET NULL,

  -- Ship details
  ship_class VARCHAR(100),
  image_url TEXT,

  -- Extensible metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cruise_ships_provider_identifier_unique UNIQUE (provider, provider_identifier),
  CONSTRAINT cruise_ships_slug_unique UNIQUE (slug)
);

-- Create cruise_regions reference table
CREATE TABLE IF NOT EXISTS cruise_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,

  -- Provider mapping
  provider VARCHAR(100) NOT NULL DEFAULT 'traveltek',
  provider_identifier VARCHAR(100) NOT NULL,

  -- Extensible metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cruise_regions_provider_identifier_unique UNIQUE (provider, provider_identifier),
  CONSTRAINT cruise_regions_slug_unique UNIQUE (slug)
);

-- Create cruise_ports reference table
CREATE TABLE IF NOT EXISTS cruise_ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,

  -- Provider mapping
  provider VARCHAR(100) NOT NULL DEFAULT 'traveltek',
  provider_identifier VARCHAR(100) NOT NULL,

  -- Extensible metadata (can include country, coordinates, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT cruise_ports_provider_identifier_unique UNIQUE (provider, provider_identifier),
  CONSTRAINT cruise_ports_slug_unique UNIQUE (slug)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cruise_lines_name ON cruise_lines(name);
CREATE INDEX IF NOT EXISTS idx_cruise_lines_slug ON cruise_lines(slug);
CREATE INDEX IF NOT EXISTS idx_cruise_lines_supplier_id ON cruise_lines(supplier_id) WHERE supplier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cruise_ships_name ON cruise_ships(name);
CREATE INDEX IF NOT EXISTS idx_cruise_ships_slug ON cruise_ships(slug);
CREATE INDEX IF NOT EXISTS idx_cruise_ships_cruise_line_id ON cruise_ships(cruise_line_id) WHERE cruise_line_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cruise_regions_name ON cruise_regions(name);
CREATE INDEX IF NOT EXISTS idx_cruise_regions_slug ON cruise_regions(slug);

CREATE INDEX IF NOT EXISTS idx_cruise_ports_name ON cruise_ports(name);
CREATE INDEX IF NOT EXISTS idx_cruise_ports_slug ON cruise_ports(slug);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_cruise_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cruise_lines_updated_at_trigger
  BEFORE UPDATE ON cruise_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_cruise_lines_updated_at();

CREATE OR REPLACE FUNCTION update_cruise_ships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cruise_ships_updated_at_trigger
  BEFORE UPDATE ON cruise_ships
  FOR EACH ROW
  EXECUTE FUNCTION update_cruise_ships_updated_at();

CREATE OR REPLACE FUNCTION update_cruise_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cruise_regions_updated_at_trigger
  BEFORE UPDATE ON cruise_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_cruise_regions_updated_at();

CREATE OR REPLACE FUNCTION update_cruise_ports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cruise_ports_updated_at_trigger
  BEFORE UPDATE ON cruise_ports
  FOR EACH ROW
  EXECUTE FUNCTION update_cruise_ports_updated_at();

-- Comments for documentation
COMMENT ON TABLE cruise_lines IS 'Reference table for cruise line companies';
COMMENT ON COLUMN cruise_lines.provider IS 'Data source provider (e.g., traveltek, cruiseline_direct)';
COMMENT ON COLUMN cruise_lines.provider_identifier IS 'External system ID for this cruise line';
COMMENT ON COLUMN cruise_lines.metadata IS 'Extensible JSONB for additional cruise line data';

COMMENT ON TABLE cruise_ships IS 'Reference table for cruise ships';
COMMENT ON COLUMN cruise_ships.cruise_line_id IS 'FK to cruise_lines table';
COMMENT ON COLUMN cruise_ships.metadata IS 'Extensible JSONB for additional ship data (amenities, specs, etc.)';

COMMENT ON TABLE cruise_regions IS 'Reference table for cruise sailing regions';
COMMENT ON COLUMN cruise_regions.metadata IS 'Extensible JSONB for additional region data';

COMMENT ON TABLE cruise_ports IS 'Reference table for cruise embarkation/disembarkation ports';
COMMENT ON COLUMN cruise_ports.metadata IS 'Extensible JSONB for port data (country, coordinates, etc.)';
