-- ==============================================================================
-- MVP: Extend user_profiles with essential profile fields
-- JSONB with DEFAULT '{}' for required structures, nullable for optional
-- ==============================================================================

-- Avatar & Public Profile (all nullable)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS public_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS office_address JSONB;

-- Social & Marketing (default empty object for required structure)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}'::jsonb;

-- Emergency Contact (nullable)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);

-- Platform Settings (default empty objects for required structure)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email_signature_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS platform_preferences JSONB DEFAULT '{}'::jsonb;

-- Public Profile Visibility (agent opts in to B2C directory)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_public_profile BOOLEAN NOT NULL DEFAULT false;

-- ==============================================================================
-- DEFERRED TO FOLLOW-UP:
-- commission_rate, tico_certification_number, hst_number
-- billing_address, mailing_address
-- specialties[], languages_spoken[]
-- tln_agent_profile_url, territory
-- ==============================================================================
