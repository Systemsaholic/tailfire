-- Create bookings table for package-level pricing and activity grouping
-- Migration: 20251129100001_create_bookings_table.sql

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships (required)
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

  -- Booking identification
  name VARCHAR(255) NOT NULL,                           -- "Flights - Smith Family Round Trip"
  confirmation_number VARCHAR(255),                      -- Supplier confirmation (e.g., "AFOU73")

  -- Supplier (denormalized for display + optional FK)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),                           -- Cached display name (survives supplier deletion)

  -- Status tracking (NOT NULL with defaults)
  status booking_status NOT NULL DEFAULT 'draft',
  payment_status booking_payment_status NOT NULL DEFAULT 'unpaid',

  -- Pricing (source of truth when activities linked)
  pricing_type booking_pricing_type NOT NULL DEFAULT 'flat_rate',
  traveler_count INTEGER NOT NULL DEFAULT 1 CHECK (traveler_count > 0),
  total_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_price_cents >= 0),
  taxes_cents INTEGER NOT NULL DEFAULT 0 CHECK (taxes_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'CAD',

  -- Commission (either cents OR percentage, not both)
  commission_cents INTEGER DEFAULT 0 CHECK (commission_cents >= 0),
  commission_percentage DECIMAL(5,2) CHECK (commission_percentage >= 0 AND commission_percentage <= 100),

  -- Payment schedule
  deposit_cents INTEGER CHECK (deposit_cents >= 0),
  deposit_due_date DATE,
  final_payment_due_date DATE,

  -- Policies
  cancellation_policy TEXT,
  cancellation_deadline DATE,
  terms_and_conditions TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps (NOT NULL with defaults)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_trip ON bookings(trip_id);
CREATE INDEX idx_bookings_status ON bookings(status) WHERE status != 'cancelled';
CREATE INDEX idx_bookings_supplier ON bookings(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status) WHERE payment_status != 'paid';

-- Unique confirmation number per trip (prevents duplicates within same trip)
CREATE UNIQUE INDEX idx_bookings_confirmation_unique
  ON bookings(trip_id, confirmation_number)
  WHERE confirmation_number IS NOT NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_bookings_updated_at();

-- Comments
COMMENT ON TABLE bookings IS 'Packages/bundles of activities for financial tracking. Price is source of truth when activities linked.';
COMMENT ON COLUMN bookings.supplier_name IS 'Cached display name from supplier lookup. Preserved if supplier deleted.';
COMMENT ON COLUMN bookings.traveler_count IS 'Number of travelers for per_person pricing. Always >= 1.';
COMMENT ON COLUMN bookings.total_price_cents IS 'Final total price in cents. For per_person, this is the computed total (not per-person rate).';
