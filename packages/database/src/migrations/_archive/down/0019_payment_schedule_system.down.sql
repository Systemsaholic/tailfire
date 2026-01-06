-- Down Migration 0019: Rollback Payment Schedule System
-- Removes payment schedule config and expected payment items

-- Drop indexes
DROP INDEX IF EXISTS "idx_expected_payment_items_sequence";
DROP INDEX IF EXISTS "idx_expected_payment_items_status";
DROP INDEX IF EXISTS "idx_expected_payment_items_due_date";
DROP INDEX IF EXISTS "idx_expected_payment_items_config";
DROP INDEX IF EXISTS "idx_payment_schedule_config_pricing";

-- Drop tables (CASCADE will handle foreign key constraints)
DROP TABLE IF EXISTS "expected_payment_items" CASCADE;
DROP TABLE IF EXISTS "payment_schedule_config" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "expected_payment_status";
DROP TYPE IF EXISTS "deposit_type";
DROP TYPE IF EXISTS "schedule_type";

-- Remove columns from component_pricing
ALTER TABLE "component_pricing"
  DROP COLUMN IF EXISTS "total_price_cents",
  DROP COLUMN IF EXISTS "taxes_and_fees_cents";
