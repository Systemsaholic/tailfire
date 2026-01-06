-- Rollback: Remove component_type column
ALTER TABLE "itinerary_activities" DROP COLUMN "component_type";
