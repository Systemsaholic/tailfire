-- ============================================================================
-- Migration 0007: Travel Credentials & Preferences
-- ============================================================================
-- Description: Add TSA credentials, enhanced passport fields, travel preferences
-- Author: Tailfire Development Team
-- Date: 2025-01-13

-- Step 1: TSA credentials (Alpha-proven)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS redress_number VARCHAR(20);
-- TSA Redress Number for travelers with watch list issues

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS known_traveler_number VARCHAR(20);
-- Supports TSA PreCheck, Global Entry, NEXUS, etc.

-- Step 2: Enhanced passport fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS passport_country VARCHAR(3);
-- ISO 3166-1 alpha-3 country code

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS passport_issue_date DATE;
-- Passport issue date (complements existing passport_expiry)

-- Step 3: Travel preferences (Alpha-proven)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS seat_preference VARCHAR(20);
-- Options: 'aisle', 'window', 'middle', 'no_preference'

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS cabin_preference VARCHAR(20);
-- Options: 'economy', 'premium_economy', 'business', 'first', 'no_preference'

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS floor_preference VARCHAR(20);
-- Options: 'high', 'low', 'no_preference'

-- Step 4: Extensible preferences (JSONB for future use)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS travel_preferences JSONB DEFAULT '{}';
-- Allows for custom preferences without schema changes
-- Examples: { "bedType": "king", "pillow": "firm", "roomView": "ocean" }

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- To rollback this migration, run:
/*
ALTER TABLE contacts DROP COLUMN IF EXISTS travel_preferences;
ALTER TABLE contacts DROP COLUMN IF EXISTS floor_preference;
ALTER TABLE contacts DROP COLUMN IF EXISTS cabin_preference;
ALTER TABLE contacts DROP COLUMN IF EXISTS seat_preference;
ALTER TABLE contacts DROP COLUMN IF EXISTS passport_issue_date;
ALTER TABLE contacts DROP COLUMN IF EXISTS passport_country;
ALTER TABLE contacts DROP COLUMN IF EXISTS known_traveler_number;
ALTER TABLE contacts DROP COLUMN IF EXISTS redress_number;
*/
