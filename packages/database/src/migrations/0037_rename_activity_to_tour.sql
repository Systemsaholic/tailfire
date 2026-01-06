-- Migration: Rename 'activity' enum value to 'tour'
-- This renames the activity type enum value to avoid confusion with the generic "activity" concept
-- Date: 2025-11-27

-- Step 1: Rename the enum value 'activity' to 'tour'
-- PostgreSQL's RENAME VALUE ensures atomic rename without adding new values
ALTER TYPE activity_type RENAME VALUE 'activity' TO 'tour';

-- Step 2: Update any existing records with the old value
-- Both activity_type and component_type columns may store this value
UPDATE itinerary_activities
SET activity_type = 'tour'
WHERE activity_type = 'activity';

UPDATE itinerary_activities
SET component_type = 'tour'
WHERE component_type = 'activity';
