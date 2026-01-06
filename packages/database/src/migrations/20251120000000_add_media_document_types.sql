-- Add cabin_image and media_image to component_documents document_type constraint
-- Drop the old constraint and create a new one with the additional types

ALTER TABLE "component_documents" DROP CONSTRAINT IF EXISTS "component_documents_type_check";

ALTER TABLE "component_documents" ADD CONSTRAINT "component_documents_type_check"
CHECK (
  "document_type" IS NULL OR
  "document_type" IN (
    'confirmation',
    'voucher',
    'invoice',
    'itinerary',
    'receipt',
    'contract',
    'ticket',
    'passport',
    'visa',
    'cabin_image',
    'media_image',
    'other'
  )
);
