-- Add trip_group entity type and group-related actions for audit logging

DO $$
BEGIN
  -- Add trip_group entity type
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trip_group' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'trip_group';
  END IF;
END$$;

DO $$
BEGIN
  -- Add group-related actions
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moved_to_group' AND enumtypid = 'activity_action'::regtype) THEN
    ALTER TYPE activity_action ADD VALUE 'moved_to_group';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'removed_from_group' AND enumtypid = 'activity_action'::regtype) THEN
    ALTER TYPE activity_action ADD VALUE 'removed_from_group';
  END IF;
END$$;
