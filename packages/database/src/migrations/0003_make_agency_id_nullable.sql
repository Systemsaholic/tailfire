-- Migration: Make agency_id nullable (single agency model)
-- Date: 2025-11-13
-- Reason: System has only one agency, so agency_id is redundant for filtering
-- Future multi-tenancy will use branch_id (Phase 2)

ALTER TABLE "public"."contacts" ALTER COLUMN "agency_id" DROP NOT NULL;
ALTER TABLE "public"."contact_relationships" ALTER COLUMN "agency_id" DROP NOT NULL;
ALTER TABLE "public"."contact_groups" ALTER COLUMN "agency_id" DROP NOT NULL;
ALTER TABLE "public"."trips" ALTER COLUMN "agency_id" DROP NOT NULL;
