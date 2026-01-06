-- Migration: Add amadeus_hotels to api_provider enum
-- This supports the separate Amadeus Hotels API provider

ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'amadeus_hotels';
