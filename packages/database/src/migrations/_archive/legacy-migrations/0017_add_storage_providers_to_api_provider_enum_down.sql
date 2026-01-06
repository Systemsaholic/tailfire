-- Migration Rollback: Remove Cloudflare R2 and Backblaze B2 Storage Providers
-- Description: This rollback is NOT SAFE if any credentials use these providers!
-- Author: System
-- Date: 2025-11-21
--
-- WARNING: PostgreSQL does not support removing enum values directly.
-- To rollback this migration, you must:
--
-- 1. Ensure no rows in api_credentials use 'cloudflare_r2' or 'backblaze_b2'
-- 2. Create a new enum without these values
-- 3. Alter the table to use the new enum
-- 4. Drop the old enum
--
-- Example rollback procedure (ONLY if no rows use R2/B2):
--
-- BEGIN;
--
-- -- Check for usage (will error if any found)
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM api_credentials WHERE provider IN ('cloudflare_r2', 'backblaze_b2')) THEN
--     RAISE EXCEPTION 'Cannot rollback: api_credentials table contains rows using cloudflare_r2 or backblaze_b2 providers';
--   END IF;
-- END $$;
--
-- -- Create new enum without R2 and B2
-- CREATE TYPE api_provider_new AS ENUM ('supabase_storage');
--
-- -- Alter table to use new enum
-- ALTER TABLE api_credentials
--   ALTER COLUMN provider TYPE api_provider_new
--   USING provider::text::api_provider_new;
--
-- -- Drop old enum and rename new one
-- DROP TYPE api_provider;
-- ALTER TYPE api_provider_new RENAME TO api_provider;
--
-- COMMIT;
--
-- NOTE: This is a complex rollback. It's recommended to backup your database first
-- and test the rollback procedure on a staging environment.

-- Safety check: Prevent rollback if R2 or B2 credentials exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM api_credentials WHERE provider IN ('cloudflare_r2', 'backblaze_b2')) THEN
    RAISE EXCEPTION 'Cannot rollback migration 0017: api_credentials table contains rows using cloudflare_r2 or backblaze_b2 providers. Please delete or migrate these credentials first.';
  END IF;

  RAISE NOTICE 'Safe to rollback: No R2 or B2 credentials found. However, manual enum modification is required (see migration comments).';
END $$;
