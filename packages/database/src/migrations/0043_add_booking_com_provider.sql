-- Add booking_com to api_provider enum for Booking.com hotel enrichment
ALTER TYPE api_provider ADD VALUE IF NOT EXISTS 'booking_com';
