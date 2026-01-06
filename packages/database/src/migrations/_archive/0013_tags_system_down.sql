-- ============================================================================
-- DOWN MIGRATION: Rollback central tagging system to text[] arrays
-- ============================================================================
-- This script safely rolls back the tags system by:
-- 1. Restoring tags arrays from junction tables
-- 2. Dropping the new tables
--
-- IMPORTANT: This assumes trips.tags and contacts.tags columns still exist
-- ============================================================================

-- Step 1: Restore trips.tags array from trip_tags junction table
-- Only update trips that have tags in the junction table
UPDATE trips t
SET tags = (
  SELECT array_agg(tg.name ORDER BY tg.name)
  FROM trip_tags tt
  INNER JOIN tags tg ON tt.tag_id = tg.id
  WHERE tt.trip_id = t.id
)
WHERE EXISTS (
  SELECT 1 FROM trip_tags tt WHERE tt.trip_id = t.id
);

-- Step 2: Restore contacts.tags array from contact_tags junction table
-- Only update contacts that have tags in the junction table
UPDATE contacts c
SET tags = (
  SELECT array_agg(tg.name ORDER BY tg.name)
  FROM contact_tags ct
  INNER JOIN tags tg ON ct.tag_id = tg.id
  WHERE ct.contact_id = c.id
)
WHERE EXISTS (
  SELECT 1 FROM contact_tags ct WHERE ct.contact_id = c.id
);

-- Step 3: Drop junction tables
DROP TABLE IF EXISTS trip_tags;
DROP TABLE IF EXISTS contact_tags;

-- Step 4: Drop tags table
DROP TABLE IF EXISTS tags;

-- ============================================================================
-- Rollback complete - system restored to text[] array-based tags
-- ============================================================================
