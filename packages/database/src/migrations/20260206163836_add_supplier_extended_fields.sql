-- Add extended fields to suppliers table
-- Fields: legalName, defaultCommissionRate, isActive, isPreferred, notes, defaultTermsAndConditions, defaultCancellationPolicy

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS default_commission_rate VARCHAR(10),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS default_terms_and_conditions TEXT,
ADD COLUMN IF NOT EXISTS default_cancellation_policy TEXT;

-- Add index for active suppliers lookup
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Add index for preferred suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_is_preferred ON suppliers(is_preferred);

COMMENT ON COLUMN suppliers.legal_name IS 'Legal business name for contracts';
COMMENT ON COLUMN suppliers.default_commission_rate IS 'Default commission rate as decimal string (e.g., "10.00" for 10%)';
COMMENT ON COLUMN suppliers.is_active IS 'Whether supplier is active and available for selection';
COMMENT ON COLUMN suppliers.is_preferred IS 'Whether supplier is a preferred/priority partner';
COMMENT ON COLUMN suppliers.notes IS 'Internal notes about the supplier';
COMMENT ON COLUMN suppliers.default_terms_and_conditions IS 'Default terms and conditions text for bookings';
COMMENT ON COLUMN suppliers.default_cancellation_policy IS 'Default cancellation policy text for bookings';
