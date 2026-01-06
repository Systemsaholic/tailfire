-- Migration: Add aerodatabox to api_provider enum
-- Purpose: Enable Aerodatabox Flight API integration as the first external API provider
-- NOTE: Run `pnpm db:generate` after this migration to regenerate Drizzle types

-- Add aerodatabox enum value
-- This is a safe operation: ALTER TYPE ... ADD VALUE is irreversible but non-breaking
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'aerodatabox';

-- Future providers will be added in separate migrations when implemented:
-- - google_places (Slice 4)
-- - booking_com (Slice 4)
-- - visa_requirements (Slice 4)
