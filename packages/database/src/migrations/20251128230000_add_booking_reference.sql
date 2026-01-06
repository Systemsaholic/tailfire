-- Add booking_reference column to activity_pricing
-- Used to link related activities (e.g., round-trip flights share the same booking reference)

ALTER TABLE activity_pricing ADD COLUMN booking_reference VARCHAR(255);

-- Index for querying activities by booking reference (find linked flights)
CREATE INDEX idx_activity_pricing_booking_ref ON activity_pricing(booking_reference) WHERE booking_reference IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN activity_pricing.booking_reference IS 'Links related activities (e.g., round-trip flights share the same booking reference)';
