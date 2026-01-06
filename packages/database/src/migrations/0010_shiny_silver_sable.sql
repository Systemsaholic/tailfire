-- ============================================================================
-- Add Traveler Role System
-- ============================================================================
-- Migration 0010: Adds role enum to trip_travelers table
--
-- Sprint 2.1 Phase 3 - Travelers Tab Management
--
-- Changes:
-- 1. Create traveler_role enum (primary_contact, full_access, limited_access)
-- 2. Add role column to trip_travelers table
-- 3. Backfill existing isPrimaryTraveler data
-- 4. Set role as NOT NULL with default 'limited_access'
--
-- IMPORTANT: Keep isPrimaryTraveler column during migration for backward compatibility
-- Future migration will remove isPrimaryTraveler once role is confirmed stable
-- ============================================================================

-- Step 1: Create traveler_role enum type
DO $$ BEGIN
  CREATE TYPE traveler_role AS ENUM (
    'primary_contact',
    'full_access',
    'limited_access'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Step 2: Add role column (nullable initially for backfill)
ALTER TABLE trip_travelers
ADD COLUMN IF NOT EXISTS role traveler_role;
--> statement-breakpoint

-- Step 3: Backfill existing data
-- Map isPrimaryTraveler = true → role = 'primary_contact'
-- Map isPrimaryTraveler = false → role = 'limited_access'
UPDATE trip_travelers
SET role = CASE
  WHEN is_primary_traveler = true THEN 'primary_contact'::traveler_role
  ELSE 'limited_access'::traveler_role
END
WHERE role IS NULL;
--> statement-breakpoint

-- Step 4: Make role NOT NULL with default
ALTER TABLE trip_travelers
ALTER COLUMN role SET NOT NULL,
ALTER COLUMN role SET DEFAULT 'limited_access'::traveler_role;
--> statement-breakpoint

-- Step 5: Add comment documenting the role system
COMMENT ON COLUMN trip_travelers.role IS 'Traveler access role: primary_contact (main decision maker), full_access (can view and decide), limited_access (view only). Matches TERN passenger management system.';
--> statement-breakpoint

-- Step 6: Add check constraint: Only one primary_contact per trip
-- This is enforced at application level, but we can add a partial unique index
-- for additional safety at database level
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_contact_per_trip
ON trip_travelers (trip_id)
WHERE role = 'primary_contact';
--> statement-breakpoint

COMMENT ON INDEX one_primary_contact_per_trip IS 'Ensures only one traveler per trip can have the primary_contact role';
