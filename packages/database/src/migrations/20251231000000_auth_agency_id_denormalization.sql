-- Auth Migration: Add agency_id to trip chain tables and owner_id to contacts
-- This migration supports Row-Level Security (RLS) policies for multi-tenant isolation

-- ==============================================================================
-- STEP 1: Add columns (IF NOT EXISTS prevents duplicate column errors)
-- ==============================================================================

-- Core trip chain
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE itinerary_days ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE itinerary_activities ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE activity_pricing ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE payment_schedule_config ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE expected_payment_items ADD COLUMN IF NOT EXISTS agency_id UUID;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS agency_id UUID;

-- Contacts ownership
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id UUID;

-- ==============================================================================
-- STEP 2: Backfill agency_id from parent tables
-- ==============================================================================

-- 2a. Backfill itineraries from trips
UPDATE itineraries SET agency_id = t.agency_id
FROM trips t
WHERE itineraries.trip_id = t.id
  AND itineraries.agency_id IS NULL;

-- 2b. Backfill itinerary_days from itineraries
UPDATE itinerary_days SET agency_id = i.agency_id
FROM itineraries i
WHERE itinerary_days.itinerary_id = i.id
  AND itinerary_days.agency_id IS NULL;

-- 2c. Backfill itinerary_activities from itinerary_days (standard path)
UPDATE itinerary_activities SET agency_id = d.agency_id
FROM itinerary_days d
WHERE itinerary_activities.itinerary_day_id = d.id
  AND itinerary_activities.agency_id IS NULL;

-- 2d. EDGE CASE: Floating activities (NULL itinerary_day_id) - backfill via parent activity
-- These are package children that inherit from their parent's agency_id
UPDATE itinerary_activities child SET agency_id = parent.agency_id
FROM itinerary_activities parent
WHERE child.parent_activity_id = parent.id
  AND child.agency_id IS NULL
  AND parent.agency_id IS NOT NULL;

-- 2e. Backfill activity_pricing from itinerary_activities
UPDATE activity_pricing SET agency_id = a.agency_id
FROM itinerary_activities a
WHERE activity_pricing.activity_id = a.id
  AND activity_pricing.agency_id IS NULL;

-- 2f. Backfill payment_schedule_config from activity_pricing
UPDATE payment_schedule_config SET agency_id = ap.agency_id
FROM activity_pricing ap
WHERE payment_schedule_config.activity_pricing_id = ap.id
  AND payment_schedule_config.agency_id IS NULL;

-- 2g. Backfill expected_payment_items from payment_schedule_config
UPDATE expected_payment_items SET agency_id = psc.agency_id
FROM payment_schedule_config psc
WHERE expected_payment_items.payment_schedule_config_id = psc.id
  AND expected_payment_items.agency_id IS NULL;

-- 2h. Backfill payment_transactions from expected_payment_items
UPDATE payment_transactions SET agency_id = epi.agency_id
FROM expected_payment_items epi
WHERE payment_transactions.expected_payment_item_id = epi.id
  AND payment_transactions.agency_id IS NULL;

-- ==============================================================================
-- STEP 3: Verify backfill completeness (for manual review before NOT NULL)
-- These queries should return 0 after successful backfill
-- ==============================================================================

-- Note: Run these manually to verify before applying NOT NULL constraints:
-- SELECT COUNT(*) AS orphan_itineraries FROM itineraries WHERE agency_id IS NULL;
-- SELECT COUNT(*) AS orphan_days FROM itinerary_days WHERE agency_id IS NULL;
-- SELECT COUNT(*) AS orphan_activities FROM itinerary_activities WHERE agency_id IS NULL;
-- SELECT COUNT(*) AS orphan_pricing FROM activity_pricing WHERE agency_id IS NULL;
-- SELECT COUNT(*) AS orphan_psc FROM payment_schedule_config WHERE agency_id IS NULL;
-- SELECT COUNT(*) AS orphan_epi FROM expected_payment_items WHERE agency_id IS NULL;
-- SELECT COUNT(*) AS orphan_txn FROM payment_transactions WHERE agency_id IS NULL;

-- ==============================================================================
-- STEP 4: Create indexes for RLS performance
-- ==============================================================================

-- Create indexes on agency_id columns for efficient RLS policy execution
CREATE INDEX IF NOT EXISTS idx_itineraries_agency_id ON itineraries(agency_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_agency_id ON itinerary_days(agency_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_agency_id ON itinerary_activities(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_pricing_agency_id ON activity_pricing(agency_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedule_config_agency_id ON payment_schedule_config(agency_id);
CREATE INDEX IF NOT EXISTS idx_expected_payment_items_agency_id ON expected_payment_items(agency_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_agency_id ON payment_transactions(agency_id);

-- Create index on contacts.owner_id for ownership lookups
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);

-- ==============================================================================
-- STEP 5: Add NOT NULL constraints (run after verifying backfill)
-- NOTE: These are commented out - run manually after verification
-- ==============================================================================

-- To apply NOT NULL constraints after verification:
-- ALTER TABLE itineraries ALTER COLUMN agency_id SET NOT NULL;
-- ALTER TABLE itinerary_days ALTER COLUMN agency_id SET NOT NULL;
-- ALTER TABLE itinerary_activities ALTER COLUMN agency_id SET NOT NULL;
-- ALTER TABLE activity_pricing ALTER COLUMN agency_id SET NOT NULL;
-- ALTER TABLE payment_schedule_config ALTER COLUMN agency_id SET NOT NULL;
-- ALTER TABLE expected_payment_items ALTER COLUMN agency_id SET NOT NULL;
-- ALTER TABLE payment_transactions ALTER COLUMN agency_id SET NOT NULL;

-- Note: contacts.owner_id remains nullable (NULL = agency-wide contact)
