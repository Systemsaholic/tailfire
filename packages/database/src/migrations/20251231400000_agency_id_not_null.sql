-- Migration: Add NOT NULL constraints to agency_id columns in trip chain
--
-- Prerequisites:
-- - All agency_id columns must be backfilled (no NULL values)
-- - Run AFTER 20251231000000_auth_agency_id_denormalization.sql which added the columns
--
-- This ensures RLS policies can rely on agency_id always being present.

-- ============================================================================
-- Step 1: Verify no NULL values exist (safety check)
-- ============================================================================

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  -- Check trips
  SELECT COUNT(*) INTO null_count FROM trips WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: trips has % rows with NULL agency_id', null_count;
  END IF;

  -- Check itinerary_days
  SELECT COUNT(*) INTO null_count FROM itinerary_days WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: itinerary_days has % rows with NULL agency_id', null_count;
  END IF;

  -- Check itinerary_activities
  SELECT COUNT(*) INTO null_count FROM itinerary_activities WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: itinerary_activities has % rows with NULL agency_id', null_count;
  END IF;

  -- Check activity_pricing
  SELECT COUNT(*) INTO null_count FROM activity_pricing WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: activity_pricing has % rows with NULL agency_id', null_count;
  END IF;

  -- Check payment_schedule_config
  SELECT COUNT(*) INTO null_count FROM payment_schedule_config WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: payment_schedule_config has % rows with NULL agency_id', null_count;
  END IF;

  -- Check expected_payment_items
  SELECT COUNT(*) INTO null_count FROM expected_payment_items WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: expected_payment_items has % rows with NULL agency_id', null_count;
  END IF;

  -- Check payment_transactions
  SELECT COUNT(*) INTO null_count FROM payment_transactions WHERE agency_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL: payment_transactions has % rows with NULL agency_id', null_count;
  END IF;
END $$;

-- ============================================================================
-- Step 2: Add NOT NULL constraints
-- ============================================================================

-- Core trip chain
ALTER TABLE trips ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE itinerary_days ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE itinerary_activities ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE activity_pricing ALTER COLUMN agency_id SET NOT NULL;

-- Payment chain
ALTER TABLE payment_schedule_config ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE expected_payment_items ALTER COLUMN agency_id SET NOT NULL;
ALTER TABLE payment_transactions ALTER COLUMN agency_id SET NOT NULL;

-- ============================================================================
-- Step 3: Add comments documenting the constraint
-- ============================================================================

COMMENT ON COLUMN trips.agency_id IS 'Agency that owns this trip. Required for RLS.';
COMMENT ON COLUMN itinerary_days.agency_id IS 'Denormalized from trip for RLS. Required.';
COMMENT ON COLUMN itinerary_activities.agency_id IS 'Denormalized from trip for RLS. Required.';
COMMENT ON COLUMN activity_pricing.agency_id IS 'Denormalized from trip for RLS. Required.';
COMMENT ON COLUMN payment_schedule_config.agency_id IS 'Denormalized from trip for RLS. Required.';
COMMENT ON COLUMN expected_payment_items.agency_id IS 'Denormalized from trip for RLS. Required.';
COMMENT ON COLUMN payment_transactions.agency_id IS 'Denormalized from trip for RLS. Required.';
