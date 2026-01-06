-- JWT Custom Claims Hook
-- Adds agency_id, user_id, and role to the JWT token
-- Enable in Supabase Dashboard: Authentication > Hooks > Custom Access Token Hook

-- ==============================================================================
-- STEP 1: Create the custom access token hook function
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_agency_id uuid;
  user_role text;
BEGIN
  -- Lookup user profile to get agency_id and role
  SELECT agency_id, role::text INTO user_agency_id, user_role
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  -- FAIL FAST: Don't issue tokens without agency_id/role
  -- This prevents login if user_profiles row doesn't exist
  IF user_agency_id IS NULL OR user_role IS NULL THEN
    RAISE EXCEPTION 'User profile incomplete: missing agency_id or role for user %', (event->>'user_id');
  END IF;

  -- Build the claims object
  claims := event->'claims';
  claims := jsonb_set(claims, '{agency_id}', to_jsonb(user_agency_id));
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  claims := jsonb_set(claims, '{user_id}', event->'user_id');

  -- Return the modified event
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- ==============================================================================
-- STEP 2: Grant permissions
-- ==============================================================================

-- Grant execute to supabase_auth_admin (required for hook to work)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from public for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- Grant usage on user_role type
GRANT USAGE ON TYPE user_role TO supabase_auth_admin;

-- ==============================================================================
-- INSTRUCTIONS FOR SUPABASE DASHBOARD
-- ==============================================================================
--
-- After running this migration:
-- 1. Go to Supabase Dashboard > Authentication > Hooks
-- 2. Enable "Custom Access Token Hook"
-- 3. Select the function: public.custom_access_token_hook
-- 4. Save changes
--
-- Test by logging in - the JWT will now contain:
-- {
--   "agency_id": "uuid",
--   "role": "admin" | "user",
--   "user_id": "uuid"
-- }
-- ==============================================================================
