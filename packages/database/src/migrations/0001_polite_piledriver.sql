DO $$ BEGIN
 CREATE TYPE "public"."itinerary_status" AS ENUM('draft', 'presented', 'selected', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."traveler_group_type" AS ENUM('room', 'dining', 'activity', 'transfer', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."traveler_type" AS ENUM('adult', 'child', 'infant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."trip_status" AS ENUM('draft', 'quoted', 'booked', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."trip_type" AS ENUM('leisure', 'business', 'group', 'honeymoon', 'corporate', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "itinerary_status" DEFAULT 'draft' NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL,
	"estimated_cost" numeric(12, 2),
	"sequence_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "traveler_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"traveler_group_id" uuid NOT NULL,
	"trip_traveler_id" uuid NOT NULL,
	"role" varchar(100),
	"notes" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" uuid,
	CONSTRAINT "unique_traveler_group_member" UNIQUE("traveler_group_id","trip_traveler_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "traveler_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"group_type" "traveler_group_type" NOT NULL,
	"description" text,
	"sequence_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"commission_percentage" numeric(5, 2) NOT NULL,
	"role" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	CONSTRAINT "unique_trip_collaborator" UNIQUE("trip_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_travelers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"contact_id" uuid,
	"is_primary_traveler" boolean DEFAULT false NOT NULL,
	"traveler_type" "traveler_type" DEFAULT 'adult' NOT NULL,
	"contact_snapshot" jsonb,
	"emergency_contact_id" uuid,
	"emergency_contact_inline" jsonb,
	"traveler_group_id" uuid,
	"special_requirements" text,
	"sequence_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"branch_id" uuid,
	"owner_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"trip_type" "trip_type",
	"start_date" date,
	"end_date" date,
	"booking_date" date,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"primary_contact_id" uuid,
	"reference_number" varchar(100),
	"external_reference" varchar(255),
	"currency" varchar(3) DEFAULT 'CAD',
	"estimated_total_cost" numeric(12, 2),
	"tags" text[],
	"custom_fields" jsonb,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "traveler_group_members" ADD CONSTRAINT "traveler_group_members_traveler_group_id_traveler_groups_id_fk" FOREIGN KEY ("traveler_group_id") REFERENCES "public"."traveler_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "traveler_group_members" ADD CONSTRAINT "traveler_group_members_trip_traveler_id_trip_travelers_id_fk" FOREIGN KEY ("trip_traveler_id") REFERENCES "public"."trip_travelers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "traveler_groups" ADD CONSTRAINT "traveler_groups_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_collaborators" ADD CONSTRAINT "trip_collaborators_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_travelers" ADD CONSTRAINT "trip_travelers_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_travelers" ADD CONSTRAINT "trip_travelers_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_travelers" ADD CONSTRAINT "trip_travelers_emergency_contact_id_contacts_id_fk" FOREIGN KEY ("emergency_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trips" ADD CONSTRAINT "trips_primary_contact_id_contacts_id_fk" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
