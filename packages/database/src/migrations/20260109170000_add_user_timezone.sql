-- Add timezone field to user_profiles
-- Allows users to set their preferred timezone in IANA format (e.g., 'America/Toronto')
ALTER TABLE "user_profiles" ADD COLUMN "timezone" varchar(64);
