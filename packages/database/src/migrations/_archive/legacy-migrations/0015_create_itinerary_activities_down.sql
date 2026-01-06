-- Migration Rollback: Drop Itinerary Activities Table and Enums
-- Reverts changes from 0015_create_itinerary_activities.sql

-- Drop indexes
DROP INDEX IF EXISTS idx_activities_sequence;
DROP INDEX IF EXISTS idx_activities_start_datetime;
DROP INDEX IF EXISTS idx_activities_status;
DROP INDEX IF EXISTS idx_activities_type;
DROP INDEX IF EXISTS idx_activities_day_id;

-- Drop table
DROP TABLE IF EXISTS itinerary_activities;

-- Drop enums
DROP TYPE IF EXISTS pricing_type;
DROP TYPE IF EXISTS activity_status;
DROP TYPE IF EXISTS activity_type;
