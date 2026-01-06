-- Migration: Create payment_transactions table for recording actual payments
-- This enables tracking of payments against expected_payment_items with full audit trail

-- Create payment transaction type enum
CREATE TYPE "payment_transaction_type" AS ENUM ('payment', 'refund', 'adjustment');

-- Create payment method enum
CREATE TYPE "payment_method" AS ENUM ('cash', 'check', 'credit_card', 'bank_transfer', 'stripe', 'other');

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS "payment_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "expected_payment_item_id" uuid NOT NULL REFERENCES "expected_payment_items"("id") ON DELETE CASCADE,
  "transaction_type" "payment_transaction_type" NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" varchar(3) NOT NULL,
  "payment_method" "payment_method",
  "reference_number" varchar(100),
  "transaction_date" timestamp with time zone NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" uuid
);

-- Add CHECK constraint for non-negative amounts
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_amount_non_negative" CHECK (amount_cents >= 0);

-- Create index on expected_payment_item_id for efficient lookups
CREATE INDEX IF NOT EXISTS "payment_transactions_expected_payment_item_id_idx" ON "payment_transactions" ("expected_payment_item_id");

-- Create index on transaction_date for date range queries
CREATE INDEX IF NOT EXISTS "payment_transactions_transaction_date_idx" ON "payment_transactions" ("transaction_date");
