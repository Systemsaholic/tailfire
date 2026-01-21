-- ==============================================================================
-- Migration: Create Trip Orders Table
-- ==============================================================================
-- Stores Trip Order JSON snapshots with versioning for invoice generation.
-- RLS enabled but NO policies (API-only access via service_role).
-- ==============================================================================

-- Create trip_order_status enum
DO $$ BEGIN
  CREATE TYPE "public"."trip_order_status" AS ENUM (
    'draft',
    'finalized',
    'sent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create trip_orders table
CREATE TABLE IF NOT EXISTS "trip_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trip_id" uuid NOT NULL,
  "agency_id" uuid NOT NULL,
  "version_number" integer NOT NULL DEFAULT 1,

  -- JSON snapshots (immutable once created)
  "order_data" jsonb NOT NULL,
  "payment_summary" jsonb,
  "booking_details" jsonb,
  "business_config" jsonb,

  -- Status workflow: draft -> finalized -> sent
  "status" "trip_order_status" NOT NULL DEFAULT 'draft',

  -- Timestamps for workflow tracking
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "finalized_at" timestamp with time zone,
  "sent_at" timestamp with time zone,

  -- Audit: who performed each action
  "created_by" uuid,
  "finalized_by" uuid,
  "sent_by" uuid,

  -- Link to email log when sent
  "email_log_id" uuid,

  -- Unique constraint: one version number per trip
  CONSTRAINT "unique_trip_version" UNIQUE ("trip_id", "version_number")
);

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "trip_orders" ADD CONSTRAINT "trip_orders_trip_id_trips_id_fk"
    FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "trip_orders" ADD CONSTRAINT "trip_orders_email_log_id_email_logs_id_fk"
    FOREIGN KEY ("email_log_id") REFERENCES "public"."email_logs"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_trip_orders_trip_id" ON "trip_orders" USING btree ("trip_id");
CREATE INDEX IF NOT EXISTS "idx_trip_orders_agency_id" ON "trip_orders" USING btree ("agency_id");
CREATE INDEX IF NOT EXISTS "idx_trip_orders_status" ON "trip_orders" USING btree ("status");
CREATE INDEX IF NOT EXISTS "idx_trip_orders_created_at" ON "trip_orders" USING btree ("created_at");

-- Enable RLS but no policies (API-only access via service_role)
ALTER TABLE "trip_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "trip_orders" FORCE ROW LEVEL SECURITY;

-- Grant permissions to service_role (API access)
GRANT ALL ON "trip_orders" TO service_role;
