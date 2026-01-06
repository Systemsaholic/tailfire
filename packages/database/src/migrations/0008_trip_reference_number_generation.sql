-- ============================================================================
-- Trip Reference Number Auto-Generation
-- ============================================================================
-- Migration 0008: Implements table-based sequence storage for trip reference
-- numbers with format {TYPE_ID}-{YEAR}-{SEQUENCE} (e.g., FIT-2025-000001)
--
-- Features:
-- - Table-based sequence storage keyed by {trip_type, year}
-- - Annual sequence reset (sequences start at 1 each January)
-- - Auto-generation on INSERT for all new trips
-- - Regeneration on UPDATE for drafts when trip_type changes
-- - Reference numbers immutable once status leaves 'draft'
-- ============================================================================

-- Create sequence tracking table
CREATE TABLE IF NOT EXISTS "trip_reference_sequences" (
  "trip_type" varchar(50) NOT NULL,
  "year" integer NOT NULL,
  "last_sequence" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("trip_type", "year")
);
--> statement-breakpoint

-- Create function to generate trip reference numbers
CREATE OR REPLACE FUNCTION generate_trip_reference()
RETURNS TRIGGER AS $$
DECLARE
  type_prefix TEXT;
  year_part TEXT;
  next_num INTEGER;
BEGIN
  -- Map trip_type to prefix
  -- FIT: Free Independent Travel
  -- GRP: Group Travel
  -- BUS: Business
  -- MICE: Meetings, Incentives, Conferences, Events
  -- DFT: Draft (temporary reference for draft trips)
  CASE NEW.trip_type
    WHEN 'leisure' THEN type_prefix := 'FIT';
    WHEN 'honeymoon' THEN type_prefix := 'FIT';
    WHEN 'custom' THEN type_prefix := 'FIT';
    WHEN 'group' THEN type_prefix := 'GRP';
    WHEN 'business' THEN type_prefix := 'BUS';
    WHEN 'corporate' THEN type_prefix := 'MICE';
    ELSE type_prefix := 'DFT';
  END CASE;

  -- Get current year
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get and increment sequence (atomic operation)
  -- Uses ON CONFLICT to handle concurrent inserts safely
  INSERT INTO trip_reference_sequences (trip_type, year, last_sequence, updated_at)
  VALUES (NEW.trip_type, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 1, now())
  ON CONFLICT (trip_type, year)
  DO UPDATE SET
    last_sequence = trip_reference_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO next_num;

  -- Format reference number: TYPE-YYYY-NNNNNN (e.g., FIT-2025-000001)
  NEW.reference_number := type_prefix || '-' || year_part || '-' || LPAD(next_num::TEXT, 6, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Trigger on INSERT: Auto-generate reference for all new trips
CREATE TRIGGER set_trip_reference_insert
  BEFORE INSERT ON trips
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_trip_reference();
--> statement-breakpoint

-- Trigger on UPDATE: Regenerate reference for drafts when trip_type changes
-- Only fires when:
-- 1. Status is 'draft' (reference numbers become immutable after leaving draft)
-- 2. trip_type has changed (prevents unnecessary regeneration)
CREATE TRIGGER set_trip_reference_update
  BEFORE UPDATE ON trips
  FOR EACH ROW
  WHEN (
    NEW.status = 'draft' AND
    OLD.trip_type IS DISTINCT FROM NEW.trip_type
  )
  EXECUTE FUNCTION generate_trip_reference();
--> statement-breakpoint

-- Add unique constraint on reference_number to prevent duplicates
-- Only applies to non-null values (NULLs are allowed for backward compatibility)
ALTER TABLE trips ADD CONSTRAINT trips_reference_number_unique UNIQUE (reference_number);
--> statement-breakpoint

-- Add comment to document the reference number format
COMMENT ON COLUMN trips.reference_number IS 'Auto-generated trip reference in format {TYPE_ID}-{YEAR}-{SEQUENCE}. Examples: FIT-2025-000001, GRP-2025-000042. Immutable once status leaves draft.';
