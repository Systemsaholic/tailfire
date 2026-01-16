-- Add TICO compliance lock fields and agency_id to expected_payment_items
-- These fields prevent modification of payment items once paid

-- Add agency_id column for RLS (denormalized for performance)
-- Backfill from activity_pricing through payment_schedule_config
ALTER TABLE expected_payment_items
ADD COLUMN IF NOT EXISTS agency_id UUID;

-- Backfill agency_id from activity_pricing
UPDATE expected_payment_items epi
SET agency_id = ap.agency_id
FROM payment_schedule_config psc
JOIN activity_pricing ap ON ap.id = psc.component_pricing_id
WHERE epi.payment_schedule_config_id = psc.id
  AND epi.agency_id IS NULL;

-- Make agency_id NOT NULL after backfill
ALTER TABLE expected_payment_items
ALTER COLUMN agency_id SET NOT NULL;

-- Add is_locked column with default value
ALTER TABLE expected_payment_items
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Add locked_at timestamp
ALTER TABLE expected_payment_items
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Add locked_by reference
ALTER TABLE expected_payment_items
ADD COLUMN IF NOT EXISTS locked_by UUID;

-- Add comment explaining the purpose
COMMENT ON COLUMN expected_payment_items.is_locked IS 'TICO compliance: prevents modification once paid';
COMMENT ON COLUMN expected_payment_items.locked_at IS 'Timestamp when item was locked';
COMMENT ON COLUMN expected_payment_items.locked_by IS 'User ID who locked the item';
