-- Add FK columns for cruise line, ship, and region to custom_cruise_details
-- These enable proper foreign key relationships while maintaining backwards compatibility
-- with existing label-only fields (cruise_line_name, ship_name, region)

-- Add cruise_line_id column
ALTER TABLE custom_cruise_details
ADD COLUMN cruise_line_id UUID REFERENCES cruise_lines(id) ON DELETE SET NULL;

-- Add cruise_ship_id column
ALTER TABLE custom_cruise_details
ADD COLUMN cruise_ship_id UUID REFERENCES cruise_ships(id) ON DELETE SET NULL;

-- Add cruise_region_id column
ALTER TABLE custom_cruise_details
ADD COLUMN cruise_region_id UUID REFERENCES cruise_regions(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX idx_custom_cruise_details_cruise_line_id ON custom_cruise_details(cruise_line_id);
CREATE INDEX idx_custom_cruise_details_cruise_ship_id ON custom_cruise_details(cruise_ship_id);
CREATE INDEX idx_custom_cruise_details_cruise_region_id ON custom_cruise_details(cruise_region_id);

-- Add comments for documentation
COMMENT ON COLUMN custom_cruise_details.cruise_line_id IS 'FK to cruise_lines table (null for custom entries)';
COMMENT ON COLUMN custom_cruise_details.cruise_ship_id IS 'FK to cruise_ships table (null for custom entries)';
COMMENT ON COLUMN custom_cruise_details.cruise_region_id IS 'FK to cruise_regions table (null for custom entries)';
