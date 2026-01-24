-- Create cruise_booking_sessions table for ephemeral FusionAPI session state
-- This is distinct from the durable booking data in custom_cruise_details

CREATE TABLE IF NOT EXISTS cruise_booking_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES itinerary_activities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  trip_traveler_id uuid REFERENCES trip_travelers(id) ON DELETE SET NULL,

  -- Session status (for lifecycle management)
  status varchar(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'completed', 'cancelled')),
  flow_type varchar(20) NOT NULL
    CHECK (flow_type IN ('agent', 'client_handoff', 'ota')),

  -- FusionAPI session state (varchar not uuid - API may return non-UUID strings)
  session_key varchar(100) NOT NULL,
  session_expires_at timestamptz NOT NULL,

  -- Search context (needed for replay/re-booking)
  codetocruiseid varchar(100),
  result_no varchar(100),

  -- Selection state (needed to restore if transient failure)
  fare_code varchar(50),
  grade_no integer,
  cabin_no varchar(20),

  -- Basket state
  basket_item_key varchar(100),
  cabin_result varchar(100),
  hold_expires_at timestamptz,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index: only one ACTIVE session per activity (allows historical records)
CREATE UNIQUE INDEX idx_cruise_sessions_active_unique
ON cruise_booking_sessions(activity_id)
WHERE status = 'active';

-- Index for session cleanup job
CREATE INDEX idx_cruise_sessions_expires
ON cruise_booking_sessions(session_expires_at)
WHERE status = 'active';

-- Index for hold expiry monitoring
CREATE INDEX idx_cruise_sessions_hold_expires
ON cruise_booking_sessions(hold_expires_at)
WHERE hold_expires_at IS NOT NULL AND status = 'active';

-- Index for trip-based lookups (handoff validation)
CREATE INDEX idx_cruise_sessions_trip
ON cruise_booking_sessions(trip_id, trip_traveler_id)
WHERE status = 'active';

-- Index on status for cleanup queries
CREATE INDEX idx_cruise_sessions_status
ON cruise_booking_sessions(status);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_cruise_booking_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cruise_booking_sessions_updated_at
  BEFORE UPDATE ON cruise_booking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_cruise_booking_sessions_updated_at();

-- Comments
COMMENT ON TABLE cruise_booking_sessions IS 'Ephemeral FusionAPI session state for cruise booking flow';
COMMENT ON COLUMN cruise_booking_sessions.session_key IS 'FusionAPI sessionkey (varchar for compatibility)';
COMMENT ON COLUMN cruise_booking_sessions.status IS 'Session lifecycle: active→completed/expired/cancelled';
COMMENT ON COLUMN cruise_booking_sessions.flow_type IS 'Booking flow: agent, client_handoff, ota';
COMMENT ON COLUMN cruise_booking_sessions.trip_traveler_id IS 'Reference to trip_travelers for handoff authorization';
