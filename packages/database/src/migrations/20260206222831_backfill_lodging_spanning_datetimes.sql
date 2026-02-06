-- Backfill startDatetime/endDatetime for existing lodging activities
-- that have lodging_details with check-in/out dates but NULL/missing activity dates
--
-- This enables lodging activities to display as spanning bars (Gantt-style)
-- across multiple days, similar to cruises and land tours.
--
-- Uses date + time arithmetic instead of string concatenation to handle
-- time values that may already include seconds (HH:MM:SS)

UPDATE itinerary_activities ia
SET
  start_datetime = COALESCE(
    ia.start_datetime,
    (ld.check_in_date + COALESCE(ld.check_in_time, time '12:00'))::timestamptz
  ),
  end_datetime = COALESCE(
    ia.end_datetime,
    (ld.check_out_date + COALESCE(ld.check_out_time, time '12:00'))::timestamptz
  ),
  updated_at = now()
FROM lodging_details ld
WHERE ia.id = ld.activity_id
  AND ia.activity_type = 'lodging'
  AND (ia.start_datetime IS NULL OR ia.end_datetime IS NULL)
  AND ld.check_in_date IS NOT NULL
  AND ld.check_out_date IS NOT NULL;
