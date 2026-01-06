-- Port Info Details Table
-- Extended details for port/cruise information
-- One-to-one relationship with itinerary_activities

CREATE TABLE IF NOT EXISTS "port_info_details" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "component_id" uuid NOT NULL,
  "port_name" varchar(255),
  "port_location" varchar(255),
  "arrival_date" date,
  "arrival_time" time,
  "departure_date" date,
  "departure_time" time,
  "timezone" varchar(100),
  "dock_name" varchar(255),
  "address" text,
  "coordinates" jsonb,
  "phone" varchar(50),
  "website" varchar(500),
  "excursion_notes" text,
  "tender_required" boolean DEFAULT false,
  "special_requests" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "port_info_details_component_id_unique" UNIQUE("component_id")
);

-- Foreign key to itinerary_activities with cascade delete
ALTER TABLE "port_info_details"
  ADD CONSTRAINT "port_info_details_component_id_fkey"
  FOREIGN KEY ("component_id")
  REFERENCES "itinerary_activities"("id")
  ON DELETE CASCADE;

-- Index on component_id for efficient lookups
CREATE INDEX IF NOT EXISTS "port_info_details_component_id_idx" ON "port_info_details"("component_id");
