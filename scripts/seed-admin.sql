-- Admin User Bootstrap (run AFTER creating user in Supabase Auth)
-- Replace placeholders before running

-- Placeholder UUID: replace with actual auth.users.id after creating user
-- via Supabase Dashboard or CLI
INSERT INTO public.user_profiles (
  id,
  agency_id,
  email,
  first_name,
  last_name,
  role,
  status
)
VALUES (
  '__AUTH_USER_UUID__',
  '00000000-0000-0000-0000-000000000001',
  '__ADMIN_EMAIL__',
  'Admin',
  'User',
  'admin',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = NOW();
