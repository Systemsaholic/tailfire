-- Add departure and arrival port IDs to custom_cruise_details
-- These are optional FK references to cruise_ports table for linking to known ports
-- The text fields (departure_port, arrival_port) remain for display and custom ports

ALTER TABLE custom_cruise_details
ADD COLUMN departure_port_id UUID REFERENCES cruise_ports(id) ON DELETE SET NULL,
ADD COLUMN arrival_port_id UUID REFERENCES cruise_ports(id) ON DELETE SET NULL;

-- Add indexes for efficient lookups
CREATE INDEX idx_custom_cruise_details_departure_port_id ON custom_cruise_details(departure_port_id);
CREATE INDEX idx_custom_cruise_details_arrival_port_id ON custom_cruise_details(arrival_port_id);

-- Add comments for documentation
COMMENT ON COLUMN custom_cruise_details.departure_port_id IS 'Optional FK to cruise_ports for departure port lookup';
COMMENT ON COLUMN custom_cruise_details.arrival_port_id IS 'Optional FK to cruise_ports for arrival port lookup';
