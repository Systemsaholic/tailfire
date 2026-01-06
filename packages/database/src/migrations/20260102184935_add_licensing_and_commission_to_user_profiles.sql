-- Migration: Add licensing info and commission settings to user_profiles
-- These JSONB columns store agent licensing details and commission configuration

-- Add licensing info (TICO, HST, TLN profile URL, etc.)
ALTER TABLE user_profiles
ADD COLUMN licensing_info JSONB DEFAULT '{}';

-- Add commission settings (default rate, split type, split value)
ALTER TABLE user_profiles
ADD COLUMN commission_settings JSONB DEFAULT '{}';
