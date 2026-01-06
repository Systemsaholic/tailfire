-- Migration: Add Bidirectional Relationship Uniqueness Constraint
-- This ensures that (A,B) and (B,A) cannot both exist as separate relationships
-- The functional unique index uses LEAST/GREATEST to normalize the pair order

-- Create unique index on normalized contact pair
-- This prevents both (contactA, contactB) and (contactB, contactA) from existing
CREATE UNIQUE INDEX IF NOT EXISTS unique_bidirectional_relationship
ON contact_relationships (
  LEAST(contact_id1, contact_id2),
  GREATEST(contact_id1, contact_id2)
);

-- Note: The existing unique_contact_relationship index on (contact_id1, contact_id2)
-- is still useful for exact lookups, but this new index enforces true bidirectional uniqueness
