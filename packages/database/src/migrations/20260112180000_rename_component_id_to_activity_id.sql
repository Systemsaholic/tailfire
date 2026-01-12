-- Rename component_id to activity_id in detail tables
-- The Drizzle schema uses activity_id but the database was created with component_id

-- Rename column in lodging_details
ALTER TABLE lodging_details RENAME COLUMN component_id TO activity_id;

-- Rename column in flight_details
ALTER TABLE flight_details RENAME COLUMN component_id TO activity_id;

-- Rename column in transportation_details
ALTER TABLE transportation_details RENAME COLUMN component_id TO activity_id;

-- Rename column in dining_details
ALTER TABLE dining_details RENAME COLUMN component_id TO activity_id;

-- Rename column in port_info_details
ALTER TABLE port_info_details RENAME COLUMN component_id TO activity_id;

-- Rename column in options_details
ALTER TABLE options_details RENAME COLUMN component_id TO activity_id;

-- Rename column in custom_cruise_details
ALTER TABLE custom_cruise_details RENAME COLUMN component_id TO activity_id;
