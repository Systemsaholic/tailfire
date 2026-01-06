CREATE TABLE IF NOT EXISTS "trip_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"media_type" "media_type" NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"caption" text,
	"is_cover_photo" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"attribution" jsonb,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uploaded_by" uuid
);
--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "cover_photo_url" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_media" ADD CONSTRAINT "trip_media_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
