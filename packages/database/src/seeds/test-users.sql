-- =============================================================================
-- Test Users Seed Script
-- =============================================================================
-- Creates test users for local development and QA environments.
--
-- Password for all users: Phoenix2026!
--
-- Usage:
--   psql $DATABASE_URL -f packages/database/src/seeds/test-users.sql
--   OR run via Supabase MCP execute_sql (for dev environments only)
--
-- IMPORTANT: Do NOT run on production!
-- =============================================================================

-- Configuration
DO $$
DECLARE
  -- Phoenix Voyages agency ID
  agency_id uuid := '00000000-0000-0000-0000-000000000001';
  instance_id uuid := '00000000-0000-0000-0000-000000000000';

  -- Pre-generated UUIDs for consistent test data (valid hex only)
  admin_id uuid := 'aaaa0001-0000-0000-0000-000000000001';
  agent_id uuid := 'aaaa0002-0000-0000-0000-000000000002';
  test_id  uuid := 'aaaa0003-0000-0000-0000-000000000003';

  -- Password: Phoenix2026! (bcrypt with 10 rounds)
  -- Generated with: crypt('Phoenix2026!', gen_salt('bf', 10))
  hashed_password text;

  now_ts timestamptz := NOW();
BEGIN
  -- Generate password hash
  hashed_password := crypt('Phoenix2026!', gen_salt('bf', 10));

  -- ===========================================================================
  -- ADMIN USER: admin@phoenixvoyages.ca
  -- ===========================================================================

  -- Delete existing (idempotent)
  DELETE FROM public.user_profiles WHERE id = admin_id;
  DELETE FROM auth.identities WHERE user_id = admin_id;
  DELETE FROM auth.users WHERE id = admin_id;

  -- Create auth.users record (confirmed_at is auto-generated from email_confirmed_at)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    phone_change,
    phone_change_token,
    reauthentication_token,
    email_change_confirm_status,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  ) VALUES (
    instance_id,
    admin_id,
    'authenticated',
    'authenticated',
    'admin@phoenixvoyages.ca',
    hashed_password,
    now_ts,  -- email_confirmed_at
    '',      -- confirmation_token (empty string, not NULL)
    '',      -- recovery_token
    '',      -- email_change_token_new
    '',      -- email_change_token_current
    '',      -- email_change
    '',      -- phone_change
    '',      -- phone_change_token
    '',      -- reauthentication_token
    0,       -- email_change_confirm_status
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'role', 'admin',
      'agency_id', agency_id
    ),
    jsonb_build_object('email_verified', true),
    false,   -- is_sso_user
    false,   -- is_anonymous
    now_ts,
    now_ts
  );

  -- Create auth.identities record
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_id::text,
    admin_id,
    jsonb_build_object(
      'sub', admin_id::text,
      'email', 'admin@phoenixvoyages.ca',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now_ts,
    now_ts,
    now_ts
  );

  -- Create user_profiles record
  INSERT INTO public.user_profiles (
    id,
    agency_id,
    email,
    first_name,
    last_name,
    role,
    status,
    is_active,
    is_public_profile,
    social_media_links,
    email_signature_config,
    platform_preferences,
    licensing_info,
    commission_settings,
    created_at,
    updated_at
  ) VALUES (
    admin_id,
    agency_id,
    'admin@phoenixvoyages.ca',
    'Phoenix',
    'Admin',
    'admin',
    'active',
    true,
    false,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    now_ts,
    now_ts
  );

  -- ===========================================================================
  -- AGENT USER: agent@phoenixvoyages.ca
  -- ===========================================================================

  DELETE FROM public.user_profiles WHERE id = agent_id;
  DELETE FROM auth.identities WHERE user_id = agent_id;
  DELETE FROM auth.users WHERE id = agent_id;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change,
    phone_change, phone_change_token, reauthentication_token,
    email_change_confirm_status, raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    instance_id, agent_id, 'authenticated', 'authenticated',
    'agent@phoenixvoyages.ca', hashed_password,
    now_ts, '', '', '', '', '', '', '', '', 0,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'user', 'agency_id', agency_id),
    jsonb_build_object('email_verified', true),
    false, false, now_ts, now_ts
  );

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), agent_id::text, agent_id,
    jsonb_build_object('sub', agent_id::text, 'email', 'agent@phoenixvoyages.ca', 'email_verified', true, 'phone_verified', false),
    'email', now_ts, now_ts, now_ts
  );

  INSERT INTO public.user_profiles (
    id, agency_id, email, first_name, last_name, role, status, is_active,
    is_public_profile, social_media_links, email_signature_config,
    platform_preferences, licensing_info, commission_settings, created_at, updated_at
  ) VALUES (
    agent_id, agency_id, 'agent@phoenixvoyages.ca', 'Phoenix', 'Agent', 'user', 'active', true,
    false, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now_ts, now_ts
  );

  -- ===========================================================================
  -- TEST USER: test@phoenixvoyages.ca
  -- ===========================================================================

  DELETE FROM public.user_profiles WHERE id = test_id;
  DELETE FROM auth.identities WHERE user_id = test_id;
  DELETE FROM auth.users WHERE id = test_id;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change,
    phone_change, phone_change_token, reauthentication_token,
    email_change_confirm_status, raw_app_meta_data, raw_user_meta_data,
    is_sso_user, is_anonymous, created_at, updated_at
  ) VALUES (
    instance_id, test_id, 'authenticated', 'authenticated',
    'test@phoenixvoyages.ca', hashed_password,
    now_ts, '', '', '', '', '', '', '', '', 0,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'user', 'agency_id', agency_id),
    jsonb_build_object('email_verified', true),
    false, false, now_ts, now_ts
  );

  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (
    gen_random_uuid(), test_id::text, test_id,
    jsonb_build_object('sub', test_id::text, 'email', 'test@phoenixvoyages.ca', 'email_verified', true, 'phone_verified', false),
    'email', now_ts, now_ts, now_ts
  );

  INSERT INTO public.user_profiles (
    id, agency_id, email, first_name, last_name, role, status, is_active,
    is_public_profile, social_media_links, email_signature_config,
    platform_preferences, licensing_info, commission_settings, created_at, updated_at
  ) VALUES (
    test_id, agency_id, 'test@phoenixvoyages.ca', 'Phoenix', 'Tester', 'user', 'active', true,
    false, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now_ts, now_ts
  );

  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE 'Email: admin@phoenixvoyages.ca | Password: Phoenix2026! | Role: admin';
  RAISE NOTICE 'Email: agent@phoenixvoyages.ca | Password: Phoenix2026! | Role: user';
  RAISE NOTICE 'Email: test@phoenixvoyages.ca  | Password: Phoenix2026! | Role: user';
END $$;
