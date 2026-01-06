-- Rollback: Drop shared tables and enums
DROP TABLE IF EXISTS "component_suppliers" CASCADE;
DROP TABLE IF EXISTS "payment_schedule" CASCADE;
DROP TABLE IF EXISTS "component_pricing" CASCADE;
DROP TABLE IF EXISTS "commission_tracking" CASCADE;
DROP TABLE IF EXISTS "component_documents" CASCADE;
DROP TABLE IF EXISTS "component_media" CASCADE;
DROP TABLE IF EXISTS "suppliers" CASCADE;

DROP TYPE IF EXISTS "payment_status";
DROP TYPE IF EXISTS "commission_status";
DROP TYPE IF EXISTS "media_type";
