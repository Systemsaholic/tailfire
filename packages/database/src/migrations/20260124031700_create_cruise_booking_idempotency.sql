-- Create cruise_booking_idempotency table for preventing double-bookings
-- Separate from session table to allow multiple booking attempts per activity

CREATE TABLE IF NOT EXISTS cruise_booking_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key uuid NOT NULL UNIQUE,
  activity_id uuid NOT NULL REFERENCES itinerary_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_ref varchar(100),
  booking_response jsonb,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Note: idempotency_key already has UNIQUE constraint, index is implicit
CREATE INDEX idx_idempotency_expires ON cruise_booking_idempotency(expires_at)
WHERE status = 'pending';

COMMENT ON TABLE cruise_booking_idempotency IS 'Idempotency tracking for cruise booking retries (24h TTL)';
COMMENT ON COLUMN cruise_booking_idempotency.idempotency_key IS 'Client-generated UUID for retry safety';
COMMENT ON COLUMN cruise_booking_idempotency.expires_at IS 'TTL for cleanup job - default 24 hours';
