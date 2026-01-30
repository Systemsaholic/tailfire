-- Fix: change BEFORE DELETE trigger to AFTER DELETE on itinerary_activities
-- The BEFORE trigger conflicts with CASCADE deletes from trips because it
-- UPDATEs child rows that the cascade is simultaneously trying to DELETE.
-- As an AFTER trigger, the UPDATE is a harmless no-op during cascades.
-- Only recreate if the function exists (some environments may not have it).

DROP TRIGGER IF EXISTS trg_unlink_children_before_package_delete ON itinerary_activities;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unlink_children_on_package_delete') THEN
    CREATE TRIGGER trg_unlink_children_before_package_delete
      AFTER DELETE ON itinerary_activities
      FOR EACH ROW
      EXECUTE FUNCTION unlink_children_on_package_delete();
  END IF;
END;
$$;
