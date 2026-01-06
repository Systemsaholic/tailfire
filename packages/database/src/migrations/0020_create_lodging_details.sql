-- Migration 0020: Create Lodging Details
-- Lodging-specific fields extending the base component model (hotels, resorts, etc.)

CREATE TABLE IF NOT EXISTS "lodging_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"property_name" varchar(255),
	"address" text,
	"phone" varchar(50),
	"website" varchar(255),
	"check_in_date" date NOT NULL,
	"check_in_time" time,
	"check_out_date" date NOT NULL,
	"check_out_time" time,
	"timezone" varchar(100),
	"room_type" varchar(100),
	"room_count" integer DEFAULT 1 NOT NULL,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"special_requests" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lodging_details_component_id_unique" UNIQUE("component_id"),
	CONSTRAINT "room_count_positive" CHECK ("room_count" > 0),
	CONSTRAINT "checkout_after_checkin" CHECK ("check_out_date" >= "check_in_date")
);
--> statement-breakpoint

-- Foreign key to base component table
ALTER TABLE "lodging_details"
	ADD CONSTRAINT "lodging_details_component_id_fkey"
	FOREIGN KEY ("component_id")
	REFERENCES "itinerary_activities"("id")
	ON DELETE CASCADE;
--> statement-breakpoint

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_lodging_details_component_id" ON "lodging_details"("component_id");
