-- Migration: Itinerary and Package Templates
-- Creates tables for storing reusable itinerary and package template patterns

-- Itinerary Templates - Agency-scoped reusable itinerary structures
CREATE TABLE IF NOT EXISTS itinerary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,              -- No FK (agencies table doesn't exist yet)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB NOT NULL,               -- ItineraryTemplatePayload structure
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,                      -- No FK (users table doesn't exist yet)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Package Templates - Agency-scoped reusable package structures
CREATE TABLE IF NOT EXISTS package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,              -- No FK (agencies table doesn't exist yet)
  name VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB NOT NULL,               -- PackageTemplatePayload structure
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,                      -- No FK (users table doesn't exist yet)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for itinerary_templates
CREATE INDEX IF NOT EXISTS idx_itinerary_templates_agency
  ON itinerary_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_templates_agency_active
  ON itinerary_templates(agency_id, is_active);

-- Indexes for package_templates
CREATE INDEX IF NOT EXISTS idx_package_templates_agency
  ON package_templates(agency_id);
CREATE INDEX IF NOT EXISTS idx_package_templates_agency_active
  ON package_templates(agency_id, is_active);

-- Comments for documentation
COMMENT ON TABLE itinerary_templates IS 'Agency-scoped reusable itinerary structure templates';
COMMENT ON COLUMN itinerary_templates.payload IS 'JSONB containing day offsets and activities (ItineraryTemplatePayload)';

COMMENT ON TABLE package_templates IS 'Agency-scoped reusable package structure templates';
COMMENT ON COLUMN package_templates.payload IS 'JSONB containing package metadata, day offsets and activities (PackageTemplatePayload)';
