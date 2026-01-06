-- Migration 0023: Create Dining Details
-- Dining-specific fields extending the base component model (restaurants, reservations, etc.)

CREATE TABLE IF NOT EXISTS "dining_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"restaurant_name" varchar(255),
	"cuisine_type" varchar(100),
	"meal_type" varchar(50),
	"reservation_date" date,
	"reservation_time" time,
	"timezone" varchar(100),
	"party_size" integer,
	"address" text,
	"phone" varchar(50),
	"website" varchar(500),
	"coordinates" jsonb,
	"price_range" varchar(50),
	"dress_code" varchar(100),
	"dietary_requirements" text[],
	"special_requests" text,
	"menu_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dining_details_component_id_unique" UNIQUE("component_id"),
	CONSTRAINT "dining_details_party_size_check" CHECK ("party_size" IS NULL OR ("party_size" >= 1 AND "party_size" <= 100))
);
--> statement-breakpoint

-- Foreign key to base component table
ALTER TABLE "dining_details"
	ADD CONSTRAINT "dining_details_component_id_fkey"
	FOREIGN KEY ("component_id")
	REFERENCES "itinerary_activities"("id")
	ON DELETE CASCADE;
--> statement-breakpoint

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "dining_details_component_id_idx" ON "dining_details"("component_id");
