-- Add indexes on agency_id columns for CRM tenant isolation performance
-- These columns are now used in WHERE clauses on every CRM query

CREATE INDEX IF NOT EXISTS idx_contacts_agency_id ON contacts (agency_id);
CREATE INDEX IF NOT EXISTS idx_contact_groups_agency_id ON contact_groups (agency_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_agency_id ON contact_relationships (agency_id);
