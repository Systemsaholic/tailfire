-- Migration: Update JWT hook to include user_status and block locked users
-- This replaces the existing function (CREATE OR REPLACE)

-- ==============================================================================
-- STEP 1: Update the custom access token hook function
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
  user_status text;
BEGIN
  -- Lookup user profile to get agency_id, role, and status
  SELECT agency_id, role::text, status::text
  INTO user_agency_id, user_role, user_status
  FROM public.user_profiles
  WHERE id = (event->>'user_id')::uuid;

  -- FAIL FAST: Don't issue tokens without agency_id/role
  IF user_agency_id IS NULL OR user_role IS NULL THEN
    RAISE EXCEPTION 'User profile incomplete: missing agency_id or role for user %', (event->>'user_id');
  END IF;

  -- Block locked users at token level
  IF user_status = 'locked' THEN
    RAISE EXCEPTION 'User account is locked for user %', (event->>'user_id');
  END IF;

  -- Build the claims object (pending users CAN get tokens - limited access enforced at API)
  claims := event->'claims';
  claims := jsonb_set(claims, '{agency_id}', to_jsonb(user_agency_id));
  claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  claims := jsonb_set(claims, '{user_id}', event->'user_id');
  claims := jsonb_set(claims, '{user_status}', to_jsonb(user_status));

  -- Return the modified event
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- ==============================================================================
-- STEP 2: Re-grant permissions (required after CREATE OR REPLACE)
-- ==============================================================================

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;

-- Grant usage on user_status enum to auth admin (matches user_role grant pattern)
GRANT USAGE ON TYPE public.user_status TO supabase_auth_admin;
