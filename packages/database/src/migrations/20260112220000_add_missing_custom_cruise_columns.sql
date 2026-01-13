-- Migration: Add missing columns to custom_cruise_details table
-- The service code references cabin_image_url and cabin_description but they don't exist in the table

-- Add cabin_image_url column
ALTER TABLE custom_cruise_details
ADD COLUMN IF NOT EXISTS cabin_image_url TEXT;

-- Add cabin_description column
ALTER TABLE custom_cruise_details
ADD COLUMN IF NOT EXISTS cabin_description TEXT;

-- Comments for documentation
COMMENT ON COLUMN custom_cruise_details.cabin_image_url IS 'URL to cabin category or specific cabin image';
COMMENT ON COLUMN custom_cruise_details.cabin_description IS 'Description of the cabin type and amenities';
