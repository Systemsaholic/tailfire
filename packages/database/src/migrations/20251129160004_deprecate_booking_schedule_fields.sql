-- Add deprecation comments to legacy payment schedule fields
-- These fields are superseded by the booking_installments table
-- Keeping columns for backward compatibility but marking as deprecated

COMMENT ON COLUMN bookings.deposit_cents IS 'DEPRECATED: Use booking_installments table instead';
COMMENT ON COLUMN bookings.deposit_due_date IS 'DEPRECATED: Use booking_installments table instead';
COMMENT ON COLUMN bookings.final_payment_due_date IS 'DEPRECATED: Use booking_installments table instead';
COMMENT ON COLUMN bookings.traveler_count IS 'DEPRECATED: Computed from booking_travelers table. Do not use directly.';
