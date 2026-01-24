-- Add FusionAPI booking confirmation columns to custom_cruise_details
-- These store durable booking facts (not ephemeral session state)

ALTER TABLE custom_cruise_details
ADD COLUMN IF NOT EXISTS fusion_booking_ref varchar(100),
ADD COLUMN IF NOT EXISTS fusion_booking_status varchar(50),
ADD COLUMN IF NOT EXISTS fusion_booked_at timestamptz,
ADD COLUMN IF NOT EXISTS fusion_booking_response jsonb;

COMMENT ON COLUMN custom_cruise_details.fusion_booking_ref IS 'Traveltek booking confirmation reference';
COMMENT ON COLUMN custom_cruise_details.fusion_booking_status IS 'Booking status: confirmed, cancelled, etc.';
COMMENT ON COLUMN custom_cruise_details.fusion_booked_at IS 'Timestamp when booking was finalized';
COMMENT ON COLUMN custom_cruise_details.fusion_booking_response IS 'Cached booking response for idempotent retries';
