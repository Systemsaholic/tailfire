DO $$ BEGIN
 CREATE TYPE "public"."component_entity_type" AS ENUM('activity', 'accommodation', 'flight', 'transfer', 'dining', 'cruise', 'port_info', 'option');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_status" AS ENUM('pending', 'dismissed', 'acted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('split_recalculation_needed', 'payment_received', 'payment_overdue', 'refund_processed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."service_fee_recipient" AS ENUM('primary_traveller', 'all_travellers');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."service_fee_status" AS ENUM('draft', 'sent', 'paid', 'partially_refunded', 'refunded', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."split_type" AS ENUM('equal', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."stripe_account_status" AS ENUM('not_connected', 'pending', 'active', 'restricted', 'disabled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_traveller_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"activity_id" uuid NOT NULL,
	"traveller_id" uuid NOT NULL,
	"split_type" "split_type" DEFAULT 'equal' NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"exchange_rate_to_trip_currency" numeric(10, 6),
	"exchange_rate_snapshot_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "unique_activity_traveller" UNIQUE("activity_id","traveller_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agency_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"stripe_account_id" varchar(255),
	"stripe_account_status" "stripe_account_status" DEFAULT 'not_connected' NOT NULL,
	"stripe_charges_enabled" boolean DEFAULT false,
	"stripe_payouts_enabled" boolean DEFAULT false,
	"stripe_onboarding_completed_at" timestamp with time zone,
	"jurisdiction_code" varchar(10),
	"compliance_disclaimer_text" text,
	"insurance_waiver_text" text,
	"logo_url" text,
	"primary_color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_agency_settings" UNIQUE("agency_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_stripe_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"stripe_account_id" varchar(255) NOT NULL,
	"stripe_customer_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_contact_stripe_account" UNIQUE("contact_id","stripe_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "currency_exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" numeric(10, 6) NOT NULL,
	"rate_date" date NOT NULL,
	"source" varchar(50) DEFAULT 'ExchangeRate-API',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_currency_pair_date" UNIQUE("from_currency","to_currency","rate_date")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"recipient_type" "service_fee_recipient" DEFAULT 'primary_traveller' NOT NULL,
	"title" varchar(255) NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"due_date" date,
	"description" text,
	"status" "service_fee_status" DEFAULT 'draft' NOT NULL,
	"exchange_rate_to_trip_currency" numeric(10, 6),
	"amount_in_trip_currency_cents" integer,
	"stripe_invoice_id" varchar(255),
	"stripe_payment_intent_id" varchar(255),
	"stripe_hosted_invoice_url" text,
	"refunded_amount_cents" integer DEFAULT 0,
	"refund_reason" text,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"stripe_account_id" varchar(255),
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb,
	CONSTRAINT "unique_stripe_event" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trip_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone,
	"acted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "component_media" DROP CONSTRAINT "component_media_component_id_itinerary_activities_id_fk";
--> statement-breakpoint
ALTER TABLE "component_media" ADD COLUMN "entity_type" "component_entity_type" DEFAULT 'activity' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_traveller_splits" ADD CONSTRAINT "activity_traveller_splits_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_traveller_splits" ADD CONSTRAINT "activity_traveller_splits_activity_id_itinerary_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."itinerary_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_traveller_splits" ADD CONSTRAINT "activity_traveller_splits_traveller_id_trip_travelers_id_fk" FOREIGN KEY ("traveller_id") REFERENCES "public"."trip_travelers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_stripe_customers" ADD CONSTRAINT "contact_stripe_customers_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_fees" ADD CONSTRAINT "service_fees_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trip_notifications" ADD CONSTRAINT "trip_notifications_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Validation trigger for activity_traveller_splits
-- Ensures trip consistency: activity and traveller must belong to the same trip
-- Ensures currency consistency: split currency must match activity currency
CREATE OR REPLACE FUNCTION validate_split_trip_consistency()
RETURNS TRIGGER AS $$
DECLARE
  activity_trip_id UUID;
  activity_currency VARCHAR(3);
  traveller_trip_id UUID;
BEGIN
  -- Get the trip_id and currency for the activity
  SELECT i.trip_id, ia.currency
  INTO activity_trip_id, activity_currency
  FROM itinerary_activities ia
  JOIN itinerary_days id ON ia.itinerary_day_id = id.id
  JOIN itineraries i ON id.itinerary_id = i.id
  WHERE ia.id = NEW.activity_id;

  -- Validate activity exists and belongs to the specified trip
  IF activity_trip_id IS NULL THEN
    RAISE EXCEPTION 'Activity with ID % not found', NEW.activity_id;
  END IF;

  IF activity_trip_id != NEW.trip_id THEN
    RAISE EXCEPTION 'Activity does not belong to the specified trip';
  END IF;

  -- Validate traveller belongs to the trip
  SELECT trip_id INTO traveller_trip_id
  FROM trip_travelers
  WHERE id = NEW.traveller_id;

  IF traveller_trip_id IS NULL THEN
    RAISE EXCEPTION 'Traveller with ID % not found', NEW.traveller_id;
  END IF;

  IF traveller_trip_id != NEW.trip_id THEN
    RAISE EXCEPTION 'Traveller does not belong to the specified trip';
  END IF;

  -- Validate currency matches activity currency
  IF NEW.currency != activity_currency THEN
    RAISE EXCEPTION 'Split currency (%) must match activity currency (%)', NEW.currency, activity_currency;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS validate_split_trip_consistency_trigger ON activity_traveller_splits;
--> statement-breakpoint
CREATE TRIGGER validate_split_trip_consistency_trigger
  BEFORE INSERT OR UPDATE ON activity_traveller_splits
  FOR EACH ROW
  EXECUTE FUNCTION validate_split_trip_consistency();
--> statement-breakpoint
-- Add CHECK constraint for amount_cents >= 0
DO $$ BEGIN
  ALTER TABLE activity_traveller_splits ADD CONSTRAINT activity_traveller_splits_amount_positive CHECK (amount_cents >= 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add CHECK constraint for service_fees amount_cents > 0
DO $$ BEGIN
  ALTER TABLE service_fees ADD CONSTRAINT service_fees_amount_positive CHECK (amount_cents > 0);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
