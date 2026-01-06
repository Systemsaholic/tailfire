-- Add unique constraint on (itinerary_id, date) for ON CONFLICT support in bulk operations
-- This enables idempotent bulk day creation for cruise port schedules

-- First handle potential duplicates (keep the oldest one)
DELETE FROM itinerary_days d1
USING itinerary_days d2
WHERE d1.itinerary_id = d2.itinerary_id
  AND d1.date = d2.date
  AND d1.date IS NOT NULL
  AND d1.created_at > d2.created_at;

-- Now add the unique index (partial index to exclude NULL dates)
CREATE UNIQUE INDEX IF NOT EXISTS itinerary_days_itinerary_date_unique
ON itinerary_days (itinerary_id, date)
WHERE date IS NOT NULL;
