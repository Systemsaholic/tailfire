-- Migration: Add missing api_provider enum values
-- Purpose: Enable Google Places, Booking.com, and Amadeus Hotels API integrations

-- Add google_places enum value
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'google_places';

-- Add booking_com enum value
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'booking_com';

-- Add amadeus_hotels enum value
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'amadeus_hotels';
