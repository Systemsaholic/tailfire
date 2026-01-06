-- Migration: Create insurance tables for trip insurance packages and traveler coverage
-- This enables per-traveler insurance tracking with compliance states

-- Create insurance policy type enum
CREATE TYPE "insurance_policy_type" AS ENUM (
  'trip_cancellation',
  'medical',
  'comprehensive',
  'evacuation',
  'baggage',
  'other'
);

-- Create traveler insurance status enum
CREATE TYPE "traveler_insurance_status" AS ENUM (
  'pending',
  'has_own_insurance',
  'declined',
  'selected_package'
);

-- Create trip_insurance_packages table (insurance options available for a trip)
CREATE TABLE IF NOT EXISTS "trip_insurance_packages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "provider_name" varchar(255) NOT NULL,
  "package_name" varchar(255) NOT NULL,
  "policy_type" "insurance_policy_type" NOT NULL,
  "coverage_amount_cents" integer,
  "premium_cents" integer NOT NULL,
  "deductible_cents" integer,
  "currency" varchar(3) NOT NULL DEFAULT 'CAD',
  "coverage_start_date" date,
  "coverage_end_date" date,
  "coverage_details" jsonb,
  "terms_url" text,
  "is_from_catalog" boolean DEFAULT false,
  "display_order" integer DEFAULT 0,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create trip_traveler_insurance table (per-traveler insurance status)
CREATE TABLE IF NOT EXISTS "trip_traveler_insurance" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trip_id" uuid NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "trip_traveler_id" uuid NOT NULL REFERENCES "trip_travelers"("id") ON DELETE CASCADE,
  "status" "traveler_insurance_status" NOT NULL DEFAULT 'pending',
  "selected_package_id" uuid REFERENCES "trip_insurance_packages"("id") ON DELETE SET NULL,
  "external_policy_number" varchar(100),
  "external_provider_name" varchar(255),
  "external_coverage_details" text,
  "declined_reason" text,
  "declined_at" timestamp with time zone,
  "acknowledged_at" timestamp with time zone,
  "premium_paid_cents" integer,
  "policy_number" varchar(100),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  -- One insurance record per traveler per trip
  CONSTRAINT "trip_traveler_insurance_unique_traveler" UNIQUE ("trip_id", "trip_traveler_id")
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "trip_insurance_packages_trip_id_idx" ON "trip_insurance_packages" ("trip_id");
CREATE INDEX IF NOT EXISTS "trip_traveler_insurance_trip_id_idx" ON "trip_traveler_insurance" ("trip_id");
CREATE INDEX IF NOT EXISTS "trip_traveler_insurance_traveler_id_idx" ON "trip_traveler_insurance" ("trip_traveler_id");
CREATE INDEX IF NOT EXISTS "trip_traveler_insurance_status_idx" ON "trip_traveler_insurance" ("status");
