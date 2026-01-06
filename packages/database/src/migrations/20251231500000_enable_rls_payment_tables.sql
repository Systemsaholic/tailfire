-- ==============================================================================
-- Row Level Security (RLS) Policies for Payment Tables
-- Extends RLS coverage to payment_schedule_config, expected_payment_items,
-- and payment_transactions tables
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Enable RLS on payment tables
-- WARNING: Once enabled, all access is denied until policies are added
-- ==============================================================================

ALTER TABLE payment_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 2: Payment Schedule Config Policies (Simple Agency Scope)
-- ==============================================================================

CREATE POLICY "payment_schedule_config_select" ON payment_schedule_config FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "payment_schedule_config_insert" ON payment_schedule_config FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "payment_schedule_config_update" ON payment_schedule_config FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "payment_schedule_config_delete" ON payment_schedule_config FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- STEP 3: Expected Payment Items Policies (Simple Agency Scope)
-- ==============================================================================

CREATE POLICY "expected_payment_items_select" ON expected_payment_items FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "expected_payment_items_insert" ON expected_payment_items FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "expected_payment_items_update" ON expected_payment_items FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "expected_payment_items_delete" ON expected_payment_items FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- STEP 4: Payment Transactions Policies (Simple Agency Scope)
-- ==============================================================================

CREATE POLICY "payment_transactions_select" ON payment_transactions FOR SELECT
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "payment_transactions_insert" ON payment_transactions FOR INSERT
WITH CHECK (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "payment_transactions_update" ON payment_transactions FOR UPDATE
USING (agency_id = (auth.jwt() ->> 'agency_id')::uuid);

CREATE POLICY "payment_transactions_delete" ON payment_transactions FOR DELETE
USING (
  agency_id = (auth.jwt() ->> 'agency_id')::uuid
  AND (auth.jwt() ->> 'role') = 'admin'
);

-- ==============================================================================
-- STEP 5: Grant access to authenticated role
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON payment_schedule_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expected_payment_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payment_transactions TO authenticated;

-- ==============================================================================
-- NOTES
-- ==============================================================================
--
-- This migration extends RLS coverage from 20251231300000_enable_rls_policies.sql
-- to include the payment tables that were missing.
--
-- Payment tables follow the same agency-scoped pattern as activity_pricing:
-- - All operations require matching agency_id from JWT
-- - DELETE restricted to admin role
--
-- PARENT-PROTECTED TABLES (no direct agency_id):
-- - credit_card_guarantee: Protected via FK to payment_schedule_config.
--   Not directly queryable from client without joining through protected parent.
--   If direct client access is ever needed, add agency_id column and RLS policy.
--
-- ==============================================================================
