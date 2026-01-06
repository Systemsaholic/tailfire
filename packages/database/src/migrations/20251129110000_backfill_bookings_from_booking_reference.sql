-- Backfill Migration: booking_reference → bookings table
--
-- Purpose: Migrate existing activity_pricing.booking_reference data into the new bookings table
-- and link activities to their respective bookings via itinerary_activities.booking_id
--
-- This migration is idempotent and can be safely re-run.

-- Step 1: Create bookings from unique (trip_id, booking_reference) combinations
-- Aggregates pricing data from all activities with the same booking_reference
INSERT INTO bookings (
  id,
  trip_id,
  name,
  confirmation_number,
  supplier_name,
  status,
  payment_status,
  pricing_type,
  traveler_count,
  total_price_cents,
  taxes_cents,
  currency,
  commission_cents,
  terms_and_conditions,
  cancellation_policy,
  notes,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  i.trip_id,
  -- Name: Use booking_reference as the name (can be updated later in UI)
  COALESCE(ap.booking_reference, 'Imported Booking') as name,
  -- Use first non-null confirmation number from activities in this booking
  MAX(ap.confirmation_number) as confirmation_number,
  -- Use first non-null supplier
  MAX(ap.supplier) as supplier_name,
  -- Default status based on activity status
  CASE
    WHEN bool_and(ia.status = 'confirmed') THEN 'confirmed'
    WHEN bool_or(ia.status = 'cancelled') THEN 'cancelled'
    WHEN bool_or(ia.status = 'confirmed') THEN 'pending'
    ELSE 'draft'
  END::booking_status as status,
  -- Payment status based on booking_status in activity_pricing
  CASE
    WHEN bool_and(ap.booking_status = 'paid') THEN 'paid'
    WHEN bool_or(ap.booking_status = 'paid') THEN 'deposit_paid'
    ELSE 'unpaid'
  END::booking_payment_status as payment_status,
  -- Pricing type: Map activity pricing_type to booking_pricing_type (only supports flat_rate, per_person)
  CASE
    WHEN MODE() WITHIN GROUP (ORDER BY ap.pricing_type) = 'per_person' THEN 'per_person'
    ELSE 'flat_rate'
  END::booking_pricing_type as pricing_type,
  -- Traveler count defaults to 1 (can be corrected in UI)
  1 as traveler_count,
  -- Sum all activity prices for total
  COALESCE(SUM(ap.total_price_cents), 0)::integer as total_price_cents,
  -- Sum all taxes
  COALESCE(SUM(ap.taxes_and_fees_cents), 0)::integer as taxes_cents,
  -- Currency (use first non-null, default CAD)
  COALESCE(MAX(ap.currency), 'CAD') as currency,
  -- Sum all commissions
  COALESCE(SUM(ap.commission_total_cents), 0)::integer as commission_cents,
  -- Combine terms (use first non-null)
  MAX(ap.terms_and_conditions) as terms_and_conditions,
  -- Combine cancellation policies (use first non-null)
  MAX(ap.cancellation_policy) as cancellation_policy,
  -- Add migration note
  '[Auto-migrated from booking_reference: ' || ap.booking_reference || ']' as notes,
  -- Use earliest activity creation time
  MIN(ia.created_at) as created_at,
  NOW() as updated_at
FROM activity_pricing ap
JOIN itinerary_activities ia ON ia.id = ap.activity_id
JOIN itinerary_days id ON id.id = ia.itinerary_day_id
JOIN itineraries i ON i.id = id.itinerary_id
WHERE ap.booking_reference IS NOT NULL
  AND ap.booking_reference != ''
  -- Skip activities that are already linked to a booking
  AND ia.booking_id IS NULL
GROUP BY i.trip_id, ap.booking_reference;

-- Step 2: Link activities to their newly created bookings
-- Create a temporary mapping table to avoid re-computing joins
CREATE TEMP TABLE booking_reference_mapping AS
SELECT DISTINCT
  ap.booking_reference,
  i.trip_id,
  b.id as booking_id,
  ia.id as activity_id
FROM activity_pricing ap
JOIN itinerary_activities ia ON ia.id = ap.activity_id
JOIN itinerary_days id ON id.id = ia.itinerary_day_id
JOIN itineraries i ON i.id = id.itinerary_id
JOIN bookings b ON b.trip_id = i.trip_id
  AND b.name = ap.booking_reference
WHERE ap.booking_reference IS NOT NULL
  AND ap.booking_reference != ''
  AND ia.booking_id IS NULL;

-- Update activities with their booking_id
UPDATE itinerary_activities ia
SET booking_id = m.booking_id
FROM booking_reference_mapping m
WHERE ia.id = m.activity_id;

-- Cleanup temp table
DROP TABLE booking_reference_mapping;

-- Step 3: Mark booking_reference as deprecated
COMMENT ON COLUMN activity_pricing.booking_reference IS
  '@deprecated Use bookings.id via itinerary_activities.booking_id instead. This column will be removed in a future migration after all references are migrated.';

-- Step 4: Log migration results
DO $$
DECLARE
  bookings_created INTEGER;
  activities_linked INTEGER;
BEGIN
  SELECT COUNT(*) INTO bookings_created
  FROM bookings
  WHERE notes LIKE '[Auto-migrated from booking_reference:%';

  SELECT COUNT(*) INTO activities_linked
  FROM itinerary_activities
  WHERE booking_id IS NOT NULL;

  RAISE NOTICE 'Backfill complete: % bookings created, % activities linked',
    bookings_created, activities_linked;
END $$;
