-- Create booking-related enum types
-- Migration: 20251129100000_create_booking_enums.sql

-- Booking workflow status
CREATE TYPE booking_status AS ENUM (
  'draft',           -- Initial state, not yet confirmed
  'pending',         -- Submitted to supplier, awaiting confirmation
  'confirmed',       -- Supplier confirmed
  'cancelled',       -- Cancelled (by agent or supplier)
  'completed'        -- Trip completed, booking fulfilled
);

-- Payment tracking status
CREATE TYPE booking_payment_status AS ENUM (
  'unpaid',              -- No payment received
  'deposit_paid',        -- Partial deposit paid
  'paid',                -- Fully paid
  'refunded',            -- Full refund processed
  'partially_refunded'   -- Partial refund (e.g., cancellation fee retained)
);

-- How pricing is calculated
CREATE TYPE booking_pricing_type AS ENUM (
  'flat_rate',   -- Single price for entire booking
  'per_person'   -- Price based on traveler count
);

-- Comments for documentation
COMMENT ON TYPE booking_status IS 'Workflow status for bookings/packages';
COMMENT ON TYPE booking_payment_status IS 'Payment tracking status for bookings';
COMMENT ON TYPE booking_pricing_type IS 'Pricing calculation method for bookings';
