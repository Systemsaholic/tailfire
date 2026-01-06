-- Rollback Migration: Remove Unsplash Provider from API Provider Enum
-- Description: Removes unsplash from api_provider enum
-- Author: System
-- Date: 2025-11-21
--
-- WARNING: PostgreSQL does not support directly removing enum values.
-- This requires recreating the enum type if data allows.
--
-- PREREQUISITE: Ensure no rows use 'unsplash' provider before running:
-- SELECT COUNT(*) FROM api_credentials WHERE provider = 'unsplash';

-- Step 1: Create new enum without unsplash
CREATE TYPE api_provider_new AS ENUM ('supabase_storage', 'cloudflare_r2', 'backblaze_b2');

-- Step 2: Update column to use new enum (fails if unsplash values exist)
ALTER TABLE api_credentials
  ALTER COLUMN provider TYPE api_provider_new
  USING provider::text::api_provider_new;

-- Step 3: Drop old enum and rename new one
DROP TYPE api_provider;
ALTER TYPE api_provider_new RENAME TO api_provider;

-- Step 4: Update comment
COMMENT ON TYPE api_provider IS 'Supported API providers: supabase_storage (Supabase Storage), cloudflare_r2 (Cloudflare R2), backblaze_b2 (Backblaze B2). All providers use S3-compatible APIs.';
