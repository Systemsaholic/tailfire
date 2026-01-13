-- ============================================================================
-- Fix Trip Reference Number Generation for NULL trip_type
-- ============================================================================
-- Ensures generate_trip_reference() handles NULL trip_type values by using
-- a fallback sequence key (DFT).
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
  sequence_key := COALESCE(NEW.trip_type::text, 'DFT');

  -- Get current year
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Get and increment sequence (atomic operation)
  INSERT INTO trip_reference_sequences (trip_type, year, last_sequence, updated_at)
  VALUES (sequence_key, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 1, now())
  ON CONFLICT (trip_type, year)
  DO UPDATE SET
    last_sequence = trip_reference_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO next_num;

  -- Format reference number: TYPE-YYYY-NNNNNN
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
