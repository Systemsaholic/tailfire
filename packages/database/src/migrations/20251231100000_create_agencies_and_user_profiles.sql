-- Auth Migration: Create agencies and user_profiles tables
-- These tables support multi-tenant authentication with Supabase

-- ==============================================================================
-- STEP 1: Create user_role enum
-- ==============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- STEP 2: Create agencies table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on slug for lookups
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);

-- ==============================================================================
-- STEP 3: Create user_profiles table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY, -- Matches auth.users.id
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE RESTRICT,
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_agency_id ON user_profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ==============================================================================
-- STEP 4: Create default agency for development
-- ==============================================================================

-- Insert a default agency for development/testing
INSERT INTO agencies (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Tailfire Demo Agency', 'demo')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- STEP 5: Backfill trips with missing agency_id
-- ==============================================================================

-- Update any trips with NULL agency_id to use the demo agency
UPDATE trips
SET agency_id = '00000000-0000-0000-0000-000000000001'
WHERE agency_id IS NULL;

-- ==============================================================================
-- STEP 6: Re-run backfill for trip chain tables
-- ==============================================================================

-- Backfill itineraries from trips
UPDATE itineraries SET agency_id = t.agency_id
FROM trips t
WHERE itineraries.trip_id = t.id
  AND itineraries.agency_id IS NULL;

-- Backfill itinerary_days from itineraries
UPDATE itinerary_days SET agency_id = i.agency_id
FROM itineraries i
WHERE itinerary_days.itinerary_id = i.id
  AND itinerary_days.agency_id IS NULL;

-- Backfill itinerary_activities from itinerary_days
UPDATE itinerary_activities SET agency_id = d.agency_id
FROM itinerary_days d
WHERE itinerary_activities.itinerary_day_id = d.id
  AND itinerary_activities.agency_id IS NULL;

-- Backfill floating activities via parent activity
UPDATE itinerary_activities child SET agency_id = parent.agency_id
FROM itinerary_activities parent
WHERE child.parent_activity_id = parent.id
  AND child.agency_id IS NULL
  AND parent.agency_id IS NOT NULL;

-- Backfill activity_pricing from itinerary_activities
UPDATE activity_pricing SET agency_id = a.agency_id
FROM itinerary_activities a
WHERE activity_pricing.activity_id = a.id
  AND activity_pricing.agency_id IS NULL;

-- Backfill payment_schedule_config from activity_pricing
UPDATE payment_schedule_config SET agency_id = ap.agency_id
FROM activity_pricing ap
WHERE payment_schedule_config.activity_pricing_id = ap.id
  AND payment_schedule_config.agency_id IS NULL;

-- Backfill expected_payment_items from payment_schedule_config
UPDATE expected_payment_items SET agency_id = psc.agency_id
FROM payment_schedule_config psc
WHERE expected_payment_items.payment_schedule_config_id = psc.id
  AND expected_payment_items.agency_id IS NULL;

-- Backfill payment_transactions from expected_payment_items
UPDATE payment_transactions SET agency_id = epi.agency_id
FROM expected_payment_items epi
WHERE payment_transactions.expected_payment_item_id = epi.id
  AND payment_transactions.agency_id IS NULL;
