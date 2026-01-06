CREATE TABLE IF NOT EXISTS "flight_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"airline" varchar(255),
	"flight_number" varchar(100),
	"departure_airport_code" varchar(10),
	"departure_date" date,
	"departure_time" time,
	"departure_timezone" varchar(64),
	"departure_terminal" varchar(50),
	"departure_gate" varchar(50),
	"arrival_airport_code" varchar(10),
	"arrival_date" date,
	"arrival_time" time,
	"arrival_timezone" varchar(64),
	"arrival_terminal" varchar(50),
	"arrival_gate" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flight_details_component_id_unique" UNIQUE("component_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "flight_details" ADD CONSTRAINT "flight_details_component_id_itinerary_activities_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."itinerary_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
