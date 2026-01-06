-- ============================================================================
-- Migration 0004: Identity & Inclusive Fields
-- ============================================================================
-- Description: Add legal name separation, preferred name, LGBTQ+ inclusive fields
-- Author: Tailfire Development Team
-- Date: 2025-01-13

-- Step 1: Drop existing NOT NULL constraints on first_name and last_name
ALTER TABLE contacts ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN last_name DROP NOT NULL;

-- Step 2: Add legal name columns (Alpha-proven)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS legal_first_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS legal_last_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS middle_name TEXT;

-- Step 3: Add display identity
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_name TEXT;

-- Step 4: Add name elements
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS prefix VARCHAR(10);
-- Options: 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Mx.' (gender-neutral)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS suffix VARCHAR(10);
-- Options: 'Jr.', 'Sr.', 'III', 'PhD', 'Esq.'

-- Step 5: Add LGBTQ+ inclusive fields (all nullable/optional)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
-- Options: 'male', 'female', 'non-binary', 'prefer_not_to_say', or custom text

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS pronouns VARCHAR(50);
-- Examples: 'she/her', 'he/him', 'they/them', 'ze/zir', or custom

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);
-- Options: 'single', 'married', 'domestic_partnership', 'civil_union', 'widowed', 'divorced'

-- Step 6: Add flexible name constraint (replaces old NOT NULL)
ALTER TABLE contacts ADD CONSTRAINT check_has_name
  CHECK (
    first_name IS NOT NULL OR
    legal_first_name IS NOT NULL OR
    preferred_name IS NOT NULL
  );

-- Step 7: Backfill existing data (preserve current firstName/lastName)
UPDATE contacts
SET legal_first_name = first_name,
    legal_last_name = last_name
WHERE legal_first_name IS NULL;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration, run:
/*
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS check_has_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS marital_status;
ALTER TABLE contacts DROP COLUMN IF EXISTS pronouns;
ALTER TABLE contacts DROP COLUMN IF EXISTS gender;
ALTER TABLE contacts DROP COLUMN IF EXISTS suffix;
ALTER TABLE contacts DROP COLUMN IF EXISTS prefix;
ALTER TABLE contacts DROP COLUMN IF EXISTS preferred_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS middle_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS legal_last_name;
ALTER TABLE contacts DROP COLUMN IF EXISTS legal_first_name;
ALTER TABLE contacts ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE contacts ALTER COLUMN last_name SET NOT NULL;
*/
