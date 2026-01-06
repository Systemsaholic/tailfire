-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Enables multi-tenant data isolation with agency-scoped access
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Enable RLS on core tables
-- WARNING: Once enabled, all access is denied until policies are added
-- ==============================================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_pricing ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 2: Trips Policies
-- - SELECT: All users can see all agency trips
-- - INSERT: All users can create trips
-- - UPDATE: Admins can edit all, users can only edit their own
-- - DELETE: Admins or owners only
-- ==============================================================================

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
-- STEP 3: Contacts Policies
-- - SELECT: All agency contacts (filtering for sensitive data done in API)
-- - INSERT: Admins can create agency-wide, users must set owner_id to themselves
-- - UPDATE: Admins can edit all, users can only edit their own
-- - DELETE: Admins or owners only
-- ==============================================================================

-- SELECT: All agency contacts (all users can see all rows)
CREATE POLICY "contacts_select" ON contacts FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

-- INSERT: Admins can create any (including agency-wide), users must set owner_id
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
-- STEP 4: Trip Chain Policies (Simple Agency Scope)
-- These tables inherit access from the parent trip
-- ==============================================================================

-- Itineraries
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

-- Itinerary Days
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

-- Itinerary Activities
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

-- Activity Pricing
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
-- STEP 5: Grant access to authenticated role
-- Supabase uses 'authenticated' role for logged-in users
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itineraries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itinerary_days TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON itinerary_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_pricing TO authenticated;

-- ==============================================================================
-- NOTES
-- ==============================================================================
--
-- 1. Service Role bypasses RLS - use only for migrations/scripts
-- 2. The API uses service role key, so RLS is bypassed in the API layer
--    The API implements its own auth checks via NestJS guards
-- 3. RLS primarily protects direct database access (Supabase client from browser)
-- 4. Phase 2+ will add:
--    - trip_collaborators table for sharing trips
--    - contact_shares table for sharing contacts
--    - Helper functions like is_trip_collaborator()
--
-- ==============================================================================
