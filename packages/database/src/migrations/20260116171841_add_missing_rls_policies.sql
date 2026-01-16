-- ==============================================================================
-- Migration: Add Missing RLS Policies
-- ==============================================================================
-- The prod_baseline enabled RLS on all tables but only included 2 policies
-- (agencies_authenticated_select, user_profiles_self_select).
-- This migration adds all the missing policies for proper multi-tenant access.
--
-- Note: These policies use auth.jwt() for browser/client access.
-- The API uses postgres role which should bypass RLS.
-- ==============================================================================

-- ==============================================================================
-- TRIPS POLICIES
-- ==============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "trips_select" ON trips;
DROP POLICY IF EXISTS "trips_insert" ON trips;
DROP POLICY IF EXISTS "trips_update" ON trips;
DROP POLICY IF EXISTS "trips_delete" ON trips;

-- SELECT: Agency-scoped (all users see all agency trips)
CREATE POLICY "trips_select" ON trips FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

-- INSERT: Agency-scoped
CREATE POLICY "trips_insert" ON trips FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

-- UPDATE: Admins can edit all, users can only edit their own
CREATE POLICY "trips_update" ON trips FOR UPDATE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
);

-- DELETE: Admin or owner only
CREATE POLICY "trips_delete" ON trips FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
);

-- ==============================================================================
-- CONTACTS POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "contacts_select" ON contacts;
DROP POLICY IF EXISTS "contacts_insert" ON contacts;
DROP POLICY IF EXISTS "contacts_update" ON contacts;
DROP POLICY IF EXISTS "contacts_delete" ON contacts;

-- SELECT: All agency contacts
CREATE POLICY "contacts_select" ON contacts FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

-- INSERT: Admins can create any, users must set owner_id
CREATE POLICY "contacts_insert" ON contacts FOR INSERT
WITH CHECK (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
);

-- UPDATE: Admins can edit all, users can only edit their own
CREATE POLICY "contacts_update" ON contacts FOR UPDATE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
);

-- DELETE: Admin or owner only
CREATE POLICY "contacts_delete" ON contacts FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (
    (auth.jwt() ->> 'role') = 'admin'
    OR owner_id = (auth.jwt() ->> 'user_id')::uuid
  )
);

-- ==============================================================================
-- ITINERARIES POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "itineraries_select" ON itineraries;
DROP POLICY IF EXISTS "itineraries_insert" ON itineraries;
DROP POLICY IF EXISTS "itineraries_update" ON itineraries;
DROP POLICY IF EXISTS "itineraries_delete" ON itineraries;

CREATE POLICY "itineraries_select" ON itineraries FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itineraries_insert" ON itineraries FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itineraries_update" ON itineraries FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itineraries_delete" ON itineraries FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- ITINERARY_DAYS POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "itinerary_days_select" ON itinerary_days;
DROP POLICY IF EXISTS "itinerary_days_insert" ON itinerary_days;
DROP POLICY IF EXISTS "itinerary_days_update" ON itinerary_days;
DROP POLICY IF EXISTS "itinerary_days_delete" ON itinerary_days;

CREATE POLICY "itinerary_days_select" ON itinerary_days FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itinerary_days_insert" ON itinerary_days FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itinerary_days_update" ON itinerary_days FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itinerary_days_delete" ON itinerary_days FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- ITINERARY_ACTIVITIES POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "itinerary_activities_select" ON itinerary_activities;
DROP POLICY IF EXISTS "itinerary_activities_insert" ON itinerary_activities;
DROP POLICY IF EXISTS "itinerary_activities_update" ON itinerary_activities;
DROP POLICY IF EXISTS "itinerary_activities_delete" ON itinerary_activities;

CREATE POLICY "itinerary_activities_select" ON itinerary_activities FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itinerary_activities_insert" ON itinerary_activities FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itinerary_activities_update" ON itinerary_activities FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "itinerary_activities_delete" ON itinerary_activities FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- ACTIVITY_PRICING POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "activity_pricing_select" ON activity_pricing;
DROP POLICY IF EXISTS "activity_pricing_insert" ON activity_pricing;
DROP POLICY IF EXISTS "activity_pricing_update" ON activity_pricing;
DROP POLICY IF EXISTS "activity_pricing_delete" ON activity_pricing;

CREATE POLICY "activity_pricing_select" ON activity_pricing FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "activity_pricing_insert" ON activity_pricing FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "activity_pricing_update" ON activity_pricing FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "activity_pricing_delete" ON activity_pricing FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- GRANT PERMISSIONS TO AUTHENTICATED ROLE
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itineraries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itinerary_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itinerary_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_pricing TO authenticated;
