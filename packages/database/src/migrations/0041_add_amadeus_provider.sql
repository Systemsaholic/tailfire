-- Add Amadeus provider to api_provider enum
-- Amadeus On Demand Flight Status API - flight data via OAuth2
-- Priority: 2 (fallback when Aerodatabox returns empty)

ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'amadeus';
