-- Fix schema drift: add licensing_info and commission_settings to user_profiles
-- Idempotent: safe to run multiple times

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS licensing_info JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS commission_settings JSONB DEFAULT '{}';
