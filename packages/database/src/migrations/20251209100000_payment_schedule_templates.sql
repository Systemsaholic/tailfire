-- Migration: Payment Schedule Templates
-- Stack: Drizzle ORM (generates .sql files via drizzle-kit)
-- Description: Adds payment schedule templates, template items, and audit log tables
-- @see beta/docs/design/payment-schedule/PAYMENT_SCHEDULE_TEMPLATES.md

-- PREREQUISITE: These enums MUST exist (created in earlier migrations)
-- Dependency: packages/database/src/schema/activity-pricing.schema.ts
-- If missing, migration will fail with "type schedule_type does not exist"

-- Verify enum exists (will fail fast if not)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
    RAISE EXCEPTION 'Required enum schedule_type does not exist. Run activity-pricing migrations first.';
  END IF;
END $$;

-- Step 1: Create audit action enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_audit_action') THEN
    CREATE TYPE payment_audit_action AS ENUM (
      'created',
      'updated',
      'deleted',
      'status_changed',
      'locked',
      'unlocked',
      'template_applied'
    );
  END IF;
END $$;

-- Step 2: Create templates table
CREATE TABLE IF NOT EXISTS payment_schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schedule_type schedule_type NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID,
  CONSTRAINT uq_templates_agency_name_version UNIQUE(agency_id, name, version)
);

-- Step 3: Create template items table with STRICT constraints
CREATE TABLE IF NOT EXISTS payment_schedule_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES payment_schedule_templates(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  payment_name VARCHAR(100) NOT NULL,
  percentage DECIMAL(5,2),
  fixed_amount_cents INTEGER,
  days_from_booking INTEGER,
  days_before_departure INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Amount: EXACTLY ONE must be set
  CONSTRAINT check_amount_type CHECK (
    (percentage IS NOT NULL)::int + (fixed_amount_cents IS NOT NULL)::int = 1
  ),

  -- Timing: EXACTLY ONE must be set (no timeless items)
  CONSTRAINT check_timing_type CHECK (
    (days_from_booking IS NOT NULL)::int + (days_before_departure IS NOT NULL)::int = 1
  )
);

-- Step 4: Create IMMUTABLE audit log table (JSONB, no updates/deletes)
CREATE TABLE IF NOT EXISTS payment_schedule_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  agency_id UUID NOT NULL,
  action payment_audit_action NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Step 5: Add columns to existing tables
ALTER TABLE payment_schedule_config
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS template_version INTEGER;

ALTER TABLE expected_payment_items
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_by UUID;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_agency_active
  ON payment_schedule_templates(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_template_items_template_seq
  ON payment_schedule_template_items(template_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_time
  ON payment_schedule_audit_log(entity_type, entity_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_agency_time
  ON payment_schedule_audit_log(agency_id, performed_at);

-- Step 7: Enforce audit log immutability at DB level
-- Revoke UPDATE/DELETE from application role
-- NOTE: Adjust role name to match your environment (e.g., api_user, postgres, authenticator)
-- This DO block safely skips REVOKE if the role doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'api_user') THEN
    REVOKE UPDATE, DELETE ON payment_schedule_audit_log FROM api_user;
  ELSE
    RAISE NOTICE 'Role api_user does not exist; skipping REVOKE. Adjust role name if needed.';
  END IF;
END $$;

-- Step 8: Trigger to block any UPDATE/DELETE attempts (defense in depth)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable. UPDATE and DELETE operations are not allowed.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable ON payment_schedule_audit_log;
CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON payment_schedule_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- Note: NO RLS policies - access control enforced via NestJS guards
-- Note: Audit logging handled by PaymentAuditService (INSERT only)

COMMENT ON TABLE payment_schedule_templates IS 'Agency-scoped reusable payment schedule patterns';
COMMENT ON TABLE payment_schedule_template_items IS 'Payment milestones within a template (amounts/timing)';
COMMENT ON TABLE payment_schedule_audit_log IS 'IMMUTABLE: No UPDATE or DELETE allowed. Append-only for TICO compliance.';
