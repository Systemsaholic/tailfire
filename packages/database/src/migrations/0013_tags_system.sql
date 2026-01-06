CREATE TABLE IF NOT EXISTS "contact_tags" (
	"contact_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_tags_contact_id_tag_id_pk" PRIMARY KEY("contact_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50),
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_tags" (
	"trip_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_tags_trip_id_tag_id_pk" PRIMARY KEY("trip_id","tag_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_tags" ADD CONSTRAINT "contact_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_tags" ADD CONSTRAINT "trip_tags_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_tags" ADD CONSTRAINT "trip_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_tags_contact_id" ON "contact_tags" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_tags_tag_id" ON "contact_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tags_name" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trip_tags_trip_id" ON "trip_tags" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trip_tags_tag_id" ON "trip_tags" USING btree ("tag_id");--> statement-breakpoint

-- ============================================================================
-- DATA MIGRATION: Migrate existing tags from text[] arrays to central system
-- ============================================================================

-- Step 1: Extract and deduplicate all unique tags from trips.tags array
INSERT INTO tags (name, category, created_at, updated_at)
SELECT DISTINCT
  TRIM(tag) as name,
  'trip' as category,  -- Mark as trip-originated tags
  NOW() as created_at,
  NOW() as updated_at
FROM trips
CROSS JOIN LATERAL UNNEST(tags) AS tag
WHERE tags IS NOT NULL
  AND array_length(tags, 1) > 0
  AND TRIM(tag) != ''  -- Skip empty tags
ON CONFLICT (name) DO NOTHING;  -- Skip if tag already exists

-- Step 2: Extract and deduplicate all unique tags from contacts.tags array
INSERT INTO tags (name, category, created_at, updated_at)
SELECT DISTINCT
  TRIM(tag) as name,
  'contact' as category,  -- Mark as contact-originated tags
  NOW() as created_at,
  NOW() as updated_at
FROM contacts
CROSS JOIN LATERAL UNNEST(tags) AS tag
WHERE tags IS NOT NULL
  AND array_length(tags, 1) > 0
  AND TRIM(tag) != ''  -- Skip empty tags
ON CONFLICT (name) DO NOTHING;  -- Skip if tag already exists

-- Step 3: Populate trip_tags junction table from trips.tags array
INSERT INTO trip_tags (trip_id, tag_id, created_at)
SELECT DISTINCT
  t.id as trip_id,
  tg.id as tag_id,
  NOW() as created_at
FROM trips t
CROSS JOIN LATERAL UNNEST(t.tags) AS tag_name
INNER JOIN tags tg ON TRIM(tag_name) = tg.name
WHERE t.tags IS NOT NULL
  AND array_length(t.tags, 1) > 0
ON CONFLICT DO NOTHING;  -- Skip if relationship already exists

-- Step 4: Populate contact_tags junction table from contacts.tags array
INSERT INTO contact_tags (contact_id, tag_id, created_at)
SELECT DISTINCT
  c.id as contact_id,
  tg.id as tag_id,
  NOW() as created_at
FROM contacts c
CROSS JOIN LATERAL UNNEST(c.tags) AS tag_name
INNER JOIN tags tg ON TRIM(tag_name) = tg.name
WHERE c.tags IS NOT NULL
  AND array_length(c.tags, 1) > 0
ON CONFLICT DO NOTHING;  -- Skip if relationship already exists

-- ============================================================================
-- IMPORTANT: Old tags columns are PRESERVED for backward compatibility
-- They will be kept in sync via application logic until full migration is verified
-- Remove in a future migration after validation
-- ============================================================================