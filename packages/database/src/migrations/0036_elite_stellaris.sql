CREATE TABLE IF NOT EXISTS "credit_card_guarantee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_schedule_config_id" uuid NOT NULL,
	"card_holder_name" varchar(255) NOT NULL,
	"card_last_4" varchar(4) NOT NULL,
	"authorization_code" varchar(100) NOT NULL,
	"authorization_date" timestamp with time zone NOT NULL,
	"authorization_amount_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_card_guarantee_payment_schedule_config_id_unique" UNIQUE("payment_schedule_config_id")
);
--> statement-breakpoint
ALTER TABLE "component_pricing" ADD COLUMN IF NOT EXISTS "terms_and_conditions" text;--> statement-breakpoint
ALTER TABLE "component_pricing" ADD COLUMN IF NOT EXISTS "cancellation_policy" text;--> statement-breakpoint
ALTER TABLE "component_pricing" ADD COLUMN IF NOT EXISTS "supplier" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_card_guarantee" ADD CONSTRAINT "credit_card_guarantee_payment_schedule_config_id_payment_schedule_config_id_fk" FOREIGN KEY ("payment_schedule_config_id") REFERENCES "public"."payment_schedule_config"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
