-- Migration: Add Unsplash Provider to API Provider Enum
-- Description: Extends api_provider enum to support Unsplash stock photography
-- Author: System
-- Date: 2025-11-21
--
-- IMPORTANT: ALTER TYPE ADD VALUE cannot run inside a transaction block.
-- For production deployment, run this command separately:
--
-- psql $DATABASE_URL -c "ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'unsplash';"
--
-- For local development with Supabase, this migration will run automatically.

-- Add Unsplash provider
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'unsplash';

-- Update comments for documentation
COMMENT ON TYPE api_provider IS 'Supported API providers: supabase_storage (Supabase Storage), cloudflare_r2 (Cloudflare R2), backblaze_b2 (Backblaze B2), unsplash (Unsplash stock photography). Storage providers use S3-compatible APIs.';
