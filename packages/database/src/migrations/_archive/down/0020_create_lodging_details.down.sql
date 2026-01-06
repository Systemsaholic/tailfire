-- Down migration 0020: Drop Lodging Details

DROP INDEX IF EXISTS "idx_lodging_details_component_id";
DROP TABLE IF EXISTS "lodging_details";
