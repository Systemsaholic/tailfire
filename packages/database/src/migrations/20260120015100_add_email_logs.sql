-- ==============================================================================
-- Migration: Add Email Logs Table
-- ==============================================================================
-- Creates the email_logs table for tracking sent emails.
-- RLS enabled but NO policies (API-only access via service_role).
-- ==============================================================================

-- Create email_status enum
DO $$ BEGIN
  CREATE TYPE "public"."email_status" AS ENUM (
    'pending',
    'sent',
    'failed',
    'filtered'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create email_logs table
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agency_id" uuid NOT NULL,
  "to_email" text[] NOT NULL,
  "cc_email" text[],
  "bcc_email" text[],
  "from_email" varchar(255) NOT NULL,
  "reply_to" varchar(255),
  "subject" text NOT NULL,
  "body_html" text,
  "body_text" text,
  "template_slug" varchar(100),
  "variables" jsonb,
  "status" "email_status" DEFAULT 'pending' NOT NULL,
  "provider" varchar(50) DEFAULT 'resend',
  "provider_message_id" varchar(255),
  "error_message" text,
  "trip_id" uuid,
  "contact_id" uuid,
  "activity_id" uuid,
  "sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid
);

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_trip_id_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_contact_id_contacts_id_fk"
    FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_activity_id_activities_id_fk"
    FOREIGN KEY ("activity_id") REFERENCES "public"."itinerary_activities"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_email_logs_agency_id" ON "email_logs" USING btree ("agency_id");
CREATE INDEX IF NOT EXISTS "idx_email_logs_trip_id" ON "email_logs" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "idx_email_logs_contact_id" ON "email_logs" USING btree ("contact_id");
CREATE INDEX IF NOT EXISTS "idx_email_logs_status" ON "email_logs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_email_logs_created_at" ON "email_logs" USING btree ("created_at");

-- Enable RLS but no policies (API-only access via service_role)
ALTER TABLE "email_logs" ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service_role (API access)
GRANT ALL ON "email_logs" TO service_role;
