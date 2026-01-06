-- Migration 0019: Payment Schedule System
-- Extends existing component_pricing and payment_schedule tables
-- Adds payment_schedule_config and expected_payment_items tables

-- Create new enums
DO $$ BEGIN
 CREATE TYPE "schedule_type" AS ENUM('full', 'deposit', 'installments');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "deposit_type" AS ENUM('percentage', 'fixed_amount');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "expected_payment_status" AS ENUM('pending', 'partial', 'paid', 'overdue');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Extend component_pricing table
ALTER TABLE "component_pricing"
  ADD COLUMN IF NOT EXISTS "total_price_cents" integer,
  ADD COLUMN IF NOT EXISTS "taxes_and_fees_cents" integer DEFAULT 0;

-- Note: currency column already exists in component_pricing from migration 0017

-- Create payment_schedule_config table (1:1 with component_pricing)
CREATE TABLE IF NOT EXISTS "payment_schedule_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component_pricing_id" uuid NOT NULL,
	"schedule_type" "schedule_type" DEFAULT 'full' NOT NULL,
	"allow_partial_payments" boolean DEFAULT false,
	"deposit_type" "deposit_type",
	"deposit_percentage" numeric(5, 2),
	"deposit_amount_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_schedule_config_component_pricing_id_unique" UNIQUE("component_pricing_id"),
	CONSTRAINT "deposit_percentage_range" CHECK ("deposit_percentage" >= 0 AND "deposit_percentage" <= 100),
	CONSTRAINT "deposit_amount_positive" CHECK ("deposit_amount_cents" >= 0)
);
--> statement-breakpoint

-- Create expected_payment_items table (1:many with payment_schedule_config)
CREATE TABLE IF NOT EXISTS "expected_payment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_schedule_config_id" uuid NOT NULL,
	"payment_name" varchar(100) NOT NULL,
	"expected_amount_cents" integer NOT NULL,
	"due_date" date,
	"status" "expected_payment_status" DEFAULT 'pending' NOT NULL,
	"sequence_order" integer DEFAULT 0 NOT NULL,
	"paid_amount_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expected_amount_positive" CHECK ("expected_amount_cents" >= 0),
	CONSTRAINT "paid_not_exceed_expected" CHECK ("paid_amount_cents" <= "expected_amount_cents")
);
--> statement-breakpoint

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "payment_schedule_config" ADD CONSTRAINT "payment_schedule_config_component_pricing_id_fk"
   FOREIGN KEY ("component_pricing_id") REFERENCES "public"."component_pricing"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "expected_payment_items" ADD CONSTRAINT "expected_payment_items_payment_schedule_config_id_fk"
   FOREIGN KEY ("payment_schedule_config_id") REFERENCES "public"."payment_schedule_config"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_payment_schedule_config_pricing" ON "payment_schedule_config" ("component_pricing_id");
CREATE INDEX IF NOT EXISTS "idx_expected_payment_items_config" ON "expected_payment_items" ("payment_schedule_config_id");
CREATE INDEX IF NOT EXISTS "idx_expected_payment_items_due_date" ON "expected_payment_items" ("due_date");
CREATE INDEX IF NOT EXISTS "idx_expected_payment_items_status" ON "expected_payment_items" ("status");
CREATE INDEX IF NOT EXISTS "idx_expected_payment_items_sequence" ON "expected_payment_items" ("payment_schedule_config_id", "sequence_order");
