CREATE TABLE IF NOT EXISTS "custom_cruise_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_id" uuid NOT NULL,
	"traveltek_cruise_id" text,
	"source" varchar(50) DEFAULT 'manual',
	"cruise_line_name" varchar(255),
	"cruise_line_code" varchar(50),
	"cruise_line_id" uuid,
	"ship_name" varchar(255),
	"ship_code" varchar(50),
	"ship_class" varchar(100),
	"ship_image_url" text,
	"cruise_ship_id" uuid,
	"itinerary_name" varchar(255),
	"voyage_code" varchar(100),
	"region" varchar(100),
	"cruise_region_id" uuid,
	"nights" integer,
	"sea_days" integer,
	"departure_port" varchar(255),
	"departure_port_id" uuid,
	"departure_date" date,
	"departure_time" time,
	"departure_timezone" varchar(100),
	"arrival_port" varchar(255),
	"arrival_port_id" uuid,
	"arrival_date" date,
	"arrival_time" time,
	"arrival_timezone" varchar(100),
	"cabin_category" varchar(50),
	"cabin_code" varchar(50),
	"cabin_number" varchar(50),
	"cabin_deck" varchar(50),
	"cabin_image_url" text,
	"cabin_description" text,
	"booking_number" varchar(100),
	"fare_code" varchar(50),
	"booking_deadline" date,
	"port_calls_json" jsonb DEFAULT '[]'::jsonb,
	"cabin_pricing_json" jsonb DEFAULT '{}'::jsonb,
	"ship_content_json" jsonb DEFAULT '{}'::jsonb,
	"inclusions" text[],
	"special_requests" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_cruise_details_component_id_unique" UNIQUE("component_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cruise_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"provider" varchar(100) DEFAULT 'traveltek' NOT NULL,
	"provider_identifier" varchar(100) NOT NULL,
	"supplier_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cruise_lines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cruise_ships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"provider" varchar(100) DEFAULT 'traveltek' NOT NULL,
	"provider_identifier" varchar(100) NOT NULL,
	"cruise_line_id" uuid,
	"ship_class" varchar(100),
	"image_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cruise_ships_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cruise_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"provider" varchar(100) DEFAULT 'traveltek' NOT NULL,
	"provider_identifier" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cruise_regions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cruise_ports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"provider" varchar(100) DEFAULT 'traveltek' NOT NULL,
	"provider_identifier" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cruise_ports_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_cruise_details" ADD CONSTRAINT "custom_cruise_details_component_id_itinerary_activities_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."itinerary_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_cruise_details" ADD CONSTRAINT "custom_cruise_details_cruise_line_id_cruise_lines_id_fk" FOREIGN KEY ("cruise_line_id") REFERENCES "public"."cruise_lines"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_cruise_details" ADD CONSTRAINT "custom_cruise_details_cruise_ship_id_cruise_ships_id_fk" FOREIGN KEY ("cruise_ship_id") REFERENCES "public"."cruise_ships"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_cruise_details" ADD CONSTRAINT "custom_cruise_details_cruise_region_id_cruise_regions_id_fk" FOREIGN KEY ("cruise_region_id") REFERENCES "public"."cruise_regions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_cruise_details" ADD CONSTRAINT "custom_cruise_details_departure_port_id_cruise_ports_id_fk" FOREIGN KEY ("departure_port_id") REFERENCES "public"."cruise_ports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_cruise_details" ADD CONSTRAINT "custom_cruise_details_arrival_port_id_cruise_ports_id_fk" FOREIGN KEY ("arrival_port_id") REFERENCES "public"."cruise_ports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cruise_ships" ADD CONSTRAINT "cruise_ships_cruise_line_id_cruise_lines_id_fk" FOREIGN KEY ("cruise_line_id") REFERENCES "public"."cruise_lines"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
