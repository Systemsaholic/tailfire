-- Create options_details table for upsell options (upgrades, tours, excursions, insurance, meal plans)
-- Polymorphic pattern: extends itinerary_activities base component

CREATE TABLE IF NOT EXISTS "options_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL UNIQUE,

	-- Option Classification
	"option_category" varchar(50),

	-- Selection & Availability
	"is_selected" boolean DEFAULT false,
	"availability_start_date" date,
	"availability_end_date" date,
	"booking_deadline" date,

	-- Capacity
	"min_participants" integer,
	"max_participants" integer,
	"spots_available" integer,

	-- Duration
	"duration_minutes" integer,
	"meeting_point" varchar(255),
	"meeting_time" time,

	-- Provider/Vendor information
	"provider_name" varchar(255),
	"provider_phone" varchar(50),
	"provider_email" varchar(255),
	"provider_website" varchar(500),

	-- Details (text[] arrays)
	"inclusions" text[],
	"exclusions" text[],
	"requirements" text[],
	"what_to_bring" text[],

	-- Display
	"display_order" integer,
	"highlight_text" varchar(100),
	"instructions_text" text,

	-- Audit fields
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,

	-- Foreign key constraint
	CONSTRAINT "options_details_component_id_itinerary_activities_id_fk"
		FOREIGN KEY ("component_id")
		REFERENCES "public"."itinerary_activities"("id")
		ON DELETE cascade
		ON UPDATE no action,

	-- CHECK constraints for category enum validation
	CONSTRAINT "options_details_category_check"
		CHECK (option_category IS NULL OR option_category IN ('upgrade', 'add_on', 'tour', 'excursion', 'insurance', 'meal_plan', 'other')),

	-- CHECK constraints for numeric fields
	CONSTRAINT "options_details_min_participants_check"
		CHECK (min_participants IS NULL OR min_participants >= 0),

	CONSTRAINT "options_details_max_participants_check"
		CHECK (max_participants IS NULL OR max_participants >= 0),

	CONSTRAINT "options_details_participants_range_check"
		CHECK (
			min_participants IS NULL OR
			max_participants IS NULL OR
			max_participants >= min_participants
		),

	CONSTRAINT "options_details_duration_check"
		CHECK (duration_minutes IS NULL OR duration_minutes >= 0),

	CONSTRAINT "options_details_spots_available_check"
		CHECK (spots_available IS NULL OR spots_available >= 0)
);

-- Create index for component_id lookups
CREATE INDEX IF NOT EXISTS "idx_options_details_component_id" ON "options_details" USING btree ("component_id");

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS "idx_options_details_option_category" ON "options_details" USING btree ("option_category");

-- Create index for display ordering
CREATE INDEX IF NOT EXISTS "idx_options_details_display_order" ON "options_details" USING btree ("display_order");
