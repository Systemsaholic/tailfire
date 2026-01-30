-- Fix missing ON DELETE CASCADE for denormalized trip_id FKs
-- These RLS denormalization columns should cascade when the parent trip is deleted

-- package_details.trip_id
ALTER TABLE package_details
  DROP CONSTRAINT IF EXISTS package_details_trip_id_trips_id_fk,
  ADD CONSTRAINT package_details_trip_id_trips_id_fk
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;

-- activity_travelers.trip_id
ALTER TABLE activity_travelers
  DROP CONSTRAINT IF EXISTS activity_travelers_trip_id_trips_id_fk,
  ADD CONSTRAINT activity_travelers_trip_id_trips_id_fk
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
