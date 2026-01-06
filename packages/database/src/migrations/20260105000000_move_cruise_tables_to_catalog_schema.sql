-- Migration: Move cruise tables from public to catalog schema
-- This migration moves all 16 cruise-related tables to the catalog schema
-- for FDW (Foreign Data Wrapper) architecture support.

-- Step 1: Create the catalog schema
CREATE SCHEMA IF NOT EXISTS catalog;

-- Step 2: Move all cruise tables to catalog schema
-- Note: ALTER ... SET SCHEMA moves the table and all dependent objects (indexes, constraints)

-- Core reference tables (no FKs to other cruise tables)
ALTER TABLE IF EXISTS public.cruise_lines SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_ports SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_regions SET SCHEMA catalog;

-- Ship depends on cruise_lines
ALTER TABLE IF EXISTS public.cruise_ships SET SCHEMA catalog;

-- Ship child tables
ALTER TABLE IF EXISTS public.cruise_ship_cabin_types SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_ship_decks SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_ship_images SET SCHEMA catalog;

-- Cabin images depends on cruise_ship_cabin_types
ALTER TABLE IF EXISTS public.cruise_cabin_images SET SCHEMA catalog;

-- Sailings depends on ships, lines, ports
ALTER TABLE IF EXISTS public.cruise_sailings SET SCHEMA catalog;

-- Sailing child tables
ALTER TABLE IF EXISTS public.cruise_sailing_cabin_prices SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_sailing_stops SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_sailing_regions SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_alternate_sailings SET SCHEMA catalog;

-- Sync/operational tables
ALTER TABLE IF EXISTS public.cruise_sync_raw SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_sync_history SET SCHEMA catalog;
ALTER TABLE IF EXISTS public.cruise_ftp_file_sync SET SCHEMA catalog;

-- Step 3: Grant permissions to service roles
GRANT USAGE ON SCHEMA catalog TO service_role, authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA catalog TO service_role, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA catalog TO service_role;

-- Step 4: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog
  GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog
  GRANT ALL ON TABLES TO service_role;
