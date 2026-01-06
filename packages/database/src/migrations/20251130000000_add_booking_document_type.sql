-- Migration: Add document_type enum to booking_documents
-- This allows categorizing booking documents (confirmations, invoices, etc.)

-- Create the document type enum
CREATE TYPE booking_document_type AS ENUM (
  'confirmation',      -- Booking confirmations, receipts
  'invoice',           -- Supplier invoices
  'itinerary',         -- Travel itinerary documents
  'insurance',         -- Insurance documents
  'visa',              -- Visa/passport copies
  'voucher',           -- Hotel/tour vouchers
  'other'              -- Catch-all for uncategorized
);

-- Add the document_type column with default
ALTER TABLE booking_documents
ADD COLUMN document_type booking_document_type NOT NULL DEFAULT 'other';

-- Add index for filtering by type
CREATE INDEX idx_booking_documents_type ON booking_documents(document_type);

-- Comment for documentation
COMMENT ON COLUMN booking_documents.document_type IS 'Category of document: confirmation, invoice, itinerary, insurance, visa, voucher, or other';
