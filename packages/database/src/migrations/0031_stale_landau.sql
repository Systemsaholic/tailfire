DO $$ BEGIN
 CREATE TYPE "public"."port_type" AS ENUM('departure', 'arrival', 'sea_day', 'port_call');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."api_provider" AS ENUM('supabase_storage', 'cloudflare_r2', 'backblaze_b2', 'unsplash');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."credential_status" AS ENUM('active', 'expired', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"provider" "api_provider" NOT NULL,
	"name" varchar(255) NOT NULL,
	"encrypted_credentials" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" "credential_status" DEFAULT 'active' NOT NULL,
	"last_rotated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "itinerary_activities" ADD COLUMN IF NOT EXISTS "parent_activity_id" uuid;--> statement-breakpoint
ALTER TABLE "component_media" ADD COLUMN IF NOT EXISTS "attribution" jsonb;--> statement-breakpoint
ALTER TABLE "port_info_details" ADD COLUMN IF NOT EXISTS "port_type" "port_type";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_credentials" ADD CONSTRAINT "api_credentials_parent_id_api_credentials_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."api_credentials"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itinerary_activities" ADD CONSTRAINT "itinerary_activities_parent_activity_id_fk" FOREIGN KEY ("parent_activity_id") REFERENCES "public"."itinerary_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
