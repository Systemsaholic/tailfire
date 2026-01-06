-- Migration: Add user status enum and columns for user management
-- This adds status tracking separate from soft-delete (isActive)

-- 1. Create user_status enum
CREATE TYPE user_status AS ENUM ('active', 'pending', 'locked');

-- 2. Add status and related columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN status user_status NOT NULL DEFAULT 'active',
  ADD COLUMN invited_at TIMESTAMPTZ,
  ADD COLUMN invited_by UUID REFERENCES user_profiles(id),
  ADD COLUMN locked_at TIMESTAMPTZ,
  ADD COLUMN locked_reason TEXT;

-- 3. All existing users are active (explicit update for clarity)
UPDATE user_profiles SET status = 'active' WHERE status IS NULL;

-- 4. Add indexes for list filtering performance
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_agency_status ON user_profiles(agency_id, status);
