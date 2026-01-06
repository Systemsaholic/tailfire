-- Migration: Create API Credentials System
-- Description: Secure storage for API credentials with versioning and rotation support
-- Author: System
-- Date: 2025-11-20

-- Create ENUM types for provider and status
CREATE TYPE api_provider AS ENUM ('supabase_storage');
CREATE TYPE credential_status AS ENUM ('active', 'expired', 'revoked');

-- Create api_credentials table
-- parent_id: NULL for version 1, set to parent credential ID for rotations
-- version: Must be >= 1, increments on rotation
-- is_active: Only one active credential per provider enforced by exclusion constraint
CREATE TABLE api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES api_credentials(id) ON DELETE SET NULL,
  provider api_provider NOT NULL,
  name VARCHAR(255) NOT NULL,
  encrypted_credentials JSONB NOT NULL, -- Structure: {iv, ciphertext, authTag}
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status credential_status NOT NULL DEFAULT 'active',
  last_rotated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID, -- Nullable until auth system ready
  updated_by UUID, -- Nullable until auth system ready

  -- Constraints
  CONSTRAINT version_must_be_positive CHECK (version >= 1),
  CONSTRAINT only_one_active_per_provider
    EXCLUDE (provider WITH =) WHERE (is_active = true)
);

-- Create indexes for performance
CREATE INDEX idx_api_credentials_provider ON api_credentials(provider);
CREATE INDEX idx_api_credentials_active ON api_credentials(is_active) WHERE is_active = true;
CREATE INDEX idx_api_credentials_parent ON api_credentials(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_api_credentials_status ON api_credentials(status);

-- Add comment for documentation
COMMENT ON TABLE api_credentials IS 'Stores encrypted API credentials with versioning support. Rotation creates new rows with parent_id set. Rollback flips is_active flags.';
COMMENT ON COLUMN api_credentials.parent_id IS 'NULL for initial version (v1), references parent credential ID for rotations';
COMMENT ON COLUMN api_credentials.encrypted_credentials IS 'AES-256-GCM encrypted credentials: {iv: base64, ciphertext: base64, authTag: base64}';
COMMENT ON COLUMN api_credentials.version IS 'Version number starting at 1, incremented on rotation';
COMMENT ON COLUMN api_credentials.is_active IS 'Only one credential per provider can be active (enforced by exclusion constraint)';
