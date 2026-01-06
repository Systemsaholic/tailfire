-- ============================================================================
-- Migration 0005: Lifecycle & Status System
-- ============================================================================
-- Description: Add contact type (lead/client) and status lifecycle tracking
-- Author: Tailfire Development Team
-- Date: 2025-01-13

-- Step 1: Create enums
DO $$ BEGIN
  CREATE TYPE contact_type_enum AS ENUM ('lead', 'client');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_status_enum AS ENUM (
    'prospecting',   -- Lead only
    'quoted',        -- Client: has active quotes
    'booked',        -- Client: has confirmed upcoming trip
    'traveling',     -- Client: currently on trip
    'returned',      -- Client: recently returned
    'awaiting_next', -- Client: returned, no active quotes
    'inactive'       -- Client: dormant
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add lifecycle columns (nullable initially for existing data)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type contact_type_enum;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_status contact_status_enum;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS became_client_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_booking_date DATE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_trip_return_date DATE;

-- Step 3: Backfill existing contacts as leads
UPDATE contacts
SET contact_type = 'lead',
    contact_status = 'prospecting'
WHERE contact_type IS NULL;

-- Step 4: Make columns NOT NULL after backfill
ALTER TABLE contacts ALTER COLUMN contact_type SET DEFAULT 'lead';
ALTER TABLE contacts ALTER COLUMN contact_type SET NOT NULL;
ALTER TABLE contacts ALTER COLUMN contact_status SET DEFAULT 'prospecting';
ALTER TABLE contacts ALTER COLUMN contact_status SET NOT NULL;

-- Step 5: Add business rule constraints
ALTER TABLE contacts ADD CONSTRAINT check_lead_status
  CHECK (contact_type != 'lead' OR contact_status = 'prospecting');

ALTER TABLE contacts ADD CONSTRAINT check_client_timestamp
  CHECK (contact_type != 'client' OR became_client_at IS NOT NULL);

-- Step 6: One-way door trigger (prevents client → lead demotion)
CREATE OR REPLACE FUNCTION prevent_client_demotion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.contact_type = 'client' AND NEW.contact_type = 'lead' THEN
    RAISE EXCEPTION 'Cannot demote client back to lead (one-way door)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_client_one_way_door ON contacts;
CREATE TRIGGER enforce_client_one_way_door
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_client_demotion();

-- Step 7: Auto-promotion trigger (with guard to prevent re-triggering)
CREATE OR REPLACE FUNCTION auto_promote_to_client()
RETURNS TRIGGER AS $$
BEGIN
  -- GUARD: Only fire when first_booking_date transitions from null → value
  IF NEW.contact_type = 'lead'
     AND NEW.first_booking_date IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.first_booking_date IS NULL) THEN
    NEW.contact_type := 'client';
    NEW.became_client_at := NOW();
    NEW.contact_status := 'booked';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_promote_on_booking ON contacts;
CREATE TRIGGER auto_promote_on_booking
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_to_client();

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration, run:
/*
DROP TRIGGER IF EXISTS auto_promote_on_booking ON contacts;
DROP FUNCTION IF EXISTS auto_promote_to_client();
DROP TRIGGER IF EXISTS enforce_client_one_way_door ON contacts;
DROP FUNCTION IF EXISTS prevent_client_demotion();

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_client_timestamp;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_lead_status;
ALTER TABLE contacts DROP COLUMN IF EXISTS last_trip_return_date;
ALTER TABLE contacts DROP COLUMN IF EXISTS first_booking_date;
ALTER TABLE contacts DROP COLUMN IF EXISTS became_client_at;
ALTER TABLE contacts DROP COLUMN IF EXISTS contact_status;
ALTER TABLE contacts DROP COLUMN IF EXISTS contact_type;

DROP TYPE IF EXISTS contact_status_enum;
DROP TYPE IF EXISTS contact_type_enum;
*/
