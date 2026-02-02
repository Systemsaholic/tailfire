-- Add snapshot staleness tracking and contact deletion awareness to trip_travelers
-- Issue 1: snapshotUpdatedAt for staleness detection
-- Issue 3: contactDeletedAt for contact deletion awareness

ALTER TABLE trip_travelers
  ADD COLUMN snapshot_updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN contact_deleted_at TIMESTAMPTZ;

-- Backfill snapshotUpdatedAt to match updatedAt for existing rows
UPDATE trip_travelers SET snapshot_updated_at = updated_at WHERE snapshot_updated_at IS NULL;
