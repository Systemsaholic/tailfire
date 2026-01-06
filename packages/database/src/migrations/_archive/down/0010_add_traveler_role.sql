-- ============================================================================
-- Rollback: Remove Traveler Role System
-- ============================================================================
-- Down Migration for 0010: Safely removes role enum from trip_travelers
--
-- This rollback is safe because:
-- 1. isPrimaryTraveler column was kept during migration
-- 2. No data loss - role can be reconstructed from isPrimaryTraveler
-- 3. Application can fall back to isPrimaryTraveler
--
-- Steps:
-- 1. Drop unique index for primary_contact enforcement
-- 2. Drop role column
-- 3. Drop traveler_role enum type
--
-- IMPORTANT: Only run this if issues are discovered with role system
-- ============================================================================

-- Step 1: Drop the unique index
DROP INDEX IF EXISTS one_primary_contact_per_trip;
--> statement-breakpoint

-- Step 2: Drop role column
ALTER TABLE trip_travelers
DROP COLUMN IF EXISTS role;
--> statement-breakpoint

-- Step 3: Drop traveler_role enum type
DROP TYPE IF EXISTS traveler_role;
--> statement-breakpoint

-- Note: isPrimaryTraveler column remains intact and functional
COMMENT ON COLUMN trip_travelers.is_primary_traveler IS 'Primary traveler flag. Role system was rolled back - using isPrimaryTraveler for now.';
