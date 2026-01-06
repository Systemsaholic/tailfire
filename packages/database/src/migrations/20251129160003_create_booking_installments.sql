-- Create installment_status enum for payment tracking
CREATE TYPE installment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Create booking_installments table as the single source of truth for payment schedules
CREATE TABLE booking_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  description VARCHAR(255),
  status installment_status NOT NULL DEFAULT 'pending',
  paid_date DATE,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient installment lookups by booking
CREATE INDEX idx_booking_installments_booking ON booking_installments(booking_id);

-- Partial index for unpaid installments (for payment reminders, overdue tracking)
CREATE INDEX idx_booking_installments_status ON booking_installments(status) WHERE status != 'paid';

-- Index for due date queries (e.g., upcoming payments)
CREATE INDEX idx_booking_installments_due_date ON booking_installments(due_date) WHERE status = 'pending';
