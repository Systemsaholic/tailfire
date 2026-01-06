-- Phase 11: RLS API-First Lockdown
-- Strategy: Enable RLS, minimal policies, API bypasses via postgres role
-- Scope: agencies, user_profiles, contacts, trips

-- ============================================================================
-- STEP 1: Enable RLS (no access by default)
-- ============================================================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners (hardening)
ALTER TABLE public.agencies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.trips FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Allow policies (minimal)
-- ============================================================================

-- Agencies: authenticated can read (safe - no sensitive data)
DROP POLICY IF EXISTS agencies_authenticated_select ON public.agencies;
CREATE POLICY agencies_authenticated_select
  ON public.agencies
  FOR SELECT
  TO authenticated
  USING (true);

-- User Profiles: authenticated can read own record only
DROP POLICY IF EXISTS user_profiles_self_select ON public.user_profiles;
CREATE POLICY user_profiles_self_select
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- STEP 3: Contacts & Trips - No policies = complete lockout
-- ============================================================================

-- No policies created for contacts or trips
-- RLS enabled + FORCE + no policies = denied for authenticated/anon
-- API (postgres) bypasses RLS entirely
