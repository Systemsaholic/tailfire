-- Migration: Make component_media polymorphic to support multiple entity types
-- This allows media to be attached to activities, accommodations, flights, transfers, etc.

-- Create enum for entity types
DO $$ BEGIN
    CREATE TYPE component_entity_type AS ENUM (
        'activity',
        'accommodation',
        'flight',
        'transfer',
        'dining',
        'cruise',
        'port_info',
        'option'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add entity_type column with default 'activity' for existing records
ALTER TABLE component_media
ADD COLUMN IF NOT EXISTS entity_type component_entity_type NOT NULL DEFAULT 'activity';

-- Drop the foreign key constraint to itinerary_activities
-- This allows media to reference any entity type
DO $$ BEGIN
    ALTER TABLE component_media
    DROP CONSTRAINT IF EXISTS component_media_component_id_itinerary_activities_id_fk;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Rename component_id to entity_id for clarity (optional - keeping component_id for backward compat)
-- We'll keep component_id but add a comment
COMMENT ON COLUMN component_media.component_id IS 'The ID of the entity this media belongs to. Entity type is specified in entity_type column.';
COMMENT ON COLUMN component_media.entity_type IS 'The type of entity this media is attached to (activity, accommodation, flight, etc.)';

-- Create index for efficient lookups by entity type
CREATE INDEX IF NOT EXISTS idx_component_media_entity_type ON component_media(entity_type);
CREATE INDEX IF NOT EXISTS idx_component_media_component_entity ON component_media(component_id, entity_type);
