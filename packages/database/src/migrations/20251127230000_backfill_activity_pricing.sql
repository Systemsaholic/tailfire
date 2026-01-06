-- Idempotent backfill: activity_pricing for activities missing pricing records
-- Only backfills when:
--   1. No pricing row exists, OR
--   2. Pricing row exists with total_price_cents = 0 AND estimated_cost is non-null
-- Uses ON CONFLICT DO NOTHING for safety if rerun
-- Uses ROUND() to avoid floating-point artifacts

-- Part 1: Insert missing pricing rows
INSERT INTO activity_pricing (
  activity_id,
  pricing_type,
  base_price,
  total_price_cents,
  currency
)
SELECT
  ia.id,
  -- Prefer activity's pricing_type, fall back to 'flat_rate'
  COALESCE(ia.pricing_type, 'flat_rate'),
  COALESCE(ia.estimated_cost, '0.00'),
  -- Use ROUND() to avoid floating-point artifacts (e.g., 99.999... -> 100)
  COALESCE(ROUND(CAST(ia.estimated_cost AS NUMERIC) * 100)::INTEGER, 0),
  -- Currency fallback: trip -> activity -> 'CAD'
  COALESCE(t.currency, ia.currency, 'CAD')
FROM itinerary_activities ia
JOIN itinerary_days id ON ia.itinerary_day_id = id.id
JOIN itineraries i ON id.itinerary_id = i.id
JOIN trips t ON i.trip_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM activity_pricing ap WHERE ap.activity_id = ia.id
)
ON CONFLICT (activity_id) DO NOTHING;

-- Part 2: Update zero-value pricing rows where estimated_cost has data
UPDATE activity_pricing ap
SET
  total_price_cents = ROUND(CAST(ia.estimated_cost AS NUMERIC) * 100)::INTEGER,
  base_price = ia.estimated_cost
FROM itinerary_activities ia
WHERE ap.activity_id = ia.id
  AND ap.total_price_cents = 0
  AND ia.estimated_cost IS NOT NULL
  AND CAST(ia.estimated_cost AS NUMERIC) > 0;
