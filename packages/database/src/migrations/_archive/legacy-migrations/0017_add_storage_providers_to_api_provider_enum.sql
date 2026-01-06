-- Migration: Add Cloudflare R2 and Backblaze B2 Storage Providers
-- Description: Extends api_provider enum to support multiple storage backends
-- Author: System
-- Date: 2025-11-21
--
-- IMPORTANT: ALTER TYPE ADD VALUE cannot run inside a transaction block.
-- For production deployment, run each ALTER TYPE command separately:
--
-- psql $DATABASE_URL -c "ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'cloudflare_r2';"
-- psql $DATABASE_URL -c "ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'backblaze_b2';"
--
-- For local development with Supabase, this migration will run automatically.

-- Add Cloudflare R2 provider
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'cloudflare_r2';

-- Add Backblaze B2 provider
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'backblaze_b2';

-- Add comments for documentation
COMMENT ON TYPE api_provider IS 'Supported API providers: supabase_storage (Supabase Storage), cloudflare_r2 (Cloudflare R2), backblaze_b2 (Backblaze B2). All providers use S3-compatible APIs for consistency.';
