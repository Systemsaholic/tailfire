-- Drop the cabin_category CHECK constraint to allow free-text input
-- The constraint was limiting values to ('suite', 'balcony', 'oceanview', 'inside')
-- but the application now treats cabin_category as a free-text field
-- This was causing 500 errors on auto-save when users entered values outside the enum

ALTER TABLE custom_cruise_details
DROP CONSTRAINT IF EXISTS custom_cruise_details_cabin_category_check;
