-- Tour Catalog FDW Extension
-- Adds tour tables to the existing FDW setup for Dev/Preview environments.
--
-- IMPORTANT: This migration ONLY runs on Dev/Preview (skips if Production).
-- Production has local tour tables created by 20260203043132_create_tour_catalog_tables.sql

DO $$
DECLARE
  has_foreign_server boolean;
  is_production boolean;
BEGIN
  -- Check if prod_catalog foreign server exists (Dev/Preview only)
  SELECT EXISTS (
    SELECT 1 FROM pg_foreign_server WHERE srvname = 'prod_catalog'
  ) INTO has_foreign_server;

  -- Check if this is Production (has local tour_operators table)
  SELECT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'catalog'
      AND c.relname = 'tour_operators'
      AND c.relkind = 'r'  -- 'r' = ordinary table (not foreign table 'f')
  ) INTO is_production;

  IF is_production THEN
    RAISE NOTICE 'Production environment detected (local tour tables exist). Skipping FDW import.';
    RETURN;
  END IF;

  IF NOT has_foreign_server THEN
    RAISE NOTICE 'No prod_catalog foreign server found. Skipping tour FDW import.';
    RETURN;
  END IF;

  RAISE NOTICE 'Dev/Preview environment detected. Importing tour tables as foreign tables...';

  -- Drop any local tour tables that may exist (from previous migrations)
  DROP TABLE IF EXISTS catalog.tour_sync_history CASCADE;
  DROP TABLE IF EXISTS catalog.tour_inclusions CASCADE;
  DROP TABLE IF EXISTS catalog.tour_media CASCADE;
  DROP TABLE IF EXISTS catalog.tour_hotels CASCADE;
  DROP TABLE IF EXISTS catalog.tour_itinerary_days CASCADE;
  DROP TABLE IF EXISTS catalog.tour_departure_pricing CASCADE;
  DROP TABLE IF EXISTS catalog.tour_departures CASCADE;
  DROP TABLE IF EXISTS catalog.tours CASCADE;
  DROP TABLE IF EXISTS catalog.tour_operators CASCADE;

  -- Import tour tables as foreign tables from Production
  IMPORT FOREIGN SCHEMA catalog
    LIMIT TO (
      tour_operators,
      tours,
      tour_departures,
      tour_departure_pricing,
      tour_itinerary_days,
      tour_hotels,
      tour_media,
      tour_inclusions,
      tour_sync_history
    )
    FROM SERVER prod_catalog
    INTO catalog;

  -- Grant permissions (same as cruise tables)
  GRANT USAGE ON SCHEMA catalog TO service_role, authenticated;
  GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO service_role, authenticated;

  RAISE NOTICE 'Tour catalog foreign tables imported successfully.';
END $$;

-- ===========================================================================
-- VERIFICATION QUERIES (run after applying on Dev/Preview)
-- ===========================================================================
--
-- 1. Confirm all 9 tour tables are FOREIGN tables (relkind='f'):
--
--    SELECT c.relname, c.relkind,
--           CASE c.relkind WHEN 'f' THEN 'foreign' WHEN 'r' THEN 'LOCAL' END as type
--    FROM pg_class c
--    JOIN pg_namespace n ON n.oid = c.relnamespace
--    WHERE n.nspname = 'catalog' AND c.relname LIKE 'tour%'
--    ORDER BY c.relname;
--
--    Expected on Dev/Preview: 9 rows, all with relkind='f'
--    Expected on Production: 9 rows, all with relkind='r'
--
-- 2. Verify data comes from Production (after Production sync runs):
--
--    SELECT COUNT(*) FROM catalog.tours;
--    SELECT COUNT(*) FROM catalog.tour_operators;
--
-- ===========================================================================
