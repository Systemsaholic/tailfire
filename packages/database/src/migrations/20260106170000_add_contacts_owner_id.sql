-- Add owner_id to contacts table for ownership tracking
-- Idempotent: safe to run multiple times

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Create index for ownership lookups
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
