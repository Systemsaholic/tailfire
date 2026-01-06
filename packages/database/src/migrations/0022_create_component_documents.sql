-- Component Documents Table
-- Stores documents associated with trip components (confirmations, vouchers, invoices, etc.)

CREATE TABLE IF NOT EXISTS "component_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "component_id" uuid NOT NULL,

  -- Document metadata
  "document_type" varchar(100), -- confirmation, voucher, invoice, itinerary, receipt, contract, other
  "file_url" text NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_size" integer, -- Size in bytes

  -- Audit fields
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "uploaded_by" uuid, -- FK to users table (when implemented)

  CONSTRAINT "component_documents_component_id_fkey"
    FOREIGN KEY ("component_id")
    REFERENCES "itinerary_activities"("id")
    ON DELETE CASCADE,

  -- Validate document type values
  CONSTRAINT "component_documents_type_check"
    CHECK (document_type IS NULL OR document_type IN (
      'confirmation', 'voucher', 'invoice', 'itinerary',
      'receipt', 'contract', 'ticket', 'passport', 'visa', 'other'
    ))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "component_documents_component_id_idx"
  ON "component_documents" ("component_id");

CREATE INDEX IF NOT EXISTS "component_documents_type_idx"
  ON "component_documents" ("document_type");
