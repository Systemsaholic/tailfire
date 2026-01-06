-- Add cover photo, overview, and date fields to itineraries table
-- Following TERN's pattern: name, dates, cover photo, overview

ALTER TABLE "itineraries"
ADD COLUMN "cover_photo" text,
ADD COLUMN "overview" text,
ADD COLUMN "start_date" date,
ADD COLUMN "end_date" date;

-- Add comment explaining these fields
COMMENT ON COLUMN "itineraries"."cover_photo" IS 'Optional cover photo URL. Shown as the first photo when multiple itineraries are used';
COMMENT ON COLUMN "itineraries"."overview" IS 'Optional rich text overview statement shown to travelers with each itinerary option';
COMMENT ON COLUMN "itineraries"."start_date" IS 'Itinerary start date (can override trip start date)';
COMMENT ON COLUMN "itineraries"."end_date" IS 'Itinerary end date (can override trip end date)';
