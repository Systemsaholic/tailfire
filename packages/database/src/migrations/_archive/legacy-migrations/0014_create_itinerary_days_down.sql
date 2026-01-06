-- Migration Rollback: Drop Itinerary Days Table
-- Reverts changes from 0014_create_itinerary_days.sql

DROP INDEX IF EXISTS idx_itinerary_days_sequence;
DROP INDEX IF EXISTS idx_itinerary_days_date;
DROP INDEX IF EXISTS idx_itinerary_days_itinerary_id;

DROP TABLE IF EXISTS itinerary_days;
