-- ============================================================================
-- Fix Trip Reference Number Generation for NULL trip_type
-- ============================================================================
-- Migration 0032: Fixes the generate_trip_reference() function to handle
-- NULL trip_type values correctly by using 'DFT' as the sequence key
-- when trip_type is NULL.
--
-- Issue: When creating a trip without a trip_type, the INSERT into
-- trip_reference_sequences fails because:
-- 1. trip_type column is NOT NULL in trip_reference_sequences
-- 2. COALESCE(enum_value, 'text') tries to cast 'text' to the enum type
--
-- Fix: Explicitly cast NEW.trip_type::text before COALESCE to avoid
-- implicit enum casting that would fail for non-enum string values.
-- ============================================================================

-- Drop existing triggers first (they will be recreated)
DROP TRIGGER IF EXISTS set_trip_reference_insert ON trips;
DROP TRIGGER IF EXISTS set_trip_reference_update ON trips;

-- Recreate function with proper type casting for NULL handling
CREATE OR REPLACE FUNCTION generate_trip_reference()
RETURNS TRIGGER AS $$
DECLARE
  type_prefix TEXT;
  sequence_key TEXT;
  year_part TEXT;
  next_num INTEGER;
BEGIN
  -- Map trip_type to prefix (cast enum to text for CASE comparison)
  -- FIT: Free Independent Travel
  -- GRP: Group Travel
  -- BUS: Business
  -- MICE: Meetings, Incentives, Conferences, Events
  -- DFT: Draft (temporary reference for draft trips or trips without type)
  CASE NEW.trip_type::text
    WHEN 'leisure' THEN type_prefix := 'FIT';
    WHEN 'honeymoon' THEN type_prefix := 'FIT';
    WHEN 'custom' THEN type_prefix := 'FIT';
    WHEN 'group' THEN type_prefix := 'GRP';
    WHEN 'business' THEN type_prefix := 'BUS';
    WHEN 'corporate' THEN type_prefix := 'MICE';
    ELSE type_prefix := 'DFT';
  END CASE;

  -- Cast enum to text BEFORE coalescing to avoid implicit cast of 'DFT' to enum
  -- This ensures we can track sequences even for trips without a type
  sequence_key := COALESCE(NEW.trip_type::text, 'DFT');

  -- Get current year
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get and increment sequence (atomic operation)
  -- Uses ON CONFLICT to handle concurrent inserts safely
  INSERT INTO trip_reference_sequences (trip_type, year, last_sequence, updated_at)
  VALUES (sequence_key, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 1, now())
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

-- Recreate trigger on INSERT: Auto-generate reference for all new trips
CREATE TRIGGER set_trip_reference_insert
  BEFORE INSERT ON trips
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_trip_reference();
--> statement-breakpoint

-- Recreate trigger on UPDATE: Regenerate reference for drafts when trip_type changes
CREATE TRIGGER set_trip_reference_update
  BEFORE UPDATE ON trips
  FOR EACH ROW
  WHEN (
    NEW.status = 'draft' AND
    OLD.trip_type IS DISTINCT FROM NEW.trip_type
  )
  EXECUTE FUNCTION generate_trip_reference();
