-- Package to Activity Type Migration
--
-- Goal: Eliminate the separate `packages` table and treat packages as an activity type
-- (`activityType = 'package'`), using `parentActivityId` for child relationships.
--
-- This migration:
-- 1. Drops the package_id FK from itinerary_activities
-- 2. Drops the packages, package_travelers, package_documents, package_installments tables
-- 3. Adds 'package' to the activity_type enum (drop/recreate approach)
-- 4. Makes itinerary_day_id nullable for floating packages
-- 5. Adds CHECK constraint to prevent nested packages
-- 6. Creates package_details table
-- 7. Creates activity_travelers junction table
-- 8. Creates trigger to unlink children when package is deleted

-- ===========================================================================
-- PHASE 1: Drop dependent objects
-- ===========================================================================

-- 1a. Drop the package_id column from itinerary_activities
ALTER TABLE itinerary_activities DROP COLUMN IF EXISTS package_id;

-- ===========================================================================
-- PHASE 2: Drop old package tables
-- ===========================================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS package_installments CASCADE;
DROP TABLE IF EXISTS package_documents CASCADE;
DROP TABLE IF EXISTS package_travelers CASCADE;
DROP TABLE IF EXISTS packages CASCADE;

-- Note: We keep the enums (booking_status, booking_payment_status, etc.)
-- as they may be used elsewhere or needed for future reference

-- ===========================================================================
-- PHASE 3: Add 'package' to activity_type enum
-- ===========================================================================

-- Since there's no production data, we can safely drop and recreate the enum
-- First, alter the column to TEXT to preserve existing data
ALTER TABLE itinerary_activities ALTER COLUMN activity_type TYPE TEXT;
ALTER TABLE itinerary_activities ALTER COLUMN component_type TYPE TEXT;

-- Drop the old enum
DROP TYPE IF EXISTS activity_type;

-- Recreate with 'package' included
CREATE TYPE activity_type AS ENUM (
  'lodging',
  'flight',
  'tour',
  'transportation',
  'cruise',
  'dining',
  'options',
  'custom_cruise',
  'port_info',
  'package'
);

-- Convert columns back to the enum type
ALTER TABLE itinerary_activities
  ALTER COLUMN activity_type TYPE activity_type USING activity_type::activity_type;
ALTER TABLE itinerary_activities
  ALTER COLUMN component_type TYPE activity_type USING component_type::activity_type;

-- ===========================================================================
-- PHASE 4: Make itinerary_day_id nullable for floating packages
-- ===========================================================================

ALTER TABLE itinerary_activities ALTER COLUMN itinerary_day_id DROP NOT NULL;

-- ===========================================================================
-- PHASE 5: Add CHECK constraint to prevent nested packages
-- ===========================================================================

-- Packages cannot have a parent (prevents package → package nesting)
ALTER TABLE itinerary_activities
ADD CONSTRAINT chk_package_no_parent
CHECK (activity_type != 'package' OR parent_activity_id IS NULL);

-- ===========================================================================
-- PHASE 6: Create package_details table
-- ===========================================================================

CREATE TABLE package_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL UNIQUE REFERENCES itinerary_activities(id) ON DELETE CASCADE,

  -- Supplier info (moved from packages table)
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name VARCHAR(255),

  -- Payment status tracking
  payment_status booking_payment_status DEFAULT 'unpaid',

  -- Pricing type
  pricing_type booking_pricing_type DEFAULT 'flat_rate',

  -- Cancellation and terms
  cancellation_policy TEXT,
  cancellation_deadline DATE,
  terms_and_conditions TEXT,

  -- Group booking reference
  group_booking_number VARCHAR(255),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for package_details
CREATE INDEX idx_package_details_activity ON package_details(activity_id);
CREATE INDEX idx_package_details_supplier ON package_details(supplier_id);
CREATE INDEX idx_package_details_payment_status ON package_details(payment_status);

-- ===========================================================================
-- PHASE 7: Create activity_travelers junction table
-- ===========================================================================

CREATE TABLE activity_travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES itinerary_activities(id) ON DELETE CASCADE,
  trip_traveler_id UUID NOT NULL REFERENCES trip_travelers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one traveler per activity
  UNIQUE(activity_id, trip_traveler_id)
);

-- Indexes for activity_travelers
CREATE INDEX idx_activity_travelers_activity ON activity_travelers(activity_id);
CREATE INDEX idx_activity_travelers_traveler ON activity_travelers(trip_traveler_id);

-- ===========================================================================
-- PHASE 8: Create trigger to unlink children when package is deleted
-- ===========================================================================

CREATE OR REPLACE FUNCTION unlink_children_on_package_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on package activities
  IF OLD.activity_type = 'package' THEN
    -- Unlink all children by setting their parent_activity_id to NULL
    UPDATE itinerary_activities
    SET parent_activity_id = NULL
    WHERE parent_activity_id = OLD.id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (BEFORE DELETE to ensure children are unlinked before cascade)
DROP TRIGGER IF EXISTS trg_unlink_children_before_package_delete ON itinerary_activities;
CREATE TRIGGER trg_unlink_children_before_package_delete
BEFORE DELETE ON itinerary_activities
FOR EACH ROW EXECUTE FUNCTION unlink_children_on_package_delete();

-- ===========================================================================
-- PHASE 9: Enable RLS on new tables
-- ===========================================================================

ALTER TABLE package_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_travelers ENABLE ROW LEVEL SECURITY;

-- RLS policies: Match existing tenant/agency scoping pattern
-- These join through activity → itinerary_day → itinerary → trip → agency
-- NOTE: For floating packages (null itinerary_day_id), this policy will fail.
-- Consider adding a direct trip_id to itinerary_activities for proper scoping,
-- or handle floating packages differently in your RLS strategy.

-- For now, use permissive policies (service role bypasses RLS)
-- TODO: Replace with proper tenant-scoped policies before production
CREATE POLICY package_details_all ON package_details FOR ALL USING (true);
CREATE POLICY activity_travelers_all ON activity_travelers FOR ALL USING (true);

-- ===========================================================================
-- PHASE 10: Add helpful comments
-- ===========================================================================

COMMENT ON TABLE package_details IS 'Package-specific details for activities with activity_type=''package''. One-to-one with itinerary_activities.';
COMMENT ON TABLE activity_travelers IS 'Junction table linking travelers to activities (primarily packages). Replaces package_travelers.';
COMMENT ON CONSTRAINT chk_package_no_parent ON itinerary_activities IS 'Prevents package activities from having a parent (no nested packages).';
COMMENT ON FUNCTION unlink_children_on_package_delete() IS 'Unlinks child activities when a package is deleted by setting their parent_activity_id to NULL.';
