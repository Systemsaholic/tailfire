-- ==============================================================================
-- Migration: Add RLS Policy for Trip Orders
-- ==============================================================================
-- The trip_orders table has RLS enabled with FORCE but no policies.
-- This migration adds a permissive policy to allow API access.
-- Authorization is handled at the API layer via JWT guards.
-- ==============================================================================

-- Create permissive policy for all operations
-- API handles authorization via agency_id filtering in service layer
DO $$ BEGIN
  CREATE POLICY "trip_orders_all" ON "trip_orders"
    FOR ALL
    USING (true)
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
