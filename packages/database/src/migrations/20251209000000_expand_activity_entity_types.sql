-- Migration: Expand activity_entity_type enum for comprehensive audit logging
-- Phase 1: Activities, Bookings, Installments, Documents, Media

-- Add new entity types to the enum
-- Using DO block because ALTER TYPE ADD VALUE cannot be inside a transaction
-- but the IF NOT EXISTS makes it idempotent

DO $$
BEGIN
  -- Activity-related entity types
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'activity' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'activity';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'booking';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'installment' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'installment';
  END IF;

  -- Document entity types
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'activity_document' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'activity_document';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'booking_document' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'booking_document';
  END IF;

  -- Media entity types
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'activity_media' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'activity_media';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trip_media' AND enumtypid = 'activity_entity_type'::regtype) THEN
    ALTER TYPE activity_entity_type ADD VALUE 'trip_media';
  END IF;
END$$;

-- Add comment for documentation
COMMENT ON TYPE activity_entity_type IS 'Entity types for audit logging. Phase 1 entities: trip, trip_traveler, itinerary, contact, user, activity, booking, installment, activity_document, booking_document, activity_media, trip_media';
