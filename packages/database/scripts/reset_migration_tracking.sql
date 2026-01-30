-- =============================================================================
-- MIGRATION TRACKING RESET SCRIPT
-- =============================================================================
-- Purpose: Reset drizzle.__drizzle_migrations to match repo's _journal.json
-- Applies to: ALL environments (tailfire-Dev, Tailfire-Preview, Tailfire-Prod)
--
-- This script does NOT change schema - only migration tracking metadata.
-- The FDW migration (id 48) has built-in guards that auto-skip where not needed.
--
-- USAGE:
--   psql "postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres" < reset_migration_tracking.sql
--
-- VALIDATION (run after):
--   SELECT COUNT(*) FROM drizzle.__drizzle_migrations;  -- Should return 72
-- =============================================================================

BEGIN;

-- Clear existing migration tracking
DELETE FROM drizzle.__drizzle_migrations;

-- Insert all 72 migrations from _journal.json (generated programmatically)
INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at) VALUES
(1, '0000_aberrant_mikhail_rasputin', 1763045221403),
(2, '0001_polite_piledriver', 1763045295108),
(3, '0002_add_bidirectional_relationship_constraint', 1731526800000),
(4, '0003_make_agency_id_nullable', 1731528000000),
(5, '0004_identity_and_inclusive_fields', 1731610800000),
(6, '0005_lifecycle_and_status_system', 1731611400000),
(7, '0006_marketing_compliance', 1731612000000),
(8, '0007_travel_credentials_and_preferences', 1731612600000),
(9, '0008_trip_reference_number_generation', 1731613200000),
(10, '0009_trip_status_workflow_validation', 1731613800000),
(11, '0010_shiny_silver_sable', 1763166217631),
(12, '0011_charming_rhino', 1763176747362),
(13, '0012_thick_black_bird', 1763223219307),
(14, '0013_tags_system', 1763237364302),
(15, '0014_blue_the_fury', 1763247914547),
(16, '0015_brief_forgotten_one', 1763261977945),
(17, '0016_gigantic_sunfire', 1763264666406),
(18, '0017_low_kingpin', 1763264767567),
(19, '0018_tranquil_ricochet', 1763264821046),
(20, '0019_payment_schedule_system', 1763328000000),
(21, '0020_create_lodging_details', 1731974400000),
(22, '0021_create_transportation_details', 1732060800000),
(23, '0022_create_component_documents', 1763561100869),
(24, '0023_create_dining_details', 1763561101000),
(25, '20251118230207_create_port_info_details', 1763561102000),
(26, '20251119000000_create_options_details', 1763561103000),
(27, '20251119100000_create_custom_cruise_details', 1763561104000),
(28, '20251119200000_create_cruise_reference_tables', 1763561105000),
(29, '20251119210000_add_port_ids_to_cruise_details', 1763561106000),
(30, '20251119220000_add_line_ship_region_ids_to_cruise_details', 1763561107000),
(31, '0030_aromatic_slayback', 1763644082411),
(32, '0031_stale_landau', 1763820347059),
(33, '0032_light_wallow', 1763929260630),
(34, '0033_adorable_sebastian_shaw', 1763986958579),
(35, '0034_mysterious_firebird', 1764017718456),
(36, '0035_many_whizzer', 1764018258005),
(37, '0036_elite_stellaris', 1764021743344),
(38, '20260105130000_add_avatar_url_and_pricing_visibility', 1764022200000),
(39, '20260106000000_add_missing_columns', 1764979200000),
(40, '20260102152051_extend_user_profiles', 1764892851000),
(41, '20260106010000_extend_user_profiles_v2', 1764982800000),
(42, '20260106165207_add_licensing_commission', 1765036327000),
(43, '20260106170000_add_contacts_owner_id', 1765040400000),
(44, '20260107000000_enable_rls_api_lockdown', 1767830400000),
(45, '20260109000000_sync_activity_tables', 1736380800000),
(46, '20260110000000_prod_baseline', 1736467200000),
(47, '20260109170000_add_user_timezone', 1736535600000),
(48, '20260104205000_setup_catalog_fdw', 1767830400001),
(49, '20260111210112_create_storage_buckets', 1767830400002),
(50, '20260111210113_storage_rls_policies', 1767830400003),
(51, '20251231200000_jwt_custom_claims_hook', 1767830400004),
(52, '20260112162300_add_itineraries_agency_id', 1768234980000),
(53, '20260112164500_add_days_activities_agency_id', 1768236300000),
(54, '20260112170000_add_booking_tracking_to_activities', 1768240800000),
(55, '20260112180000_rename_component_id_to_activity_id', 1768244400000),
(56, '0040_add_aerodatabox_provider', 1768248000000),
(57, '0041_add_amadeus_provider', 1768251600000),
(58, '20260112123000_add_missing_api_providers', 1768255800000),
(59, '20260112200000_add_tour_package_enum_values', 1768262400000),
(60, '20260112220000_add_missing_custom_cruise_columns', 1768270800000),
(61, '20260113040952_floating_packages_support', 1768330192000),
(62, '20260114000000_fix_trip_reference_null_type', 1768348800000),
(63, '20260115155933_add_lock_fields_to_expected_payment_items', 1768521573000),
(64, '20260116171841_add_missing_rls_policies', 1768689521000),
(65, '20260120003729_add_system_deployments_table', 1768953449000),
(66, '20260120015100_add_email_logs', 1768957860000),
(67, '20260120015200_add_email_templates', 1768957920000),
(68, '20260120015300_seed_email_templates', 1768957980000),
(69, '20260120050000_add_trip_order_pdf_email_template', 1768971600000),
(70, '20260120200000_create_trip_orders', 1768986000000),
(71, '20260120215012_add_trip_orders_rls_policy', 1768989012000),
(72, '20260120210000_sync_all_environments', 1768990800000);

-- Reset sequence to match highest id
SELECT setval('drizzle.__drizzle_migrations_id_seq', 72, true);

COMMIT;

-- =============================================================================
-- VALIDATION QUERIES (run after script completes)
-- =============================================================================
--
-- 1. Verify count matches journal:
--    SELECT COUNT(*) FROM drizzle.__drizzle_migrations;
--    Expected: 72
--
-- 2. Verify no duplicates:
--    SELECT hash, COUNT(*) FROM drizzle.__drizzle_migrations GROUP BY hash HAVING COUNT(*) > 1;
--    Expected: 0 rows
--
-- 3. Verify sequence:
--    SELECT last_value FROM drizzle.__drizzle_migrations_id_seq;
--    Expected: 72
--
-- 4. Run migrator to confirm 0 pending:
--    cd packages/database && npx drizzle-kit push
--    Expected: "No changes detected" or "0 pending migrations"
-- =============================================================================
