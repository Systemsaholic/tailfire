/**
 * Migration: Add Timezone Columns
 *
 * Adds IANA timezone identifier columns to contacts and trips tables.
 * These columns store the timezone context for interpreting calendar dates.
 *
 * Design Decisions:
 * - All timezone columns are nullable (no backfill required)
 * - Uses VARCHAR(64) to store IANA timezone identifiers (e.g., 'America/Toronto')
 * - Contact timezone: User's local timezone for displaying dates/times
 * - Trip timezone: Primary timezone for the trip (typically destination or start location)
 * - No constraint on timezone values at DB level (validation happens in application layer)
 *
 * Related:
 * - Phase 1: Date utility library created in packages/shared-types
 * - Phase 3: API DTOs will validate timezone values against IANA list
 * - Phase 4: Services will use timezone-aware date utilities
 */

-- Add timezone column to contacts table
-- This represents the user's preferred timezone for displaying dates/times
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "timezone" varchar(64);

COMMENT ON COLUMN "contacts"."timezone" IS 'IANA timezone identifier for this contact (e.g., America/Toronto). Used to display dates/times in the user''s local timezone.';

-- Add timezone column to trips table
-- This represents the primary timezone for the trip (typically destination or start location)
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "timezone" varchar(64);

COMMENT ON COLUMN "trips"."timezone" IS 'IANA timezone identifier for this trip (e.g., America/Toronto). Used to interpret trip dates (start_date, end_date) in the correct timezone context.';
